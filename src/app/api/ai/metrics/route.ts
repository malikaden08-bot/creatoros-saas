import { NextRequest, NextResponse } from 'next/server';
import { ProviderMetrics } from '../../../../lib/ai/metrics';
import { PromptCache } from '../../../../lib/ai/cache';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  if (searchParams.get('reset') === 'true') {
    ProviderMetrics.resetAll();
    PromptCache.flush();
    return NextResponse.json({ reset: true, message: 'All metrics and cache cleared.' });
  }

  if (searchParams.get('prune') === 'true') {
    const removed = PromptCache.pruneExpired();
    return NextResponse.json({ pruned: removed, message: `Removed ${removed} expired cache entries.` });
  }

  const providerMetrics = ProviderMetrics.getAll();
  const cacheStats = PromptCache.stats();

  const all = Object.values(providerMetrics);
  const totalRequests = all.reduce((s, p) => s + p.totalRequests, 0);
  const totalSuccess = all.reduce((s, p) => s + p.successCount, 0);
  const totalFailures = all.reduce((s, p) => s + p.failureCount, 0);
  const totalTokens = all.reduce((s, p) => s + p.totalTokens, 0);
  const totalCostUsd = Number(all.reduce((s, p) => s + p.totalCostUsd, 0).toFixed(6));
  const totalCacheHits = all.reduce((s, p) => s + p.cacheHits, 0);
  const overallSuccessRate = totalRequests > 0
    ? Number((totalSuccess / totalRequests).toFixed(4))
    : 0;

  return NextResponse.json(
    {
      timestamp: new Date().toISOString(),
      gateway: {
        totalRequests,
        totalSuccess,
        totalFailures,
        overallSuccessRate,
        totalTokens,
        totalCostUsd,
        totalCacheHits,
        cacheHitRate: totalRequests > 0
          ? Number((totalCacheHits / totalRequests).toFixed(4))
          : 0
      },
      providers: providerMetrics,
      cache: cacheStats
    },
    {
      status: 200,
      headers: { 'Cache-Control': 'no-store' }
    }
  );
}
