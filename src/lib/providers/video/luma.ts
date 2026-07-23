import { VideoGenerationOptions, VideoGeneratedResponse } from './fal';

export class LumaVideoError extends Error {
  public status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = 'LumaVideoError';
    this.status = status;
  }
}

const LUMA_API_BASE = 'https://api.lumalabs.ai/dream-machine/v1/generations';

function requireKey(): string {
  const key = process.env.LUMA_API_KEY;
  if (!key || key.includes('demo')) throw new LumaVideoError('LUMA_API_KEY is not configured.', 401);
  return key;
}

async function pollGeneration(id: string, apiKey: string, maxWaitMs = 300000): Promise<any> {
  const deadline = Date.now() + maxWaitMs;
  while (Date.now() < deadline) {
    const res = await fetch(`${LUMA_API_BASE}/${id}`, { headers: { Authorization: `Bearer ${apiKey}` } });
    const data = await res.json() as any;
    if (data.state === 'completed') return data;
    if (data.state === 'failed') throw new LumaVideoError(`[Luma] Generation failed: ${data.failure_reason}`, 500);
    await new Promise((r) => setTimeout(r, 5000));
  }
  throw new LumaVideoError('[Luma] Generation timed out after 5 minutes.', 408);
}

export const LumaVideoProvider = {
  async textToVideo(options: VideoGenerationOptions): Promise<VideoGeneratedResponse> {
    const apiKey = requireKey();
    const startTime = Date.now();
    const res = await fetch(LUMA_API_BASE, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: options.prompt, model: 'ray-2-flash',
        resolution: options.aspectRatio === '9:16' ? '540p' : '720p',
        duration: options.durationSeconds && options.durationSeconds >= 9 ? '9s' : '5s',
        aspect_ratio: options.aspectRatio ?? '16:9'
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as any;
      throw new LumaVideoError(`[Luma] ${err?.detail ?? `HTTP ${res.status}`}`, res.status);
    }
    const job = await res.json() as any;
    const completed = await pollGeneration(job.id, apiKey);
    const videoUrl = completed?.assets?.video;
    if (!videoUrl) throw new LumaVideoError('[Luma] No video asset URL in completed generation.', 500);
    const isPortrait = options.aspectRatio === '9:16';
    return {
      provider: 'luma', model: 'ray-2-flash', videoUrl, storageUrl: videoUrl,
      prompt: options.prompt, durationSeconds: options.durationSeconds ?? 5,
      width: isPortrait ? 720 : 1280, height: isPortrait ? 1280 : 720,
      latencyMs: Date.now() - startTime, thumbnailUrl: completed?.assets?.thumbnail
    };
  },
  async imageToVideo(options: VideoGenerationOptions): Promise<VideoGeneratedResponse> {
    const apiKey = requireKey();
    const startTime = Date.now();
    if (!options.imageUrl) throw new LumaVideoError('[Luma] imageUrl required for image-to-video.', 400);
    const res = await fetch(LUMA_API_BASE, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: options.prompt, model: 'ray-2',
        keyframes: { frame0: { type: 'image', url: options.imageUrl } },
        duration: options.durationSeconds && options.durationSeconds >= 9 ? '9s' : '5s',
        aspect_ratio: options.aspectRatio ?? '16:9'
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as any;
      throw new LumaVideoError(`[Luma] ${err?.detail ?? `HTTP ${res.status}`}`, res.status);
    }
    const job = await res.json() as any;
    const completed = await pollGeneration(job.id, apiKey);
    const videoUrl = completed?.assets?.video;
    if (!videoUrl) throw new LumaVideoError('[Luma] No video asset URL in image-to-video response.', 500);
    return {
      provider: 'luma', model: 'ray-2', videoUrl, storageUrl: videoUrl,
      prompt: options.prompt, durationSeconds: options.durationSeconds ?? 5,
      width: 1280, height: 720, latencyMs: Date.now() - startTime,
      thumbnailUrl: completed?.assets?.thumbnail
    };
  }
};
