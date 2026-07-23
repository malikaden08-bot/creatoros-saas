import { logger } from './logger';

export interface ChatSessionRecord {
  id: string;
  workspaceId: string;
  userId: string;
  title: string;
  provider: string;
  model: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessageRecord {
  id: string;
  sessionId: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  attachments?: any;
  tokens: number;
  cost: number;
  latency: number;
  createdAt: string;
}

export interface PromptTemplateRecord {
  id: string;
  name: string;
  category: string;
  systemPrompt: string;
  variables?: any;
  createdAt: string;
}

export interface AIUsageRecord {
  id: string;
  userId: string;
  provider: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  cost: number;
  credits: number;
  latency: number;
  createdAt: string;
}

export interface ImageHistoryRecord {
  id: string;
  user: string;
  workspace: string;
  prompt: string;
  negativePrompt: string;
  provider: string;
  model: string;
  seed: number;
  steps: number;
  resolution: string;
  cost: number;
  credits: number;
  date: string;
  storageUrl: string;
}

export interface AiRequestLogRecord {
  id: string;
  requestId: string;
  userId: string;
  workspaceId: string;
  provider: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  credits: number;
  latency: number;
  cost: number;
  status: 'success' | 'error' | 'rate_limited' | 'failed';
  ipAddress: string;
  timestamp: string;
  errorDetails?: string;
}

export class DatabaseService {
  private static chatSessions: ChatSessionRecord[] = [
    {
      id: 'session-1',
      workspaceId: 'ws-default',
      userId: 'usr-1',
      title: 'CreatorOS Next.js App Router Refactoring',
      provider: 'openai',
      model: 'gpt-5',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString()
    }
  ];

  private static chatMessages: ChatMessageRecord[] = [
    {
      id: 'msg-1',
      sessionId: 'session-1',
      role: 'user',
      content: 'How do we design a multi-provider AI Gateway failover in Next.js 16?',
      tokens: 45,
      cost: 0.0001,
      latency: 0,
      createdAt: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 'msg-2',
      sessionId: 'session-1',
      role: 'assistant',
      content: 'Here is the high-level architecture:\n\n```typescript\nexport class ProviderManager {\n  public static async executeWithFailover(method, options, preferred) {\n    // Cascade OpenAI -> Gemini -> Claude -> DeepSeek\n  }\n}\n```',
      tokens: 280,
      cost: 0.0042,
      latency: 280,
      createdAt: new Date(Date.now() - 3590000).toISOString()
    }
  ];

  private static promptTemplates: PromptTemplateRecord[] = [
    {
      id: 'prompt-1',
      name: 'High-Converting YouTube Hook',
      category: 'Copywriting',
      systemPrompt: 'You are an expert YouTube growth strategist. Write 5 punchy viral hooks for topic: {{topic}}.',
      variables: ['topic'],
      createdAt: new Date().toISOString()
    },
    {
      id: 'prompt-2',
      name: 'Photorealistic Creator Avatar',
      category: 'Image Gen',
      systemPrompt: 'Studio portrait of modern content creator, warm bronze lighting, 8k photorealistic, 16:9 aspect ratio.',
      variables: [],
      createdAt: new Date().toISOString()
    }
  ];

  private static aiUsage: AIUsageRecord[] = [];

  private static imageHistoryTable: ImageHistoryRecord[] = [];

  private static aiLogRecords: AiRequestLogRecord[] = [];

  public static async getSystemStats(): Promise<{
    totalSessions: number;
    totalMessages: number;
    totalAssets: number;
    totalLogs: number;
    activeUsers: number;
  }> {
    return {
      totalSessions: this.chatSessions.length,
      totalMessages: this.chatMessages.length,
      totalAssets: this.imageHistoryTable.length,
      totalLogs: this.aiLogRecords.length,
      activeUsers: 1
    };
  }

  public static async getSessions(userId: string = 'usr-1', workspaceId: string = 'ws-default'): Promise<ChatSessionRecord[]> {
    return this.chatSessions.filter((s) => s.userId === userId && s.workspaceId === workspaceId);
  }

  public static async createSession(params: {
    userId?: string;
    workspaceId?: string;
    title?: string;
    provider?: string;
    model?: string;
  }): Promise<ChatSessionRecord> {
    const newSession: ChatSessionRecord = {
      id: `session-${Date.now()}`,
      userId: params.userId || 'usr-1',
      workspaceId: params.workspaceId || 'ws-default',
      title: params.title || 'New AI Conversation',
      provider: params.provider || 'openai',
      model: params.model || 'gpt-4o',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.chatSessions.unshift(newSession);
    return newSession;
  }

  public static async getMessages(sessionId: string): Promise<ChatMessageRecord[]> {
    return this.chatMessages.filter((m) => m.sessionId === sessionId);
  }

  public static async saveMessage(params: {
    sessionId: string;
    role: 'system' | 'user' | 'assistant';
    content: string;
    attachments?: any;
    tokens?: number;
    cost?: number;
    latency?: number;
  }): Promise<ChatMessageRecord> {
    const newMsg: ChatMessageRecord = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      sessionId: params.sessionId,
      role: params.role,
      content: params.content,
      attachments: params.attachments,
      tokens: params.tokens || 0,
      cost: params.cost || 0,
      latency: params.latency || 0,
      createdAt: new Date().toISOString()
    };
    this.chatMessages.push(newMsg);

    const session = this.chatSessions.find((s) => s.id === params.sessionId);
    if (session) {
      session.updatedAt = new Date().toISOString();
    }

    return newMsg;
  }

