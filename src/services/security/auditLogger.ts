import { logger } from '../logger';

export type SecurityEventSeverity = 'INFO' | 'WARNING' | 'HIGH' | 'CRITICAL';

export interface SecurityAuditEvent {
  id: string;
  eventType: string;
  severity: SecurityEventSeverity;
  userId?: string;
  ipAddress: string;
  details: string;
  timestamp: string;
}

export class SecurityAuditLogger {
  private static auditLogs: SecurityAuditEvent[] = [];

  public static logEvent(params: {
    eventType: string;
    severity: SecurityEventSeverity;
    userId?: string;
    ipAddress?: string;
    details: string;
  }): SecurityAuditEvent {
    const event: SecurityAuditEvent = {
      id: `sec-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      eventType: params.eventType,
      severity: params.severity,
      userId: params.userId || 'usr-anonymous',
      ipAddress: params.ipAddress || '127.0.0.1',
      details: params.details,
      timestamp: new Date().toISOString()
    };

    this.auditLogs.unshift(event);

    logger.warn(
      {
        securityEventId: event.id,
        eventType: event.eventType,
        severity: event.severity,
        userId: event.userId,
        ipAddress: event.ipAddress
      },
      `[SECURITY AUDIT] ${event.severity} - ${event.eventType}: ${event.details}`
    );

    return event;
  }

  public static getLogs(severity?: SecurityEventSeverity): SecurityAuditEvent[] {
    if (severity) {
      return this.auditLogs.filter((l) => l.severity === severity);
    }
    return this.auditLogs;
  }
}
