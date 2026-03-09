# Progress

## Current Status

Документация и архитектурный контур инициализированы. Локальный Git настроен и синхронизирован с удаленным репозиторием. UI-каркас приложения собран, а экраны переведены на Appwrite-ready data layer без mock-данных.

## Known Issues

- в рабочем дереве присутствует локальный `.env`, поэтому он должен оставаться вне версии;
- в [src/components/ui/sidebar.tsx](C:\Users\Ravva\projects-tracker\src\components\ui\sidebar.tsx) остается предупреждение Biome про `document.cookie` внутри сгенерированного shadcn-компонента;
- до создания Appwrite-коллекций интерфейс будет работать на пустых состояниях без живых данных.

## Changelog

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

## Контроль изменений

- `last_checked_commit`: `02f183615f2b4a0980049c54804f7831067f4755`
