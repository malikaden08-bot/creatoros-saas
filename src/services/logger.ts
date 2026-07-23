import pino from 'pino';
import { DatabaseService, AiRequestLogRecord } from './database';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  base: { service: 'creatoros-ai-gateway' },
  timestamp: pino.stdTimeFunctions.isoTime
});

export interface LogAiRequestParams {
  userId?: string;
  workspaceId?: string;
  provider: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  credits: number;
  latency: number;
  cost: number;
  status: 'success' | 'error' | 'rate_limited' | 'failed';
  ipAddress?: string;
  requestId?: string;
  errorDetails?: string;
}

export class EnterpriseLogger {
  public static logAiRequest(params: LogAiRequestParams): AiRequestLogRecord {
    const record: AiRequestLogRecord = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      requestId: params.requestId || `req-${Date.now()}`,
      userId: params.userId || 'usr-default',
      workspaceId: params.workspaceId || 'ws-default',
      provider: params.provider,
      model: params.model,
      promptTokens: params.promptTokens,
      completionTokens: params.completionTokens,
      credits: params.credits,
      latency: params.latency,
      cost: params.cost,
      status: params.status,
      ipAddress: params.ipAddress || '127.0.0.1',
      timestamp: new Date().toISOString(),
      errorDetails: params.errorDetails
    };

    logger.info(
      {
        requestId: record.requestId,
        userId: record.userId,
        workspaceId: record.workspaceId,
        provider: record.provider,
        model: record.model,
        promptTokens: record.promptTokens,
        completionTokens: record.completionTokens,
        credits: record.credits,
        latencyMs: record.latency,
        costUsd: record.cost,
        status: record.status,
        ipAddress: record.ipAddress
      },
      `[AI Request] ${record.provider.toUpperCase()} (${record.model}) — ${record.status} in ${record.latency}ms`
    );

    DatabaseService.saveAiLogRecord(record);

    return record;
  }
}
