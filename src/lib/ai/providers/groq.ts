import Groq from 'groq-sdk';
import {
  AIProvider,
  ChatGenerationOptions,
  ImageGenerationOptions,
  VideoGenerationOptions,
  SubtitleGenerationOptions,
  SEOGenerationOptions,
  AIGeneratedResponse,
  TokenUsage
} from '../types';
import { AI_CONFIG } from '../../../config/ai.config';

export class GroqProviderError extends Error {
  public provider = 'groq';
  public status: number;
  public code?: string;
  constructor(message: string, status = 400, code?: string) {
    super(message);
    this.name = 'GroqProviderError';
    this.status = status;
    this.code = code;
  }
}

function requireKey(): string {
  const key = process.env.GROQ_API_KEY;
  if (!key || key.includes('demo')) {
    throw new GroqProviderError(
      'Groq API Key (GROQ_API_KEY) is not configured. Add a valid key to .env.local.',
      401,
      'missing_groq_api_key'
    );
  }
  return key;
}

export class GroqProvider implements AIProvider {
  private getClient(): Groq {
    return new Groq({ apiKey: requireKey() });
  }

  public async chat(options: ChatGenerationOptions): Promise<AIGeneratedResponse> {
    const client = this.getClient();
    const startTime = Date.now();
    const model = options.model || AI_CONFIG.models.groq.chat;

    try {
      const response = await client.chat.completions.create({
        model,
        messages: options.messages as any,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 1000
      });

      const latency = Date.now() - startTime;
      const tokenUsage: TokenUsage = {
        prompt: response.usage?.prompt_tokens ?? 0,
        completion: response.usage?.completion_tokens ?? 0,
        total: response.usage?.total_tokens ?? 0
      };

      return {
        provider: 'groq' as any,
        model,
        content: response.choices[0]?.message?.content ?? '',
        tokenUsage,
        tokensUsed: tokenUsage,
        latency
      };
    } catch (rawError: any) {
      const status = rawError.status ?? rawError.statusCode ?? 400;
      const message = rawError.error?.message ?? rawError.message ?? 'Groq API execution failed.';
      throw new GroqProviderError(`[Groq] ${message}`, status, rawError.code ?? 'groq_error');
    }
  }

  public async image(_: ImageGenerationOptions): Promise<AIGeneratedResponse> {
    throw new GroqProviderError('[Groq] Image generation not supported.', 501, 'groq_no_image_api');
  }

  public async video(_: VideoGenerationOptions): Promise<AIGeneratedResponse> {
    throw new GroqProviderError('[Groq] Video generation not supported.', 501, 'groq_no_video_api');
  }

  public async subtitle(options: SubtitleGenerationOptions): Promise<AIGeneratedResponse> {
    const client = this.getClient();
    const startTime = Date.now();

    if (!options.audioUrl) {
      throw new GroqProviderError(
        '[Groq Whisper] No audio URL provided in SubtitleGenerationOptions.',
        400,
        'groq_whisper_missing_audio'
      );
    }

    try {
      const audioResponse = await fetch(options.audioUrl, {
        signal: AbortSignal.timeout(20000)
      });
      if (!audioResponse.ok) {
        throw new GroqProviderError(`[Groq Whisper] Could not fetch audio: HTTP ${audioResponse.status}`, 400, 'groq_whisper_fetch_error');
      }

      const audioBuffer = await audioResponse.arrayBuffer();
      const audioFile = new File([audioBuffer], 'audio.mp3', { type: 'audio/mpeg' });

      const transcription = await client.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-large-v3',
        response_format: 'verbose_json'
      });

      const segments = (transcription as any).segments?.map((seg: any) => ({
        start: seg.start,
        end: seg.end,
        text: seg.text.trim()
      })) ?? [];

      const tokenUsage: TokenUsage = { prompt: 0, completion: 0, total: 0 };
      return {
        provider: 'groq' as any,
        model: 'whisper-large-v3',
        content: JSON.stringify(segments),
        tokenUsage,
        tokensUsed: tokenUsage,
        latency: Date.now() - startTime,
        metadata: { presetStyle: options.presetStyle ?? 'default' }
      };
    } catch (rawError: any) {
      if (rawError instanceof GroqProviderError) throw rawError;
      throw new GroqProviderError(`[Groq Whisper] ${rawError.message ?? 'Transcription failed.'}`, 400, 'groq_whisper_error');
    }
  }

  public async seo(options: SEOGenerationOptions): Promise<AIGeneratedResponse> {
    const client = this.getClient();
    const startTime = Date.now();
    const model = AI_CONFIG.models.groq.fast;

    const systemPrompt = `You are an expert YouTube & content SEO specialist. 
Return a JSON object with keys: title, description, tags (array of strings), and hashtags (array).
Be data-driven and optimised for maximum discoverability. No preamble — only JSON.`;

    const userPrompt = `Generate SEO metadata:
Topic: ${options.topic}
Audience: ${options.targetAudience ?? 'general creators'}
Keywords: ${(options.keywords ?? []).join(', ')}
Platform: ${(options as any).platform ?? 'YouTube'}`;

    try {
      const response = await client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.4,
        max_tokens: 600,
        response_format: { type: 'json_object' }
      });

      const latency = Date.now() - startTime;
      const tokenUsage: TokenUsage = {
        prompt: response.usage?.prompt_tokens ?? 0,
        completion: response.usage?.completion_tokens ?? 0,
        total: response.usage?.total_tokens ?? 0
      };

      return {
        provider: 'groq' as any,
        model,
        content: response.choices[0]?.message?.content ?? '{}',
        tokenUsage,
        tokensUsed: tokenUsage,
        latency
      };
    } catch (rawError: any) {
      throw new GroqProviderError(`[Groq SEO] ${rawError.message ?? 'SEO generation failed.'}`, 400, 'groq_seo_error');
    }
  }
}
