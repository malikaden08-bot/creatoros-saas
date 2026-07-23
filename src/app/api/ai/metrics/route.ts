import { NextRequest, NextResponse } from 'next/server';
import { ProviderMetrics } from '../../../../lib/ai/metrics';
import { PromptCache } from '../../../../lib/ai/cache';
import { AIMetricsService } from '../../../../services/ai-metrics';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  if (searchParams.get('reset') === 'true') {
    ProviderMetrics.resetAll();
    PromptCache.flush();
    return NextResponse.json({ reset: true, message: 'All live metrics and cache cleared.' });
  }

  if (searchParams.get('prune') === 'true') {
    const removed = PromptCache.pruneExpired();
    return NextResponse.json({ pruned: removed, message: `Removed ${removed} expired cache entries.` });
  }

  const userId = searchParams.get('userId') || undefined;
  const workspaceId = searchParams.get('workspaceId') || undefined;

  const summary = await AIMetricsService.getSummary({ userId, workspaceId });

  if (searchParams.get('format') === 'csv') {
    const csvContent = AIMetricsService.exportMetricsCsv(summary);
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="creatoros_ai_metrics_${Date.now()}.csv"`,
        'Cache-Control': 'no-store'
      }
    });
  }

  const cacheStats = PromptCache.stats();

  return NextResponse.json(
    {
      success: true,
      summary,
      cache: cacheStats
    },
    {
      status: 200,
      headers: { 'Cache-Control': 'no-store' }
    }
  );
}
