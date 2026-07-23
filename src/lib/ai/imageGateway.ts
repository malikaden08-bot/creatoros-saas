import OpenAI from 'openai';
import {
  ImageProviderName,
  ImageGenerationOptions,
  ImageGeneratedResponse,
  TokenUsage
} from './types';
import { logger } from '../../services/logger';
import { ProviderMetrics } from './metrics';
import { AI_CONFIG } from '../../config/ai.config';
import { FalImageProvider, FalError } from '../providers/image/fal';
import { ReplicateImageProvider, ReplicateError } from '../providers/image/replicate';

export class ImageProviderError extends Error {
  public status: number;
  public code?: string;
  constructor(message: string, status = 400, code?: string) {
    super(message);
    this.name = 'ImageProviderError';
    this.status = status;
    this.code = code;
  }
}

function isRetryable(err: any): boolean {
  const status: number = err?.status ?? err?.statusCode ?? 0;
  if (status === 401 || status === 403 || status === 501) return false;
  return [0, 429, 500, 502, 503, 504].includes(status);
}

async function backoffDelay(attempt: number): Promise<void> {
  const ms = 500 * Math.pow(2, attempt) + Math.random() * 100;
  return new Promise((r) => setTimeout(r, ms));
}

async function generateWithOpenAI(options: ImageGenerationOptions): Promise<ImageGeneratedResponse> {
  const key = process.env.OPENAI_API_KEY;
  if (!key || key.includes('demo') || key.includes('sk-demo')) {
    throw new ImageProviderError(
      'OpenAI API Key (OPENAI_API_KEY) is not configured.',
      401,
      'missing_openai_api_key'
    );
  }

  const startTime = Date.now();
  const client = new OpenAI({ apiKey: key });
  const model = AI_CONFIG.models.openai.image;

  const response = await client.images.generate({
    model,
    prompt: options.prompt,
    n: 1,
    size: (options.aspectRatio === '1:1'
      ? '1024x1024'
      : options.aspectRatio === '9:16'
      ? '1024x1792'
      : '1792x1024') as '1024x1024' | '1792x1024' | '1024x1792',
    quality: (options.quality === 'hd' ? 'hd' : 'standard') as 'hd' | 'standard',
    response_format: 'url'
  });

  const imageUrl = response.data?.[0]?.url;
  if (!imageUrl) {
    throw new ImageProviderError('[OpenAI DALL-E] No image URL returned.', 500, 'dalle_empty_response');
  }

  const latency = Date.now() - startTime;
  const isPortrait = options.aspectRatio === '9:16';
  const tokenUsage: TokenUsage = { prompt: 0, completion: 0, total: 0 };

  return {
    provider: 'openai',
    model,
    imageUrl,
    storageUrl: imageUrl,
    prompt: options.prompt,
    width: isPortrait ? 1024 : 1792,
    height: isPortrait ? 1792 : 1024,
    resolution: isPortrait ? '1024x1792' : '1792x1024',
    latency,
    tokenUsage,
    tokensUsed: tokenUsage
  };
}

type RealImageProvider = 'openai' | 'fal' | 'replicate';

const AUTO_IMAGE_CHAIN: RealImageProvider[] = ['openai', 'fal', 'replicate'];

export class ImageGateway {
  public static async generateImage(
    options: ImageGenerationOptions,
    requestedProvider: ImageProviderName = 'auto'
  ): Promise<ImageGeneratedResponse> {
    let chain: RealImageProvider[];

    if (requestedProvider === 'auto') {
      chain = AUTO_IMAGE_CHAIN;
    } else {
      const primary = requestedProvider as RealImageProvider;
      const rest = AUTO_IMAGE_CHAIN.filter((p) => p !== primary);
      chain = [primary, ...rest];
    }

    const errors: string[] = [];

    for (const providerName of chain) {
      const startTime = Date.now();
      let attempts = 0;

      while (attempts < 2) {
        if (attempts > 0) await backoffDelay(attempts - 1);

        try {
          logger.info(
            { providerName, prompt: options.prompt.slice(0, 80), attempt: attempts + 1 },
            `[ImageGateway] Attempting ${providerName} (attempt ${attempts + 1})`
          );

          let result: ImageGeneratedResponse;

          switch (providerName) {
            case 'openai':
              result = await generateWithOpenAI(options);
              break;
            case 'fal':
              result = await FalImageProvider.generate(options);
              break;
            case 'replicate':
              result = await ReplicateImageProvider.generate(options);
              break;
            default:
              throw new ImageProviderError(`Unknown image provider: ${providerName}`, 500);
          }

          logger.info(
            { providerName, model: result.model, latency: result.latency },
            `[ImageGateway] ✅ Success from ${providerName}`
          );

          ProviderMetrics.record({
            provider: providerName as any,
            success: true,
            latencyMs: Date.now() - startTime,
            retriesUsed: attempts
          });

          return result;
        } catch (err: any) {
          attempts++;
          const errMsg = err?.message ?? 'Unknown error';
          const status: number = err?.status ?? err?.statusCode ?? 0;

          if (status === 401 || status === 403 || status === 501) {
            logger.warn(
              { providerName, status, error: errMsg },
              `[ImageGateway] ${providerName} auth/config error — cascading`
            );
            errors.push(`${providerName}(${errMsg})`);
            break;
          }

          if (!isRetryable(err) || attempts >= 2) {
            logger.warn(
              { providerName, error: errMsg },
              `[ImageGateway] ${providerName} failed — cascading to next provider`
            );
            errors.push(`${providerName}(${errMsg})`);
            break;
          }

          logger.warn({ providerName, attempt: attempts }, `[ImageGateway] Retrying ${providerName}...`);
        }
      }

      ProviderMetrics.record({
        provider: providerName as any,
        success: false,
        latencyMs: Date.now() - startTime,
        error: errors[errors.length - 1]
      });
    }

    throw new ImageProviderError(
      `[ImageGateway] All image providers exhausted: [${errors.join(' | ')}]`,
      503,
      'IMAGE_GATEWAY_EXHAUSTED'
    );
  }
}
