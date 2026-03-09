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
- UI kit: `shadcn/ui` preset `a1F9UU9Q`, `radix-ui`, `hugeicons`;
- package manager: `bun`;
- code quality: `Biome`;
- local dev URL: `http://localhost:3100`;
- backend SDK: `node-appwrite`;
- frontend/backend платформа: Appwrite;
- аутентификация: GitHub OAuth;
- интеграция репозиториев: GitHub API;
- AI-анализ: OpenAI API;
- уведомления: Telegram Bot API;
- документация продукта: Markdown в репозитории.

## Ограничения

- не запускать и не останавливать dev-сервер;
- не использовать Telegram username как ключ доставки;
- не проектировать student-access как активную возможность MVP;
- изменения архитектуры должны отражаться в `docs/README.md`.
- до выдачи реальных Appwrite env-переменных приложение должно оставаться работоспособным на empty states.
