export type ProviderKeyType =
  | 'openai'
  | 'gemini'
  | 'claude'
  | 'groq'
  | 'fal'
  | 'replicate'
  | 'elevenlabs'
  | 'deepgram';

export class SecretsValidatorService {
  private static KEY_PATTERNS: Record<ProviderKeyType, RegExp> = {
    openai: /^sk-[a-zA-Z0-9_-]{32,}$/,
    gemini: /^AIzaSy[a-zA-Z0-9_-]{33}$/,
    claude: /^sk-ant-api[a-zA-Z0-9_-]{30,}$/,
    groq: /^gsk_[a-zA-Z0-9_-]{30,}$/,
    fal: /^fal_[a-zA-Z0-9_-]{20,}$/,
    replicate: /^r8_[a-zA-Z0-9_-]{30,}$/,
    elevenlabs: /^[a-zA-Z0-9]{32,}$/,
    deepgram: /^[a-zA-Z0-9]{40,}$/
  };

  public static isValidFormat(provider: ProviderKeyType, key: string): boolean {
    if (!key || typeof key !== 'string') return false;
    const pattern = this.KEY_PATTERNS[provider];
    if (!pattern) return key.length >= 20;
    return pattern.test(key.trim());
  }

  public static maskSecret(key: string): string {
    if (!key || typeof key !== 'string') return 'unconfigured';
    const trimmed = key.trim();
    if (trimmed.length <= 8) return '********';

    const prefix = trimmed.slice(0, 4);
    const suffix = trimmed.slice(-4);
    return `${prefix}***...***${suffix}`;
  }
}