  public static async getPrompts(): Promise<PromptTemplateRecord[]> {
    return this.promptTemplates;
  }

  public static async logAIUsage(params: {
    userId?: string;
    provider: string;
    model: string;
    promptTokens: number;
    completionTokens: number;
    cost: number;
    credits: number;
    latency: number;
  }): Promise<AIUsageRecord> {
    const record: AIUsageRecord = {
      id: `usage-${Date.now()}`,
      userId: params.userId || 'usr-1',
      provider: params.provider,
      model: params.model,
      promptTokens: params.promptTokens,
      completionTokens: params.completionTokens,
      cost: params.cost,
      credits: params.credits,
      latency: params.latency,
      createdAt: new Date().toISOString()
    };
    this.aiUsage.unshift(record);
    return record;
  }

  public static async getUserAIUsage(userId: string = 'usr-1'): Promise<AIUsageRecord[]> {
    return this.aiUsage.filter((u) => u.userId === userId);
  }

  public static async saveImageHistory(params: {
    user?: string;
    workspace?: string;
    prompt: string;
    negativePrompt?: string;
    provider: string;
    model: string;
    seed?: number;
    steps?: number;
    resolution?: string;
    cost?: number;
    credits: number;
    storageUrl: string;
  }): Promise<ImageHistoryRecord> {
    const record: ImageHistoryRecord = {
      id: `img_hist_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      user: params.user || 'usr-1',
      workspace: params.workspace || 'ws-default',
      prompt: params.prompt,
      negativePrompt: params.negativePrompt || 'blurry, distorted, low quality',
      provider: params.provider,
      model: params.model,
      seed: params.seed ?? Math.floor(Math.random() * 89999999) + 10000000,
      steps: params.steps || 30,
      resolution: params.resolution || '1280x720',
      cost: params.cost ?? 0.04,
      credits: params.credits,
      date: new Date().toISOString(),
      storageUrl: params.storageUrl
    };

    this.imageHistoryTable.unshift(record);
    return record;
  }

  public static async saveAsset(params: any): Promise<any> {
    return this.saveImageHistory({
      user: params.userId,
      workspace: params.workspace,
      prompt: params.prompt,
      negativePrompt: params.negativePrompt,
      provider: params.provider,
      model: params.model,
      seed: params.seed,
      steps: params.steps,
      resolution: params.width && params.height ? `${params.width}x${params.height}` : '1280x720',
      cost: 0.04,
      credits: params.creditsCost || 15,
      storageUrl: params.storageUrl
    });
  }

  public static async getImageHistory(user: string = 'usr-1', workspace?: string): Promise<ImageHistoryRecord[]> {
    let records = this.imageHistoryTable.filter((r) => r.user === user);
    if (workspace) {
      records = records.filter((r) => r.workspace === workspace);
    }
    return records;
  }

  public static async getUserAssets(userId: string): Promise<any[]> {
    return this.getImageHistory(userId);
  }

  public static saveAiLogRecord(record: AiRequestLogRecord): AiRequestLogRecord {
    this.aiLogRecords.unshift(record);
    return record;
  }

  public static getAiLogRecords(filters?: {
    userId?: string;
    workspaceId?: string;
    provider?: string;
    status?: string;
    limit?: number;
  }): AiRequestLogRecord[] {
    let records = [...this.aiLogRecords];
    if (filters?.userId) records = records.filter((r) => r.userId === filters.userId);
    if (filters?.workspaceId) records = records.filter((r) => r.workspaceId === filters.workspaceId);
    if (filters?.provider) records = records.filter((r) => r.provider.toLowerCase() === filters.provider!.toLowerCase());
    if (filters?.status) records = records.filter((r) => r.status.toLowerCase() === filters.status!.toLowerCase());

    const limit = filters?.limit || 100;
    return records.slice(0, limit);
  }

  public static rotateLogs(maxAgeDays: number = 30): { purgedCount: number; remainingCount: number } {
    const cutoffTime = Date.now() - maxAgeDays * 86400000;
    const initialCount = this.aiLogRecords.length;
    this.aiLogRecords = this.aiLogRecords.filter(
      (r) => new Date(r.timestamp).getTime() > cutoffTime
    );
    const purgedCount = initialCount - this.aiLogRecords.length;
    return { purgedCount, remainingCount: this.aiLogRecords.length };
  }
}
