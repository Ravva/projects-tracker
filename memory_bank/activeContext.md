# Active Context

## Текущий фокус

UI-фундамент приложения поднят: Next.js, shadcn preset `a1F9UU9Q`, базовый teacher dashboard и app shell готовы. Реализованы первые версии модулей `students`, `attendance` и `projects`; следующий фокус - data layer и detail pages.

## Задача в работе

- создать отсутствующий `memory_bank`;
- зафиксировать архитектурные решения в `docs/README.md`;
- привести `docs/PRD.md` в соответствие с утвержденными решениями;
- подготовить основу для последующего технического плана и разработки.
- инициализировать локальный Git и привязать удаленный `origin`.
- создать `.gitignore`, исключить секреты и выполнить первый commit/push.
- перенести архитектурный README из `local` в `docs`;
- развернуть frontend-каркас и начать реализацию UI.
- синхронизировать memory bank и архитектурную документацию с новым frontend-слоем.
- перевести dev server на `localhost:3100`;
- реализовать teacher-only модуль `students`.
- довести `attendance` и `projects` до mock-driven рабочих экранов.

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
- общие mock-данные собраны в `src/lib/mock-data.ts`;
- итоговая степень реализации проекта вычисляется на лету;
- ручной override сбрасывается после следующего AI-анализа;
- будущая привязка student-access должна строиться на `github_user_id`, а не на username.
