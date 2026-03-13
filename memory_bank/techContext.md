# Tech Context

## Основной стек

- `Next.js 16` с `App Router`;
- `React 19`;
- `Tailwind CSS v4`;
- `shadcn/ui` preset `a1F9UU9Q`;
- `Biome` для lint/format;
- `bun` как пакетный менеджер и runtime для скриптов;
- `next-auth` для GitHub OAuth;
- `node-appwrite` для server-side доступа к Appwrite;
- GitHub REST API для чтения student repositories, `memory_bank` файлов и commit history;
- `xlsx` для teacher import students.

## Auth And Access

- OAuth provider: GitHub;
- GitHub OAuth scope включает доступ, достаточный для чтения списка student repositories владельца;
- server session хранит `githubLogin`, `githubId` и OAuth access token;
- роль teacher вычисляется по env allowlist;
- роль student вычисляется по `students.github_user_id`;
- student bind использует поля Appwrite:
  - `github_link_token`
  - `github_link_expires_at`

## Appwrite

- основная база: `projects-tracker`;
- коллекции:
  - `students`
  - `lessons`
  - `attendance`
  - `projects`
  - `project_ai_reports`
- схема поднимается идемпотентно через `bun run db:provision`;
- индекс `students_by_github_link_token` нужен для student bind flow.

## Deployment And Env

- production target: Vercel;
- production URL: `https://projects-tracker-one.vercel.app`;
- обязательные auth env:
  - `GITHUB_ID`
  - `GITHUB_SECRET`
  - `NEXTAUTH_SECRET`
  - `NEXTAUTH_URL`
  - `TEACHER_GITHUB_USER_ID` или `TEACHER_GITHUB_LOGIN`
- Telegram env:
  - `TELEGRAM_BOT_TOKEN`
  - `TELEGRAM_BOT_USERNAME`
  - `TELEGRAM_WEBHOOK_SECRET`
  - `TEACHER_TELEGRAM_CHAT_ID`
- AI env:
  - `OPENAI_API_KEY`
  - `OPENAI_MODEL`

## Ограничения

- Markdown-файлы не проверяются через Biome;
- dev server на `127.0.0.1:3300` управляется пользователем и не должен запускаться агентом;
- teacher-only AI-анализ student projects опирается на публично доступные или доступные через `GITHUB_TOKEN` данные GitHub repo;
- teacher-only AI-анализ вызывает модели только через официальный OpenAI Responses API с серверным `OPENAI_API_KEY`; `OPENAI_MODEL` остается конфигурируемым env;
- student-access не дает student права на teacher-only маршруты и ручные teacher actions.
