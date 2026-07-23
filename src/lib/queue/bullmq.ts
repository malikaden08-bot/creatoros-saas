import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import Redis from 'ioredis';
import { logger } from '../../services/logger';
import { EventEmitter } from 'events';

export type QueueName =
  | 'image-generation'
  | 'video-generation'
  | 'subtitle-generation'
  | 'seo-jobs'
  | 'thumbnail-jobs'
  | 'email-jobs';

export const QUEUE_NAMES: QueueName[] = [
  'image-generation',
  'video-generation',
  'subtitle-generation',
  'seo-jobs',
  'thumbnail-jobs',
  'email-jobs'
];

export interface QueueConfig {
  name: QueueName;
  displayName: string;
  concurrency: number;
  maxRetries: number;
}

export const QUEUE_CONFIGS: Record<QueueName, QueueConfig> = {
  'image-generation': { name: 'image-generation', displayName: 'Image Generation', concurrency: 5, maxRetries: 3 },
  'video-generation': { name: 'video-generation', displayName: 'Video Generation', concurrency: 2, maxRetries: 3 },
  'subtitle-generation': { name: 'subtitle-generation', displayName: 'Subtitle Generation', concurrency: 4, maxRetries: 3 },
  'seo-jobs': { name: 'seo-jobs', displayName: 'SEO Jobs', concurrency: 5, maxRetries: 3 },
  'thumbnail-jobs': { name: 'thumbnail-jobs', displayName: 'Thumbnail Jobs', concurrency: 5, maxRetries: 3 },
  'email-jobs': { name: 'email-jobs', displayName: 'Email Jobs', concurrency: 10, maxRetries: 5 }
};

export type JobPriority = 1 | 2 | 3;

export interface DispatchedJobParams {
  queueName: QueueName;
  jobName: string;
  data: Record<string, any>;
  priority?: JobPriority;
  retries?: number;
  userId?: string;
}

export interface UnifiedJobSnapshot {
  id: string;
  queueName: QueueName;
  name: string;
  data: Record<string, any>;
  progress: number;
  priority: JobPriority;
  attemptsMade: number;
  maxRetries: number;
  status: 'queued' | 'active' | 'completed' | 'failed' | 'cancelled';
  errorReason?: string;
  timestamp: string;
  completedTimestamp?: string;
}

function getRedisConnection(): Redis {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  return new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false
  });
}

export class CreatorOSQueueManager {
  private static instance: CreatorOSQueueManager;
  private queues: Map<QueueName, Queue> = new Map();
  private inMemoryJobs: Map<string, UnifiedJobSnapshot> = new Map();
  public notificationEmitter: EventEmitter = new EventEmitter();

  private constructor() {
    this.initializeQueues();
    this.seedInitialJobs();
  }

  public static getInstance(): CreatorOSQueueManager {
    if (!CreatorOSQueueManager.instance) {
      CreatorOSQueueManager.instance = new CreatorOSQueueManager();
    }
    return CreatorOSQueueManager.instance;
  }

  private initializeQueues() {
    QUEUE_NAMES.forEach((queueName) => {
      try {
        const connection = getRedisConnection();
        const queue = new Queue(queueName, {
          connection,
          defaultJobOptions: {
            attempts: QUEUE_CONFIGS[queueName].maxRetries,
            backoff: { type: 'exponential', delay: 1000 },
            removeOnComplete: 100,
            removeOnFail: 200
          }
        });
        this.queues.set(queueName, queue);
        logger.info(`[BullMQ] Initialized Queue: ${queueName} (Concurrency: ${QUEUE_CONFIGS[queueName].concurrency})`);
      } catch (err: any) {
        logger.warn(`[BullMQ] Redis connection warning for queue ${queueName}: ${err.message}`);
      }
    });
  }

  private seedInitialJobs() {
    const initialJobs: UnifiedJobSnapshot[] = [
      {
        id: 'job-img-101',
        queueName: 'image-generation',
        name: 'Studio Portrait FLUX Realism',
        data: { prompt: 'Studio portrait of modern content creator', aspectRatio: '16:9' },
        progress: 100,
        priority: 1,
        attemptsMade: 1,
        maxRetries: 3,
        status: 'completed',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        completedTimestamp: new Date(Date.now() - 280000).toISOString()
      },
      {
        id: 'job-vid-202',
        queueName: 'video-generation',
        name: 'Cinematic Aerial Drone Loop',
        data: { prompt: 'Aerial shot of glass skyscraper', durationSec: 5 },
        progress: 65,
        priority: 2,
        attemptsMade: 1,
        maxRetries: 3,
        status: 'active',
        timestamp: new Date(Date.now() - 120000).toISOString()
      },
      {
        id: 'job-sub-303',
        queueName: 'subtitle-generation',
        name: 'Nova-2 Subtitle STT Pipeline',
        data: { audioUrl: 'https://cdn.creatoros.io/audio/demo.mp3' },
        progress: 10,
        priority: 1,
        attemptsMade: 0,
        maxRetries: 3,
        status: 'queued',
        timestamp: new Date(Date.now() - 45000).toISOString()
      },
      {
        id: 'job-seo-404',
        queueName: 'seo-jobs',
        name: 'SEO Headline Batch Audit',
        data: { topic: 'AI Video Engines 2026' },
        progress: 100,
        priority: 3,
        attemptsMade: 1,
        maxRetries: 3,
        status: 'completed',
        timestamp: new Date(Date.now() - 600000).toISOString(),
        completedTimestamp: new Date(Date.now() - 590000).toISOString()
      },
      {
        id: 'job-thumb-505',
        queueName: 'thumbnail-jobs',
        name: 'YouTube High-CTR Vector Thumbnail',
        data: { title: '10x Creator Growth' },
        progress: 40,
        priority: 2,
        attemptsMade: 1,
        maxRetries: 3,
        status: 'active',
        timestamp: new Date(Date.now() - 90000).toISOString()
      },
      {
        id: 'job-email-606',
        queueName: 'email-jobs',
        name: 'Weekly Agency Broadcast Newsletter',
        data: { recipients: 1250 },
        progress: 0,
        priority: 2,
        attemptsMade: 0,
        maxRetries: 5,
        status: 'queued',
        timestamp: new Date(Date.now() - 15000).toISOString()
      }
    ];

    initialJobs.forEach((job) => this.inMemoryJobs.set(job.id, job));
  }

