import crypto from 'crypto';

export class CsrfProtectionService {
  private static SECRET = process.env.NEXTAUTH_SECRET || 'creatoros-csrf-secret-key-2026';

  public static generateToken(): string {
    const raw = crypto.randomBytes(24).toString('hex');
    const signature = crypto.createHmac('sha256', this.SECRET).update(raw).digest('hex');
    return `${raw}.${signature}`;
  }

  public static validateToken(token: string | null): boolean {
    if (!token || typeof token !== 'string') return false;

    const parts = token.split('.');
    if (parts.length !== 2) return false;

    const [raw, signature] = parts;
    const expectedSignature = crypto.createHmac('sha256', this.SECRET).update(raw).digest('hex');

    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  }
}
