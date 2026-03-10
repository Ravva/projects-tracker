# Progress

## Current Status

Документация и архитектурный контур инициализированы. Локальный Git настроен и синхронизирован с удаленным репозиторием. Реализованы teacher-only GitHub OAuth, Appwrite schema provisioning, CRUD для `students` и `projects`, запись посещаемости и project detail actions.

## Known Issues

- в рабочем дереве присутствует локальный `.env`, поэтому он должен оставаться вне версии;
- лимиты Appwrite на размер строковых атрибутов требуют держать `projects` и `project_ai_reports` в компактной JSON-state схеме;
- даже после нормализации `project_state_json` нужно контролировать суммарный размер JSON при дальнейшем расширении AI summary и списков шагов.

## Changelog

- 2026-03-10: teacher dashboard получил teacher-only кнопку ручной отправки weekly digest; добавлены `src/lib/server/teacher-weekly-digest.ts`, server action `src/app/dashboard-actions.ts` и env `TEACHER_TELEGRAM_CHAT_ID`, а итог отправки показывается через `FeedbackModal`.
- 2026-03-10: teacher-only страница `students` получила массовую Telegram-рассылку: добавлен client-side блок выбора учеников, а server action возвращает сводку по `sent`, пропускам без `chat_id`, некорректным ID и ошибкам доставки.
- 2026-03-10: teacher-only уведомления и ошибки переведены с браузерных `alert()` на общий `FeedbackModal`; Telegram-отправка и импорт XLSX теперь показывают стилизованные модальные окна с `success/error` состояниями.
- 2026-03-10: исправлено падение `NotificationCard` после успешной отправки Telegram-сообщения: сброс формы больше не использует `event.currentTarget` внутри асинхронного `startTransition`.
- 2026-03-10: Telegram-поток усилен под реальные `chat_id`: `src/lib/server/telegram.ts` валидирует формат ID и длину сообщения, отключен `parse_mode`, а teacher-only карточка отправки показывает лимит 4096 символов и более точные ошибки.
- 2026-03-10: project-формы и поле `manualOverrideNote` получили явные счетчики символов через `src/components/ui/field-with-counter.tsx`, чтобы лимиты Appwrite были видны до сохранения.
- 2026-03-10: `/attendance` переведен на прямое сохранение по клику: каждая ячейка отправляет одиночный server action, поэтому отметки сразу записываются в Appwrite без общей кнопки сохранения недели.
- 2026-03-10: исправлен порядок расчета `/attendance`: lessons выбранной недели теперь гарантированно создаются/синхронизируются до пересчета student summaries, поэтому `Статус недели` не залипает в `риск` на первом открытии недели.
- 2026-03-10: исправлен расчет weekly status на `/attendance`: summaries учеников теперь считаются по выбранной `weekStart`, поэтому бейдж `Статус недели` совпадает с видимой неделей и отметками в таблице.
- 2026-03-10: `/attendance` получил навигацию по неделям: страница читает `weekStart` из query-параметра, показывает диапазон выбранной недели и позволяет переходить на предыдущую/следующую неделю.
- 2026-03-10: страница `/attendance` упрощена до weekly-таблицы: календарный блок и список нарушителей убраны, а ячейки attendance grid переключают статус одним кликом по циклу `- -> Был -> Не был`.
- 2026-03-10: таблица `/attendance` зафиксирована по трем weekday-колонкам `Вторник/Четверг/Пятница`, чтобы дубли lesson-записей за неделю не раздували число столбцов.
- 2026-03-10: исправлен UTC-сдвиг дат в attendance: `lesson_date` теперь формируется в локальной дате, auto-generated уроки текущей недели синхронизируются с шаблоном `Вт/Чт/Пт`, а dashboard выбирает реально ближайшее занятие.
- 2026-03-10: добавлена server-side нормализация `project_state_json`: ограничены `manualOverrideNote`, `aiSummary` и `nextSteps`, а форма override приведена к тем же лимитам.
- 2026-03-10: устранено предупреждение Biome в `src/components/ui/sidebar.tsx`: состояние sidebar теперь пишется через `Cookie Store API` без прямого `document.cookie`.
- 2026-03-10: project-формы синхронизированы с Appwrite-лимитами, добавлены `maxLength` в UI и server-side нормализация payload через `src/lib/project-limits.ts`.
- 2026-03-10: документация и memory bank синхронизированы с маршрутом `src/middleware.ts`, Telegram-интеграцией и ограничениями полей проектов.
- 2026-03-09: реализована интеграция с Telegram: создан серверный сервис, Server Action и UI-карточка для отправки уведомлений из профиля студента.
- 2026-03-09: реализован импорт студентов из XLSX: добавлен клиентский компонент `ImportStudentsButton` и Server Action для парсинга файлов.
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

- `last_checked_commit`: `fc6a2259fddaf3598fce746776f37bc079bfaddb`
