import "server-only";

/**
 * Хранилище загруженных логов OpenCode
 *
 * Временное in-memory хранилище для логов, загруженных студентами.
 * В production следует использовать Appwrite Storage или Redis.
 */

interface StoredLogs {
  projectId: string;
  studentId: string;
  logs: Array<{
    path: string;
    content: string;
  }>;
  uploadedAt: string;
  expiresAt: string;
}

// In-memory хранилище (для разработки)
// В production заменить на Redis или Appwrite Storage
const logsStorage = new Map<string, StoredLogs>();

const LOGS_TTL_MS = 60 * 60 * 1000; // 1 час

/**
 * Сохранить загруженные логи
 */
export async function storeUploadedLogs(
  projectId: string,
  studentId: string,
  logs: Array<{ path: string; content: string }>,
): Promise<string> {
  const storageKey = `${projectId}:${studentId}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + LOGS_TTL_MS);

  const stored: StoredLogs = {
    projectId,
    studentId,
    logs,
    uploadedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  logsStorage.set(storageKey, stored);

  // Автоматическая очистка через TTL
  setTimeout(() => {
    logsStorage.delete(storageKey);
  }, LOGS_TTL_MS);

  return storageKey;
}

/**
 * Получить загруженные логи
 */
export async function getUploadedLogs(
  projectId: string,
  studentId?: string,
): Promise<Array<{ path: string; content: string }> | null> {
  // Если studentId не указан, ищем любые логи для проекта
  if (!studentId) {
    for (const [key, stored] of logsStorage.entries()) {
      if (stored.projectId === projectId) {
        // Проверка срока действия
        if (new Date(stored.expiresAt).getTime() > Date.now()) {
          return stored.logs;
        }
        // Удаляем просроченные
        logsStorage.delete(key);
      }
    }
    return null;
  }

  const storageKey = `${projectId}:${studentId}`;
  const stored = logsStorage.get(storageKey);

  if (!stored) {
    return null;
  }

  // Проверка срока действия
  if (new Date(stored.expiresAt).getTime() <= Date.now()) {
    logsStorage.delete(storageKey);
    return null;
  }

  return stored.logs;
}

/**
 * Удалить загруженные логи
 */
export async function deleteUploadedLogs(
  projectId: string,
  studentId: string,
): Promise<void> {
  const storageKey = `${projectId}:${studentId}`;
  logsStorage.delete(storageKey);
}

/**
 * Проверить наличие загруженных логов
 */
export async function hasUploadedLogs(
  projectId: string,
  studentId?: string,
): Promise<boolean> {
  const logs = await getUploadedLogs(projectId, studentId);
  return logs !== null && logs.length > 0;
}

/**
 * Получить метаданные загруженных логов
 */
export async function getUploadedLogsMetadata(
  projectId: string,
  studentId?: string,
): Promise<{
  filesCount: number;
  totalSize: number;
  uploadedAt: string;
  expiresAt: string;
} | null> {
  if (!studentId) {
    for (const [key, stored] of logsStorage.entries()) {
      if (stored.projectId === projectId) {
        if (new Date(stored.expiresAt).getTime() > Date.now()) {
          const totalSize = stored.logs.reduce(
            (sum, log) => sum + Buffer.byteLength(log.content, "utf-8"),
            0,
          );
          return {
            filesCount: stored.logs.length,
            totalSize,
            uploadedAt: stored.uploadedAt,
            expiresAt: stored.expiresAt,
          };
        }
        logsStorage.delete(key);
      }
    }
    return null;
  }

  const storageKey = `${projectId}:${studentId}`;
  const stored = logsStorage.get(storageKey);

  if (!stored) {
    return null;
  }

  if (new Date(stored.expiresAt).getTime() <= Date.now()) {
    logsStorage.delete(storageKey);
    return null;
  }

  const totalSize = stored.logs.reduce(
    (sum, log) => sum + Buffer.byteLength(log.content, "utf-8"),
    0,
  );

  return {
    filesCount: stored.logs.length,
    totalSize,
    uploadedAt: stored.uploadedAt,
    expiresAt: stored.expiresAt,
  };
}

/**
 * Очистить все просроченные логи
 */
export async function cleanupExpiredLogs(): Promise<number> {
  let cleaned = 0;
  const now = Date.now();

  for (const [key, stored] of logsStorage.entries()) {
    if (new Date(stored.expiresAt).getTime() <= now) {
      logsStorage.delete(key);
      cleaned++;
    }
  }

  return cleaned;
}
