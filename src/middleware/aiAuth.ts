import { NextResponse } from 'next/server';
import { CreditService } from '../services/credits';
import { checkRateLimit, UserPlanTier } from './rateLimiter';

export async function validateAiRequest(req: Request, requiredCredits: number = 5) {
  const userId = req.headers.get('x-user-id') || 'usr-1';
  const planTier = (req.headers.get('x-plan-tier') as UserPlanTier) || 'Free';

  const rateLimitResult = await checkRateLimit(userId, planTier);
  if (!rateLimitResult.allowed) {
    return {
      authorized: false,
      response: rateLimitResult.response!
    };
  }

  if (!CreditService.hasSufficientCredits(userId, requiredCredits)) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Insufficient AI credits balance for this operation.' },
        { status: 402 }
      )
    };
  }

  return {
    authorized: true,
    userId,
    planTier,
    remainingRateLimitHits: rateLimitResult.remainingHits,
    deduct: () => CreditService.deductCredits(userId, requiredCredits)
  };
}
