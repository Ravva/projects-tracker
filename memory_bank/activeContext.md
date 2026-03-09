# Active Context

## Текущий фокус

UI-фундамент приложения поднят: Next.js, shadcn preset `a1F9UU9Q`, базовый teacher dashboard и app shell готовы. Реализованы первые версии модулей `students`, `attendance` и `projects`, включая project detail page. Добавлен Appwrite-ready data layer без локальных mock-данных.

## Задача в работе

- удерживать teacher-only UI и документацию синхронизированными;
- подключить реальные Appwrite-коллекции вместо пустых состояний;
- перейти от read-only репозиториев к CRUD и server actions для `students`, `attendance` и `projects`.

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
- при отсутствии Appwrite-конфигурации страницы показывают пустые состояния вместо локального mock-слоя;
- итоговая степень реализации проекта вычисляется на лету;
- ручной override сбрасывается после следующего AI-анализа;
- будущая привязка student-access должна строиться на `github_user_id`, а не на username.
