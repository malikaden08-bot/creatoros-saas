import { ImageGenerationOptions, ImageGeneratedResponse } from '../types';
import { FalImageProvider } from './fal';
import { OpenAIImageProvider } from './openai';

export class RecraftImageProvider {
  public async generate(options: ImageGenerationOptions): Promise<ImageGeneratedResponse> {
    const vectorPrompt = `${options.prompt}, clean vector art style, flat design graphic logo, SVG aesthetic`;
    const updatedOptions = { ...options, prompt: vectorPrompt };

    try {
      const falProvider = new FalImageProvider();
      const res = await falProvider.generate(updatedOptions);
      return {
        ...res,
        provider: 'recraft',
        model: 'recraft-v3-vector'
      };
    } catch (err: any) {
      const openaiProvider = new OpenAIImageProvider();
      const res = await openaiProvider.generate(updatedOptions);
      return {
        ...res,
        provider: 'recraft',
        model: 'dall-e-3-recraft-vector'
      };
    }
  }
}
