# Projects Tracker Architecture

## Product Scope

`Projects Tracker` - сервис для teacher control room и ограниченного student-access сценария выбора и ведения нескольких ученических проектов, включая групповой проект для пары учеников с одним общим GitHub-репозиторием.

MVP включает:

- вход преподавателя через GitHub OAuth;
- вход ученика через GitHub OAuth после подтверждения личности через Telegram;
- teacher-only управление учениками, включая страницу редактирования ученика;
- student-only просмотр своей истории проектов и выбор следующего GitHub-репозитория на маршруте `/my-project`;
- ручное заполнение `telegram_chat_id` преподавателем и привязку через персональные Telegram `start`-ссылки;
- недельные занятия по шаблону вторник/четверг/пятница;
- CRUD проектов, GitHub sync и AI-анализ с автоматическим запуском при подключении и обновлении репозитория;
- Telegram-уведомления ученикам и weekly digest преподавателю.

## Roles

- `teacher`: единственная активная роль в MVP;
- `student`: ограниченная роль для входа и выбора собственного проекта.

### Student Access

Student-access строится на GitHub OAuth и стабильном `github_user_id`. После подтверждения через Telegram бот ученик получает одноразовую GitHub login-ссылку, связывает свой аккаунт с карточкой ученика и попадает на `/my-project`, где видит текущий проект, историю завершенных проектов и может выбрать только свой следующий репозиторий из списка GitHub-репозиториев владельца. Если проект выполняется в паре, в системе существует один канонический project record и один GitHub-репозиторий, а второй ученик подключается к нему teacher-only действием как участник проекта. Новый проект разрешен только после перевода предыдущего участия в статус `completed`. Teacher-only страница ученика также умеет сбросить ошибочно привязанный `github_user_id` и сразу перевыпустить новую GitHub login-ссылку, если браузер ученика подставил не тот аккаунт. Если student-link открыт при уже активной GitHub-сессии, `/login` больше не завершает привязку автоматически: сначала показывается подтверждение текущего аккаунта и действие `Выйти и сменить аккаунт`, а новый OAuth-запрос идет с `prompt=select_account`. На student-flow также есть явная инструкция по подготовке `AGENTS.md` и `memory_bank`, потому что без корректной структуры Memory Bank teacher-only AI-анализ и сигналы проекта будут неточными. Редактирование ученических данных, посещаемости и ручных оценок остается за преподавателем.
Страница `/my-project` показывает ученику канонический `AGENTS.md` прямо из репозитория `projects-tracker` по GitHub raw URL с локальным fallback, чтобы инструкция не устаревала между проектами и всегда содержала актуальные правила для `Project Deliverables`.

Детальное ТЗ: [Student Project Access](./student-project-access.md).

## Modules

### Auth

- GitHub OAuth как единственный способ входа;
- реализация на `next-auth`;
- teacher определяется только по `TEACHER_GITHUB_USER_ID` в production и по `TEACHER_GITHUB_USER_ID` либо fallback `TEACHER_GITHUB_LOGIN` вне production;
- student определяется поиском по `students.github_user_id`;
- post-login redirect идет через `/auth/complete`;
- маршруты `/auth/complete`, `/student/link` и `/my-project` защищены через `src/proxy.ts`, а role-check выполняется на сервере;
- в production допуск учителя идет только по `TEACHER_GITHUB_USER_ID`; `TEACHER_GITHUB_LOGIN` остается fallback только для локальной разработки и других non-production сред.

### Students

- список учеников;
- создание и редактирование ученика;
- teacher-only страница редактирования ученика для ввода `telegram_chat_id`;
- teacher-only страница `/students` поддерживает массовую Telegram-рассылку по выбранным ученикам с пропуском карточек без `chat_id` и итоговой сводкой по отправке;
- teacher-only страница ученика умеет выпускать персональную invite-ссылку `t.me/<bot>?start=<token>` для автоматической привязки `telegram_chat_id`;
- после `Start` бот отправляет ученику одноразовую GitHub login-ссылку для безопасной привязки `github_user_id`;
- teacher-only страница ученика умеет сбрасывать текущую GitHub-привязку и перевыпускать одноразовую GitHub login-ссылку для безопасной перепривязки;
- импорт из XLSX без дедупликации в MVP.

### Attendance

