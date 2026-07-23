export class XssSanitizer {
  private static HTML_ESCAPES: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };

  public static escapeHtml(str: string): string {
    if (!str || typeof str !== 'string') return '';
    return str.replace(/[&<>"'/]/g, (match) => this.HTML_ESCAPES[match]);
  }

  public static sanitizeString(input: string): string {
    if (!input || typeof input !== 'string') return '';

    let cleaned = input;

    cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    cleaned = cleaned.replace(/\s*on\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '');
    cleaned = cleaned.replace(/javascript\s*:/gi, 'no-javascript:');
    cleaned = cleaned.replace(/data\s*:\s*text\/html/gi, 'no-data:');
    cleaned = cleaned.replace(/<\/?(iframe|object|embed|applet)[^>]*>/gi, '');

    return cleaned.trim();
  }

  public static sanitizeObject<T>(data: T): T {
    if (typeof data === 'string') {
      return this.sanitizeString(data) as any;
    }
    if (Array.isArray(data)) {
      return data.map((item) => this.sanitizeObject(item)) as any;
    }
    if (data !== null && typeof data === 'object') {
      const sanitizedObj: any = {};
      for (const [key, value] of Object.entries(data as any)) {
        sanitizedObj[key] = this.sanitizeObject(value);
      }
      return sanitizedObj;
    }
    return data;
  }
}
