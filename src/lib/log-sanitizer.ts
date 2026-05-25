/**
 * Санитизатор логов OpenCode для удаления чувствительной информации
 * перед отправкой на сервер анализа.
 */

export interface SanitizationResult {
  sanitized: string;
  redactedCount: number;
  patterns: string[];
}

/**
 * Паттерны для обнаружения чувствительных данных
 */
const SENSITIVE_PATTERNS = [
  // API ключи и токены
  {
    name: "GitHub Token",
    pattern: /\b(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{36,255}\b/gi,
    replacement: "[REDACTED_GITHUB_TOKEN]",
  },
  {
    name: "Generic API Key",
    pattern:
      /\b[Aa][Pp][Ii][-_]?[Kk][Ee][Yy]\s*[:=]\s*['"]?([A-Za-z0-9_\-]{20,})/gi,
    replacement: "api_key=[REDACTED_API_KEY]",
  },
  {
    name: "Bearer Token",
    pattern: /\b[Bb]earer\s+[A-Za-z0-9\-._~+/]+=*/gi,
    replacement: "Bearer [REDACTED_TOKEN]",
  },
  {
    name: "JWT Token",
    pattern: /\beyJ[A-Za-z0-9_-]*\.eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*/gi,
    replacement: "[REDACTED_JWT]",
  },
  {
    name: "AWS Access Key",
    pattern: /\b(AKIA|ASIA)[A-Z0-9]{16}\b/gi,
    replacement: "[REDACTED_AWS_KEY]",
  },
  {
    name: "AWS Secret Key",
    pattern: /\b[A-Za-z0-9/+=]{40}\b/g,
    replacement: "[REDACTED_AWS_SECRET]",
  },
  {
    name: "Private Key",
    pattern:
      /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----[\s\S]*?-----END\s+(?:RSA\s+)?PRIVATE\s+KEY-----/gi,
    replacement: "[REDACTED_PRIVATE_KEY]",
  },
  {
    name: "Password in URL",
    pattern: /(https?:\/\/[^:]+:)([^@]+)(@)/gi,
    replacement: "$1[REDACTED_PASSWORD]$3",
  },
  {
    name: "Generic Password",
    pattern: /\b[Pp]assword\s*[:=]\s*['"]?([^\s'"]{6,})/gi,
    replacement: "password=[REDACTED_PASSWORD]",
  },
  {
    name: "Generic Secret",
    pattern: /\b[Ss]ecret\s*[:=]\s*['"]?([^\s'"]{6,})/gi,
    replacement: "secret=[REDACTED_SECRET]",
  },
  {
    name: "Database Connection String",
    pattern: /(mongodb|mysql|postgresql|postgres):\/\/([^:]+):([^@]+)@/gi,
    replacement: "$1://[REDACTED_USER]:[REDACTED_PASSWORD]@",
  },
  {
    name: "Slack Token",
    pattern: /xox[baprs]-[0-9]{10,13}-[0-9]{10,13}-[A-Za-z0-9]{24,}/gi,
    replacement: "[REDACTED_SLACK_TOKEN]",
  },
  {
    name: "Stripe Key",
    pattern: /\b(sk|pk)_(test|live)_[A-Za-z0-9]{24,}/gi,
    replacement: "[REDACTED_STRIPE_KEY]",
  },
  {
    name: "OpenAI API Key",
    pattern: /\bsk-[A-Za-z0-9]{48}\b/gi,
    replacement: "[REDACTED_OPENAI_KEY]",
  },
  {
    name: "Anthropic API Key",
    pattern: /\bsk-ant-[A-Za-z0-9\-_]{95,}/gi,
    replacement: "[REDACTED_ANTHROPIC_KEY]",
  },

  // Персональные данные
  {
    name: "Email Address",
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi,
    replacement: "[REDACTED_EMAIL]",
  },
  {
    name: "Phone Number",
    pattern: /\b(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    replacement: "[REDACTED_PHONE]",
  },
  {
    name: "IP Address",
    pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
    replacement: "[REDACTED_IP]",
  },
  {
    name: "IPv6 Address",
    pattern: /\b(?:[A-Fa-f0-9]{1,4}:){7}[A-Fa-f0-9]{1,4}\b/g,
    replacement: "[REDACTED_IPV6]",
  },

  // Пути файловой системы (могут содержать имена пользователей)
  {
    name: "Windows Path",
    pattern: /\bC:\\Users\\[^\s\\]+/gi,
    replacement: "C:\\Users\\[REDACTED_USER]",
  },
  {
    name: "Unix Home Path",
    pattern: /\/home\/[^\s\/]+/gi,
    replacement: "/home/[REDACTED_USER]",
  },
  {
    name: "Mac Home Path",
    pattern: /\/Users\/[^\s\/]+/gi,
    replacement: "/Users/[REDACTED_USER]",
  },

  // Специфичные для проекта
  {
    name: "Appwrite API Key",
    pattern: /\b[A-Za-z0-9]{64}\b/g,
    replacement: "[REDACTED_APPWRITE_KEY]",
  },
  {
    name: "Session Cookie",
    pattern: /\b(session|sid|token)=['"][A-Za-z0-9+/=]{20,}['"]/gi,
    replacement: "$1=[REDACTED_SESSION]",
  },
];

/**
 * Санитизирует содержимое лог-файла, удаляя чувствительную информацию
 */
export function sanitizeLogContent(content: string): SanitizationResult {
  let sanitized = content;
  let redactedCount = 0;
  const triggeredPatterns: string[] = [];

  for (const { name, pattern, replacement } of SENSITIVE_PATTERNS) {
    const matches = sanitized.match(pattern);
    if (matches && matches.length > 0) {
      sanitized = sanitized.replace(pattern, replacement);
      redactedCount += matches.length;
      triggeredPatterns.push(name);
    }
  }

  return {
    sanitized,
    redactedCount,
    patterns: [...new Set(triggeredPatterns)],
  };
}

/**
 * Санитизирует JSON-лог OpenCode
 */
export function sanitizeOpenCodeLog(logJson: unknown): SanitizationResult {
  const logString = JSON.stringify(logJson, null, 2);
  const result = sanitizeLogContent(logString);

  try {
    // Пытаемся распарсить обратно в JSON для валидации
    JSON.parse(result.sanitized);
  } catch {
    // Если JSON сломался после санитизации, возвращаем предупреждение
    return {
      sanitized: JSON.stringify({
        error: "Log sanitization resulted in invalid JSON",
        originalSize: logString.length,
      }),
      redactedCount: result.redactedCount,
      patterns: result.patterns,
    };
  }

  return result;
}

/**
 * Пакетная санитизация массива логов
 */
export function sanitizeLogs(
  logs: Array<{ path: string; content: string }>,
): Array<{
  path: string;
  content: string;
  redactedCount: number;
  patterns: string[];
}> {
  return logs.map((log) => {
    const result = sanitizeLogContent(log.content);
    return {
      path: log.path,
      content: result.sanitized,
      redactedCount: result.redactedCount,
      patterns: result.patterns,
    };
  });
}

/**
 * Проверяет, содержит ли строка потенциально чувствительные данные
 */
export function containsSensitiveData(content: string): boolean {
  for (const { pattern } of SENSITIVE_PATTERNS) {
    if (pattern.test(content)) {
      return true;
    }
  }
  return false;
}

/**
 * Генерирует отчет о санитизации
 */
export function generateSanitizationReport(
  results: Array<{
    path: string;
    redactedCount: number;
    patterns: string[];
  }>,
): string {
  const totalRedacted = results.reduce((sum, r) => sum + r.redactedCount, 0);
  const allPatterns = new Set(results.flatMap((r) => r.patterns));

  let report = `Санитизация логов завершена\n`;
  report += `═══════════════════════════════════════\n`;
  report += `Обработано файлов: ${results.length}\n`;
  report += `Удалено чувствительных данных: ${totalRedacted}\n`;
  report += `Типы обнаруженных данных: ${allPatterns.size}\n\n`;

  if (allPatterns.size > 0) {
    report += `Обнаруженные типы:\n`;
    for (const pattern of allPatterns) {
      report += `  • ${pattern}\n`;
    }
  }

  return report;
}
