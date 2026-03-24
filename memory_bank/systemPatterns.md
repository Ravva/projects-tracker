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
- `src/proxy.ts` защищает только факт логина, но не роль.

## Telegram To GitHub Bind Pattern

1. teacher выпускает персональную Telegram deep-link из карточки ученика;
2. ученик нажимает `Start` в приватном чате с ботом;
3. webhook сохраняет реальный `telegram_chat_id` и генерирует одноразовый `github_link_token`;
4. бот отправляет student login-ссылку на `/login?studentLinkToken=...`;
5. после GitHub OAuth маршрут `/student/link` связывает `github_user_id` с карточкой ученика;
6. token очищается после успешного bind или после истечения срока.

## Student Project Selection Pattern

- student page `/my-project` показывает все проекты текущего ученика, отдельно выделяет текущий проект и историю завершенных;
- student page `/my-project` показывает проекты ученика через `project_memberships`, поэтому групповой проект виден всем участникам, а не только владельцу GitHub-репозитория;
- student page `/my-project` подтягивает канонический `AGENTS.md` из репозитория `projects-tracker` по GitHub raw URL с локальным fallback, чтобы ученик всегда копировал актуальную инструкцию;
- список репозиториев читается напрямую из GitHub API по OAuth access token;
- приватные репозитории в `/my-project` помечаются как `Приватный`, выделяются предупреждающим стилем и не могут быть выбраны; server action повторно проверяет список доступных репозиториев перед созданием проекта;
- выбор репозитория создает новый `draft`-проект в `projects`, где `student_id` хранит владельца GitHub-репозитория, а участие учеников фиксируется отдельной коллекцией `project_memberships`;
- создание и смена статуса текущего проекта сериализуются per-student lock через Appwrite-коллекцию `project_selection_locks`, чтобы параллельные запросы не нарушали инвариант `один текущий проект`;
- teacher-only detail page проекта может добавить второго ученика в уже существующий проект как `member`, не создавая второй project record;
- после выбора репозитория в student-flow teacher-side AI-анализ запускается автоматически; проект повышается из `draft` в `active`, если подтверждены `hasRepository`, `hasMemoryBank`, `hasSpec` и `hasPlan`;
- teacher review и AI-анализ остаются в teacher-only модуле `/projects`, но ручное создание проекта преподавателем не используется;
- teacher переводит проект в `completed`, когда ученик завершил его, после чего student-flow разрешает выбрать следующий репозиторий.

## Project Review Pattern

- `/projects` показывает только подключенные student-проекты и не содержит teacher-only форму ручного создания;
- `/projects` показывает один проект одной строкой и отображает всех участников группы;
- `/projects/[projectId]` — обзорная страница, а не primary edit-form;
- detail page также управляет жизненным циклом проекта: teacher может пометить его завершенным или вернуть в работу;
- detail page также управляет составом проекта: owner GitHub-репозитория остается неизменным, а остальные участники добавляются и удаляются через memberships;
- detail page опирается на последний AI-report и полный snapshot `memory_bank`, чтобы показать:
  - что это за проект через `docs/README.md`;
  - какой у него процент выполнения;
  - какой у него текущий контекст;
  - какие repo signals и next steps актуальны сейчас.
- все крупные текстовые карточки на detail page рендерят Markdown, чтобы списки, заголовки, таблицы, ссылки и `code` из repo snapshot отображались без потери структуры.

## Project Analysis Pattern

- teacher-only AI-анализ проекта можно запускать вручную из `/projects/[projectId]`, но он также стартует автоматически после создания нового student-проекта и после `GitHub sync`;
- teacher-only список `/projects` дополнительно делает live-check последнего commit default branch в GitHub и сравнивает его с сохраненным `lastCommitSha`, чтобы отделять актуальные snapshots от проектов, которым нужен `sync`;
- пакетная teacher-only команда `Синхронизировать все` на `/projects` обрабатывает только проекты со статусом `sync_needed`, чтобы не делать лишние GitHub/API-вызовы по уже актуальным snapshot'ам;
- GitHub Actions workflow `.github/workflows/project-sync.yml` каждые 4 часа по UTC вызывает production route `/api/github-actions/project-sync`; route авторизуется через `PROJECT_SYNC_CRON_SECRET` и переиспользует тот же server-side batch helper, что и teacher-only кнопка массовой синхронизации;
- backend читает `memory_bank/projectbrief.md`, `productContext.md`, `activeContext.md`, `progress.md` и опциональный `docs/README.md` прямо из student GitHub repository;
- `completion_percent` считается детерминированно только по `## Project Deliverables` в `memory_bank/projectbrief.md`; допустим только табличный формат `ID | Deliverable | Status | Weight`, а deliverables без валидной суммы весов `100` не участвуют в расчете процента;
- commit metrics и флаг `abandoned` считаются по истории коммитов default branch;
- snapshot AI-анализа сохраняет явную причину, почему progress не считается корректно: отсутствует `projectbrief.md`, отсутствует секция `Project Deliverables`, deliverables не распарсились или сумма весов не равна `100`;
- AI используется только для нормализации summary, risks и next steps поверх уже рассчитанного snapshot;
- Vercel-приложение не ходит к модели напрямую по умолчанию: server-only клиент сначала вызывает token-protected Cloudflare Worker `/chat`, а уже Worker обращается к Workers AI `@cf/qwen/qwen3-30b-a3b-fp8` через binding `AI`; если Worker возвращает quota/error `4006` или gateway не сконфигурирован, server-only клиент может переключиться на Hugging Face Chat Completions через `HF_TOKEN`;
- до первого AI-анализа проект остается в нейтральном состоянии `данные отсутствуют`; флаги `missing_memory_bank`, `missing_spec` и `missing_plan` выставляются только после реального repo analysis;
- агрегированные metrics пишутся в `projects.project_state_json`, а история запусков — в `project_ai_reports`;
- полный текст `Project brief`, `Product context`, `Active context` и `Progress notes` внутри AI-отчета хранится в сжатом виде в `inputSnapshotJson`, чтобы detail page читал весь markdown и оставался в пределах лимита Appwrite.

## Data Isolation

- teacher repositories продолжают работать как раньше;
- student flow использует отдельные read/write entrypoints:
  - поиск ученика по `github_user_id`;
  - claim одноразового GitHub bind token;
  - выбор проекта только для `student_id` текущего ученика как владельца GitHub-репозитория;
  - чтение проектов ученика через `project_memberships`;
- `projects` и `project_ai_reports` остаются на компактных JSON-state полях из-за лимитов Appwrite.
- каскадное удаление student-проектов и самого ученика выполняется через общий cleanup-helper, который сначала удаляет связанные `project_memberships` и `project_ai_reports`, а затем сам `projects` документ.

## Appwrite Anti-Pause Pattern

- для `Appwrite Cloud Free` нельзя полагаться на API traffic как на защиту от pause, потому что Appwrite привязывает inactivity rule к Console activity;
- в репозитории подготовлен только operational workflow, а не bypass:
  - команда `bun run appwrite:keepalive` строит прямой URL в Console по `APPWRITE_ENDPOINT` и `APPWRITE_PROJECT_ID`;
  - команда открывает браузер и сохраняет локальный heartbeat в `.codex/appwrite-console-heartbeat.json`;
  - следующую проверку рекомендуется делать максимум через `6` дней.