- занятия только плановые: вторник, четверг, пятница;
- внеплановые занятия не поддерживаются;
- преподаватель может удалить плановое занятие, например из-за праздника;
- календарные `lesson_date` формируются в локальной дате без UTC-сдвига; auto-generated уроки текущей недели при рассинхронизации пересобираются по шаблону `Вт/Чт/Пт`;
- страница `/attendance` сведена к компактной weekly-таблице: отметки переключаются локально по циклу `- -> Был -> Не был`, а у lesson-колонки есть отдельное состояние `Не состоялось`, которое исключается из weekly attendance rate; запись в базу и пересчет итогов происходят после кнопки `Сохранить изменения`;
- `/attendance` поддерживает навигацию по неделям через `weekStart` в query-параметре и кнопки перехода на предыдущую/следующую неделю;
- статус недели и attendance rate на `/attendance` считаются по выбранной неделе, а не всегда по текущей календарной неделе;
- недельная норма: `min(2, count(lessons_in_week))`.

### Projects

- проект существует в системе один раз и может иметь одного или нескольких участников;
- `projects.student_id` хранит владельца GitHub-репозитория, а реальное участие учеников в проекте хранится отдельным слоем `project_memberships`;
- в каждый момент времени у ученика допускается только один текущий проект со статусом `draft` или `active`, но ограничение проверяется по memberships, а не только по полю владельца;
- репозиторий нормализуется в `owner/repo/default_branch`;
- teacher вручную не создает проекты из `/projects`; новый проект появляется только из student-flow `/my-project` после GitHub bind и выбора репозитория;
- teacher-only detail page проекта умеет добавлять второго ученика в существующий project record и удалять участника, сохраняя один общий GitHub sync и один AI-analysis pipeline на группу;
- выбор следующего проекта сериализуется per-student lock в Appwrite, чтобы параллельные запросы не создали несколько текущих проектов одновременно;
- после выбора репозитория student-проект создается в статусе `draft`, и teacher-side AI-анализ запускается автоматически сразу после привязки; в `active` проект переводится автоматически, если репозиторий доступен и в нем найдены `memory_bank`, осмысленные `spec` и `plan`;
- teacher-only действие `GitHub sync` теперь сразу повторяет AI-анализ после обновления metadata и последнего commit, чтобы detail page не зависела от отдельного ручного прогона;
- teacher-only список `/projects` выполняет live-проверку default branch в GitHub и явно показывает два статуса: нужен ли `sync` и актуален ли текущий AI-report;
- teacher-only список `/projects` поддерживает пакетную кнопку `Синхронизировать все`, которая для всех stale-проектов последовательно запускает `GitHub sync`, а затем автоматический AI-анализ;
- фоновая синхронизация проектов через GitHub Actions переведена в ручной режим `workflow_dispatch`; teacher-side массовый `Синхронизировать все` и ручной запуск workflow остаются основными способами запуска защищенного route `/api/github-actions/project-sync` с секретом `PROJECT_SYNC_CRON_SECRET`;
- teacher-only detail page проекта умеет переводить проект в `completed` и обратно в `active`, чтобы открывать ученику доступ к следующему проекту;
- AI-анализ teacher-only проекта читает `memory_bank` и commit history прямо из student GitHub repository, а не полагается только на локально заполненные поля проекта;
- вызов модели идет через отдельный Cloudflare Worker gateway с Workers AI `@cf/qwen/qwen3-30b-a3b-fp8`; если Cloudflare возвращает quota/error по Workers AI или gateway временно не настроен, server-only AI client может уйти в fallback на Hugging Face Chat Completions через `HF_TOKEN`, без пользовательских OAuth-токенов и неофициальных ChatGPT-потоков;
- `completion_percent` считается детерминированно только по `## Project Deliverables` в `memory_bank/projectbrief.md`; вес завершенных deliverables дает итоговый процент, а `activeContext.md` и `progress.md` больше не используются как источник процента;
- канонический формат `## Project Deliverables` фиксирован: Markdown-таблица `ID | Deliverable | Status | Weight`, где `Status` может быть только `pending`, `in_progress`, `completed` или `blocked`, а сумма всех `Weight` обязана быть ровно `100`;
- для обратной совместимости teacher-side parser дополнительно понимает legacy-формат секции с блоками `### ID: Title` и многострочными полями `ID/Название/Статус/Вес`, но это fallback, а не новый канон;
- AI используется только для нормализации summary и next steps поверх уже рассчитанных метрик;
- до первого AI-анализа UI показывает состояние `данные отсутствуют`; флаги `missing_memory_bank`, `missing_spec` и `missing_plan` появляются только после реального анализа репозитория;
- детальное ТЗ механизма: [Project Repo Analysis](./project-repo-analysis.md);
- project-формы ограничивают `name`, `summary`, `github_url`, `spec_markdown` и `plan_markdown` по фактическим лимитам Appwrite;
- project-формы и поле `manualOverrideNote` показывают явные счетчики символов рядом с лимитами, чтобы преподаватель видел остаток до сохранения;
- содержимое `project_state_json` нормализуется перед записью: `manualOverrideNote`, `aiSummary` и `nextSteps` подрезаются до безопасных размеров;
- `final_completion_percent` вычисляется на лету;
- ручной override отключается после следующего AI-анализа.

