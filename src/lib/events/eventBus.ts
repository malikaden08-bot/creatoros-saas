import { EventEmitter } from 'events';
import { logger } from '../../services/logger';

export interface JobEventPayload {
  jobId: string;
  queueName: string;
  userId?: string;
  status: 'queued' | 'active' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  result?: any;
  error?: string;
  timestamp: string;
}

class SystemEventBus extends EventEmitter {
  private static instance: SystemEventBus;
  private sseClients: Set<(data: string) => void> = new Set();

  private constructor() {
    super();
    this.setMaxListeners(100);
  }

  public static getInstance(): SystemEventBus {
    if (!SystemEventBus.instance) {
      SystemEventBus.instance = new SystemEventBus();
    }
    return SystemEventBus.instance;
  }

  public broadcastJobEvent(payload: JobEventPayload): void {
    logger.info({ jobId: payload.jobId, status: payload.status, progress: payload.progress }, '[EventBus] Broadcasting Job Event');
    this.emit(`job:${payload.jobId}`, payload);
    this.emit('job:any', payload);
    const formatted = `data: ${JSON.stringify(payload)}\n\n`;
    this.sseClients.forEach((send) => {
      try {
        send(formatted);
      } catch (err) {
        this.sseClients.delete(send);
      }
    });
  }

  public subscribeSse(send: (data: string) => void): () => void {
    this.sseClients.add(send);
    return () => {
      this.sseClients.delete(send);
    };
  }

  public getClientCount(): number {
    return this.sseClients.size;
  }
}

export const eventBus = SystemEventBus.getInstance();
