import { NextResponse } from 'next/server';
import { XssSanitizer } from './sanitizer';
import { SqlInjectionSanitizer } from './sqlSanitizer';
import { PromptInjectionGuard } from './promptGuard';
import { CsrfProtectionService } from './csrf';
import { JwtValidationService } from './jwtValidator';
import { SecurityAuditLogger } from './auditLogger';

export interface SecurityValidationResult {
  authorized: boolean;
  sanitizedInput?: any;
  errorResponse?: NextResponse;
  userId?: string;
  threatDetails?: string;
}

export class MasterSecurityEngine {
  public static async validateRequest(
    req: Request,
    options?: {
      requireAuth?: boolean;
      requireCsrf?: boolean;
      promptInput?: string;
    }
  ): Promise<SecurityValidationResult> {
    const ipAddress = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const authHeader = req.headers.get('authorization');
    const csrfToken = req.headers.get('x-csrf-token');

    let userId = req.headers.get('x-user-id') || 'usr-1';
    if (options?.requireAuth) {
      const token = JwtValidationService.extractBearerToken(authHeader);
      if (!token) {
        SecurityAuditLogger.logEvent({
          eventType: 'UNAUTHORIZED_ACCESS',
          severity: 'WARNING',
          ipAddress,
          details: 'Missing or malformed Authorization Bearer header'
        });
        return {
          authorized: false,
          errorResponse: NextResponse.json({ error: 'Unauthorized: Missing or invalid JWT token' }, { status: 401 })
        };
      }

      const jwtResult = JwtValidationService.verifyToken(token);
      if (!jwtResult.valid) {
        SecurityAuditLogger.logEvent({
          eventType: 'INVALID_JWT',
          severity: 'WARNING',
          ipAddress,
          details: jwtResult.error || 'JWT signature verification failed'
        });
        return {
          authorized: false,
          errorResponse: NextResponse.json({ error: `Unauthorized: ${jwtResult.error}` }, { status: 401 })
        };
      }

      if (jwtResult.payload?.userId) {
        userId = jwtResult.payload.userId;
      }
    }

    if (options?.requireCsrf) {
      if (!CsrfProtectionService.validateToken(csrfToken)) {
        SecurityAuditLogger.logEvent({
          eventType: 'CSRF_VIOLATION',
          severity: 'HIGH',
          userId,
          ipAddress,
          details: 'Invalid or missing CSRF double-submit token'
        });
        return {
          authorized: false,
          errorResponse: NextResponse.json({ error: 'Forbidden: Invalid CSRF token' }, { status: 403 })
        };
      }
    }

    if (options?.promptInput) {
      const promptCheck = PromptInjectionGuard.inspect(options.promptInput);
      if (!promptCheck.safe) {
        SecurityAuditLogger.logEvent({
          eventType: 'PROMPT_INJECTION_BLOCKED',
          severity: 'HIGH',
          userId,
          ipAddress,
          details: `Blocked adversarial prompt injection category: ${promptCheck.threatCategory}`
        });

        return {
          authorized: false,
          errorResponse: NextResponse.json(
            {
              error: 'Security Guardrail Intercepted Payload',
              message: `Adversarial prompt injection pattern detected (${promptCheck.threatCategory}). Prompt was blocked for safety.`,
              threatCategory: promptCheck.threatCategory
            },
            { status: 400 }
          )
        };
      }
    }

    if (options?.promptInput && SqlInjectionSanitizer.containsSqlInjection(options.promptInput)) {
      SecurityAuditLogger.logEvent({
        eventType: 'SQL_INJECTION_DETECTED',
        severity: 'CRITICAL',
        userId,
        ipAddress,
        details: 'SQL injection attack pattern detected in input parameter'
      });
      return {
        authorized: false,
        errorResponse: NextResponse.json(
          { error: 'Security Intercept: Malicious SQL injection payload detected.' },
          { status: 400 }
        )
      };
    }

    const sanitizedInput = options?.promptInput ? XssSanitizer.sanitizeString(options.promptInput) : undefined;

    return {
      authorized: true,
      userId,
      sanitizedInput
    };
  }
}
