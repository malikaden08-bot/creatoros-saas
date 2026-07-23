import { VideoGenerationOptions, VideoGeneratedResponse } from './fal';

export class RunwayVideoError extends Error {
  public status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = 'RunwayVideoError';
    this.status = status;
  }
}

const RUNWAY_API_BASE = 'https://api.dev.runwayml.com/v1';

function requireKey(): string {
  const key = process.env.RUNWAY_API_KEY;
  if (!key || key.includes('demo')) throw new RunwayVideoError('RUNWAY_API_KEY is not configured.', 401);
  return key;
}

async function pollRunwayTask(taskId: string, apiKey: string, maxWaitMs = 300000): Promise<any> {
  const deadline = Date.now() + maxWaitMs;
  while (Date.now() < deadline) {
    const res = await fetch(`${RUNWAY_API_BASE}/tasks/${taskId}`, {
      headers: { Authorization: `Bearer ${apiKey}`, 'X-Runway-Version': '2024-11-06' }
    });
    const data = await res.json() as any;
    if (data.status === 'SUCCEEDED') return data;
    if (data.status === 'FAILED') throw new RunwayVideoError(`[Runway] Task failed: ${data.failure ?? 'Unknown'}`, 500);
    await new Promise((r) => setTimeout(r, 5000));
  }
  throw new RunwayVideoError('[Runway] Task timed out after 5 minutes.', 408);
}

export const RunwayVideoProvider = {
  async textToVideo(options: VideoGenerationOptions): Promise<VideoGeneratedResponse> {
    const apiKey = requireKey();
    const startTime = Date.now();
    const isPortrait = options.aspectRatio === '9:16';
    const ratio = isPortrait ? '720:1280' : '1280:720';
    const seconds = Math.min(options.durationSeconds ?? 5, 10);
    const res = await fetch(`${RUNWAY_API_BASE}/text_to_video`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'X-Runway-Version': '2024-11-06', 'Content-Type': 'application/json' },
      body: JSON.stringify({ promptText: options.prompt, model: 'gen4_turbo', ratio, duration: seconds })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as any;
      throw new RunwayVideoError(`[Runway] ${err?.error ?? `HTTP ${res.status}`}`, res.status);
    }
    const job = await res.json() as any;
    const completed = await pollRunwayTask(job.id, apiKey);
    const videoUrl = completed?.output?.[0];
    if (!videoUrl) throw new RunwayVideoError('[Runway] No video URL in completed task.', 500);
    return {
      provider: 'runway', model: 'gen4_turbo', videoUrl, storageUrl: videoUrl,
      prompt: options.prompt, durationSeconds: seconds,
      width: isPortrait ? 720 : 1280, height: isPortrait ? 1280 : 720,
      latencyMs: Date.now() - startTime
    };
  },
  async imageToVideo(options: VideoGenerationOptions): Promise<VideoGeneratedResponse> {
    const apiKey = requireKey();
    const startTime = Date.now();
    if (!options.imageUrl) throw new RunwayVideoError('[Runway] imageUrl required for image-to-video.', 400);
    const seconds = Math.min(options.durationSeconds ?? 5, 10);
    const res = await fetch(`${RUNWAY_API_BASE}/image_to_video`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'X-Runway-Version': '2024-11-06', 'Content-Type': 'application/json' },
      body: JSON.stringify({ promptText: options.prompt, promptImage: options.imageUrl, model: 'gen4_turbo', ratio: '1280:720', duration: seconds })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as any;
      throw new RunwayVideoError(`[Runway] ${err?.error ?? `HTTP ${res.status}`}`, res.status);
    }
    const job = await res.json() as any;
    const completed = await pollRunwayTask(job.id, apiKey);
    const videoUrl = completed?.output?.[0];
    if (!videoUrl) throw new RunwayVideoError('[Runway] No video URL in image-to-video response.', 500);
    return {
      provider: 'runway', model: 'gen4_turbo', videoUrl, storageUrl: videoUrl,
      prompt: options.prompt, durationSeconds: seconds, width: 1280, height: 720,
      latencyMs: Date.now() - startTime
    };
  },
  async motionBrush(options: VideoGenerationOptions): Promise<VideoGeneratedResponse> {
    const motionPrompt = `${options.prompt}, smooth motion, cinematic movement, dynamic`;
    return this.imageToVideo({ ...options, prompt: motionPrompt });
  }
};
