import { ImageGenerationOptions, ImageGeneratedResponse } from '../types';
import { ReplicateImageProvider as CoreReplicateProvider } from '../../providers/image/replicate';

export class ReplicateImageProvider {
  public async generate(options: ImageGenerationOptions): Promise<ImageGeneratedResponse> {
    return await CoreReplicateProvider.generate(options);
  }
}
