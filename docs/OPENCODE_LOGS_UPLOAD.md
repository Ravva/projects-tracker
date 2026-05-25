# Безопасная загрузка логов OpenCode для анализа

## Обзор

Система безопасной загрузки логов OpenCode позволяет студентам отправлять логи своих сессий работы с AI-ассистентом для анализа AI Engineering Coach без риска утечки чувствительных данных.

## Архитектура

### Компоненты

1. **Клиентская санитизация** (`src/lib/log-sanitizer.ts`)
   - Удаление API ключей, токенов, паролей
   - Редактирование персональных данных (email, телефоны)
   - Маскирование путей файловой системы

2. **CLI-утилита** (`scripts/upload-logs.ts`)
   - Сканирование локальных директорий `.ai-coach/logs/` и `.opencode-logs/`
   - Санитизация логов перед отправкой
   - Загрузка на сервер через защищенный API

3. **API endpoint** (`src/app/api/projects/[projectId]/upload-logs/route.ts`)
   - Аутентификация студента
   - Валидация размера и формата
   - Дополнительная санитизация на сервере
   - Сохранение во временное хранилище

4. **Временное хранилище** (`src/lib/server/logs-storage.ts`)
   - In-memory хранилище с TTL (1 час)
   - В production рекомендуется Redis или Appwrite Storage

5. **Анализатор** (`src/lib/server/opencode-coach-analyzer.ts`)
   - Парсинг сессий из загруженных логов
   - Запуск детекторов антипаттернов
   - Генерация отчета и оценки (0-100)

6. **Интеграция** (`src/lib/server/opencode-coach-integration.ts`)
   - Интеграция с существующей функцией `runProjectAiAnalysis`
   - Автоматическое использование загруженных логов если они есть

## Использование

### Для студентов

1. Установить зависимости проекта:
```bash
bun install
```

2. Загрузить логи для проекта:
```bash
bun scripts/upload-logs.ts --project-id <PROJECT_ID> --token <AUTH_TOKEN>
```

3. Проверить что будет отправлено (dry-run):
```bash
bun scripts/upload-logs.ts --project-id <PROJECT_ID> --token <AUTH_TOKEN> --dry-run
```

### Параметры CLI

- `--project-id <id>` - ID проекта в системе (обязательно)
- `--token <token>` - Токен аутентификации студента (обязательно)
- `--server <url>` - URL сервера (по умолчанию: production)
- `--dry-run` - Показать что будет отправлено без фактической отправки
- `--verbose` - Подробный вывод
- `--help` - Справка

### Получение токена аутентификации

Токен можно получить из cookies после входа в систему:
1. Войти в систему через GitHub
2. Открыть DevTools → Application → Cookies
3. Скопировать значение cookie с именем сессии

## Безопасность

### Санитизируемые данные

Автоматически удаляются:
- API ключи (GitHub, OpenAI, Anthropic, AWS, Stripe, Slack)
- Токены (Bearer, JWT, OAuth)
- Пароли и секреты
- Приватные ключи
- Строки подключения к БД
- Email адреса
- Номера телефонов
- IP адреса
- Пути файловой системы с именами пользователей

### Двухуровневая защита

1. **Клиентская санитизация** - логи очищаются на машине студента перед отправкой
2. **Серверная санитизация** - дополнительная проверка на сервере для защиты от обхода

### Ограничения

- Максимум 150 файлов логов
- Максимум 10MB на файл
- Максимум 50MB общий размер
- TTL загруженных логов: 1 час

## API

### POST /api/projects/[projectId]/upload-logs

Загрузка санитизированных логов для проекта.

**Аутентификация:** Bearer token (студент должен быть участником проекта)

**Request Body:**
```json
{
  "logs": [
    {
      "path": ".opencode-logs/session-2026-05-25.json",
      "content": "{ ... sanitized log content ... }"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Логи успешно загружены и готовы к анализу",
  "metadata": {
    "filesCount": 10,
    "totalSize": 1048576,
    "redactedCount": 5,
    "uploadedAt": "2026-05-25T07:00:00.000Z",
    "storageKey": "project123:student456"
  }
}
```

## Интеграция с анализом проекта

Анализ OpenCode Coach автоматически запускается при вызове `runProjectAiAnalysis()`:

1. Проверяется наличие загруженных логов для проекта
2. Если логи есть - анализируются и результаты добавляются в отчет
3. Если логов нет - анализ пропускается (обратная совместимость)

Результаты сохраняются в `report_payload_json`:
- `opencodeCoachScore` - оценка от 0 до 100
- `opencodeCoachReport` - подробный Markdown-отчет

## Миграция с GitHub API

### Старый подход (небезопасный)
```typescript
// Прямое чтение из GitHub
const tree = await getGithubRepositoryTree(owner, repo, branch);
const logFiles = tree.filter(entry => entry.path.includes('.opencode-logs/'));
const logs = await Promise.all(logFiles.map(entry => 
  getGithubRepositoryFileText(owner, repo, entry.path, branch)
));
```

### Новый подход (безопасный)
```typescript
// Использование загруженных логов
const analysis = await getOpenCodeCoachAnalysis(projectId);
// Логи уже санитизированы и загружены студентом
```

## Production рекомендации

### Замена in-memory хранилища

Для production окружения рекомендуется заменить in-memory хранилище на:

**Вариант 1: Redis**
```typescript
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.REDIS_URL,
  token: process.env.REDIS_TOKEN,
});

export async function storeUploadedLogs(projectId, studentId, logs) {
  const key = `logs:${projectId}:${studentId}`;
  await redis.setex(key, 3600, JSON.stringify(logs));
  return key;
}
```

**Вариант 2: Appwrite Storage**
```typescript
import { Storage } from 'node-appwrite';

export async function storeUploadedLogs(projectId, studentId, logs) {
  const storage = new Storage(client);
  const file = await storage.createFile(
    'logs-bucket',
    ID.unique(),
    Buffer.from(JSON.stringify(logs)),
  );
  return file.$id;
}
```

## Troubleshooting

### Логи не загружаются

1. Проверить наличие логов в `.ai-coach/logs/` или `.opencode-logs/`
2. Убедиться что файлы имеют расширение `.json`
3. Проверить размер файлов (не более 10MB каждый)

### Ошибка аутентификации

1. Проверить валидность токена
2. Убедиться что студент является участником проекта
3. Проверить срок действия сессии

### Превышен лимит размера

1. Удалить старые логи
2. Использовать только последние сессии
3. Разбить загрузку на несколько частей (если необходимо)

## Дальнейшее развитие

- [ ] Поддержка инкрементальной загрузки (только новые логи)
- [ ] Сжатие логов перед отправкой
- [ ] Веб-интерфейс для загрузки логов
- [ ] Автоматическая загрузка через GitHub Actions
- [ ] Поддержка других форматов логов (VS Code, Cursor)
