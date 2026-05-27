#!/usr/bin/env bun
/**
 * CLI-утилита для безопасной загрузки логов OpenCode на сервер анализа
 *
 * Использование:
 *   bun scripts/upload-logs.ts --project-id <id> --token <auth-token>
 *
 * Опции:
 *   --project-id    ID проекта в системе projects-tracker
 *   --token         Токен аутентификации студента
 *   --server        URL сервера (по умолчанию: https://projects-tracker-one.vercel.app)
 *   --dry-run       Показать что будет отправлено без фактической отправки
 *   --verbose       Подробный вывод
 */

import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative } from "node:path";
import {
  generateSanitizationReport,
  sanitizeLogs,
} from "../src/lib/log-sanitizer";

interface CliOptions {
  projectId?: string;
  token?: string;
  server: string;
  dryRun: boolean;
  verbose: boolean;
}

interface LogFile {
  path: string;
  content: string;
}

const LOG_DIRECTORIES = [".ai-coach/logs", ".opencode-logs"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_FILES = 150;

/**
 * Парсинг аргументов командной строки
 */
function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const options: CliOptions = {
    server: "https://projects-tracker-one.vercel.app",
    dryRun: false,
    verbose: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case "--project-id":
        options.projectId = nextArg;
        i++;
        break;
      case "--token":
        options.token = nextArg;
        i++;
        break;
      case "--server":
        options.server = nextArg;
        i++;
        break;
      case "--dry-run":
        options.dryRun = true;
        break;
      case "--verbose":
        options.verbose = true;
        break;
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
    }
  }

  return options;
}

/**
 * Вывод справки
 */
