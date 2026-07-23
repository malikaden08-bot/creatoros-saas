export interface PromptSecurityCheckResult {
  safe: boolean;
  score: number;
  threatCategory?: string;
  detectedPattern?: string;
  sanitizedPrompt: string;
}

export class PromptInjectionGuard {
  private static JAILBREAK_PATTERNS = [
    { pattern: /ignore\s+(all\s+)?previous\s+instructions/i, category: 'Instruction Override' },
    { pattern: /disregard\s+(all\s+)?prior\s+(rules|prompts|guidelines)/i, category: 'Instruction Override' },
    { pattern: /you\s+are\s+now\s+in\s+DAN\s+mode/i, category: 'Jailbreak (DAN)' },
    { pattern: /reveal\s+(your\s+)?(system\s+prompt|developer\s+instructions|secret\s+keys)/i, category: 'System Leakage' },
    { pattern: /show\s+me\s+the\s+hidden\s+text\s+above/i, category: 'System Leakage' },
    { pattern: /bypass\s+all\s+(safety|content)\s+filters/i, category: 'Safety Bypass' },
    { pattern: /act\s+as\s+an\s+unrestricted\s+AI/i, category: 'Roleplay Exploitation' },
    { pattern: /\[system\s*:\s*override\]/i, category: 'System Tag Injection' }
  ];

  public static inspect(prompt: string): PromptSecurityCheckResult {
    if (!prompt || typeof prompt !== 'string') {
      return { safe: true, score: 0, sanitizedPrompt: '' };
    }

    for (const item of this.JAILBREAK_PATTERNS) {
      if (item.pattern.test(prompt)) {
        return {
          safe: false,
          score: 95,
          threatCategory: item.category,
          detectedPattern: item.pattern.toString(),
          sanitizedPrompt: prompt.replace(item.pattern, '[BLOCKED INJECTION PATTERN]')
        };
      }
    }

    return {
      safe: true,
      score: 0,
      sanitizedPrompt: prompt.trim()
    };
  }
}
