import { ImageGenerationOptions, ImageGeneratedResponse } from '../types';
import { FalImageProvider } from './fal';
import { ReplicateImageProvider } from './replicate';

export class FluxImageProvider {
  public async generate(options: ImageGenerationOptions): Promise<ImageGeneratedResponse> {
    try {
      const falProvider = new FalImageProvider();
      const res = await falProvider.generate(options);
      return {
        ...res,
        provider: 'flux',
        model: 'flux-1.1-pro'
      };
    } catch (err: any) {
      const replicateProvider = new ReplicateImageProvider();
      const res = await replicateProvider.generate(options);
      return {
        ...res,
        provider: 'flux',
        model: 'black-forest-labs/flux-schnell'
      };
    }
  }
}
