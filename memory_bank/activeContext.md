# Active Context

## Текущий фокус

UI-фундамент приложения поднят: Next.js, shadcn preset `a1F9UU9Q`, teacher dashboard и app shell работают. Реализованы teacher-only модули `students`, `attendance` и `projects` с server actions, GitHub OAuth и реальными Appwrite-коллекциями.

## Задача в работе

- удерживать teacher-only UI и документацию синхронизированными;
- стабилизировать CRUD-потоки `students`, `attendance` и `projects` на реальных данных;
- следующим этапом перейти к XLSX-импорту, Telegram-уведомлениям и валидации форм под лимиты Appwrite.

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
- реализован teacher-only маршрут `/projects/[projectId]`;
- страницы читают данные через `src/lib/server/repositories/*`;
- `.env.example` задает минимальный набор Appwrite переменных;
- GitHub OAuth реализован через `next-auth`, защита маршрутов вынесена в `src/proxy.ts`;
- `/login` показывает отсутствующие OAuth env-переменные и не ведет в сломанный signin-flow при неполной конфигурации;
- Appwrite schema создается через `bun run db:provision`;
- `projects` и `project_ai_reports` хранят часть состояния в компактных JSON-полях из-за лимитов Appwrite;
- при отсутствии Appwrite-конфигурации страницы показывают пустые состояния вместо локального mock-слоя;
- итоговая степень реализации проекта вычисляется на лету;
- ручной override сбрасывается после следующего AI-анализа;
- будущая привязка student-access должна строиться на `github_user_id`, а не на username.
