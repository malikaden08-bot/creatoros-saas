import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ModularImageGateway } from '../../../../../lib/ai/image/gateway';
import { validateAiRequest } from '../../../../../middleware/aiAuth';
import { CREDIT_COSTS } from '../../../../../config/ai.config';
import { formatAiErrorResponse } from '../../../../../services/errorHandler';
import { DatabaseService } from '../../../../../services/database';

const LogoSchema = z.object({
  companyName: z.string().optional(),
  brandName: z.string().optional(),
  industry: z.string().optional().default('SaaS & Tech'),
  style: z.string().optional().default('Minimalist Vector'),
  provider: z.enum(['auto', 'openai', 'flux', 'recraft', 'stability', 'fal', 'replicate']).optional().default('recraft')
});

export async function POST(req: Request) {
  let requestedProvider = 'recraft';

  try {
    const auth = await validateAiRequest(req, CREDIT_COSTS.image);
    if (!auth.authorized) return auth.response;
    const userId = auth.userId || 'usr-1';

    const body = await req.json().catch(() => ({}));
    const parseResult = LogoSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ success: false, error: 'Validation Error', details: parseResult.error.flatten().fieldErrors }, { status: 400 });
    }

    const name = parseResult.data.companyName || parseResult.data.brandName || 'CreatorOS';
    const { industry, style, provider } = parseResult.data;
    requestedProvider = provider;

    const result = await ModularImageGateway.execute({
      prompt: `Vector App Icon Logo for "${name}", industry: ${industry}, style: ${style}, clean geometry, isolated background, high resolution SVG style`,
      aspectRatio: '1:1',
      stylePreset: 'Vector'
    }, provider);

    const dbRecord = await DatabaseService.saveAsset({
      userId,
      assetType: 'image',
      provider: result.provider,
      model: result.model,
      prompt: `Logo: ${name} (${industry})`,
      storageUrl: result.storageUrl || result.imageUrl,
      width: 1024,
      height: 1024,
      creditsCost: CREDIT_COSTS.image
    });

    const newCredits = auth.deduct!();

    return NextResponse.json({
      success: true,
      action: 'logo',
      assetId: dbRecord.id,
      input: {
        companyName: name,
        industry,
        style
      },
      creditsDeducted: CREDIT_COSTS.image,
      remainingCredits: newCredits,
      result
    });
  } catch (error: any) {
    return formatAiErrorResponse(error, requestedProvider, 'Recraft');
  }
}