### Notifications

- личная доставка и доставка в общий ученический чат идут по явным `chat_id`;
- Telegram username хранится как вспомогательное поле и не используется как ключ доставки;
- teacher-only карточка ученика подсказывает ожидаемый формат `telegram_chat_id` и напоминает про `/start` в боте до тестовой отправки;
- teacher-only deep-link flow использует одноразовый `telegram_link_token`: преподаватель выдаёт персональную `start`-ссылку, а webhook сохраняет реальный `chat_id` после нажатия `Start`;
- server action и Telegram service валидируют формат `chat_id`, длину сообщения и возвращают диагностические ошибки вместо общего фейла отправки;
- teacher-only массовая рассылка возвращает сводку по успешным отправкам, пропущенным карточкам и ошибкам доставки;
- teacher dashboard поддерживает ручную отправку weekly digest в Telegram преподавателя через `TEACHER_TELEGRAM_CHAT_ID`, а результат отправки показывается в стилизованном modal-окне;
- допустимы персональные упоминания учеников в общем чате.

## Frontend Stack

- `Next.js 16` с `App Router`;
- `React 19`;
- `Tailwind CSS v4`;
- `Biome`;
- `shadcn/ui` c preset `a1F9UU9Q` (`radix-mira`, `taupe`, `hugeicons`);
- visual direction: `Academic Control Room`.

## Data Layer

- server-side repositories для `students`, `projects`, `attendance`;
- Appwrite используется через server-only adapter;
- схема Appwrite поднимается идемпотентным скриптом `bun run db:provision`;
- для связи нескольких учеников с одним проектом используется отдельная коллекция `project_memberships`;
- для сериализации выбора текущего student-проекта используется отдельная коллекция `project_selection_locks`;
- `projects` и `project_ai_reports` используют компактные JSON-state поля; полный snapshot `memory_bank` в AI-отчетах хранится в сжатом виде внутри `report_payload_json`, а размер атрибута `project_ai_reports.report_payload_json` расширен до `50000`, чтобы detail page мог показывать полные `Project brief`, `Product context`, `Active context` и `Progress notes` без потери данных;
- при отсутствии Appwrite env-конфигурации репозитории возвращают пустые состояния;
- operational note: для Appwrite Cloud Free действует риск авто-паузы после 7 дней без Console activity; локальный anti-pause workflow описан в [Appwrite Anti-Pause](./appwrite-anti-pause.md);
- пример переменных окружения хранится в `.env.example`.

## Current Routes

- `/` - корневой route-резолвер: teacher получает dashboard с app shell, weekly focus, KPI, risk table, AI summaries, кнопкой ручной отправки weekly digest в Telegram преподавателя и быстрым переходом в `Appwrite Console`, а student сразу перенаправляется на `/my-project`.
- `/students` - teacher-only список учеников.
- `/students/[studentId]` - teacher-only страница редактирования ученика.
- `/auth/complete` - post-login resolver для teacher/student.
- `/student/link` - защищенный bind route, который связывает GitHub-аккаунт ученика с карточкой по одноразовому token.
- `/my-project` - student-only страница истории проектов ученика, включая групповые проекты, состояния текущего проекта и выбора следующего GitHub-репозитория владельца.
- `/api/telegram/webhook` - публичный route для Telegram Bot API, который обрабатывает `/start <token>` и сохраняет `telegram_chat_id` в карточку ученика.
- `/attendance` - teacher-only weekly attendance workspace.
- `/attendance/report` - teacher-only printable attendance report view с кнопками возврата, печати и сохранения PDF.
- `/attendance/report/share` - публичный signed route для родителей без авторизации; показывает тот же attendance report по share-ссылке со сроком жизни 1 год.
- `/projects` - teacher-only список подключенных student-проектов без ручного создания, где один проект может показывать нескольких участников.
- `/projects/report` - teacher-only printable project report view с кнопкой возврата, печати и сохранения PDF.
- `/project-report/share` - публичный signed route для родителей без авторизации; показывает project report по share-ссылке со сроком жизни 1 год.
- `/projects/[projectId]` - teacher-only обзор проекта: сначала блок `Прогресс и сигналы`, затем полный `docs/README.md`, `Product context`, `Active context`, `Progress notes`, repo signals и история AI-отчетов; крупные текстовые карточки страницы рендерят Markdown-разметку.

