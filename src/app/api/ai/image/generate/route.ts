import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ModularImageGateway } from '../../../../../lib/ai/image/gateway';
import { validateAiRequest } from '../../../../../middleware/aiAuth';
import { CREDIT_COSTS } from '../../../../../config/ai.config';
import { formatAiErrorResponse } from '../../../../../services/errorHandler';
import { DatabaseService } from '../../../../../services/database';
import { UsageService } from '../../../../../services/usage';

const RequestSchema = z.object({
  provider: z.enum(['auto', 'openai', 'flux', 'recraft', 'stability', 'fal', 'replicate']).optional().default('auto'),
  prompt: z.string().min(1, 'Prompt is required for image generation.'),
  negativePrompt: z.string().optional().default('blurry, distorted, low quality, watermark, text'),
  aspectRatio: z.enum(['1:1', '16:9', '9:16', '4:3']).optional().default('16:9'),
  stylePreset: z.string().optional(),
  seed: z.number().optional(),
  steps: z.number().optional().default(30),
  workspace: z.string().optional().default('ws-default')
});

export async function POST(req: Request) {
  let requestedProvider = 'auto';
  const startTime = Date.now();

  try {
    const auth = await validateAiRequest(req, CREDIT_COSTS.image);
    if (!auth.authorized) return auth.response;
    const userId = auth.userId || 'usr-1';

    const body = await req.json().catch(() => ({}));
    const parseResult = RequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ success: false, error: 'Validation Error', details: parseResult.error.flatten().fieldErrors }, { status: 400 });
    }

    const { provider, prompt, negativePrompt, aspectRatio, stylePreset, seed, steps, workspace } = parseResult.data;
    requestedProvider = provider;

    const result = await ModularImageGateway.execute(
      { prompt, negativePrompt, aspectRatio, stylePreset, seed, steps, workspace },
      provider
    );

    const resolution = `${result.width}x${result.height}`;
    const generatedSeed = result.seed ?? seed ?? Math.floor(Math.random() * 89999999) + 10000000;
    const generatedSteps = result.steps ?? steps ?? 30;

    const historyRecord = await DatabaseService.saveImageHistory({
      user: userId,
      workspace,
      prompt: result.prompt,
      negativePrompt,
      provider: result.provider,
      model: result.model,
      seed: generatedSeed,
      steps: generatedSteps,
      resolution,
      cost: 0.04,
      credits: CREDIT_COSTS.image,
      storageUrl: result.storageUrl || result.imageUrl
    });

    const newCredits = auth.deduct!();

    UsageService.recordRequestLog({
      user: userId,
      provider: result.provider as any,
      model: result.model,
      promptTokens: result.tokenUsage.prompt,
      completionTokens: result.tokenUsage.completion,
      creditsDeducted: CREDIT_COSTS.image,
      latencyMs: Date.now() - startTime,
      status: 'success',
      endpoint: '/api/ai/image/generate'
    });

    return NextResponse.json({
      success: true,
      action: 'generate',
      historyRecordId: historyRecord.id,
      creditsDeducted: CREDIT_COSTS.image,
      remainingCredits: newCredits,
      imageHistory: {
        prompt: historyRecord.prompt,
        negativePrompt: historyRecord.negativePrompt,
        provider: historyRecord.provider,
        model: historyRecord.model,
        seed: historyRecord.seed,
        steps: historyRecord.steps,
        resolution: historyRecord.resolution,
        user: historyRecord.user,
        workspace: historyRecord.workspace,
        cost: historyRecord.cost,
        credits: historyRecord.credits,
        date: historyRecord.date,
        storageUrl: historyRecord.storageUrl
      }
    });
  } catch (error: any) {
    return formatAiErrorResponse(error, requestedProvider, 'FLUX');
  }
}
