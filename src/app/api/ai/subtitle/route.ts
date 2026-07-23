import { NextResponse } from 'next/server';
import { z } from 'zod';
import { validateAiRequest } from '../../../../middleware/aiAuth';
import { CREDIT_COSTS } from '../../../../config/ai.config';
import { formatAiErrorResponse } from '../../../../services/errorHandler';
import { DeepgramProvider, DeepgramError } from '../../../../lib/providers/voice/deepgram';
import { AIGateway } from '../../../../lib/ai/gateway';
import { UsageService } from '../../../../services/usage';
import { logger } from '../../../../services/logger';

const SubtitleRequestSchema = z.object({
  audioUrl: z.string().url('audioUrl must be a valid URL.').optional(),
  text: z.string().optional(),
  presetStyle: z.string().optional().default('Hormozi Amber Active'),
  provider: z.enum(['auto', 'deepgram', 'openai', 'groq']).optional().default('deepgram')
});

export async function POST(req: Request) {
  let requestedProvider = 'deepgram';
  const startTime = Date.now();

  try {
    const auth = await validateAiRequest(req, CREDIT_COSTS.subtitle);
    if (!auth.authorized) return auth.response;
    const userId = auth.userId || 'usr-1';

    const body = await req.json().catch(() => ({}));
    const parseResult = SubtitleRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: 'Validation Error', details: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { audioUrl, text, presetStyle, provider } = parseResult.data;
    requestedProvider = provider;

    if (!audioUrl && !text) {
      return NextResponse.json(
        { success: false, error: 'Either audioUrl or text must be provided.' },
        { status: 400 }
      );
    }

    let segments: Array<{ start: number; end: number; text: string; confidence?: number }> = [];
    let usedProvider: string = provider;
    let usedModel: string = '';
    let totalLatency = 0;

    if (audioUrl) {
      logger.info({ provider, audioUrl }, '[Subtitle] Starting audio transcription');

      if (provider === 'deepgram' || provider === 'auto') {
        try {
          const result = await DeepgramProvider.transcribe(audioUrl);
          segments = result.segments.map((s) => ({
            start: s.start,
            end: s.end,
            text: s.text,
            confidence: s.confidence
          }));
          usedProvider = 'deepgram';
          usedModel = result.model;
          totalLatency = result.latencyMs;

          logger.info(
            { segments: segments.length, latency: totalLatency, model: usedModel },
            '[Subtitle] Deepgram transcription complete'
          );
        } catch (deepgramErr: any) {
          logger.warn(
            { error: deepgramErr.message },
            '[Subtitle] Deepgram failed — falling back to OpenAI Whisper'
          );

          const whisperResult = await AIGateway.subtitle(
            { audioUrl, presetStyle },
            'openai',
            userId
          );

          const parsed = JSON.parse(whisperResult.content);
          segments = Array.isArray(parsed) ? parsed : [];
          usedProvider = 'openai';
          usedModel = 'whisper-1';
          totalLatency = whisperResult.latency;
        }
      } else {
        const whisperResult = await AIGateway.subtitle(
          { audioUrl, presetStyle },
          provider === 'openai' ? 'openai' : 'openai',
          userId
        );
        const parsed = JSON.parse(whisperResult.content);
        segments = Array.isArray(parsed) ? parsed : [];
        usedProvider = provider;
        usedModel = 'whisper-1';
        totalLatency = whisperResult.latency;
      }
    }

    if (!audioUrl && text) {
      logger.info({ textLength: text.length }, '[Subtitle] Generating timed segments from text');
      const words = text.split(/\s+/).filter(Boolean);
      const wordsPerSegment = 8;
      const secondsPerWord = 0.4;

      for (let i = 0; i < words.length; i += wordsPerSegment) {
        const chunk = words.slice(i, i + wordsPerSegment);
        const start = i * secondsPerWord;
        const end = start + chunk.length * secondsPerWord;
        segments.push({ start, end, text: chunk.join(' ') });
      }

      usedProvider = 'text-split';
      usedModel = 'none';
      totalLatency = Date.now() - startTime;
    }

    const newCreditBalance = auth.deduct!();

    UsageService.recordRequestLog({
      user: userId,
      provider: usedProvider as any,
      model: usedModel,
      promptTokens: 0,
      completionTokens: 0,
      creditsDeducted: CREDIT_COSTS.subtitle,
      latencyMs: totalLatency,
      status: 'success',
      endpoint: '/api/ai/subtitle'
    });

    return NextResponse.json({
      success: true,
      creditsDeducted: CREDIT_COSTS.subtitle,
      remainingCredits: newCreditBalance,
      response: {
        provider: usedProvider,
        model: usedModel,
        segments,
        subtitlesJson: JSON.stringify(segments),
        segmentCount: segments.length,
        presetStyle,
        latency: Date.now() - startTime
      }
    });
  } catch (error: any) {
    logger.error({ error: error.message, provider: requestedProvider }, '[Subtitle] Request failed');
    return formatAiErrorResponse(error, requestedProvider, 'Deepgram');
  }
}
