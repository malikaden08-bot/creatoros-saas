import { NextResponse } from 'next/server';
import { z } from 'zod';
import { AIGateway } from '../../../../lib/ai/gateway';
import { validateAiRequest } from '../../../../middleware/aiAuth';
import { CREDIT_COSTS } from '../../../../config/ai.config';
import { formatAiErrorResponse } from '../../../../services/errorHandler';

const SEORequestSchema = z.object({
  topic: z.string().min(1, 'Topic is required for SEO generation.'),
  keywords: z.array(z.string()).optional(),
  targetAudience: z.string().optional(),
  provider: z.enum(['auto', 'openai', 'gemini', 'claude']).optional().default('auto')
});

export async function POST(req: Request) {
  let requestedProvider = 'auto';

  try {
    const auth = await validateAiRequest(req, CREDIT_COSTS.seo);
    if (!auth.authorized) return auth.response;
    const userId = auth.userId || 'usr-1';

    const body = await req.json().catch(() => ({}));
    const parseResult = SEORequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ success: false, error: 'Validation Error', details: parseResult.error.flatten().fieldErrors }, { status: 400 });
    }

    const { topic, keywords, targetAudience, provider } = parseResult.data;
    requestedProvider = provider;

    const response = await AIGateway.seo(
      {
        topic,
        keywords,
        targetAudience
      },
      provider,
      userId
    );

    const newCreditBalance = auth.deduct!();

    return NextResponse.json({
      success: true,
      creditsDeducted: CREDIT_COSTS.seo,
      remainingCredits: newCreditBalance,
      response: {
        provider: response.provider,
        model: response.model,
        seoContent: response.content,
        topic,
        tokenUsage: response.tokenUsage,
        latency: response.latency
      }
    });
  } catch (error: any) {
    return formatAiErrorResponse(error, requestedProvider, 'Gemini');
  }
}
