# Projects Tracker Architecture

## Product Scope

`Projects Tracker` - teacher-only сервис для учета посещаемости и контроля ученических GitHub-проектов.

MVP включает:

- вход преподавателя через GitHub OAuth;
- teacher-only управление учениками, включая страницу редактирования ученика;
- ручное заполнение `telegram_chat_id` преподавателем и привязку через персональные Telegram `start`-ссылки;
- недельные занятия по шаблону вторник/четверг/пятница;
- CRUD проектов, GitHub sync и ручной AI-анализ;
- Telegram-уведомления ученикам и weekly digest преподавателю.

## Roles

- `teacher`: единственная активная роль в MVP;
- `student`: future-ready роль, неактивна в MVP.

### Future Student Access

Будущий доступ ученика должен строиться на GitHub OAuth и стабильном `github_user_id`. После входа ученик сможет выбрать только свой репозиторий из списка GitHub-репозиториев. Редактирование ученических данных, посещаемости и ручных оценок остается за преподавателем.

## Modules

### Auth

- GitHub OAuth как единственный способ входа;
- реализация на `next-auth`;
- teacher-only guard для всех экранов MVP через `src/middleware.ts`;
- допуск учителя по `TEACHER_GITHUB_USER_ID` или fallback `TEACHER_GITHUB_LOGIN`.

### Students

- список учеников;
- создание и редактирование ученика;
- teacher-only страница редактирования ученика для ввода `telegram_chat_id`;
- teacher-only страница `/students` поддерживает массовую Telegram-рассылку по выбранным ученикам с пропуском карточек без `chat_id` и итоговой сводкой по отправке;
- teacher-only страница ученика умеет выпускать персональную invite-ссылку `t.me/<bot>?start=<token>` для автоматической привязки `telegram_chat_id`;
- импорт из XLSX без дедупликации в MVP.

### Attendance

- занятия только плановые: вторник, четверг, пятница;
- внеплановые занятия не поддерживаются;
- преподаватель может удалить плановое занятие, например из-за праздника;
- календарные `lesson_date` формируются в локальной дате без UTC-сдвига; auto-generated уроки текущей недели при рассинхронизации пересобираются по шаблону `Вт/Чт/Пт`;
- страница `/attendance` сведена к компактной weekly-таблице: отметка в ячейке сразу сохраняется одним кликом по циклу `- -> Был -> Не был`;
- `/attendance` поддерживает навигацию по неделям через `weekStart` в query-параметре и кнопки перехода на предыдущую/следующую неделю;
- статус недели и attendance rate на `/attendance` считаются по выбранной неделе, а не всегда по текущей календарной неделе;
- недельная норма: `min(2, count(lessons_in_week))`.

### Projects

- проект принадлежит ученику;
- репозиторий нормализуется в `owner/repo/default_branch`;
- AI-анализ запускается только если заполнены ТЗ и план разработки;
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
- `/api/telegram/webhook` - публичный route для Telegram Bot API, который обрабатывает `/start <token>` и сохраняет `telegram_chat_id` в карточку ученика.
- `/attendance` - teacher-only weekly attendance workspace.
- `/projects` - teacher-only project control workspace.
- `/projects/[projectId]` - teacher-only страница review проекта.

## Local Development

- dev server должен использовать `localhost:3100`.
- `.env.example` включает `TELEGRAM_BOT_TOKEN` для ученических и teacher-only Telegram-уведомлений, `TELEGRAM_BOT_USERNAME` для генерации `start`-ссылок, `TELEGRAM_WEBHOOK_SECRET` для защиты webhook и `TEACHER_TELEGRAM_CHAT_ID` для weekly digest преподавателю.

## Telegram Setup

- для автоматической привязки ученика нужно настроить у бота webhook на публичный URL вида `https://<domain>/api/telegram/webhook`;
- если задан `TELEGRAM_WEBHOOK_SECRET`, Telegram должен отправлять тот же secret в заголовке `x-telegram-bot-api-secret-token`;
- после настройки teacher-only страница ученика может выпускать персональную `start`-ссылку, а webhook автоматически сохранит `telegram_chat_id` после нажатия `Start`.

## Risk Rules

- единый риск `invalid_github_repo` покрывает:
  - невалидный URL;
  - несуществующий репозиторий;
  - приватный репозиторий без доступа;
  - временные ошибки GitHub API.

## Dashboard Thresholds

- `< 25%` - критический;
- `25-49%` - низкий;
- `50-74%` - средний;
- `>= 75%` - высокий.
