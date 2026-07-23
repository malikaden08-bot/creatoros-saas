import { fal } from '@fal-ai/client';
import { logger } from '../../../services/logger';

export interface VideoGenerationOptions {
  prompt: string;
  imageUrl?: string;
  videoUrl?: string;
  durationSeconds?: number;
  aspectRatio?: '16:9' | '9:16' | '1:1';
  quality?: 'standard' | 'hd';
  motionStrength?: number;
  seed?: number;
}

export interface VideoGeneratedResponse {
  provider: string;
  model: string;
  videoUrl: string;
  storageUrl?: string;
  prompt: string;
  durationSeconds: number;
  width: number;
  height: number;
  latencyMs: number;
  thumbnailUrl?: string;
}

export class FalVideoError extends Error {
  public status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = 'FalVideoError';
    this.status = status;
  }
}

function requireFalKey(): string {
  const key = process.env.FAL_KEY;
  if (!key || key.includes('demo')) throw new FalVideoError('FAL_KEY is not configured.', 401);
  return key;
}

export const FalVideoProvider = {
  async textToVideo(options: VideoGenerationOptions): Promise<VideoGeneratedResponse> {
    const apiKey = requireFalKey();
    const startTime = Date.now();
    fal.config({ credentials: apiKey });
    const isPortrait = options.aspectRatio === '9:16';
    const model = 'fal-ai/kling-video/v1.6/pro/text-to-video';
    try {
      const result = await fal.subscribe(model, {
        input: {
          prompt: options.prompt,
          negative_prompt: 'blurry, distorted, low quality, watermark',
          duration: (options.durationSeconds ?? 5) <= 5 ? '5' : '10',
          aspect_ratio: options.aspectRatio ?? '16:9',
          cfg_scale: 0.5
        },
        logs: false
      }) as any;
      const videoUrl = result?.video?.url;
      if (!videoUrl) throw new FalVideoError('[Fal] No video URL in response', 500);
      return {
        provider: 'fal', model, videoUrl, storageUrl: videoUrl,
        prompt: options.prompt, durationSeconds: options.durationSeconds ?? 5,
        width: isPortrait ? 720 : 1280, height: isPortrait ? 1280 : 720,
        latencyMs: Date.now() - startTime
      };
    } catch (rawError: any) {
      if (rawError instanceof FalVideoError) throw rawError;
      throw new FalVideoError(`[Fal] Text-to-Video failed: ${rawError.message}`, rawError.status ?? 500);
    }
  },
  async imageToVideo(options: VideoGenerationOptions): Promise<VideoGeneratedResponse> {
    const apiKey = requireFalKey();
    const startTime = Date.now();
    fal.config({ credentials: apiKey });
    if (!options.imageUrl) throw new FalVideoError('[Fal] imageUrl is required for image-to-video.', 400);
    const model = 'fal-ai/kling-video/v1.6/pro/image-to-video';
    try {
      const result = await fal.subscribe(model, {
        input: {
          prompt: options.prompt, image_url: options.imageUrl,
          duration: (options.durationSeconds ?? 5) <= 5 ? '5' : '10',
          aspect_ratio: options.aspectRatio ?? '16:9', cfg_scale: 0.5
        },
        logs: false
      }) as any;
      const videoUrl = result?.video?.url;
      if (!videoUrl) throw new FalVideoError('[Fal] No video URL in image-to-video response', 500);
      return {
        provider: 'fal', model, videoUrl, storageUrl: videoUrl,
        prompt: options.prompt, durationSeconds: options.durationSeconds ?? 5,
        width: 1280, height: 720, latencyMs: Date.now() - startTime
      };
    } catch (rawError: any) {
      if (rawError instanceof FalVideoError) throw rawError;
      throw new FalVideoError(`[Fal] Image-to-Video failed: ${rawError.message}`, rawError.status ?? 500);
    }
  },
  async upscaleVideo(videoUrl: string): Promise<VideoGeneratedResponse> {
    const apiKey = requireFalKey();
    const startTime = Date.now();
    fal.config({ credentials: apiKey });
    const model = 'fal-ai/video-upscaler';
    try {
      const result = await fal.subscribe(model, { input: { video_url: videoUrl }, logs: false }) as any;
      const upscaledUrl = result?.video?.url;
      if (!upscaledUrl) throw new FalVideoError('[Fal] No upscaled video URL in response', 500);
      return {
        provider: 'fal', model, videoUrl: upscaledUrl, storageUrl: upscaledUrl,
        prompt: 'Upscaled video', durationSeconds: 0, width: 2560, height: 1440,
        latencyMs: Date.now() - startTime
      };
    } catch (rawError: any) {
      if (rawError instanceof FalVideoError) throw rawError;
      throw new FalVideoError(`[Fal] Video upscaling failed: ${rawError.message}`, rawError.status ?? 500);
    }
  }
};