function printHelp() {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║  OpenCode Log Uploader - Безопасная загрузка логов           ║
╚═══════════════════════════════════════════════════════════════╝

Использование:
  bun scripts/upload-logs.ts --project-id <id> --token <token>

Опции:
  --project-id <id>    ID проекта в системе projects-tracker (обязательно)
  --token <token>      Токен аутентификации студента (обязательно)
  --server <url>       URL сервера (по умолчанию: production)
  --dry-run            Показать что будет отправлено без отправки
  --verbose            Подробный вывод
  --help, -h           Показать эту справку

Примеры:
  # Загрузить логи для проекта
  bun scripts/upload-logs.ts --project-id abc123 --token xyz789

  # Проверить что будет отправлено (без отправки)
  bun scripts/upload-logs.ts --project-id abc123 --token xyz789 --dry-run

  # Использовать локальный сервер разработки
  bun scripts/upload-logs.ts --project-id abc123 --token xyz789 --server http://localhost:3000

Безопасность:
  • Все логи санитизируются перед отправкой
  • API ключи, токены, пароли автоматически удаляются
  • Персональные данные (email, телефоны) редактируются
  • Пути файловой системы с именами пользователей скрываются
`);
}

/**
 * Рекурсивный поиск JSON-файлов в директории
 */
async function findLogFiles(dir: string, baseDir: string): Promise<LogFile[]> {
  const files: LogFile[] = [];

  try {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        const subFiles = await findLogFiles(fullPath, baseDir);
        files.push(...subFiles);
      } else if (entry.isFile() && entry.name.endsWith(".json")) {
        const stats = await stat(fullPath);

        if (stats.size > MAX_FILE_SIZE) {
          console.warn(
            `⚠️  Пропущен файл ${entry.name} (размер ${(stats.size / 1024 / 1024).toFixed(2)}MB превышает лимит)`,
          );
          continue;
        }

        const content = await readFile(fullPath, "utf-8");
        const relativePath = relative(baseDir, fullPath);

        files.push({
          path: relativePath,
          content,
        });
      }
    }
  } catch (_error) {
    // Директория не существует или нет доступа
  }

  return files;
}

/**
 * Сканирование проекта на наличие логов
 */
async function scanForLogs(verbose: boolean): Promise<LogFile[]> {
  const cwd = process.cwd();
  const allLogs: LogFile[] = [];

  console.log("🔍 Сканирование проекта на наличие логов...\n");

  for (const logDir of LOG_DIRECTORIES) {
    const fullPath = join(cwd, logDir);
    if (verbose) {
      console.log(`   Проверка: ${logDir}`);
    }

    const logs = await findLogFiles(fullPath, cwd);

    if (logs.length > 0) {
      console.log(`   ✓ Найдено ${logs.length} файлов в ${logDir}`);
      allLogs.push(...logs);
    }
  }

  if (allLogs.length === 0) {
    console.log("   ℹ️  Логи не найдены\n");
    return [];
  }

  // Ограничение количества файлов
  if (allLogs.length > MAX_FILES) {
    console.log(
      `\n⚠️  Найдено ${allLogs.length} файлов, будут отправлены первые ${MAX_FILES}`,
    );
    return allLogs.slice(0, MAX_FILES);
  }

  console.log(`\n✓ Всего найдено: ${allLogs.length} файлов\n`);
  return allLogs;
}

/**
 * Загрузка логов на сервер
 */
async function uploadLogs(
  logs: Array<{
    path: string;
    content: string;
    redactedCount: number;
    patterns: string[];
  }>,
  options: CliOptions,
): Promise<void> {
  const url = `${options.server}/api/projects/${options.projectId}/upload-logs`;

  console.log(`📤 Отправка логов на сервер...\n`);
  console.log(`   URL: ${url}`);
  console.log(`   Файлов: ${logs.length}`);

  const totalSize = logs.reduce((sum, log) => sum + log.content.length, 0);
  console.log(`   Размер: ${(totalSize / 1024 / 1024).toFixed(2)}MB\n`);

  if (totalSize > MAX_TOTAL_SIZE) {
    throw new Error(
      `Общий размер логов (${(totalSize / 1024 / 1024).toFixed(2)}MB) превышает лимит ${MAX_TOTAL_SIZE / 1024 / 1024}MB`,
    );
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${options.token}`,
    },
    body: JSON.stringify({
      logs: logs.map((log) => ({
        path: log.path,
        content: log.content,
      })),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Ошибка загрузки: ${response.status} ${response.statusText}\n${errorText}`,
    );
  }

  const result = await response.json();
  console.log("✅ Логи успешно загружены!\n");

  if (options.verbose && result) {
    console.log("Ответ сервера:", JSON.stringify(result, null, 2));
  }
}

/**
 * Главная функция
 */
async function main() {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║  OpenCode Log Uploader v1.0.0                                 ║
║  Безопасная загрузка логов для анализа AI Engineering Coach  ║
╚═══════════════════════════════════════════════════════════════╝
`);

  const options = parseArgs();

  // Валидация обязательных параметров
  if (!options.projectId) {
    console.error("❌ Ошибка: не указан --project-id\n");
    console.log("Используйте --help для справки");
    process.exit(1);
  }

  if (!options.token) {
    console.error("❌ Ошибка: не указан --token\n");
    console.log("Используйте --help для справки");
    process.exit(1);
  }

  try {
    // 1. Сканирование логов
    const logs = await scanForLogs(options.verbose);

    if (logs.length === 0) {
      console.log("ℹ️  Нет логов для загрузки");
      process.exit(0);
    }

    // 2. Санитизация
    console.log("🔒 Санитизация логов (удаление чувствительных данных)...\n");
    const sanitized = sanitizeLogs(logs);

    // 3. Отчет о санитизации
    const report = generateSanitizationReport(sanitized);
    console.log(report);
    console.log();

    // 4. Dry-run режим
    if (options.dryRun) {
      console.log("🔍 Режим dry-run: логи НЕ будут отправлены\n");
      console.log("Примеры санитизированного содержимого:\n");

      for (let i = 0; i < Math.min(3, sanitized.length); i++) {
        const log = sanitized[i];
        console.log(`Файл: ${log.path}`);
        console.log(`Редактировано: ${log.redactedCount} элементов`);
        console.log(`Размер: ${(log.content.length / 1024).toFixed(2)}KB`);
        console.log(`Превью: ${log.content.substring(0, 200)}...`);
        console.log();
      }

      console.log("✓ Для фактической отправки запустите без --dry-run");
      process.exit(0);
    }

    // 5. Загрузка на сервер
    await uploadLogs(sanitized, options);

    console.log(
      "╔═══════════════════════════════════════════════════════════════╗",
    );
    console.log(
      "║  ✅ Готово! Логи загружены и готовы к анализу               ║",
    );
    console.log(
      "╚═══════════════════════════════════════════════════════════════╝",
    );
  } catch (error) {
    console.error(
      "\n❌ Ошибка:",
      error instanceof Error ? error.message : String(error),
    );
    process.exit(1);
  }
}

main();