## Local Development

- dev server должен использовать `127.0.0.1:3300`; в локальной Windows-среде порт `3100` попадает в system excluded range, а `localhost` дополнительно может уводить bind в `::1`.
- `.env.example` включает `TELEGRAM_BOT_TOKEN` для ученических и teacher-only Telegram-уведомлений, `TELEGRAM_BOT_USERNAME` для генерации `start`-ссылок, `TELEGRAM_WEBHOOK_SECRET` для защиты webhook и `TEACHER_TELEGRAM_CHAT_ID` для weekly digest преподавателю;
- `.env.example` также включает `AI_GATEWAY_URL`, `AI_GATEWAY_TOKEN` и опциональный `AI_GATEWAY_MODEL` для server-side вызова Cloudflare Worker с Workers AI, а также `HF_TOKEN`, `HF_BASE_URL`, `HF_CHAT_MODEL` и `AI_FORCE_HF` для fallback или принудительного переключения на Hugging Face; текущий fallback default — `Qwen/Qwen2.5-7B-Instruct`;
- GitHub OAuth запрашивает scope, достаточный для чтения списка student repositories владельца.

## Deployment

- production target: Vercel;
- production URL: `https://projects-tracker-one.vercel.app`;
- для production deployment требуется авторизованный `vercel` CLI или `VERCEL_TOKEN`;
- production env должен включать корректный `NEXTAUTH_URL` для публичного Vercel URL;
- production env должен включать `TEACHER_GITHUB_USER_ID`; без него teacher login считается не настроенным;
- production env должен включать `AI_GATEWAY_URL` и `AI_GATEWAY_TOKEN`; `AI_GATEWAY_MODEL` опционален и по умолчанию равен `@cf/qwen/qwen3-30b-a3b-fp8`. Для fallback на Hugging Face нужен `HF_TOKEN`; `HF_BASE_URL`, `HF_CHAT_MODEL` и `AI_FORCE_HF` остаются опциональными;
- production env должен включать `PROJECT_REPORT_SHARE_SECRET` для публичных project share-ссылок; `ATTENDANCE_REPORT_SHARE_SECRET` остается только для attendance share-флоу и совместимости;
- отдельный Worker разворачивается через `wrangler` из подпроекта `workers/ai-worker` и использует binding `[ai]`;
- Telegram webhook уже привязан к `https://projects-tracker-one.vercel.app/api/telegram/webhook`;
- на 2026-03-11 production smoke test teacher-only сценариев `/students`, `/attendance`, `/projects`, массовой Telegram-рассылки и teacher weekly digest подтвержден вручную.

## Telegram Setup

- для автоматической привязки ученика нужно настроить у бота webhook на публичный URL вида `https://<domain>/api/telegram/webhook`;
- если задан `TELEGRAM_WEBHOOK_SECRET`, Telegram должен отправлять тот же secret в заголовке `x-telegram-bot-api-secret-token`;
- в production teacher-only страница ученика уже выпускает персональную `start`-ссылку, webhook автоматически сохраняет `telegram_chat_id` после нажатия `Start`, а затем бот отправляет student login-ссылку для bind flow по `github_user_id`.

## Risk Rules

- единый риск `invalid_github_repo` покрывает:
  - невалидный URL;
  - несуществующий репозиторий;
  - приватный репозиторий без доступа;
  - временные ошибки GitHub API.
- риск `data_missing` означает, что AI-анализ еще не запускался и repository-derived signals пока не собраны.
- риск `missing_memory_bank` означает отсутствие ожидаемых файлов `memory_bank` в student repo.
- риск `missing_spec` означает отсутствие осмысленного ТЗ в `projectbrief.md` и `productContext.md`.
- риск `missing_plan` означает отсутствие осмысленного плана в `activeContext.md` и `progress.md`.
- риск `abandoned` означает, что последний коммит старше 7 дней.

## Dashboard Thresholds

- `< 25%` - критический;
- `25-49%` - низкий;
- `50-74%` - средний;
- `>= 75%` - высокий.
