# Active Context

## Текущий фокус

UI-фундамент приложения поднят: Next.js, shadcn preset `a1F9UU9Q`, teacher dashboard и app shell работают. Реализованы teacher-only модули `students`, `attendance` и `projects` с server actions, GitHub OAuth и реальными Appwrite-коллекциями.

## Задача в работе

- в работе: расширение project model под несколько проектов на одного ученика; нужно сохранить историю завершенных проектов, показать их состояния в teacher/student UI и не сломать текущий AI-analysis/review flow;
- закрыто в текущей сессии: локальный dev startup на Windows стабилизирован переводом dev server на `127.0.0.1:3300`; `localhost` уводил bind в `::1`, а порт `3100` оказался запрещен системным excluded range;
- удерживать teacher-only UI и документацию синхронизированными;
- стабилизировать CRUD-потоки `students`, `attendance` и `projects` на реальных данных;
- в работе: откат `attendance` с мгновенной server-side записи на client-side draft с общей кнопкой сохранения, чтобы убрать задержку при проставлении посещаемости;
- закрыто в текущей сессии: расчет `completion_percent` переведен с эвристики по `activeContext/progress` на канонический `## Project Deliverables` в `memory_bank/projectbrief.md`; локальный `projectbrief.md` получил взвешенный список deliverables на `100%`, а AI-анализ больше не должен завышать готовность из-за session log;
- закрыто в текущей сессии: AI-анализ student-проектов переведен на чтение `memory_bank` из GitHub-репозитория, progress считается по задачам из `progress.md` и `activeContext.md`, commit metrics сохраняются в `project_state_json`/`project_ai_reports`, а teacher-only страница проекта показывает repo signals и флаг `abandoned` при отсутствии коммитов больше недели;
- закрыто в текущей сессии: `/projects` очищен от teacher-only формы ручного создания проекта; новые проекты должны приходить только из student-flow `/my-project` после GitHub bind и выбора репозитория;
- закрыто в текущей сессии: teacher-only detail page `/projects/[projectId]` переориентирована на обзор проекта: краткие выборки `projectBrief/productContext`, процент выполнения, текущий контекст из `memory_bank`, repo signals, next steps и история AI-отчетов;
- закрыто в текущей сессии: CTA `Запустить AI-анализ` на teacher-only detail page получил pending-spinner для server action, а блок `Прогресс и сигналы` теперь имеет цветовую индикацию по тону прогресса, риска и активности;
- закрыто в текущей сессии: предыдущая прямая OpenAI-интеграция для AI-анализа заменена на server-only вызов Cloudflare Worker gateway; teacher-only приложение теперь использует `AI_GATEWAY_URL`, `AI_GATEWAY_TOKEN` и модель Workers AI `@cf/openai/gpt-oss-120b`, без пользовательских OAuth-токенов и неофициальных ChatGPT-потоков;
- закрыто в текущей сессии: до первого AI-анализа teacher-only проекты больше не получают ложный badge `missing_memory_bank`; список проектов, detail page, dashboard и weekly digest показывают нейтральное состояние `данные отсутствуют` до первого repo analysis;
- закрыто в текущей сессии: teacher-only AI-анализ проектов переведен с прямого OpenAI API на отдельный Cloudflare Worker c Workers AI `@cf/openai/gpt-oss-120b`; добавлен token-protected gateway между Vercel-приложением и моделью, а для деплоя Worker подготовлен подпроект `workers/ai-worker`;
- закрыто в текущей сессии: Worker `projects-tracker-ai` задеплоен на Cloudflare `workers.dev`, локальный `.env` привязан к gateway, и первый живой AI-report успешно записан в `project_ai_reports` для `-PopFlix88`;
- закрыто в текущей сессии: teacher-only GitHub diagnostics уточнены — временный `403 rate limit exceeded` теперь возвращается как отдельная ошибка про `GITHUB_TOKEN`, а не записывается в риск `invalid_github_repo`;
- закрыто в текущей сессии: в локальный `.env` добавлен рабочий `GITHUB_TOKEN`, после чего teacher-only GitHub API перешел на лимит `5000` запросов и live AI-analysis удалось повторно прогнать без упора в публичный лимит;
- закрыто в текущей сессии: Appwrite-лимит `project_ai_reports.report_payload_json` расширен до `50000`, а `bun run db:provision` теперь умеет обновлять существующий string-атрибут по размеру; это убирает production 500 при записи полного сжатого AI snapshot;
- закрыто в текущей сессии: teacher-only project detail page теперь показывает полный `Project brief`, `Product context`, `Active context` и `Progress notes` из последнего AI-report; snapshot `memory_bank` сохраняется полностью в сжатом виде внутри `report_payload_json.inputSnapshotJson`, а секция `Прогресс и сигналы` перенесена в начало страницы;
- закрыто в текущей сессии: teacher-only project detail page переведен с блока `Project brief` на полный `docs/README.md`, а все крупные текстовые карточки обзора проекта теперь поддерживают markdown-разметку;
- закрыто в текущей сессии: production 500 после запуска AI-анализа устранен — markdown renderer падал на inline/fenced `code`, потому что проверял несуществующую переменную `className` вместо `codeClassName`; server-side render detail page снова стабилен;
- закрыто в текущей сессии: логотип проекта и favicon переведены на единый SVG-знак на базе иконки пункта меню `Контроль недели`; sidebar branding и browser icon теперь используют один и тот же asset;
- закрыто в текущей сессии: teacher-only project detail page отполирован — в карточке `Активность` последний коммит теперь показывается в часах, если прошло меньше суток, а правая колонка (`AI summary`, `Следующие шаги`, `История AI-отчетов`) больше не растягивается по высоте и идет компактным стеком;
- закрыто в текущей сессии: общая button-система обновлена через `src/components/ui/button.tsx` — кнопки стали крупнее, получили более выразительную форму, тени и единый hover/active-эффект без точечных правок по страницам;
- закрыто в текущей сессии: живой AI-analysis успешно записан для всех трех подключенных student projects; итоговые состояния после прогона: `LinguaFlow` — `healthy`, `-PopFlix88` — `healthy`, `startlaunch` — `missing_memory_bank`;
- закрыто в текущей сессии: production deployment на Vercel завершен, рабочий URL приложения — `https://projects-tracker-one.vercel.app`;
- закрыто в текущей сессии: GitHub OAuth на Vercel стабилизирован, критичным env оказался корректный `NEXTAUTH_URL`;
- закрыто в текущей сессии: Telegram webhook привязан к production route `/api/telegram/webhook` с `TELEGRAM_WEBHOOK_SECRET`;
- закрыто в текущей сессии: первая живая привязка ученика через invite-ссылку подтверждена в production, `telegram_chat_id` сохраняется автоматически после `/start`;
- закрыто в текущей сессии: `attendance` возвращен к client-side draft-режиму с кнопкой «Сохранить изменения», а запись в Appwrite и итоговый weekly refresh происходят одним batch-сохранением;
- закрыто в текущей сессии: teacher-only страница `/students` получила массовую Telegram-рассылку по выбранным ученикам с чекбоксами, выбором всех карточек и итоговой сводкой по отправке;
- закрыто в текущей сессии: teacher dashboard получил teacher-only кнопку ручной отправки weekly digest в Telegram преподавателя, а сервер собирает сводку по текущей неделе, attendance и рисковым проектам через `TEACHER_TELEGRAM_CHAT_ID`;
- закрыто в текущей сессии: проведена живая Telegram-проверка на реальных `chat_id` — массовая student-рассылка успешно доставлена двум получателям, а weekly digest успешно ушёл на реальный `TEACHER_TELEGRAM_CHAT_ID`;
- закрыто в текущей сессии: teacher-only таблица `/students` получила отдельную колонку с порядковым номером, а `telegram_username` и `telegram_chat_id` разнесены по разным столбцам для быстрого просмотра;
- закрыто в текущей сессии: teacher-only карточка ученика получила Telegram link flow с персональной `start`-ссылкой, а публичный webhook `/api/telegram/webhook` теперь умеет автоматически сохранять `chat_id` после нажатия `Start`;
- закрыто в текущей сессии: teacher-only уведомления и ошибки переведены с браузерных `alert()` на общий feedback modal, согласованный со светлой и тёмной темой;
- закрыто в текущей сессии: `NotificationCard` больше не падает после успешной Telegram-отправки, так как сброс формы переведён на React state без обращения к освобождённому synthetic event;
- закрыто в текущей сессии: Telegram-поток усилен под реальные `chat_id` — сервер валидирует формат ID и длину сообщения, а teacher-only UI подсказывает `/start`, формат `chat_id` и показывает лимит сообщения;
- закрыто в текущей сессии: project-формы и поле `manualOverrideNote` получили явные счетчики символов, чтобы лимиты Appwrite были видны до отправки формы;
- закрыто в текущей сессии: `/attendance` переведен на прямое сохранение по клику, отметки теперь сразу пишутся в Appwrite без общей кнопки сохранения;
- закрыто в текущей сессии: порядок расчета `/attendance` исправлен, weekly status теперь пересчитывается после гарантированной подготовки уроков выбранной недели;
- закрыто в текущей сессии: weekly status в `/attendance` синхронизирован с выбранной `weekStart`, а не с текущей календарной неделей;
- закрыто в текущей сессии: в `/attendance` добавлена навигация по неделям через `weekStart`, при этом сохранены фиксированные weekday-колонки и teacher-only weekly workflow;
- закрыто в текущей сессии: `/attendance` переработан под однокликовую отметку присутствия, список нарушителей со страницы убран;
- закрыто в текущей сессии: предупреждение Biome в `sidebar.tsx` снято, project-формы ограничены под Appwrite, документация и memory bank синхронизированы;
- закрыто в текущей сессии: содержимое `project_state_json` ограничено на сервере, а `manualOverrideNote` в UI приведен к тем же лимитам Appwrite;
- закрыто в текущей сессии: исправлен сдвиг `lesson_date` на UTC+3, auto-generated уроки текущей недели синхронизируются с шаблоном, а блок "Ближайшее занятие" на дашборде выбирает ближайшую дату;
- устранено локальное предупреждение Codex CLI: корень проекта добавлен в trusted projects глобального `~/.codex/config.toml`;
- в `AGENTS.md` зафиксировано правило: Markdown-файлы не прогоняются через Biome;
- локальный `appwrite_api` MCP server переведен на WSL-совместимый bash launcher с чтением Appwrite-переменных из `.env`;
- закрыто в текущей сессии: production smoke test teacher-only сценариев на `https://projects-tracker-one.vercel.app` завершен вручную; подтверждены `/students`, `/attendance`, `/projects`, массовая Telegram-рассылка и weekly digest преподавателя.
- закрыто в текущей сессии: полный production smoke test student-access сценария завершен; подтвержден путь `Telegram Start -> GitHub login -> bind -> выбор репозитория на /my-project`.
- закрыто в текущей сессии: репозиторий приведен к чистому `biome check` без функциональных изменений; `bun run lint` и `bun run build` проходят, а шум в `git status` по кодовым файлам связан с Windows-конвертацией окончаний строк `LF/CRLF`.
- закрыто в текущей сессии: шум `LF/CRLF` в рабочем дереве Windows снят; для локального репозитория выставлен `core.autocrlf=false`, ложные modified-метки по кодовым файлам очищены через безопасную пересинхронизацию индекса, и `git status` снова показывает только реальные изменения в `memory_bank`.
- закрыто в текущей сессии: продолжен read-only smoke test production/Appwrite без браузера. Подтверждено, что в боевой базе читаются `25` студентов, на текущую неделю `2026-03-08` существуют `3` auto-generated урока (`Вторник`, `Четверг`, `Пятница`), но attendance-отметок на эту неделю пока `0`, а коллекция `projects` в production сейчас пуста. Также Telegram Bot API отвечает успешно (`getMe` для `@dsbdr_bot`), а GitHub API доступен без токена только в базовом лимите `60/60`.
- закрыто в текущей сессии: Appwrite-схема для проектов перепроверена. Коллекции `projects` и `project_ai_reports` существуют, все ожидаемые атрибуты и индексы доступны, а `bun run db:provision` проходит идемпотентно без создания новых сущностей. Текущее ограничение `/projects` связано не с отсутствием коллекции, а с тем, что в production база проектов сейчас пуста.
- закрыто в текущей сессии: активирован первый student-access flow. GitHub OAuth теперь допускает teacher и student login, post-login redirect идет через `/auth/complete`, Telegram webhook после `Start` выдает student GitHub login-ссылку, маршрут `/student/link` связывает карточку ученика по одноразовому token и `github_user_id`, а student-only страница `/my-project` показывает только собственные GitHub-репозитории и позволяет создать draft-проект из выбранного repo.
- закрыто в текущей сессии: Appwrite schema для `students` расширена полями `github_link_token` и `github_link_expires_at`, создан индекс `students_by_github_link_token`; `bun run db:provision` успешно применил эти изменения.
- закрыто в текущей сессии: teacher-auth ужесточен для production — роль преподавателя определяется только по `TEACHER_GITHUB_USER_ID`, а `TEACHER_GITHUB_LOGIN` сохранен лишь как fallback для локальной/non-production разработки.
- закрыто в текущей сессии: страница `/login` очищена от вторичной ссылки на архитектурный markdown, а CTA `Войти через GitHub` переведен на общий `Button` из UI-системы для более консистентного вида.

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
- AI-анализ проекта должен опираться на данные из `memory_bank` student-репозитория и commit history GitHub, а AI используется для нормализации summary и next steps поверх собранных метрик;
- вызов модели для teacher-only AI-анализа должен идти только через Cloudflare Worker gateway с Workers AI `@cf/openai/gpt-oss-120b` и server-side токеном `AI_GATEWAY_TOKEN`;
- ручной override сбрасывается после следующего AI-анализа;
- будущая привязка student-access должна строиться на `github_user_id`, а не на username.
- у одного ученика может быть несколько проектов, но student-flow `/my-project` должен разрешать только один текущий проект одновременно; завершенные проекты остаются в истории и доступны teacher review.
- production teacher-access должен опираться только на `TEACHER_GITHUB_USER_ID`; `TEACHER_GITHUB_LOGIN` допустим только как non-production fallback.
- локальный dev server должен слушать `127.0.0.1:3300`, потому что `localhost` на Windows может уйти в IPv6 `::1`, а порт `3100` в текущей среде зарезервирован системой.
- закрыто в текущей сессии: student bind flow после Telegram invite починен — login page теперь сохраняет и восстанавливает student callback, GitHub OAuth возвращает ученика в `/student/link`, а повторное открытие `/login` с активной сессией автоматически продолжает привязку вместо зависания на экране входа.
