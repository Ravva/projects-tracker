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

- student page `/my-project` показывает только проекты текущего ученика и только его GitHub repositories;
- список репозиториев читается напрямую из GitHub API по OAuth access token;
- выбор репозитория создает draft-проект в `projects` со связкой `student_id + github_url`;
- teacher review и дальнейшее редактирование проекта остаются в teacher-only модуле `/projects`.

## Project Analysis Pattern

- teacher-only AI-анализ проекта запускается из `/projects/[projectId]`;
- backend читает `memory_bank/projectbrief.md`, `productContext.md`, `activeContext.md`, `progress.md` и опциональный `docs/README.md` прямо из student GitHub repository;
- `completion_percent` считается детерминированно по уникальным задачам из `activeContext.md` и `progress.md`;
- commit metrics и флаг `abandoned` считаются по истории коммитов default branch;
- AI используется только для нормализации summary, risks и next steps поверх уже рассчитанного snapshot;
- запрос к модели идет через server-only клиент официального OpenAI Responses API с `OPENAI_API_KEY` и `OPENAI_MODEL`;
- до первого AI-анализа проект остается в нейтральном состоянии `данные отсутствуют`; флаги `missing_memory_bank`, `missing_spec` и `missing_plan` выставляются только после реального repo analysis;
- агрегированные metrics пишутся в `projects.project_state_json`, а история запусков — в `project_ai_reports`.

## Data Isolation

- teacher repositories продолжают работать как раньше;
- student flow использует отдельные read/write entrypoints:
  - поиск ученика по `github_user_id`;
  - claim одноразового GitHub bind token;
  - выбор проекта только для `student_id` текущего ученика;
- `projects` и `project_ai_reports` остаются на компактных JSON-state полях из-за лимитов Appwrite.
