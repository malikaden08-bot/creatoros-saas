import { logger } from '../../services/logger';
import { ProviderMetrics } from './metrics';
import { PromptCache } from './cache';
import { OpenAIProvider } from './providers/openai';
import { GeminiProvider } from './providers/gemini';
import { ClaudeProvider } from './providers/claude';
import { GroqProvider } from './providers/groq';
import { DeepSeekProvider } from './providers/deepseek';
import { FalImageProvider } from '../providers/image/fal';
import { ReplicateImageProvider } from '../providers/image/replicate';
import { ElevenLabsProvider } from '../providers/voice/elevenlabs';
import { DeepgramProvider } from '../providers/voice/deepgram';
import {
  ChatGenerationOptions,
  ImageGenerationOptions,
  VideoGenerationOptions,
  SubtitleGenerationOptions,
  SEOGenerationOptions,
  AIGeneratedResponse,
  ImageGeneratedResponse,
  TokenUsage,
  StreamStartEvent,
  StreamChunkEvent,
  StreamErrorEvent,
  StreamDoneEvent
} from './types';
import { randomUUID } from 'crypto';

export type ProviderId =
  | 'openai'
  | 'gemini'
  | 'claude'
  | 'groq'
  | 'fal'
  | 'replicate'
  | 'elevenlabs'
  | 'deepgram';

export type AIModality = 'text' | 'stream' | 'image' | 'video' | 'speech' | 'transcription' | 'seo';

export type ProviderHealthStatus = 'operational' | 'degraded' | 'unconfigured' | 'offline';

export interface ProviderHealthReport {
  id: ProviderId;
  name: string;
  status: ProviderHealthStatus;
  latencyMs: number | null;
  error: string | null;
  modalities: AIModality[];
  checkedAt: string;
}

export interface VoiceGenerationOptions {
  text: string;
  voice?: string;
  model?: string;
  stability?: number;
  similarityBoost?: number;
}

export interface UnifiedVoiceResponse {
  provider: ProviderId;
  model: string;
  audioBuffer: ArrayBuffer;
  mimeType: string;
  voiceId: string;
  charCount: number;
  latencyMs: number;
  costUsd: number;
}

export interface TranscriptionOptions {
  audioUrl: string;
  language?: string;
  presetStyle?: string;
}

export interface UnifiedSubtitleResponse {
  provider: ProviderId;
  model: string;
  segments: Array<{ start: number; end: number; text: string; confidence?: number }>;
  language?: string;
  latencyMs: number;
  costUsd: number;
}

export interface ExecutionMeta {
  requestId: string;
  succeededProvider: ProviderId;
  attemptedProviders: ProviderId[];
  failoverChain: ProviderId[];
  totalRetries: number;
  totalLatencyMs: number;
  totalLatency: number;
  fromCache: boolean;
}

export interface UnifiedExecutionResult<T> {
  data: T;
  meta: ExecutionMeta;
}

export class UnifiedAIError extends Error {
  public provider: ProviderId;
  public status: number;
  public code: string;
  public retryable: boolean;

  constructor(
    message: string,
    provider: ProviderId,
    status: number = 500,
    code: string = 'UNIFIED_AI_ERROR',
    retryable: boolean = true
  ) {
    super(message);
    this.name = 'UnifiedAIError';
    this.provider = provider;
    this.status = status;
    this.code = code;
    this.retryable = retryable;
  }
}

const RETRY_CONFIG = {
  maxAttemptsPerProvider: 2,
  baseDelayMs: 400,
  timeoutMs: 30000,
  nonRetryableStatuses: new Set([401, 403, 404, 501])
};

const COST_PER_1K_TOKENS: Record<string, { prompt: number; completion: number }> = {
  'gpt-4o': { prompt: 0.0025, completion: 0.01 },
  'gpt-4o-mini': { prompt: 0.00015, completion: 0.0006 },
  'llama-3.3-70b-versatile': { prompt: 0.00059, completion: 0.00079 },
  'gemini-1.5-pro': { prompt: 0.00125, completion: 0.005 },
  'claude-3-5-sonnet-20241022': { prompt: 0.003, completion: 0.015 }
};

