import { NextRequest, NextResponse } from 'next/server';
import { queueManager, QUEUE_NAMES, QueueName, JobPriority } from '../../../lib/queue/bullmq';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const queueName = (searchParams.get('queueName') as QueueName) || undefined;
  const status = searchParams.get('status') || undefined;

  const metrics = queueManager.getQueueMetrics();
  const jobs = queueManager.getJobs({ queueName, status });

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    metrics,
    totalJobs: jobs.length,
    jobs
  }, {
    status: 200,
    headers: { 'Cache-Control': 'no-store' }
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { queueName, jobName, data, priority, retries } = body;

    if (!queueName || !QUEUE_NAMES.includes(queueName)) {
      return NextResponse.json(
        { success: false, error: `Invalid queueName. Supported queues: ${QUEUE_NAMES.join(', ')}` },
        { status: 400 }
      );
    }

    if (!jobName) {
      return NextResponse.json({ success: false, error: 'jobName is required' }, { status: 400 });
    }

    const snapshot = await queueManager.dispatchJob({
      queueName,
      jobName,
      data: data || {},
      priority: (priority as JobPriority) || 2,
      retries: retries || 3
    });

    return NextResponse.json(
      {
        success: true,
        message: `Job ${snapshot.id} dispatched to ${queueName} queue`,
        job: snapshot
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to dispatch queue job' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const jobId = searchParams.get('jobId');

  if (!jobId) {
    return NextResponse.json({ success: false, error: 'jobId query parameter is required' }, { status: 400 });
  }

  const cancelled = await queueManager.cancelJob(jobId);
  if (!cancelled) {
    return NextResponse.json({ success: false, error: `Job ${jobId} not found` }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    message: `Job ${jobId} cancelled successfully`
  });
}
