import "server-only";

import { getUploadedLogs, hasUploadedLogs } from "@/lib/server/logs-storage";
import { analyzeUploadedOpenCodeLogs } from "@/lib/server/opencode-coach-analyzer";

/**
 * Интеграция анализа загруженных логов в существующую функцию runProjectAiAnalysis
 *
 * Этот модуль предоставляет функцию для получения результатов анализа OpenCode Coach
 * из загруженных логов вместо прямого чтения из GitHub.
 */

export interface OpenCodeCoachResult {
  opencodeCoachScore?: number;
  opencodeCoachReport?: string;
}

/**
 * Получить результаты анализа OpenCode Coach для проекта
 *
 * Сначала проверяет наличие загруженных логов, если их нет - возвращает undefined.
 * Это позволяет сохранить обратную совместимость с существующим кодом.
 *
 * @param projectId - ID проекта
 * @returns Результаты анализа или пустой объект
 */
export async function getOpenCodeCoachAnalysis(
  projectId: string,
): Promise<OpenCodeCoachResult> {
  try {
    // Проверяем наличие загруженных логов
    const hasLogs = await hasUploadedLogs(projectId);

    if (!hasLogs) {
      console.log(
        `ℹ️  Проект ${projectId}: логи OpenCode не загружены, анализ пропущен`,
      );
      return {};
    }

    // Анализируем загруженные логи
    const analysis = await analyzeUploadedOpenCodeLogs(projectId);

    if (!analysis) {
      console.warn(
        `⚠️  Проект ${projectId}: не удалось проанализировать загруженные логи`,
      );
      return {};
    }

    console.log(
      `✅ Проект ${projectId}: OpenCode Coach анализ завершен (оценка: ${analysis.score}/100, сессий: ${analysis.sessionsCount})`,
    );

    return {
      opencodeCoachScore: analysis.score,
      opencodeCoachReport: analysis.report,
    };
  } catch (error) {
    console.error(
      `❌ Ошибка анализа OpenCode Coach для проекта ${projectId}:`,
      error,
    );
    // Не прерываем основной процесс анализа проекта
    return {};
  }
}