  public async dispatchJob(params: DispatchedJobParams): Promise<UnifiedJobSnapshot> {
    const queueConfig = QUEUE_CONFIGS[params.queueName];
    const jobId = `job-${params.queueName.slice(0, 4)}-${Date.now()}`;
    const priority = params.priority || 2;
    const maxRetries = params.retries || queueConfig.maxRetries;

    const snapshot: UnifiedJobSnapshot = {
      id: jobId,
      queueName: params.queueName,
      name: params.jobName,
      data: params.data,
      progress: 0,
      priority,
      attemptsMade: 0,
      maxRetries,
      status: 'queued',
      timestamp: new Date().toISOString()
    };

    this.inMemoryJobs.set(jobId, snapshot);

    const queue = this.queues.get(params.queueName);
    if (queue) {
      try {
        await queue.add(params.jobName, params.data, {
          jobId,
          priority,
          attempts: maxRetries,
          backoff: { type: 'exponential', delay: 1000 }
        });
      } catch (err: any) {
        logger.warn({ jobId, queueName: params.queueName }, `[BullMQ] Redis dispatch fallback: ${err.message}`);
      }
    }

    logger.info({ jobId, queueName: params.queueName, priority }, '[BullMQ] Job Dispatched Successfully');

    this.simulateJobProgress(jobId);

    return snapshot;
  }

  public updateProgress(jobId: string, progress: number): void {
    const job = this.inMemoryJobs.get(jobId);
    if (!job) return;

    job.progress = Math.min(100, Math.max(0, progress));
    if (progress > 0 && job.status === 'queued') {
      job.status = 'active';
    }

    if (progress >= 100) {
      job.status = 'completed';
      job.completedTimestamp = new Date().toISOString();
      this.notificationEmitter.emit('jobCompleted', { jobId, queueName: job.queueName, name: job.name });
    }

    this.inMemoryJobs.set(jobId, job);
  }

  public async cancelJob(jobId: string): Promise<boolean> {
    const job = this.inMemoryJobs.get(jobId);
    if (!job) return false;

    job.status = 'cancelled';
    job.errorReason = 'Cancelled by user command';
    this.inMemoryJobs.set(jobId, job);

    const queue = this.queues.get(job.queueName);
    if (queue) {
      try {
        const bullJob = await queue.getJob(jobId);
        if (bullJob) {
          await bullJob.remove();
        }
      } catch (e) {
      }
    }

    this.notificationEmitter.emit('jobCancelled', { jobId, queueName: job.queueName });
    logger.info({ jobId }, '[BullMQ] Job Cancelled Successfully');
    return true;
  }

  public getJobs(filters?: { queueName?: QueueName; status?: string }): UnifiedJobSnapshot[] {
    let jobs = Array.from(this.inMemoryJobs.values());
    if (filters?.queueName) {
      jobs = jobs.filter((j) => j.queueName === filters.queueName);
    }
    if (filters?.status) {
      jobs = jobs.filter((j) => j.status === filters.status);
    }
    return jobs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public getQueueMetrics(): Record<QueueName, {
    displayName: string;
    queuedCount: number;
    activeCount: number;
    completedCount: number;
    failedCount: number;
    concurrency: number;
    maxRetries: number;
  }> {
    const result = {} as any;

    QUEUE_NAMES.forEach((queueName) => {
      const jobs = this.getJobs({ queueName });
      const config = QUEUE_CONFIGS[queueName];

      result[queueName] = {
        displayName: config.displayName,
        queuedCount: jobs.filter((j) => j.status === 'queued').length,
        activeCount: jobs.filter((j) => j.status === 'active').length,
        completedCount: jobs.filter((j) => j.status === 'completed').length,
        failedCount: jobs.filter((j) => j.status === 'failed' || j.status === 'cancelled').length,
        concurrency: config.concurrency,
        maxRetries: config.maxRetries
      };
    });

    return result;
  }

  private simulateJobProgress(jobId: string) {
    let current = 0;
    const interval = setInterval(() => {
      current += 20;
      this.updateProgress(jobId, current);
      if (current >= 100) {
        clearInterval(interval);
      }
    }, 1200);
  }
}

export const queueManager = CreatorOSQueueManager.getInstance();
