import { RateLimiterMemory } from 'rate-limiter-flexible';
import { NextResponse } from 'next/server';

export type UserPlanTier = 'Free' | 'Pro' | 'Enterprise';

export const PLAN_HOURLY_LIMITS: Record<UserPlanTier, number> = {
  Free: 100,
  Pro: 1000,
  Enterprise: 999999999
};

const freeLimiter = new RateLimiterMemory({
  points: PLAN_HOURLY_LIMITS.Free,
  duration: 3600
});

const proLimiter = new RateLimiterMemory({
  points: PLAN_HOURLY_LIMITS.Pro,
  duration: 3600
});

export async function checkRateLimit(
  userId: string,
  planTier: UserPlanTier = 'Free'
): Promise<{ allowed: boolean; remainingHits?: number; response?: NextResponse }> {
  if (planTier === 'Enterprise') {
    return { allowed: true, remainingHits: 999999 };
  }

  const limiter = planTier === 'Pro' ? proLimiter : freeLimiter;

  try {
    const res = await limiter.consume(userId);
    return {
      allowed: true,
      remainingHits: res.remainingPoints
    };
  } catch (rejRes: any) {
    const retryAfterSec = Math.round(rejRes.msBeforeNext / 1000) || 60;
    
    return {
      allowed: false,
      response: NextResponse.json(
        {
          error: 'Rate Limit Exceeded',
          message: `Hourly rate limit exceeded for ${planTier} plan (${PLAN_HOURLY_LIMITS[planTier]} req/hour). Please upgrade or try again later.`,
          planTier,
          hourlyLimit: PLAN_HOURLY_LIMITS[planTier],
          retryAfterSeconds: retryAfterSec
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfterSec)
          }
        }
      )
    };
  }
}
