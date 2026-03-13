# Projects Tracker Architecture

## Product Scope

`Projects Tracker` - сервис для teacher control room и ограниченного student-access сценария выбора проекта.

MVP включает:

- вход преподавателя через GitHub OAuth;
- вход ученика через GitHub OAuth после подтверждения личности через Telegram;
- teacher-only управление учениками, включая страницу редактирования ученика;
- student-only выбор своего GitHub-репозитория на маршруте `/my-project`;
- ручное заполнение `telegram_chat_id` преподавателем и привязку через персональные Telegram `start`-ссылки;
- недельные занятия по шаблону вторник/четверг/пятница;
- CRUD проектов, GitHub sync и ручной AI-анализ;
- Telegram-уведомления ученикам и weekly digest преподавателю.

## Roles

- `teacher`: единственная активная роль в MVP;
- `student`: ограниченная роль для входа и выбора собственного проекта.

### Student Access

Student-access строится на GitHub OAuth и стабильном `github_user_id`. После подтверждения через Telegram бот ученик получает одноразовую GitHub login-ссылку, связывает свой аккаунт с карточкой ученика и попадает на `/my-project`, где может выбрать только свой репозиторий из списка GitHub-репозиториев владельца. Редактирование ученических данных, посещаемости и ручных оценок остается за преподавателем.

Детальное ТЗ: [Student Project Access](./student-project-access.md).

## Modules

### Auth

- GitHub OAuth как единственный способ входа;
- реализация на `next-auth`;
- teacher определяется только по `TEACHER_GITHUB_USER_ID` в production и по `TEACHER_GITHUB_USER_ID` либо fallback `TEACHER_GITHUB_LOGIN` вне production;
- student определяется поиском по `students.github_user_id`;
- post-login redirect идет через `/auth/complete`;
- маршруты `/auth/complete`, `/student/link` и `/my-project` защищены через `src/middleware.ts`, а role-check выполняется на сервере;
- в production допуск учителя идет только по `TEACHER_GITHUB_USER_ID`; `TEACHER_GITHUB_LOGIN` остается fallback только для локальной разработки и других non-production сред.

### Students

- список учеников;
- создание и редактирование ученика;
- teacher-only страница редактирования ученика для ввода `telegram_chat_id`;
- teacher-only страница `/students` поддерживает массовую Telegram-рассылку по выбранным ученикам с пропуском карточек без `chat_id` и итоговой сводкой по отправке;
- teacher-only страница ученика умеет выпускать персональную invite-ссылку `t.me/<bot>?start=<token>` для автоматической привязки `telegram_chat_id`;
- после `Start` бот отправляет ученику одноразовую GitHub login-ссылку для безопасной привязки `github_user_id`;
- импорт из XLSX без дедупликации в MVP.

### Attendance

- занятия только плановые: вторник, четверг, пятница;
- внеплановые занятия не поддерживаются;
- преподаватель может удалить плановое занятие, например из-за праздника;
- календарные `lesson_date` формируются в локальной дате без UTC-сдвига; auto-generated уроки текущей недели при рассинхронизации пересобираются по шаблону `Вт/Чт/Пт`;
- страница `/attendance` сведена к компактной weekly-таблице: отметки переключаются локально по циклу `- -> Был -> Не был`, а запись в базу и пересчет итогов происходят после кнопки `Сохранить изменения`;
- `/attendance` поддерживает навигацию по неделям через `weekStart` в query-параметре и кнопки перехода на предыдущую/следующую неделю;
- статус недели и attendance rate на `/attendance` считаются по выбранной неделе, а не всегда по текущей календарной неделе;
- недельная норма: `min(2, count(lessons_in_week))`.

### Projects

- проект принадлежит ученику;
- репозиторий нормализуется в `owner/repo/default_branch`;
- AI-анализ teacher-only проекта читает `memory_bank` и commit history прямо из student GitHub repository, а не полагается только на локально заполненные поля проекта;
- вызов модели идет только через официальный OpenAI Responses API с серверным `OPENAI_API_KEY`; пользовательские OAuth-токены и неофициальные ChatGPT-потоки не используются;
- `completion_percent` считается детерминированно по задачам из `memory_bank/activeContext.md` и `memory_bank/progress.md`;
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
- `projects` и `project_ai_reports` используют компактные JSON-state поля, чтобы укладываться в лимиты Appwrite;
- при отсутствии Appwrite env-конфигурации репозитории возвращают пустые состояния;
- пример переменных окружения хранится в `.env.example`.

## Current Routes

- `/` - teacher dashboard с app shell, weekly focus, KPI, risk table, AI summaries и кнопкой ручной отправки weekly digest в Telegram преподавателя.
- `/students` - teacher-only список учеников.
- `/students/[studentId]` - teacher-only страница редактирования ученика.
- `/auth/complete` - post-login resolver для teacher/student.
- `/student/link` - защищенный bind route, который связывает GitHub-аккаунт ученика с карточкой по одноразовому token.
- `/my-project` - student-only страница выбора GitHub-репозитория и создания draft-проекта.
- `/api/telegram/webhook` - публичный route для Telegram Bot API, который обрабатывает `/start <token>` и сохраняет `telegram_chat_id` в карточку ученика.
- `/attendance` - teacher-only weekly attendance workspace.
- `/projects` - teacher-only project control workspace.
- `/projects/[projectId]` - teacher-only страница review проекта.

## Local Development

- dev server должен использовать `127.0.0.1:3300`; в локальной Windows-среде порт `3100` попадает в system excluded range, а `localhost` дополнительно может уводить bind в `::1`.
- `.env.example` включает `TELEGRAM_BOT_TOKEN` для ученических и teacher-only Telegram-уведомлений, `TELEGRAM_BOT_USERNAME` для генерации `start`-ссылок, `TELEGRAM_WEBHOOK_SECRET` для защиты webhook и `TEACHER_TELEGRAM_CHAT_ID` для weekly digest преподавателю;
- GitHub OAuth запрашивает scope, достаточный для чтения списка student repositories владельца.

## Deployment

- production target: Vercel;
- production URL: `https://projects-tracker-one.vercel.app`;
- для production deployment требуется авторизованный `vercel` CLI или `VERCEL_TOKEN`;
- production env должен включать корректный `NEXTAUTH_URL` для публичного Vercel URL;
- production env должен включать `TEACHER_GITHUB_USER_ID`; без него teacher login считается не настроенным;
- production env должен включать `OPENAI_API_KEY`; `OPENAI_MODEL` опционален и по умолчанию равен `gpt-5-mini`;
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
