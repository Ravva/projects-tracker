# Tech Context

## Текущее состояние репозитория

- в репозитории сейчас присутствует только документация;
- исходный код приложения отсутствует;
- локальный Git-репозиторий инициализирован;
- удаленный `origin` привязан к `https://github.com/Ravva/projects-tracker.git`;
- удаленный репозиторий на момент проверки пустой, без heads;
- пакетный менеджер по правилам проекта: `bun`;
- линтинг и автоисправление должны выполняться через `biome`.

## Целевой стек

- frontend: `Next.js 16`, `React 19`, `Tailwind CSS v4`;
- UI kit: `shadcn/ui` preset `a1F9UU9Q`, `radix-ui`, `hugeicons`;
- package manager: `bun`;
- code quality: `Biome`;
- local dev URL: `http://localhost:3100`;
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
