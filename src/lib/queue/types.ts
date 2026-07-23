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
