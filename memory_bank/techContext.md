# Tech Context

## Текущее состояние репозитория

- в репозитории есть документация, UI-каркас на `Next.js` и server-side data layer;
- локальный Git-репозиторий инициализирован;
- удаленный `origin` привязан к `https://github.com/Ravva/projects-tracker.git`;
- ветка `main` опубликована в удаленный репозиторий;
- пакетный менеджер по правилам проекта: `bun`;
- линтинг и автоисправление должны выполняться через `biome`.

## Целевой стек

- frontend: `Next.js 16`, `React 19`, `Tailwind CSS v4`;
- библиотеки: `xlsx` (импорт данных);
- UI kit: `shadcn/ui` preset `a1F9UU9Q`, `radix-ui`, `hugeicons`;
- package manager: `bun`;
- code quality: `Biome`;
- local dev URL: `http://localhost:3100`;
- backend SDK: `node-appwrite`;
- frontend/backend платформа: Appwrite;
- аутентификация: GitHub OAuth через `next-auth`;
- интеграция репозиториев: GitHub API;
- AI-анализ: OpenAI API;
- уведомления: Telegram Bot API;
- Telegram linking flow: deep-link `t.me/<bot>?start=<token>` + webhook `/api/telegram/webhook`;
- документация продукта: Markdown в репозитории.

## Ограничения

- не запускать и не останавливать dev-сервер;
- не использовать Telegram username как ключ доставки;
- для автоматической привязки Telegram нужен публичный webhook URL и секрет `TELEGRAM_WEBHOOK_SECRET`;
- не проектировать student-access как активную возможность MVP;
- изменения архитектуры должны отражаться в `docs/README.md`.
- Appwrite имеет жесткие лимиты на суммарный размер строковых атрибутов, поэтому проектные состояния упакованы в JSON;
- project-формы должны уважать размеры Appwrite-атрибутов: `name` `255`, `summary` `2000`, `github_url` `1000`, `spec_markdown` `4000`, `plan_markdown` `4000`;
- содержимое `project_state_json` должно оставаться компактным: `manualOverrideNote` `400`, `aiSummary` `600`, `nextSteps` максимум `5 x 120`;
- для календарных дат нельзя использовать `Date.toISOString().slice(0, 10)` в локали `Europe/Moscow`, иначе дата сдвигается на предыдущий день;
- до выдачи реальных Appwrite env-переменных приложение должно оставаться работоспособным на empty states.
