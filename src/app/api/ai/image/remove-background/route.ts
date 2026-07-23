import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ModularImageGateway } from '../../../../../lib/ai/image/gateway';
import { validateAiRequest } from '../../../../../middleware/aiAuth';
import { CREDIT_COSTS } from '../../../../../config/ai.config';
import { formatAiErrorResponse } from '../../../../../services/errorHandler';
import { DatabaseService } from '../../../../../services/database';

const RemoveBgSchema = z.object({
  imageUrl: z.string().url('Valid image URL required.'),
  provider: z.enum(['auto', 'openai', 'flux', 'recraft', 'stability', 'fal', 'replicate']).optional().default('auto')
});

export async function POST(req: Request) {
  let requestedProvider = 'auto';

  try {
    const auth = await validateAiRequest(req, CREDIT_COSTS.image);
    if (!auth.authorized) return auth.response;
    const userId = auth.userId || 'usr-1';

    const body = await req.json().catch(() => ({}));
    const parseResult = RemoveBgSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ success: false, error: 'Validation Error', details: parseResult.error.flatten().fieldErrors }, { status: 400 });
    }

    const { imageUrl, provider } = parseResult.data;
    requestedProvider = provider;

    const result = await ModularImageGateway.execute({ prompt: `Transparent PNG background removal (Source: ${imageUrl})` }, provider);

    const dbRecord = await DatabaseService.saveAsset({
      userId,
      assetType: 'image',
      provider: result.provider,
      model: result.model,
      prompt: 'Remove Background Transparent PNG',
      storageUrl: result.storageUrl || result.imageUrl,
      creditsCost: CREDIT_COSTS.image
    });

    const newCredits = auth.deduct!();

    return NextResponse.json({
      success: true,
      action: 'remove-background',
      assetId: dbRecord.id,
      creditsDeducted: CREDIT_COSTS.image,
      remainingCredits: newCredits,
      result
    });
  } catch (error: any) {
    return formatAiErrorResponse(error, requestedProvider, 'FLUX');
  }
}
