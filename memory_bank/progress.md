# Progress

## Current Status

Документация и архитектурный контур инициализированы. Локальный Git настроен и синхронизирован с удаленным репозиторием. Реализованы teacher control room, Appwrite schema provisioning, CRUD для `students` и `projects`, запись посещаемости и project detail actions. Дополнительно активирован первый student-access сценарий: bind GitHub-аккаунта по `github_user_id` после Telegram-подтверждения и student-only выбор проекта на `/my-project`. Teacher-only AI-анализ проектов теперь опирается на данные `memory_bank` и commit history student GitHub repository, а не только на локально заполненные поля проекта.

## Known Issues

- в рабочем дереве присутствует локальный `.env`, поэтому он должен оставаться вне версии;
- в локальной Windows-среде порт `3100` входит в системный excluded TCP range `3068-3167`, поэтому `bun dev` на нем не стартует даже при bind на `127.0.0.1`;
- лимиты Appwrite на размер строковых атрибутов требуют держать `projects` и `project_ai_reports` в компактной JSON-state схеме;
- даже после нормализации `project_state_json` нужно контролировать суммарный размер JSON при дальнейшем расширении AI summary и списков шагов.
- для Telegram linking flow нужно сохранять синхронность `TELEGRAM_WEBHOOK_SECRET` между Vercel env и настройкой webhook у бота; при рассинхроне Telegram будет получать `401` от `/api/telegram/webhook`.
- локальный `.env` не содержит `TELEGRAM_WEBHOOK_SECRET`, поэтому валидный production webhook smoke test с корректным секретом из терминала в этой среде недоступен.
- в production/Appwrite коллекция `projects` сейчас пуста, поэтому teacher-only сценарии `/projects`, GitHub sync и AI-analysis пока можно проверить только на пустом состоянии или после появления хотя бы одного боевого проекта; проблема не в отсутствии Appwrite-коллекций или схемы.
- student-access bind flow теперь зависит от `NEXTAUTH_URL`: без корректного публичного URL Telegram-бот не сможет выдать рабочую GitHub login-ссылку после `Start`.
- production teacher login теперь требует `TEACHER_GITHUB_USER_ID`; если переменная не задана, teacher-доступ считается не настроенным даже при наличии `TEACHER_GITHUB_LOGIN`.
- полный production smoke test student-access сценария еще не пройден; он перенесен на 2026-03-12.
- commit metrics сейчас считаются по выборке последних commit pages GitHub API, поэтому для очень больших репозиториев частота и количество отражают актуальное рабочее окно, а не бесконечную историю всего проекта.
- без `GITHUB_TOKEN` teacher-only AI-analysis и GitHub sync быстро упираются в публичный rate limit GitHub API; временный `403 rate limit exceeded` теперь диагностируется отдельно, но для стабильных прогонов нужен token.

## Changelog

