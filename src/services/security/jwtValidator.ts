import crypto from 'crypto';

export interface JwtPayload {
  userId: string;
  email?: string;
  role?: string;
  iat: number;
  exp: number;
}

export interface JwtVerificationResult {
  valid: boolean;
  payload?: JwtPayload;
  error?: string;
}

export class JwtValidationService {
  private static SECRET = process.env.NEXTAUTH_SECRET || 'creatoros-production-master-jwt-secret-key-32b';

  public static verifyToken(token: string): JwtVerificationResult {
    if (!token || typeof token !== 'string') {
      return { valid: false, error: 'Missing or invalid token format' };
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false, error: 'Malformed JWT structure' };
    }

    const [headerB64, payloadB64, signatureB64] = parts;

    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.SECRET)
        .update(`${headerB64}.${payloadB64}`)
        .digest('base64url');

      if (!crypto.timingSafeEqual(Buffer.from(signatureB64), Buffer.from(expectedSignature))) {
        return { valid: false, error: 'Invalid token signature' };
      }

      const payloadJson = Buffer.from(payloadB64, 'base64url').toString('utf8');
      const payload: JwtPayload = JSON.parse(payloadJson);

      const nowSeconds = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < nowSeconds) {
        return { valid: false, error: 'Token expired' };
      }

      return { valid: true, payload };
    } catch (err: any) {
      return { valid: false, error: 'Failed to parse token payload' };
    }
  }

  public static extractBearerToken(authHeader: string | null): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    return authHeader.slice(7).trim();
  }
}
