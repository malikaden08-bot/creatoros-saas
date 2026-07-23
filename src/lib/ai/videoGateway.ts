import { FalVideoProvider, VideoGenerationOptions, VideoGeneratedResponse } from '../providers/video/fal';
import { LumaVideoProvider } from '../providers/video/luma';
import { RunwayVideoProvider } from '../providers/video/runway';
import { ReplicateVideoProvider } from '../providers/video/replicate';
import { CloudStorageService } from '../../services/storage';
import { logger } from '../../services/logger';

export type VideoProviderName = 'auto' | 'runway' | 'luma' | 'fal' | 'replicate';
export type VideoMode = 'text-to-video' | 'image-to-video' | 'video-to-video' | 'lip-sync' | 'frame-interpolation' | 'motion-brush' | 'upscale';

export interface VideoGatewayOptions extends VideoGenerationOptions {
  mode?: VideoMode;
  videoUrl?: string;
  lipSyncAudioUrl?: string;
}

export interface VideoGatewayResult extends VideoGeneratedResponse {
  mode: VideoMode;
  failoverAttempts: number;
  cloudinaryUrl?: string;
}

export class VideoGateway {
  private static readonly PROVIDER_ORDER: VideoProviderName[] = ['runway', 'luma', 'fal', 'replicate'];

  public static async execute(options: VideoGatewayOptions, requestedProvider: VideoProviderName = 'auto'): Promise<VideoGatewayResult> {
    const mode: VideoMode = options.mode ?? (options.imageUrl ? 'image-to-video' : 'text-to-video');
    const chain: VideoProviderName[] = requestedProvider === 'auto'
      ? this.PROVIDER_ORDER
      : [requestedProvider, ...this.PROVIDER_ORDER.filter((p) => p !== requestedProvider)];

    const errors: string[] = [];
    let failoverAttempts = 0;

    for (const provider of chain) {
      failoverAttempts++;
      try {
        logger.info({ provider, mode }, `[VideoGateway] Attempting ${mode} with ${provider}`);
        let result: VideoGeneratedResponse;
        switch (mode) {
          case 'frame-interpolation':
            if (!options.videoUrl) throw new Error('videoUrl required for frame interpolation');
            result = await ReplicateVideoProvider.frameInterpolation(options.videoUrl);
            break;
          case 'upscale':
            if (!options.videoUrl) throw new Error('videoUrl required for upscaling');
            result = await FalVideoProvider.upscaleVideo(options.videoUrl);
            break;
          case 'motion-brush':
            if (provider === 'runway') result = await RunwayVideoProvider.motionBrush(options);
            else if (provider === 'fal') result = await FalVideoProvider.imageToVideo(options);
            else if (provider === 'luma') result = await LumaVideoProvider.imageToVideo(options);
            else result = await ReplicateVideoProvider.imageToVideo(options);
            break;
          case 'image-to-video':
            if (provider === 'runway') result = await RunwayVideoProvider.imageToVideo(options);
            else if (provider === 'luma') result = await LumaVideoProvider.imageToVideo(options);
            else if (provider === 'fal') result = await FalVideoProvider.imageToVideo(options);
            else result = await ReplicateVideoProvider.imageToVideo(options);
            break;
          case 'text-to-video':
          default:
            if (provider === 'runway') result = await RunwayVideoProvider.textToVideo(options);
            else if (provider === 'luma') result = await LumaVideoProvider.textToVideo(options);
            else if (provider === 'fal') result = await FalVideoProvider.textToVideo(options);
            else result = await ReplicateVideoProvider.textToVideo(options);
            break;
        }
        let cloudinaryUrl: string | undefined;
        try {
          const stored = await CloudStorageService.uploadImage(result.videoUrl, 'ai-videos');
          cloudinaryUrl = stored.storageUrl;
          result.storageUrl = cloudinaryUrl;
        } catch (storageErr: any) {
          logger.warn({ error: storageErr.message }, '[VideoGateway] Cloudinary upload failed — using source URL');
        }
        logger.info({ provider, mode, latencyMs: result.latencyMs }, `[VideoGateway] Success with ${provider}`);
        return { ...result, mode, failoverAttempts, cloudinaryUrl };
      } catch (err: any) {
        const msg = `${provider}/${mode} failed: ${err.message}`;
        logger.warn({ provider, mode, error: err.message }, `[VideoGateway] ${msg} — cascading`);
        errors.push(msg);
      }
    }
    throw new Error(`[VideoGateway] All providers exhausted for ${mode}: [${errors.join(' | ')}]`);
  }
}