- 2026-03-13: исправлена pre-analysis индикация проектов. До первого AI-анализа teacher-only UI больше не интерпретирует дефолтные `false` в `project_state_json` как реальные `missing_memory_bank` / `missing_spec` / `missing_plan`; вместо этого список проектов, detail page, dashboard и weekly digest показывают статус `данные отсутствуют` до первого repo analysis.
- 2026-03-13: починен student bind flow после Telegram invite. Student GitHub login теперь стартует с landing URL `/login?studentLinkToken=...`, но OAuth callback целенаправленно уходит в `/student/link?token=...`; login page также умеет подхватывать `callbackUrl` от `next-auth`/`middleware` и при уже активной сессии автоматически продолжает bind вместо возврата на экран входа.
- 2026-03-13: AI-анализ проектов переведен с прямого OpenAI Responses API на Cloudflare Worker gateway. Добавлен подпроект `workers/ai-worker` с `GET /health`, `POST /chat`, token-protected доступом и Workers AI `@cf/openai/gpt-oss-120b`; серверный модуль приложения теперь использует `AI_GATEWAY_URL`, `AI_GATEWAY_TOKEN` и `AI_GATEWAY_MODEL`, а документация синхронизирована без изменения `docs/OAuth.md`.
- 2026-03-13: Worker `projects-tracker-ai` задеплоен на `workers.dev`, локальный `.env` привязан к `AI_GATEWAY_URL` и `AI_GATEWAY_TOKEN`, а живой AI-report успешно создан для проекта `-PopFlix88`. Диагностика GitHub API усилена: `403 rate limit exceeded` больше не маскируется под `invalid_github_repo`.
- 2026-03-13: после добавления рабочего `GITHUB_TOKEN` подтвержден authenticated GitHub rate limit `5000`, а teacher-only AI-analysis успешно догнан для `LinguaFlow` и `startlaunch`.
- 2026-03-13: AI-отчеты ужаты под лимит Appwrite `report_payload_json <= 12000`. Вместо полного raw `memory_bank` в историю анализа теперь сохраняется compact preview snapshot, поэтому большие student repos больше не падают на записи отчета.
- 2026-03-13: механизм процента проекта переведен на `## Project Deliverables` в `memory_bank/projectbrief.md`. Старый расчет по `activeContext.md` и `progress.md` удален из server-side analyzer; локальный `projectbrief.md` дополнен взвешенным backlog'ом на `100%` для реалистичной проверки прогресса.
- 2026-03-13: teacher-only страница `/projects` очищена от ручного создания проекта. Источником новых проектов остается student-flow `/my-project`, а detail page `/projects/[projectId]` переделана в обзорный workspace с краткими preview из `memory_bank`, процентом выполнения, текущим контекстом, repo signals и историей AI-отчетов.
- 2026-03-13: на detail page проекта добавлен pending-spinner для server action `Запустить AI-анализ`, а блок `Прогресс и сигналы` получил цветовую индикацию по состоянию прогресса, риска и активности.
- 2026-03-11: зафиксировано завершение ручного production smoke test teacher-only сценариев на Vercel. Подтверждены `/students`, `/attendance`, `/projects`, массовая Telegram-рассылка и teacher weekly digest; следующий шаг перенесен на 2026-03-12 для полного student-access smoke test.
- 2026-03-11: локальный dev server переведен на `127.0.0.1:3300`. Диагностика показала, что в Windows порт `3100` входит в системный excluded TCP range `3068-3167`, поэтому bind на нем запрещен даже вне IPv6. Документация и memory bank синхронизированы.
- 2026-03-13: выполнен минимальный polish страницы входа. На `/login` удалена вторичная ссылка `Архитектура`, а CTA `Войти через GitHub` переведен с самописного `button` на общий `Button` из UI-системы; `Biome` с автоисправлением и повторной проверкой для измененных TSX-файлов проходит успешно.
- 2026-03-12: teacher-only AI-анализ проектов переведен на GitHub `memory_bank` и commit history. Новый server-side parser читает `memory_bank/projectbrief.md`, `productContext.md`, `activeContext.md`, `progress.md` и опциональный `docs/README.md`, считает детерминированный `completion_percent` по уникальным задачам, выставляет rule-based флаги `missing_memory_bank` / `missing_spec` / `missing_plan` / `abandoned`, сохраняет commit metrics в `project_state_json` и `project_ai_reports`, а страница `/projects/[projectId]` показывает repo signals и источники анализа. Обновлены архитектурная документация и memory bank.
- 2026-03-11: ужесточена teacher-auth политика. В production роль `teacher` теперь определяется только по `TEACHER_GITHUB_USER_ID`; `TEACHER_GITHUB_LOGIN` оставлен fallback-механизмом только для non-production сред и локальной разработки. Обновлены `src/lib/server/auth.ts`, архитектурная документация и память проекта.
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

- `last_checked_commit`: `52f081388852482a09d30305c4727a0b34e63221`
