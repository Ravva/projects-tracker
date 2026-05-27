# Миграция Appwrite Database

## Обзор

Проект перенесен с Appwrite Cloud на self-hosted Appwrite.
Рабочая база приложения теперь находится на self-hosted endpoint:

```env
APPWRITE_ENDPOINT=https://aw.note-canopus.ts.net/v1
APPWRITE_PROJECT_ID=6a16b1a80039cd5cbb93
APPWRITE_RESPONSE_FORMAT=1.9.0
APPWRITE_DATABASE_ID=projects-tracker
```

Appwrite Cloud остается только источником для повторной сверки или повторной
миграции.

## Версии Appwrite

- Appwrite Cloud: `1.9.4`
- Self-hosted Appwrite: `1.9.0`
- `node-appwrite`: `24.1.0`

Так как один SDK в проекте обращается к двум patch-версиям Appwrite, скрипты
явно задают `X-Appwrite-Response-Format` отдельно для каждого endpoint:

- `CLOUD_APPWRITE_RESPONSE_FORMAT=1.9.4`
- `LOCAL_APPWRITE_RESPONSE_FORMAT=1.9.0`
- `APPWRITE_RESPONSE_FORMAT=1.9.0` для runtime-приложения

Это сохраняет текущий SDK и убирает предупреждение на основном self-hosted
контуре. Если self-hosted сервер будет обновлен до `1.9.4`, достаточно поменять
`APPWRITE_RESPONSE_FORMAT` и `LOCAL_APPWRITE_RESPONSE_FORMAT` на `1.9.4`.

## Переменные окружения

Минимальный набор для работы приложения:

```env
APPWRITE_ENDPOINT=https://aw.note-canopus.ts.net/v1
APPWRITE_PROJECT_ID=6a16b1a80039cd5cbb93
APPWRITE_API_KEY=your_local_api_key_here
APPWRITE_RESPONSE_FORMAT=1.9.0
APPWRITE_DATABASE_ID=projects-tracker
```

Набор для повторной миграции или сверки Cloud -> self-hosted:

```env
CLOUD_APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
CLOUD_APPWRITE_PROJECT_ID=69adc75f001d64b67051
CLOUD_APPWRITE_API_KEY=your_cloud_api_key_here
CLOUD_APPWRITE_RESPONSE_FORMAT=1.9.4

LOCAL_APPWRITE_ENDPOINT=https://aw.note-canopus.ts.net/v1
LOCAL_APPWRITE_PROJECT_ID=6a16b1a80039cd5cbb93
LOCAL_APPWRITE_API_KEY=your_local_api_key_here
LOCAL_APPWRITE_RESPONSE_FORMAT=1.9.0
APPWRITE_MIGRATION_EXPECTED_TOTAL=1169
```

## Подготовка схемы

Перед миграцией или сверкой схема должна быть поднята идемпотентно:

```bash
bun run db:provision
```

Скрипт поддерживает базу `projects-tracker` и коллекции:

- `students`
- `lessons`
- `attendance`
- `projects`
- `project_memberships`
- `project_selection_locks`
- `project_ai_reports`

## Команды

Повторная миграция данных из Cloud в self-hosted:

```bash
bun run appwrite:migrate
```

Проверка количества документов в self-hosted базе:

```bash
bun run appwrite:check
```

Сравнение количества документов между Cloud и self-hosted:

```bash
bun run appwrite:compare
```

Очистка self-hosted коллекций перед повторной миграцией:

```bash
bun run appwrite:clear-local
```

## Контроль качества

Скрипты миграции теперь работают fail-fast:

- ошибка чтения коллекции завершает проверку с exit code `1`;
- расхождение Cloud/self-hosted завершает сравнение с exit code `1`;
- ошибки импорта документов агрегируются и завершают миграцию с exit code `1`;
- при заданном `APPWRITE_MIGRATION_EXPECTED_TOTAL` self-hosted check проверяет
  общий итог документов.

Ожидаемый результат текущей миграции:

| Collection | Documents |
| --- | ---: |
| `students` | 25 |
| `lessons` | 54 |
| `attendance` | 801 |
| `projects` | 31 |
| `project_memberships` | 11 |
| `project_selection_locks` | 0 |
| `project_ai_reports` | 247 |
| **Total** | **1169** |

## Откат

Если повторная миграция прошла неудачно:

1. Очистить self-hosted коллекции командой `bun run appwrite:clear-local`.
2. Повторно применить схему командой `bun run db:provision`.
3. Запустить `bun run appwrite:migrate`.
4. Подтвердить результат через `bun run appwrite:compare`.

## Ограничения

- Storage-файлы, пользователи, сессии и настройки проекта не мигрируются.
- Скрипты мигрируют только документы перечисленных коллекций.
- Повторный импорт без предварительной очистки может получить ошибки
  `Document already exists`, потому что сохраняются исходные `$id`.
