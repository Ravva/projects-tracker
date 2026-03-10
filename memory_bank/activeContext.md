# Active Context

## Текущий фокус

UI-фундамент приложения поднят: Next.js, shadcn preset `a1F9UU9Q`, teacher dashboard и app shell работают. Реализованы teacher-only модули `students`, `attendance` и `projects` с server actions, GitHub OAuth и реальными Appwrite-коллекциями.

## Задача в работе

- удерживать teacher-only UI и документацию синхронизированными;
- стабилизировать CRUD-потоки `students`, `attendance` и `projects` на реальных данных;
- закрыто в текущей сессии: предупреждение Biome в `sidebar.tsx` снято, project-формы ограничены под Appwrite, документация и memory bank синхронизированы;
- устранено локальное предупреждение Codex CLI: корень проекта добавлен в trusted projects глобального `~/.codex/config.toml`;
- в `AGENTS.md` зафиксировано правило: Markdown-файлы не прогоняются через Biome;
- локальный `appwrite_api` MCP server переведен на WSL-совместимый bash launcher с чтением Appwrite-переменных из `.env`;
- следующим этапом после текущей правки остается проверить Telegram-потоки на реальных `chat_id` и при необходимости добавить явные счетчики символов в проектные формы.

## Текущие решения

- источник архитектурной правды: `docs/README.md`;
- в репозитории создан локальный `.git`, ветка по умолчанию - `main`, удаленный `origin` привязан к `https://github.com/Ravva/projects-tracker.git`;
- `.env` должен оставаться вне версии и быть исключен через `.gitignore`;
- UI-направление: `Academic Control Room`;
- базовый стек UI: `Next.js + App Router + shadcn + Tailwind v4`;
- shadcn должен быть инициализирован с preset `a1F9UU9Q`;
- маршрут `/` уже занят teacher dashboard с app shell;
- реализованы маршруты `/students` и `/students/[studentId]`;
- реализованы первые teacher-only маршруты `/attendance` и `/projects`;
- реализованы маршруты `/projects/[projectId]`;
- реализован импорт студентов из XLSX через библиотеку `xlsx` и Server Actions;
- реализована интеграция с Telegram Bot API для отправки уведомлений студентам;
- страницы читают данные через `src/lib/server/repositories/*`;
- `.env.example` задает минимальный набор Appwrite переменных;
- GitHub OAuth реализован через `next-auth`, защита маршрутов перенесена из `src/proxy.ts` в `src/middleware.ts`;
- `/login` использует клиентский компонент `LoginButton` для инициации входа через GitHub;
- Appwrite schema создается через `bun run db:provision`;
- `projects` и `project_ai_reports` хранят часть состояния в компактных JSON-полях из-за лимитов Appwrite;
- при отсутствии Appwrite-конфигурации страницы показывают пустые состояния вместо локального mock-слоя;
- итоговая степень реализации проекта вычисляется на лету;
- ручной override сбрасывается после следующего AI-анализа;
- будущая привязка student-access должна строиться на `github_user_id`, а не на username.
