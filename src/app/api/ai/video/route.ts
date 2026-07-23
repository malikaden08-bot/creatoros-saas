import { NextResponse } from 'next/server';
import { z } from 'zod';
import { VideoGateway, VideoMode } from '../../../../lib/ai/videoGateway';
import { validateAiRequest } from '../../../../middleware/aiAuth';
import { CREDIT_COSTS } from '../../../../config/ai.config';
import { formatAiErrorResponse } from '../../../../services/errorHandler';
import { DatabaseService } from '../../../../services/database';

const VideoRequestSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required.'),
  mode: z.enum(['text-to-video', 'image-to-video', 'video-to-video', 'lip-sync', 'frame-interpolation', 'motion-brush', 'upscale']).optional().default('text-to-video'),
  provider: z.enum(['auto', 'runway', 'luma', 'fal', 'replicate']).optional().default('auto'),
  imageUrl: z.string().url().optional(),
  videoUrl: z.string().url().optional(),
  lipSyncAudioUrl: z.string().url().optional(),
  durationSeconds: z.number().min(3).max(15).optional().default(5),
  aspectRatio: z.enum(['16:9', '9:16', '1:1']).optional().default('16:9'),
  motionStrength: z.number().min(0).max(1).optional().default(0.5),
  workspace: z.string().optional().default('ws-default')
});

export async function POST(req: Request) {
  let requestedProvider = 'auto';
  const startTime = Date.now();
  try {
    const auth = await validateAiRequest(req, CREDIT_COSTS.video);
    if (!auth.authorized) return auth.response;
    const userId = auth.userId || 'usr-1';
    const body = await req.json().catch(() => ({}));
    const parseResult = VideoRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ success: false, error: 'Validation Error', details: parseResult.error.flatten().fieldErrors }, { status: 400 });
    }
    const { prompt, mode, provider, imageUrl, videoUrl, lipSyncAudioUrl, durationSeconds, aspectRatio, motionStrength } = parseResult.data;
    requestedProvider = provider;
    const result = await VideoGateway.execute(
      { prompt, mode: mode as VideoMode, imageUrl, videoUrl, lipSyncAudioUrl, durationSeconds, aspectRatio, motionStrength },
      provider as any
    );
    const dbRecord = await DatabaseService.saveAsset({
      userId, assetType: 'video', provider: result.provider, model: result.model,
      prompt, storageUrl: result.storageUrl || result.videoUrl, creditsCost: CREDIT_COSTS.video
    });
    const newCredits = auth.deduct!();
    return NextResponse.json({
      success: true, mode, assetId: dbRecord.id,
      creditsDeducted: CREDIT_COSTS.video, remainingCredits: newCredits,
      response: {
        provider: result.provider, model: result.model,
        videoUrl: result.videoUrl, storageUrl: result.storageUrl,
        cloudinaryUrl: result.cloudinaryUrl, thumbnailUrl: result.thumbnailUrl,
        prompt, mode, durationSeconds: result.durationSeconds,
        dimensions: { width: result.width, height: result.height, aspectRatio },
        failoverAttempts: result.failoverAttempts, latencyMs: result.latencyMs
      }
    });
  } catch (error: any) {
    return formatAiErrorResponse(error, requestedProvider, 'Luma');
  }
}
