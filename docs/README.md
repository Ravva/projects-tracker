# Projects Tracker Architecture

## Product Scope

`Projects Tracker` - teacher-only сервис для учета посещаемости и контроля ученических GitHub-проектов.

MVP включает:

- вход преподавателя через GitHub OAuth;
- teacher-only управление учениками, включая страницу редактирования ученика;
- ручное заполнение `telegram_chat_id` преподавателем;
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
- импорт из XLSX без дедупликации в MVP.

### Attendance

- занятия только плановые: вторник, четверг, пятница;
- внеплановые занятия не поддерживаются;
- преподаватель может удалить плановое занятие, например из-за праздника;
- недельная норма: `min(2, count(lessons_in_week))`.

### Projects

- проект принадлежит ученику;
- репозиторий нормализуется в `owner/repo/default_branch`;
- AI-анализ запускается только если заполнены ТЗ и план разработки;
- project-формы ограничивают `name`, `summary`, `github_url`, `spec_markdown` и `plan_markdown` по фактическим лимитам Appwrite;
- `final_completion_percent` вычисляется на лету;
- ручной override отключается после следующего AI-анализа.

### Notifications

- личная доставка и доставка в общий ученический чат идут по явным `chat_id`;
- Telegram username хранится как вспомогательное поле и не используется как ключ доставки;
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

- `/` - teacher dashboard с app shell, weekly focus, KPI, risk table и AI summaries.
- `/students` - teacher-only список учеников.
- `/students/[studentId]` - teacher-only страница редактирования ученика.
- `/attendance` - teacher-only weekly attendance workspace.
- `/projects` - teacher-only project control workspace.
- `/projects/[projectId]` - teacher-only страница review проекта.

## Local Development

- dev server должен использовать `localhost:3100`.

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
