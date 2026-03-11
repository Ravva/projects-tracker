# Progress

## Current Status

Документация и архитектурный контур инициализированы. Локальный Git настроен и синхронизирован с удаленным репозиторием. Реализованы teacher control room, Appwrite schema provisioning, CRUD для `students` и `projects`, запись посещаемости и project detail actions. Дополнительно активирован первый student-access сценарий: bind GitHub-аккаунта по `github_user_id` после Telegram-подтверждения и student-only выбор проекта на `/my-project`.

## Known Issues

- в рабочем дереве присутствует локальный `.env`, поэтому он должен оставаться вне версии;
- лимиты Appwrite на размер строковых атрибутов требуют держать `projects` и `project_ai_reports` в компактной JSON-state схеме;
- даже после нормализации `project_state_json` нужно контролировать суммарный размер JSON при дальнейшем расширении AI summary и списков шагов.
- для Telegram linking flow нужно сохранять синхронность `TELEGRAM_WEBHOOK_SECRET` между Vercel env и настройкой webhook у бота; при рассинхроне Telegram будет получать `401` от `/api/telegram/webhook`.
- полный production smoke test teacher-only маршрутов нельзя завершить только терминальными проверками: для прохода `/students`, `/attendance`, `/projects` после логина и реальной Telegram-отправки нужна ручная teacher-сессия в браузере.
- локальный `.env` не содержит `TELEGRAM_WEBHOOK_SECRET`, поэтому валидный production webhook smoke test с корректным секретом из терминала в этой среде недоступен.
- в production/Appwrite коллекция `projects` сейчас пуста, поэтому teacher-only сценарии `/projects`, GitHub sync и AI-analysis пока можно проверить только на пустом состоянии или после появления хотя бы одного боевого проекта; проблема не в отсутствии Appwrite-коллекций или схемы.
- student-access bind flow теперь зависит от `NEXTAUTH_URL`: без корректного публичного URL Telegram-бот не сможет выдать рабочую GitHub login-ссылку после `Start`.

## Changelog

- 2026-03-11: реализован первый student-access сценарий. Добавлены маршруты `/auth/complete`, `/student/link` и `/my-project`; auth расширен до teacher/student/guest модели, student определяется по `students.github_user_id`, а `/my-project` позволяет выбрать собственный GitHub-репозиторий и создать draft-проект.
- 2026-03-11: Telegram linking flow расширен до GitHub bind flow. После `Start` webhook сохраняет `telegram_chat_id`, генерирует одноразовый `github_link_token`, бот отправляет student login-ссылку, а bind route связывает GitHub-аккаунт с карточкой по `github_user_id`.
- 2026-03-11: Appwrite schema обновлена под student bind flow: в `students` добавлены поля `github_link_token` и `github_link_expires_at`, а также индекс `students_by_github_link_token`; `bun run db:provision` успешно применил изменения.
- 2026-03-11: перепроверена Appwrite-схема для проектов. Подтверждено наличие коллекций `projects` и `project_ai_reports`, всех ожидаемых атрибутов и индексов; `bun run db:provision` проходит идемпотентно без дополнительных изменений в Appwrite. Ограничение `/projects` сведено к пустым данным в production, а не к отсутствующей инфраструктуре.
- 2026-03-11: продолжен read-only smoke test интеграций без браузера. Через Appwrite подтверждены `25` студентов, `3` auto-generated урока на неделю `2026-03-08`, отсутствие attendance-отметок на эту неделю и пустая коллекция `projects` в production. Дополнительно проверены внешние сервисы: `Telegram getMe` для `@dsbdr_bot` успешен, `GitHub API rate_limit` доступен без токена в базовом лимите `60/60`.
- 2026-03-11: устранен шум `LF/CRLF` в рабочем дереве Windows. Для локального репозитория выставлен `git config --local core.autocrlf false`, после чего ложные `modified` по кодовым файлам сняты безопасной пересинхронизацией индекса через `git add`/`git reset` без содержательных изменений. `git status` снова показывает только реальные правки, `bun run lint` остается зеленым.
- 2026-03-11: репозиторий приведен к чистому `biome check` без проверки Markdown-файлов. Выполнено автоисправление `bunx biome check --write` по не-Markdown файлам, после чего успешно проходят `bun run lint` и `bun run build`. В `git status` по многим кодовым файлам остается шум из-за `LF/CRLF` в рабочем дереве Windows, но содержательных diff по коду `git diff` не показывает.
- 2026-03-11: начат production smoke test на Vercel. Автоматически подтверждены успешный `bun run build`, редирект `https://projects-tracker-one.vercel.app/` на `/login`, доступность `https://projects-tracker-one.vercel.app/login` с `200 OK` и защита `POST /api/telegram/webhook` ответом `401` без секрета. Полный teacher-only проход после логина и реальные Telegram-рассылки остались на ручную браузерную проверку.
- 2026-03-10: `attendance` возвращен к batch-режиму: клики по ячейкам снова меняют только client-side draft, кнопка `Сохранить изменения` записывает неделю одним запросом, после чего страница обновляется и weekly status пересчитывается на свежих данных.
- 2026-03-10: production rollout завершен: приложение развернуто на `https://projects-tracker-one.vercel.app`, GitHub OAuth на Vercel стабилизирован через корректный `NEXTAUTH_URL`, Telegram webhook привязан к production route с `TELEGRAM_WEBHOOK_SECRET`, а живая привязка ученика через invite-ссылку подтверждена.
- 2026-03-10: подготовка deployment-контура переведена с Cloudflare на Vercel; временные OpenNext/Wrangler-правки удалены, добавлен `bun run deploy` через `vercel deploy --prod`.
- 2026-03-10: реализован teacher-only Telegram linking flow: Appwrite хранит `telegram_link_token` и `telegram_linked_at`, student detail page умеет выпускать deep-link `t.me/<bot>?start=<token>`, а новый route `/api/telegram/webhook` автоматически сохраняет `telegram_chat_id` после `/start`.
- 2026-03-10: teacher-only таблица `/students` получила отдельную колонку `№`, а `telegram_username` и `telegram_chat_id` вынесены в разные столбцы для более читаемого teacher view.
- 2026-03-10: проведена живая Telegram-проверка на реальных `chat_id` — массовая student-рассылка успешно доставлена двум получателям, а weekly digest успешно отправлен на реальный `TEACHER_TELEGRAM_CHAT_ID`.
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

- `last_checked_commit`: `ed86dd89af9515e723a8203e7e22583781c4f5ab`
