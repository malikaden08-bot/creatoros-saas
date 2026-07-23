// ─── Core Provider Types ─────────────────────────────────────────────────────

export type RealProviderName =
  | 'openai'
  | 'gemini'
  | 'claude'
  | 'deepseek'
  | 'groq'
  | 'fal'
  | 'replicate'
  | 'elevenlabs'
  | 'deepgram';

export type AIProviderName = 'auto' | RealProviderName;
export type ImageProviderName = 'auto' | 'openai' | 'flux' | 'recraft' | 'stability' | 'fal' | 'replicate';

// ─── Chat / Conversation Types ────────────────────────────────────────────────

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  attachments?: Array<{ name: string; url: string; type: string; size: string }>;
}

export interface ChatGenerationOptions {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  /** Optional session ID to persist to DB */
  sessionId?: string;
}

// ─── Media Generation Option Types ───────────────────────────────────────────

export interface ImageGenerationOptions {
  prompt: string;
  negativePrompt?: string;
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3';
  quality?: 'standard' | 'hd';
  stylePreset?: string;
  seed?: number;
  steps?: number;
  workspace?: string;
}

export interface VideoGenerationOptions {
  prompt: string;
  imageUrl?: string;
  durationSeconds?: number;
  aspectRatio?: string;
}

export interface SubtitleGenerationOptions {
  audioUrl?: string;
  text?: string;
  presetStyle?: string;
}

export interface SEOGenerationOptions {
  topic: string;
  keywords?: string[];
  targetAudience?: string;
  platform?: string;
}

// ─── Token Usage ─────────────────────────────────────────────────────────────

export interface TokenUsage {
  prompt: number;
  completion: number;
  total: number;
}

// ─── Response Types ───────────────────────────────────────────────────────────

export interface AIGeneratedResponse {
  provider: RealProviderName;
  model: string;
  content: string;
  tokenUsage: TokenUsage;
  /** Alias kept for back-compat */
  tokensUsed: TokenUsage;
  latency: number;
  metadata?: Record<string, any>;
}

export interface ImageGeneratedResponse {
  provider: Exclude<ImageProviderName, 'auto'>;
  model: string;
  imageUrl: string;
  storageUrl?: string;
  dbAssetId?: string;
  prompt: string;
  negativePrompt?: string;
  seed?: number;
  steps?: number;
  width: number;
  height: number;
  resolution?: string;
  latency: number;
  tokensUsed: TokenUsage;
  tokenUsage: TokenUsage;
  metadata?: Record<string, any>;
}

// ─── SSE / Streaming Event Protocol ──────────────────────────────────────────

export type StreamEventType = 'start' | 'chunk' | 'tool_call' | 'error' | 'done';

export interface StreamStartEvent {
  event: 'start';
  requestId: string;
  provider: RealProviderName;
  model: string;
  fromCache?: boolean;
}

export interface StreamChunkEvent {
  event: 'chunk';
  delta: string;
  provider: RealProviderName;
}

export interface StreamErrorEvent {
  event: 'error';
  error: string;
  code?: string;
  provider?: string;
  retrying?: boolean;
  nextProvider?: string;
}

export interface StreamDoneEvent {
  event: 'done';
  requestId: string;
  provider: RealProviderName;
  model: string;
  tokenUsage: TokenUsage;
  creditsDeducted: number;
  remainingCredits: number;
  cost?: number;
  latency: number;
  fromCache?: boolean;
}

export type StreamEvent =
  | StreamStartEvent
  | StreamChunkEvent
  | StreamErrorEvent
  | StreamDoneEvent;

// ─── Provider Interface ───────────────────────────────────────────────────────

export interface AIProvider {
  chat(options: ChatGenerationOptions): Promise<AIGeneratedResponse>;
  image(options: ImageGenerationOptions): Promise<AIGeneratedResponse>;
  video(options: VideoGenerationOptions): Promise<AIGeneratedResponse>;
  subtitle(options: SubtitleGenerationOptions): Promise<AIGeneratedResponse>;
  seo(options: SEOGenerationOptions): Promise<AIGeneratedResponse>;
}

// ─── Provider Error ───────────────────────────────────────────────────────────

export class ProviderError extends Error {
  constructor(
    message: string,
    public readonly providerName: RealProviderName,
    public readonly status: number = 500,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}

// ─── Gateway Request / Response (Route-level) ─────────────────────────────────

export interface GatewayChatRequest {
  provider?: AIProviderName;
  model?: string;
  stream?: boolean;
  messages?: ChatMessage[];
  sessionId?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface GatewayChatResponse {
  success: true;
  requestId: string;
  user: string;
  planTier: string;
  creditsDeducted: number;
  remainingCredits: number;
  response: {
    provider: RealProviderName;
    model: string;
    content: string;
    tokenUsage: TokenUsage;
    latency: number;
  };
  meta: {
    failoverChain: RealProviderName[];
    attemptedProviders: RealProviderName[];
    succeededProvider: RealProviderName;
    totalLatency: number;
  };
}
