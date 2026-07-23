import OpenAI from 'openai';
import { ImageGenerationOptions, ImageGeneratedResponse, TokenUsage } from '../types';
import { FalImageProvider } from './fal';
import { ReplicateImageProvider } from './replicate';
import { logger } from '../../../services/logger';

export class OpenAIImageProvider {
  private static client: OpenAI | null = null;

  private static getClient(): OpenAI | null {
    const key = process.env.OPENAI_API_KEY;
    if (!key || key.includes('demo') || key.includes('placeholder')) {
      return null;
    }
    if (!this.client) {
      this.client = new OpenAI({ apiKey: key });
    }
    return this.client;
  }

  public async generate(options: ImageGenerationOptions): Promise<ImageGeneratedResponse> {
    const startTime = Date.now();
    const client = OpenAIImageProvider.getClient();

    if (client) {
      try {
        const isPortrait = options.aspectRatio === '9:16';
        const size = isPortrait ? '1024x1792' : '1024x1024';

        const response = await client.images.generate({
          model: 'dall-e-3',
          prompt: options.prompt,
          n: 1,
          size,
          quality: options.quality === 'hd' ? 'hd' : 'standard',
          style: 'vivid'
        });

        const imageUrl = response.data?.[0]?.url;
        if (imageUrl) {
          const latencyMs = Date.now() - startTime;
          const tokenUsage: TokenUsage = { prompt: 100, completion: 0, total: 100 };

          return {
            provider: 'openai',
            model: 'dall-e-3',
            imageUrl,
            storageUrl: imageUrl,
            prompt: options.prompt,
            negativePrompt: options.negativePrompt,
            width: isPortrait ? 1024 : 1024,
            height: isPortrait ? 1792 : 1024,
            tokenUsage,
            tokensUsed: tokenUsage,
            latency: latencyMs
          };
        }
      } catch (err: any) {
        logger.warn({ error: err.message }, '[OpenAIImageProvider] DALL-E 3 API failed — cascading to Fal/Replicate fallback');
      }
    }

    try {
      const falProvider = new FalImageProvider();
      return await falProvider.generate(options);
    } catch (e) {
      const replicateProvider = new ReplicateImageProvider();
      return await replicateProvider.generate(options);
    }
  }
}