function calculateCostUsd(model: string, usage: TokenUsage): number {
  const rates = COST_PER_1K_TOKENS[model] || { prompt: 0.001, completion: 0.002 };
  const cost = (usage.prompt / 1000) * rates.prompt + (usage.completion / 1000) * rates.completion;
  return Number(cost.toFixed(6));
}

function backoffWithJitter(attempt: number): Promise<void> {
  const delay = RETRY_CONFIG.baseDelayMs * Math.pow(2, attempt) + Math.random() * 100;
  return new Promise((res) => setTimeout(res, delay));
}

export class ProviderManager {
  private static instance: ProviderManager;

  private textProviders = {
    groq: new GroqProvider(),
    openai: new OpenAIProvider(),
    gemini: new GeminiProvider(),
    claude: new ClaudeProvider(),
    deepseek: new DeepSeekProvider()
  };

  private priorities: Record<AIModality, ProviderId[]> = {
    text: ['groq', 'openai', 'gemini', 'claude'],
    stream: ['groq', 'openai', 'gemini', 'claude'],
    image: ['openai', 'fal', 'replicate', 'gemini'],
    video: ['gemini', 'replicate'],
    speech: ['elevenlabs', 'openai'],
    transcription: ['deepgram', 'groq', 'openai'],
    seo: ['groq', 'gemini', 'openai', 'claude']
  };

  private constructor() {
    logger.info('[ProviderManager] Initialized unified AI Provider Engine across 8 providers');
  }

  public static getInstance(): ProviderManager {
    if (!ProviderManager.instance) {
      ProviderManager.instance = new ProviderManager();
    }
    return ProviderManager.instance;
  }

  public validateEnvironment(): Record<ProviderId, { configured: boolean; missingKey?: string }> {
    return {
      openai: {
        configured: !!process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes('demo'),
        missingKey: 'OPENAI_API_KEY'
      },
      gemini: {
        configured: !!process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes('demo'),
        missingKey: 'GEMINI_API_KEY'
      },
      claude: {
        configured: !!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_API_KEY.includes('demo'),
        missingKey: 'ANTHROPIC_API_KEY'
      },
      groq: {
        configured: !!process.env.GROQ_API_KEY && !process.env.GROQ_API_KEY.includes('demo'),
        missingKey: 'GROQ_API_KEY'
      },
      fal: {
        configured: !!process.env.FAL_KEY && !process.env.FAL_KEY.includes('demo'),
        missingKey: 'FAL_KEY'
      },
      replicate: {
        configured: !!process.env.REPLICATE_API_TOKEN && !process.env.REPLICATE_API_TOKEN.includes('demo'),
        missingKey: 'REPLICATE_API_TOKEN'
      },
      elevenlabs: {
        configured: !!process.env.ELEVENLABS_API_KEY && !process.env.ELEVENLABS_API_KEY.includes('demo'),
        missingKey: 'ELEVENLABS_API_KEY'
      },
      deepgram: {
        configured: !!process.env.DEEPGRAM_API_KEY && !process.env.DEEPGRAM_API_KEY.includes('demo'),
        missingKey: 'DEEPGRAM_API_KEY'
      }
    };
  }

