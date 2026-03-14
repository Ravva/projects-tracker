# System Patterns

## Архитектурные роли

- `teacher` — полный доступ к dashboard, students, attendance, projects и teacher actions;
- `student` — ограниченный доступ только к `/my-project`;
- `guest` — пользователь после GitHub OAuth, который еще не совпал ни с teacher allowlist, ни с `students.github_user_id`.

## Auth Pattern

- единая аутентификация через GitHub OAuth на `next-auth`;
- teacher определяется по `TEACHER_GITHUB_USER_ID` или fallback `TEACHER_GITHUB_LOGIN`;
- student определяется поиском в Appwrite `students.github_user_id`;
- post-login redirect выполняет маршрут `/auth/complete`;
- teacher-only и student-only ограничения проверяются на сервере через `requireTeacherSession`, `requireStudentSession` и `requireAuthenticatedSession`;
- `src/middleware.ts` защищает только факт логина, но не роль.

## Telegram To GitHub Bind Pattern

1. teacher выпускает персональную Telegram deep-link из карточки ученика;
2. ученик нажимает `Start` в приватном чате с ботом;
3. webhook сохраняет реальный `telegram_chat_id` и генерирует одноразовый `github_link_token`;
4. бот отправляет student login-ссылку на `/login?studentLinkToken=...`;
5. после GitHub OAuth маршрут `/student/link` связывает `github_user_id` с карточкой ученика;
6. token очищается после успешного bind или после истечения срока.

## Student Project Selection Pattern

- student page `/my-project` показывает все проекты текущего ученика, отдельно выделяет текущий проект и историю завершенных;
- список репозиториев читается напрямую из GitHub API по OAuth access token;
- выбор репозитория создает новый `active`-проект в `projects` со связкой `student_id + github_url`, только если у ученика нет другого текущего проекта;
- teacher review и AI-анализ остаются в teacher-only модуле `/projects`, но ручное создание проекта преподавателем не используется;
- teacher переводит проект в `completed`, когда ученик завершил его, после чего student-flow разрешает выбрать следующий репозиторий.

## Project Review Pattern

- `/projects` показывает только подключенные student-проекты и не содержит teacher-only форму ручного создания;
- `/projects/[projectId]` — обзорная страница, а не primary edit-form;
- detail page также управляет жизненным циклом проекта: teacher может пометить его завершенным или вернуть в работу;
- detail page опирается на последний AI-report и полный snapshot `memory_bank`, чтобы показать:
  - что это за проект через `docs/README.md`;
  - какой у него процент выполнения;
  - какой у него текущий контекст;
  - какие repo signals и next steps актуальны сейчас.
- все крупные текстовые карточки на detail page рендерят Markdown, чтобы списки, заголовки, таблицы, ссылки и `code` из repo snapshot отображались без потери структуры.

## Project Analysis Pattern

- teacher-only AI-анализ проекта запускается из `/projects/[projectId]`;
- backend читает `memory_bank/projectbrief.md`, `productContext.md`, `activeContext.md`, `progress.md` и опциональный `docs/README.md` прямо из student GitHub repository;
- `completion_percent` считается детерминированно только по `## Project Deliverables` в `memory_bank/projectbrief.md`; deliverables без валидной суммы весов `100` не участвуют в расчете процента;
- commit metrics и флаг `abandoned` считаются по истории коммитов default branch;
- AI используется только для нормализации summary, risks и next steps поверх уже рассчитанного snapshot;
- Vercel-приложение не ходит к модели напрямую: server-only клиент вызывает token-protected Cloudflare Worker `/chat`, а уже Worker обращается к Workers AI `@cf/openai/gpt-oss-120b` через binding `AI`;
- до первого AI-анализа проект остается в нейтральном состоянии `данные отсутствуют`; флаги `missing_memory_bank`, `missing_spec` и `missing_plan` выставляются только после реального repo analysis;
- агрегированные metrics пишутся в `projects.project_state_json`, а история запусков — в `project_ai_reports`;
- полный текст `Project brief`, `Product context`, `Active context` и `Progress notes` внутри AI-отчета хранится в сжатом виде в `inputSnapshotJson`, чтобы detail page читал весь markdown и оставался в пределах лимита Appwrite.

## Data Isolation

- teacher repositories продолжают работать как раньше;
- student flow использует отдельные read/write entrypoints:
  - поиск ученика по `github_user_id`;
  - claim одноразового GitHub bind token;
  - выбор проекта только для `student_id` текущего ученика;
- `projects` и `project_ai_reports` остаются на компактных JSON-state полях из-за лимитов Appwrite.
