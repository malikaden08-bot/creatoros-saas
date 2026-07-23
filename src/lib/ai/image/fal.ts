import { ImageGenerationOptions, ImageGeneratedResponse } from '../types';
import { FalImageProvider as CoreFalProvider } from '../../providers/image/fal';
import { ReplicateImageProvider as CoreReplicateProvider } from '../../providers/image/replicate';

export class FalImageProvider {
  public async generate(options: ImageGenerationOptions): Promise<ImageGeneratedResponse> {
    try {
      return await CoreFalProvider.generate(options);
    } catch (err: any) {
      return await CoreReplicateProvider.generate(options);
    }
  }
}