  public async detectProviderHealth(id: ProviderId): Promise<ProviderHealthReport> {
    const checkedAt = new Date().toISOString();
    const envValidation = this.validateEnvironment()[id];

    if (!envValidation.configured) {
      return {
        id,
        name: String(id).toUpperCase(),
        status: 'unconfigured',
        latencyMs: null,
        error: `${envValidation.missingKey} is missing or placeholder`,
        modalities: this.getModalitiesForProvider(id),
        checkedAt
      };
    }

    const start = Date.now();
    try {
      if (id === 'groq') {
        const res = await fetch('https://api.groq.com/openai/v1/models', {
          headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
          signal: AbortSignal.timeout(5000)
        });
        const latencyMs = Date.now() - start;
        return {
          id,
          name: 'Groq LLaMA 3.3 70B',
          status: res.ok ? 'operational' : 'degraded',
          latencyMs,
          error: res.ok ? null : `HTTP ${res.status}`,
          modalities: ['text', 'transcription', 'seo'],
          checkedAt
        };
      }

      if (id === 'openai') {
        const res = await fetch('https://api.openai.com/v1/models', {
          headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
          signal: AbortSignal.timeout(5000)
        });
        const latencyMs = Date.now() - start;
        return {
          id,
          name: 'OpenAI GPT-4o / DALL-E',
          status: res.ok ? 'operational' : 'degraded',
          latencyMs,
          error: res.ok ? null : `HTTP ${res.status}`,
          modalities: ['text', 'image', 'speech', 'transcription', 'seo'],
          checkedAt
        };
      }

      if (id === 'gemini') {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`,
          { signal: AbortSignal.timeout(5000) }
        );
        const latencyMs = Date.now() - start;
        return {
          id,
          name: 'Google Gemini 1.5 Pro',
          status: res.ok ? 'operational' : 'degraded',
          latencyMs,
          error: res.ok ? null : `HTTP ${res.status}`,
          modalities: ['text', 'image', 'video', 'seo'],
          checkedAt
        };
      }

      if (id === 'claude') {
        const latencyMs = Date.now() - start;
        return {
          id,
          name: 'Anthropic Claude 3.5 Sonnet',
          status: 'operational',
          latencyMs,
          error: null,
          modalities: ['text', 'seo'],
          checkedAt
        };
      }

      if (id === 'elevenlabs') {
        const res = await fetch('https://api.elevenlabs.io/v1/user', {
          headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY! },
          signal: AbortSignal.timeout(5000)
        });
        const latencyMs = Date.now() - start;
        return {
          id,
          name: 'ElevenLabs Voice Synthesis',
          status: res.ok ? 'operational' : 'degraded',
          latencyMs,
          error: res.ok ? null : `HTTP ${res.status}`,
          modalities: ['speech'],
          checkedAt
        };
      }

      if (id === 'deepgram') {
        const res = await fetch('https://api.deepgram.com/v1/projects', {
          headers: { Authorization: `Token ${process.env.DEEPGRAM_API_KEY}` },
          signal: AbortSignal.timeout(5000)
        });
        const latencyMs = Date.now() - start;
        return {
          id,
          name: 'Deepgram Nova-2 STT',
          status: res.ok ? 'operational' : 'degraded',
          latencyMs,
          error: res.ok ? null : `HTTP ${res.status}`,
          modalities: ['transcription'],
          checkedAt
        };
      }

      if (id === 'fal' || id === 'replicate') {
        return {
          id,
          name: id === 'fal' ? 'Fal.ai Flux Realism' : 'Replicate Flux Schnell',
          status: 'operational',
          latencyMs: Date.now() - start,
          error: null,
          modalities: id === 'fal' ? ['image'] : ['image', 'video'],
          checkedAt
        };
      }
    } catch (err: any) {
      return {
        id,
        name: String(id).toUpperCase(),
        status: 'degraded',
        latencyMs: Date.now() - start,
        error: err.message || 'Network check timeout',
        modalities: this.getModalitiesForProvider(id),
        checkedAt
      };
    }

    return {
      id,
      name: String(id).toUpperCase(),
      status: 'operational',
      latencyMs: Date.now() - start,
      error: null,
      modalities: this.getModalitiesForProvider(id),
      checkedAt
    };
  }

  public async healthCheckAll(): Promise<Record<ProviderId, ProviderHealthReport>> {
    const allProviders: ProviderId[] = [
      'groq',
      'openai',
      'gemini',
      'claude',
      'fal',
      'replicate',
      'elevenlabs',
      'deepgram'
    ];
    const results = await Promise.all(allProviders.map((p) => this.detectProviderHealth(p)));
    const out = {} as Record<ProviderId, ProviderHealthReport>;
    results.forEach((r) => (out[r.id] = r));
    return out;
  }

  public setPriorities(modality: AIModality, providers: ProviderId[]) {
    this.priorities[modality] = providers;
    logger.info({ modality, providers }, '[ProviderManager] Updated modality priority chain');
  }

  public getPriorities(modality: AIModality): ProviderId[] {
    return [...this.priorities[modality]];
  }

  private getModalitiesForProvider(id: ProviderId): AIModality[] {
    switch (id) {
      case 'openai':
        return ['text', 'image', 'speech', 'transcription', 'seo'];
      case 'gemini':
        return ['text', 'image', 'video', 'seo'];
      case 'claude':
        return ['text', 'seo'];
      case 'groq':
        return ['text', 'transcription', 'seo'];
      case 'fal':
        return ['image'];
      case 'replicate':
        return ['image', 'video'];
      case 'elevenlabs':
        return ['speech'];
      case 'deepgram':
        return ['transcription'];
      default:
        return ['text'];
    }
  }

  public async text(
    options: ChatGenerationOptions,
    requestedProvider: ProviderId | 'auto' = 'auto'
  ): Promise<UnifiedExecutionResult<AIGeneratedResponse>> {
    const startTime = Date.now();
    const requestId = randomUUID();

    const cached = PromptCache.get(options);
    if (cached) {
      logger.info({ requestId }, '[ProviderManager:Text] ⚡ Prompt Cache HIT');
      return {
        data: cached,
        meta: {
          requestId,
          succeededProvider: cached.provider as ProviderId,
          attemptedProviders: [cached.provider as ProviderId],
          failoverChain: [cached.provider as ProviderId],
          totalRetries: 0,
          totalLatencyMs: 0,
          totalLatency: 0,
          fromCache: true
        }
      };
    }

    const chain =
      requestedProvider === 'auto'
        ? this.getPriorities('text')
        : [requestedProvider, ...this.getPriorities('text').filter((p) => p !== requestedProvider)];

    const attempted: ProviderId[] = [];
    let totalRetries = 0;
    const errors: string[] = [];

    for (const providerId of chain) {
      if (!this.textProviders[providerId as keyof typeof this.textProviders]) continue;
      attempted.push(providerId);

      for (let attempt = 0; attempt < RETRY_CONFIG.maxAttemptsPerProvider; attempt++) {
        if (attempt > 0) {
          await backoffWithJitter(attempt - 1);
          totalRetries++;
        }

        try {
          const providerObj = this.textProviders[providerId as keyof typeof this.textProviders];
          const response = await providerObj.chat(options);
          const latencyMs = Date.now() - startTime;
          const costUsd = calculateCostUsd(response.model, response.tokenUsage);

          ProviderMetrics.record({
            provider: providerId as any,
            success: true,
            latencyMs,
            tokens: response.tokenUsage.total,
            costUsd,
            retriesUsed: attempt
          });

          PromptCache.set(options, response);

          return {
            data: {
              ...response,
              metadata: { ...(response.metadata || {}), costUsd }
            },
            meta: {
              requestId,
              succeededProvider: providerId,
              attemptedProviders: attempted,
              failoverChain: chain,
              totalRetries,
              totalLatencyMs: latencyMs,
              totalLatency: latencyMs,
              fromCache: false
            }
          };
        } catch (err: any) {
          const status = err.status || 500;
          const msg = err.message || 'Text generation error';

          if (RETRY_CONFIG.nonRetryableStatuses.has(status)) {
            logger.warn({ providerId, status, msg }, '[ProviderManager:Text] Non-retryable error — cascading');
            errors.push(`${providerId}: ${msg}`);
            break;
          }

          if (attempt === RETRY_CONFIG.maxAttemptsPerProvider - 1) {
            errors.push(`${providerId}: ${msg}`);
          }
        }
      }
    }

    throw new UnifiedAIError(
      `Text generation failed across all providers: [${errors.join(' | ')}]`,
      chain[0],
      503,
      'TEXT_GEN_EXHAUSTED'
    );
  }

  public async streamText(
    options: ChatGenerationOptions,
    requestedProvider: ProviderId | 'auto' = 'auto',
    deductFn?: () => number
  ): Promise<ReadableStream<Uint8Array>> {
    const requestId = randomUUID();
    const encoder = new TextEncoder();
    const startTime = Date.now();

    const emit = (evt: any) => encoder.encode(`data: ${JSON.stringify(evt)}\n\n`);
    const chain =
      requestedProvider === 'auto'
        ? this.getPriorities('stream')
        : [requestedProvider, ...this.getPriorities('stream').filter((p) => p !== requestedProvider)];

    const self = this;

    return new ReadableStream<Uint8Array>({
      async start(controller) {
        const cached = PromptCache.get(options);
        if (cached) {
          const pId = (cached.provider as ProviderId) || chain[0];
          controller.enqueue(
            emit({ event: 'start', requestId, provider: pId as any, model: cached.model, fromCache: true } satisfies StreamStartEvent)
          );

          const fullText = cached.content;
          for (let i = 0; i < fullText.length; i += 4) {
            const delta = fullText.slice(i, i + 4);
            controller.enqueue(emit({ event: 'chunk', delta, provider: pId as any } satisfies StreamChunkEvent));
            await new Promise((r) => setTimeout(r, 8));
          }

          const remCredits = deductFn ? deductFn() : 0;
          controller.enqueue(
            emit({
              event: 'done',
              requestId,
              provider: pId as any,
              model: cached.model,
              tokenUsage: cached.tokenUsage,
              creditsDeducted: 5,
              remainingCredits: remCredits,
              cost: 0,
              latency: Date.now() - startTime
            } satisfies StreamDoneEvent)
          );
          controller.close();
          return;
        }

        for (const providerId of chain) {
          const providerObj = self.textProviders[providerId as keyof typeof self.textProviders];
          if (!providerObj) continue;

          try {
            controller.enqueue(
              emit({ event: 'start', requestId, provider: providerId as any, model: 'auto' } satisfies StreamStartEvent)
            );

            const response = await providerObj.chat(options);
            const latencyMs = Date.now() - startTime;

            const fullText = response.content;
            for (let i = 0; i < fullText.length; i += 4) {
              const delta = fullText.slice(i, i + 4);
              controller.enqueue(emit({ event: 'chunk', delta, provider: providerId as any } satisfies StreamChunkEvent));
              await new Promise((r) => setTimeout(r, 10));
            }

            PromptCache.set(options, response);
            const remCredits = deductFn ? deductFn() : 0;
            const costUsd = calculateCostUsd(response.model, response.tokenUsage);

            controller.enqueue(
              emit({
                event: 'done',
                requestId,
                provider: providerId as any,
                model: response.model,
                tokenUsage: response.tokenUsage,
                creditsDeducted: 5,
                remainingCredits: remCredits,
                cost: costUsd,
                latency: latencyMs
              } satisfies StreamDoneEvent)
            );
            controller.close();
            return;
          } catch (err: any) {
            controller.enqueue(
              emit({
                event: 'error',
                error: `${providerId} streaming error: ${err.message}`,
                provider: providerId,
                retrying: true
              } satisfies StreamErrorEvent)
            );
          }
        }

        controller.enqueue(
          emit({
            event: 'error',
            error: 'All streaming providers exhausted',
            code: 'STREAM_EXHAUSTED',
            retrying: false
          } satisfies StreamErrorEvent)
        );
        controller.close();
      }
    });
  }

  public async image(
    options: ImageGenerationOptions,
    requestedProvider: ProviderId | 'auto' = 'auto'
  ): Promise<UnifiedExecutionResult<ImageGeneratedResponse>> {
    const startTime = Date.now();
    const requestId = randomUUID();
    const chain =
      requestedProvider === 'auto'
        ? this.getPriorities('image')
        : [requestedProvider, ...this.getPriorities('image').filter((p) => p !== requestedProvider)];

    const attempted: ProviderId[] = [];
    const errors: string[] = [];

    for (const providerId of chain) {
      attempted.push(providerId);

      try {
        let res: ImageGeneratedResponse;

        if (providerId === 'fal') {
          res = await FalImageProvider.generate(options);
        } else if (providerId === 'replicate') {
          res = await ReplicateImageProvider.generate(options);
        } else if (providerId === 'openai') {
          const openaiRes = await this.textProviders.openai.image(options);
          res = {
            provider: 'openai',
            model: openaiRes.model,
            imageUrl: openaiRes.content,
            prompt: options.prompt,
            width: 1024,
            height: 1024,
            latency: openaiRes.latency,
            tokenUsage: openaiRes.tokenUsage,
            tokensUsed: openaiRes.tokenUsage
          };
        } else if (providerId === 'gemini') {
          const geminiRes = await this.textProviders.gemini.image(options);
          res = {
            provider: 'openai',
            model: geminiRes.model,
            imageUrl: geminiRes.content,
            prompt: options.prompt,
            width: 1024,
            height: 1024,
            latency: geminiRes.latency,
            tokenUsage: geminiRes.tokenUsage,
            tokensUsed: geminiRes.tokenUsage
          };
        } else {
          continue;
        }

        const latencyMs = Date.now() - startTime;

        return {
          data: res,
          meta: {
            requestId,
            succeededProvider: providerId,
            attemptedProviders: attempted,
            failoverChain: chain,
            totalRetries: 0,
            totalLatencyMs: latencyMs,
            totalLatency: latencyMs,
            fromCache: false
          }
        };
      } catch (err: any) {
        errors.push(`${providerId}: ${err.message}`);
      }
    }

    throw new UnifiedAIError(
      `Image generation failed: [${errors.join(' | ')}]`,
      chain[0],
      503,
      'IMAGE_GEN_EXHAUSTED'
    );
  }

  public async video(
    options: VideoGenerationOptions,
    requestedProvider: ProviderId | 'auto' = 'auto'
  ): Promise<UnifiedExecutionResult<AIGeneratedResponse>> {
    const startTime = Date.now();
    const requestId = randomUUID();
    const chain =
      requestedProvider === 'auto'
        ? this.getPriorities('video')
        : [requestedProvider, ...this.getPriorities('video').filter((p) => p !== requestedProvider)];

    const attempted: ProviderId[] = [];
    const errors: string[] = [];

    for (const providerId of chain) {
      attempted.push(providerId);

      try {
        let response: AIGeneratedResponse;
        if (providerId === 'gemini') {
          response = await this.textProviders.gemini.video(options);
        } else {
          throw new Error(`Video generation provider ${providerId} is unconfigured`);
        }

        const latencyMs = Date.now() - startTime;
        return {
          data: response,
          meta: {
            requestId,
            succeededProvider: providerId,
            attemptedProviders: attempted,
            failoverChain: chain,
            totalRetries: 0,
            totalLatencyMs: latencyMs,
            totalLatency: latencyMs,
            fromCache: false
          }
        };
      } catch (err: any) {
        errors.push(`${providerId}: ${err.message}`);
      }
    }

    throw new UnifiedAIError(
      `Video generation failed: [${errors.join(' | ')}]`,
      chain[0],
      503,
      'VIDEO_GEN_EXHAUSTED'
    );
  }

  public async speech(
    options: VoiceGenerationOptions,
    requestedProvider: ProviderId | 'auto' = 'auto'
  ): Promise<UnifiedExecutionResult<UnifiedVoiceResponse>> {
    const startTime = Date.now();
    const requestId = randomUUID();
    const chain =
      requestedProvider === 'auto'
        ? this.getPriorities('speech')
        : [requestedProvider, ...this.getPriorities('speech').filter((p) => p !== requestedProvider)];

    const attempted: ProviderId[] = [];
    const errors: string[] = [];

    for (const providerId of chain) {
      attempted.push(providerId);

      try {
        if (providerId === 'elevenlabs') {
          const ttsResult = await ElevenLabsProvider.synthesize({
            text: options.text,
            voice: options.voice,
            model: options.model,
            stability: options.stability,
            similarityBoost: options.similarityBoost
          });

          const latencyMs = Date.now() - startTime;
          const costUsd = Number(((options.text.length / 1000) * 0.015).toFixed(6));

          return {
            data: {
              provider: 'elevenlabs',
              model: ttsResult.model,
              audioBuffer: ttsResult.audioBuffer,
              mimeType: ttsResult.mimeType,
              voiceId: ttsResult.voiceId,
              charCount: ttsResult.charCount,
              latencyMs,
              costUsd
            },
            meta: {
              requestId,
              succeededProvider: 'elevenlabs',
              attemptedProviders: attempted,
              failoverChain: chain,
              totalRetries: 0,
              totalLatencyMs: latencyMs,
              totalLatency: latencyMs,
              fromCache: false
            }
          };
        }
      } catch (err: any) {
        errors.push(`${providerId}: ${err.message}`);
      }
    }

    throw new UnifiedAIError(
      `Speech synthesis failed: [${errors.join(' | ')}]`,
      chain[0],
      503,
      'SPEECH_SYNTHESIS_EXHAUSTED'
    );
  }

  public async transcription(
    options: TranscriptionOptions,
    requestedProvider: ProviderId | 'auto' = 'auto'
  ): Promise<UnifiedExecutionResult<UnifiedSubtitleResponse>> {
    const startTime = Date.now();
    const requestId = randomUUID();
    const chain =
      requestedProvider === 'auto'
        ? this.getPriorities('transcription')
        : [requestedProvider, ...this.getPriorities('transcription').filter((p) => p !== requestedProvider)];

    const attempted: ProviderId[] = [];
    const errors: string[] = [];

    for (const providerId of chain) {
      attempted.push(providerId);

      try {
        if (providerId === 'deepgram') {
          const dgResult = await DeepgramProvider.transcribe(options.audioUrl);
          const latencyMs = Date.now() - startTime;

          return {
            data: {
              provider: 'deepgram',
              model: dgResult.model,
              segments: dgResult.segments,
              language: (dgResult as any).language || 'en',
              latencyMs,
              costUsd: 0.0043
            },
            meta: {
              requestId,
              succeededProvider: 'deepgram',
              attemptedProviders: attempted,
              failoverChain: chain,
              totalRetries: 0,
              totalLatencyMs: latencyMs,
              totalLatency: latencyMs,
              fromCache: false
            }
          };
        } else if (providerId === 'groq') {
          const groqRes = await this.textProviders.groq.subtitle({ audioUrl: options.audioUrl });
          const segments = JSON.parse(groqRes.content);
          const latencyMs = Date.now() - startTime;

          return {
            data: {
              provider: 'groq',
              model: 'whisper-large-v3',
              segments,
              latencyMs: groqRes.latency,
              costUsd: 0.001
            },
            meta: {
              requestId,
              succeededProvider: 'groq',
              attemptedProviders: attempted,
              failoverChain: chain,
              totalRetries: 0,
              totalLatencyMs: latencyMs,
              totalLatency: latencyMs,
              fromCache: false
            }
          };
        }
      } catch (err: any) {
        errors.push(`${providerId}: ${err.message}`);
      }
    }

    throw new UnifiedAIError(
      `Transcription failed: [${errors.join(' | ')}]`,
      chain[0],
      503,
      'TRANSCRIPTION_EXHAUSTED'
    );
  }
}

export const providerManager = ProviderManager.getInstance();
