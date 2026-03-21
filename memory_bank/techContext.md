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
- Cloudflare Workers + Workers AI для server-side AI gateway и модели `@cf/openai/gpt-oss-120b`;
- Hugging Face Inference Providers Chat Completions как fallback-провайдер для AI-анализа при недоступности или исчерпании квоты Workers AI;
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
  - `project_selection_locks`
  - `project_ai_reports`
- схема поднимается идемпотентно через `bun run db:provision`;
- индекс `students_by_github_link_token` нужен для student bind flow.
- в `projects.status` используется lifecycle `draft | active | completed`; новый student project разрешается только при отсутствии другого текущего проекта у того же `student_id`.
- текущий student project сериализуется отдельной lock-коллекцией `project_selection_locks`; lock берется на создание нового проекта и на перевод статуса обратно в `active`.
- для Appwrite Cloud Free нужно учитывать operational-риск: проект может уйти в pause после `7` дней без Console activity; для локальной профилактики добавлен `bun run appwrite:keepalive`.

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
  - `AI_GATEWAY_URL`
  - `AI_GATEWAY_TOKEN`
  - `AI_GATEWAY_MODEL`
  - `HF_TOKEN`
  - `HF_BASE_URL`
  - `HF_CHAT_MODEL`
  - `AI_FORCE_HF`
  - `GITHUB_TOKEN` желателен для стабильного teacher-only AI-analysis и GitHub sync без упора в публичный rate limit
  - `PROJECT_SYNC_CRON_SECRET` для защищенного route, который вызывается GitHub Actions
- GitHub Actions workflow `project-sync.yml` использует repository secret `PROJECT_SYNC_ENDPOINT_URL` для production endpoint и `PROJECT_SYNC_CRON_SECRET` для авторизации фонового запуска.

## Ограничения

- Markdown-файлы не проверяются через Biome;
- dev server на `127.0.0.1:3300` управляется пользователем и не должен запускаться агентом;
- teacher-only AI-анализ student projects опирается на публично доступные или доступные через `GITHUB_TOKEN` данные GitHub repo;
- teacher-only AI-анализ по умолчанию вызывает модели через Cloudflare Worker gateway с Workers AI; при quota error `4006` или отсутствии gateway-конфига server-only клиент может переключиться на Hugging Face через `HF_TOKEN`, `HF_BASE_URL` и `HF_CHAT_MODEL`;
- student-access не дает student права на teacher-only маршруты и ручные teacher actions.
