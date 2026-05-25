import { NextRequest, NextResponse } from "next/server";
import { requireStudentSession } from "@/lib/server/auth";
import { getProject } from "@/lib/server/repositories/projects";
import { sanitizeLogs } from "@/lib/log-sanitizer";
import { storeUploadedLogs } from "@/lib/server/logs-storage";

interface UploadLogsRequest {
  logs: Array<{
    path: string;
    content: string;
  }>;
}

const MAX_LOGS = 150;
const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per file

/**
 * POST /api/projects/[projectId]/upload-logs
 * 
 * Безопасная загрузка логов OpenCode для анализа AI Engineering Coach
 * 
 * Требования:
 * - Аутентификация студента
 * - Студент должен быть участником проекта
 * - Логи санитизируются на клиенте, но дополнительно проверяются на сервере
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    // 1. Аутентификация
    const session = await requireStudentSession();
    const { projectId } = await params;

    // 2. Проверка доступа к проекту
    const project = await getProject(projectId);

    if (!project) {
      return NextResponse.json({ error: "Проект не найден" }, { status: 404 });
    }

    // Проверка что студент является участником проекта
    const isMember = project.memberStudentIds.includes(session.studentId);

    if (!isMember) {
      return NextResponse.json(
        { error: "Доступ запрещен: вы не являетесь участником этого проекта" },
        { status: 403 },
      );
    }

    // 3. Парсинг и валидация запроса
    let body: UploadLogsRequest;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Некорректный JSON в теле запроса" },
        { status: 400 },
      );
    }

    if (!body.logs || !Array.isArray(body.logs)) {
      return NextResponse.json(
        { error: "Поле 'logs' должно быть массивом" },
        { status: 400 },
      );
    }

    // 4. Валидация количества и размера
    if (body.logs.length === 0) {
      return NextResponse.json({ error: "Массив логов пуст" }, { status: 400 });
    }

    if (body.logs.length > MAX_LOGS) {
      return NextResponse.json(
        { error: `Превышен лимит файлов: максимум ${MAX_LOGS}` },
        { status: 400 },
      );
    }

    let totalSize = 0;

    for (const log of body.logs) {
      if (!log.path || typeof log.path !== "string") {
        return NextResponse.json(
          { error: "Каждый лог должен содержать поле 'path' (строка)" },
          { status: 400 },
        );
      }

      if (!log.content || typeof log.content !== "string") {
        return NextResponse.json(
          { error: "Каждый лог должен содержать поле 'content' (строка)" },
          { status: 400 },
        );
      }

      const fileSize = Buffer.byteLength(log.content, "utf-8");

      if (fileSize > MAX_FILE_SIZE) {
        return NextResponse.json(
          {
            error: `Файл ${log.path} превышает лимит размера ${MAX_FILE_SIZE / 1024 / 1024}MB`,
          },
          { status: 400 },
        );
      }

      totalSize += fileSize;
    }

    if (totalSize > MAX_TOTAL_SIZE) {
      return NextResponse.json(
        {
          error: `Общий размер логов превышает лимит ${MAX_TOTAL_SIZE / 1024 / 1024}MB`,
        },
        { status: 400 },
      );
    }

    // 5. Дополнительная санитизация на сервере (защита от обхода клиентской санитизации)
    const sanitized = sanitizeLogs(body.logs);

    const totalRedacted = sanitized.reduce(
      (sum, log) => sum + log.redactedCount,
      0,
    );

    if (totalRedacted > 0) {
      console.warn(
        `⚠️  Обнаружены несанитизированные данные в логах проекта ${projectId}: ${totalRedacted} элементов`,
      );
    }

    // 6. Сохранение логов во временное хранилище
    const logsData = sanitized.map((log) => ({
      path: log.path,
      content: log.content,
    }));

    const storageKey = await storeUploadedLogs(
      projectId,
      session.studentId,
      logsData,
    );

    // Сохраняем метаданные загрузки
    const uploadMetadata = {
      projectId,
      studentId: session.studentId,
      uploadedAt: new Date().toISOString(),
      filesCount: logsData.length,
      totalSize,
      redactedCount: totalRedacted,
      redactedPatterns: [...new Set(sanitized.flatMap((log) => log.patterns))],
      storageKey,
    };

    console.log(
      `✅ Логи загружены для проекта ${projectId}: ${logsData.length} файлов, ${(totalSize / 1024 / 1024).toFixed(2)}MB`,
    );

    // 7. Возвращаем успешный ответ
    return NextResponse.json({
      success: true,
      message: "Логи успешно загружены и готовы к анализу",
      metadata: {
        filesCount: logsData.length,
        totalSize,
        redactedCount: totalRedacted,
        uploadedAt: uploadMetadata.uploadedAt,
        storageKey,
      },
    });
  } catch (error) {
    console.error("Ошибка загрузки логов:", error);

    return NextResponse.json(
      {
        error: "Внутренняя ошибка сервера",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
