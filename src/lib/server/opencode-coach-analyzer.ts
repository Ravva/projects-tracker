import "server-only";

import { getUploadedLogs } from "@/lib/server/logs-storage";
import { parseInMemoryOpenCodeSessions } from "@/lib/server/ai-coach/parser-opencode";
import {
  registerAllBuiltinRules,
  registerAllBuiltinMetrics,
} from "@/lib/server/ai-coach/rule-loader";
import { runDetectors } from "@/lib/server/ai-coach/detector-registry";

export interface OpenCodeCoachAnalysisResult {
  score: number;
  report: string;
  sessionsCount: number;
  antiPatternsCount: number;
}

/**
 * Анализ загруженных логов OpenCode с помощью AI Engineering Coach
 *
 * @param projectId - ID проекта
 * @param studentId - ID студента (опционально, если не указан - берутся любые логи проекта)
 * @returns Результат анализа или null если логи не найдены
 */
export async function analyzeUploadedOpenCodeLogs(
  projectId: string,
  studentId?: string,
): Promise<OpenCodeCoachAnalysisResult | null> {
  // 1. Получить загруженные логи из хранилища
  const logs = await getUploadedLogs(projectId, studentId);

  if (!logs || logs.length === 0) {
    return null;
  }

  try {
    // 2. Парсинг сессий из логов
    const sessions = parseInMemoryOpenCodeSessions(logs);

    if (sessions.length === 0) {
      return {
        score: 100,
        report:
          "### 🤖 Анализ ИИ-разработки (AI Engineering Coach)\n\n**Итоговая оценка гигиены работы с ИИ:** **100/100**\n\n*Проанализировано сессий OpenCode:* 0\n\n⚠️ Логи загружены, но не содержат валидных сессий OpenCode.",
        sessionsCount: 0,
        antiPatternsCount: 0,
      };
    }

    const reqs = sessions.flatMap((s) => s.requests);

    // 3. Инициализация правил и метрик
    registerAllBuiltinRules();
    registerAllBuiltinMetrics();

    // 4. Запуск детекторов антипаттернов
    const triggered = runDetectors(reqs, sessions, true);

    // 5. Расчет оценки
    let score = 100;
    const sevPenalty: Record<string, number> = {
      critical: 15,
      high: 10,
      medium: 5,
      low: 2,
    };

    for (const ap of triggered) {
      if (ap.occurrences > 0) {
        score -= sevPenalty[ap.severity] ?? 5;
      }
    }

    score = Math.max(0, score);

    // 6. Генерация отчета на русском языке
    let report = `### 🤖 Анализ ИИ-разработки (AI Engineering Coach)\n\n`;
    report += `**Итоговая оценка гигиены работы с ИИ:** **${score}/100**\n`;
    report += `*Проанализировано сессий OpenCode:* ${sessions.length}\n\n`;

    const activeSubscribers = triggered.filter((ap) => ap.occurrences > 0);

    if (activeSubscribers.length === 0) {
      report += `✅ **Антипаттернов не обнаружено!** Ученик демонстрирует отличную культуру проектирования и грамотное взаимодействие с ИИ-ассистентом.`;
    } else {
      report += `#### Обнаруженные антипаттерны\n\n`;

      const bySeverity: Record<string, typeof activeSubscribers> = {
        critical: [],
        high: [],
        medium: [],
        low: [],
      };

      for (const ap of activeSubscribers) {
        bySeverity[ap.severity]?.push(ap);
      }

      const severityLabels: Record<string, string> = {
        critical: "🔴 Критические",
        high: "🟠 Высокие",
        medium: "🟡 Средние",
        low: "🟢 Низкие",
      };

      for (const sev of ["critical", "high", "medium", "low"]) {
        const group = bySeverity[sev];
        if (group && group.length > 0) {
          report += `##### ${severityLabels[sev]}\n\n`;
          for (const ap of group) {
            report += `**${ap.name}** (${ap.occurrences} раз)\n`;
            report += `${ap.description}\n`;
            if (ap.suggestion) {
              report += `*Рекомендация:* ${ap.suggestion}\n`;
            }
            report += `\n`;
          }
        }
      }
    }

    return {
      score,
      report,
      sessionsCount: sessions.length,
      antiPatternsCount: activeSubscribers.length,
    };
  } catch (error) {
    console.error("Ошибка анализа OpenCode логов:", error);
    throw error;
  }
}
