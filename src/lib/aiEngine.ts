import { providerManager } from './ai/provider-manager';
import { AIModel } from './mockDataAI';
import { z } from 'zod';

export interface GenerationRequest {
  toolId: string;
  modelId: string;
  prompt: string;
  negativePrompt?: string;
  params?: Record<string, any>;
}

export interface GenerationResult {
  id: string;
  toolId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  outputType: 'text' | 'image' | 'video' | 'audio';
  content: string;
  creditsUsed: number;
  createdAt: string;
  error?: string;
}

export const GenerationRequestSchema = z.object({
  toolId: z.string(),
  modelId: z.string(),
  prompt: z.string().min(1, 'Prompt cannot be empty'),
  negativePrompt: z.string().optional(),
  params: z.record(z.string(), z.any()).optional()
});

export class AIEngine {
  private static queue: GenerationResult[] = [];

  public static async generate(req: GenerationRequest, model: AIModel): Promise<GenerationResult> {
    const validatedReq = GenerationRequestSchema.parse(req);

    const newJob: GenerationResult = {
      id: `gen-${Date.now()}`,
      toolId: validatedReq.toolId,
      status: 'processing',
      outputType: model.category,
      content: '',
      creditsUsed: model.costCredits,
      createdAt: 'Just now'
    };

    this.queue.unshift(newJob);

    try {
      let outputContent = '';

      if (model.category === 'text') {
        const res = await providerManager.text(
          { messages: [{ role: 'user', content: validatedReq.prompt }] },
          'auto'
        );
        outputContent = res.data.content;
      } else if (model.category === 'image') {
        const res = await providerManager.image(
          { prompt: validatedReq.prompt, negativePrompt: validatedReq.negativePrompt },
          'auto'
        );
        outputContent = res.data.imageUrl;
      } else if (model.category === 'video') {
        const res = await providerManager.video(
          { prompt: validatedReq.prompt },
          'auto'
        );
        outputContent = res.data.content;
      } else if (model.category === 'audio') {
        const res = await providerManager.speech(
          { text: validatedReq.prompt },
          'auto'
        );
        const base64 = Buffer.from(res.data.audioBuffer).toString('base64');
        outputContent = `data:audio/mpeg;base64,${base64}`;
      }

      newJob.status = 'completed';
      newJob.content = outputContent;
      return newJob;
    } catch (err: any) {
      newJob.status = 'failed';
      newJob.error = err.message || 'Provider execution failed';
      newJob.content = `[ERROR: Provider Request Failed] ${err.message}`;
      return newJob;
    }
  }

  public static getActiveQueue(): GenerationResult[] {
    return this.queue;
  }
}
