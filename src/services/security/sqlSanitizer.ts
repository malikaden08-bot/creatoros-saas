/**
 * SQL Injection Detection & Neutralizer
 * Patterns require actual SQL attack context (quotes, semicolons, comment sequences)
 * to avoid false-positives on creative AI generation prompts.
 */
export class SqlInjectionSanitizer {
  private static SQL_PATTERNS = [
    /(--|\/\*|\*\/)/,
    /('\s*(OR|AND)\s*'[^']*'\s*=\s*')/i,
    /\b(OR|AND)\s+\d+\s*=\s*\d+\b/i,
    /\bUNION\s+(ALL\s+)?SELECT\b/i,
    /(xp_cmdshell|exec\s+master|sp_executesql)/i,
    /;\s*(DROP|INSERT|DELETE|UPDATE|ALTER|CREATE)\s+/i
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
