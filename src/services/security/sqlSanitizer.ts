export class SqlInjectionSanitizer {
  private static SQL_PATTERNS = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|EXEC|UNION)\b)/i,
    /(--|\/\*|\*\/|;)/,
    /(\bOR\b\s+[\w']+\s*=\s*[\w']+)/i,
    /(\bAND\b\s+[\w']+\s*=\s*[\w']+)/i,
    /(' OR '1'='1|' OR 1=1)/i,
    /(xp_cmdshell|exec\s+master)/i
  ];

  public static containsSqlInjection(input: string): boolean {
    if (!input || typeof input !== 'string') return false;
    return this.SQL_PATTERNS.some((pattern) => pattern.test(input));
  }

  public static sanitizeSqlParameter(input: string): string {
    if (!input || typeof input !== 'string') return '';
    return input
      .replace(/'/g, "''")
      .replace(/--/g, '')
      .replace(/;/g, '')
      .replace(/\/\*/g, '')
      .replace(/\*\//g, '');
  }
}
