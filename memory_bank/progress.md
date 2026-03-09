# Progress

## Current Status

Документация и архитектурный контур инициализированы. Локальный Git настроен и синхронизирован с удаленным репозиторием. Реализованы teacher-only GitHub OAuth, Appwrite schema provisioning, CRUD для `students` и `projects`, запись посещаемости и project detail actions.

## Known Issues

- в рабочем дереве присутствует локальный `.env`, поэтому он должен оставаться вне версии;
- в [src/components/ui/sidebar.tsx](C:\Users\Ravva\projects-tracker\src\components\ui\sidebar.tsx) остается предупреждение Biome про `document.cookie` внутри сгенерированного shadcn-компонента;
- лимиты Appwrite на размер строковых атрибутов требуют держать `projects` и `project_ai_reports` в компактной JSON-state схеме;
- формы пока не ограничивают длину `spec_markdown` и `plan_markdown` под фактический размер атрибутов Appwrite.

## Changelog

- 2026-03-09: рефакторинг авторизации: `src/proxy.ts` удален, добавлен стандартный `src/middleware.ts`. В `/login` добавлена кнопка `LoginButton` на базе `next-auth/react`.
- 2026-03-09: починен локальный `appwrite_api` MCP server: `.codex/config.toml` переведен с отсутствующего PowerShell launcher на WSL-совместимый `scripts/run-appwrite-mcp.sh`, который читает Appwrite env-переменные из локального `.env`.
- 2026-03-09: в `AGENTS.md` добавлено правило не проверять Markdown-файлы (`*.md`) через Biome.
- 2026-03-09: корень проекта `/mnt/c/Users/Ravva/projects-tracker` добавлен в trusted projects глобального `~/.codex/config.toml`, чтобы Codex начал применять локальный `.codex/config.toml`.
- 2026-03-09: создан базовый `memory_bank`;
- 2026-03-09: добавлен `docs/README.md` как источник архитектурной правды;
- 2026-03-09: завершена синхронизация `docs/PRD.md` с подтвержденными правилами MVP.
- 2026-03-09: инициализирован локальный Git, создана ветка `main`, привязан удаленный `origin`.
- 2026-03-09: добавлен `.gitignore` для исключения секретов и локальных артефактов перед первым коммитом.
- 2026-03-09: архитектурный README перенесен из `local/README.md` в `docs/README.md`, ссылки в документации синхронизированы.
- 2026-03-09: начата реализация UI-фундамента на `Next.js + shadcn`, выбран визуальный вектор `Academic Control Room`.
- 2026-03-09: развернут `Next.js 16` frontend-каркас на `bun`, инициализирован `shadcn` preset `a1F9UU9Q`.
- 2026-03-09: реализован teacher dashboard на маршруте `/`, добавлены app shell, sidebar и базовые metric/data panels.
- 2026-03-09: dev server перенастроен на `localhost:3100`.
- 2026-03-09: реализован teacher-only модуль `students` с маршрутами списка и редактирования.
- 2026-03-09: реализованы первые mock-driven версии `/attendance` и `/projects`.
- 2026-03-09: реализован teacher-only project detail route `/projects/[projectId]`.
- 2026-03-09: добавлен Appwrite-ready data layer, server repositories и `.env.example`.
- 2026-03-09: удален `src/lib/mock-data.ts`, UI переведен на server-side repositories и пустые состояния без mock fallback.
- 2026-03-09: реализованы `next-auth` GitHub OAuth, teacher-only guard и страница `/login`.
- 2026-03-09: добавлены server actions и CRUD-потоки для `students`, `attendance` и `projects`.
- 2026-03-09: создан идемпотентный скрипт `bun run db:provision`, подняты Appwrite-коллекции и индексы.
- 2026-03-09: схема `projects` и `project_ai_reports` переведена на компактные JSON-state поля из-за лимитов Appwrite.
- 2026-03-09: `/login` дополнен явной диагностикой отсутствующих OAuth env-переменных.

## Контроль изменений

- `last_checked_commit`: `eadfbc1c012d7082a8c4c32cbe743ce7371120d2`
