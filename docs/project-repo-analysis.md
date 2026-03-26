# Project Repo Analysis

## Цель

Перевести teacher-only анализ student-проектов с ручного `spec_markdown` / `plan_markdown` на чтение фактических данных из GitHub-репозитория ученика и сохранить единый AI-analysis для группового проекта с несколькими участниками.

## Источники данных

- выбранный student repository из `/my-project`;
- канонический project record, который может быть общим для нескольких учеников через `project_memberships`;
- `memory_bank/projectbrief.md`;
- `memory_bank/productContext.md`;
- `memory_bank/activeContext.md`;
- `memory_bank/progress.md`;
- опционально `docs/README.md` как архитектурный контекст;
- история коммитов default branch из GitHub API.

## Что считаем детерминированно

- подключен ли репозиторий;
- найден ли `memory_bank`;
- есть ли ТЗ:
  `projectbrief.md` и `productContext.md` должны содержать осмысленный контент;
- есть ли план:
  `activeContext.md` и `progress.md` должны содержать осмысленный контент;
- `completion_percent`:
  считается только по `## Project Deliverables` в `memory_bank/projectbrief.md`;
- `commitCount`;
- `commitsPerWeek`;
- `lastCommitAt`;
- `lastCommitDaysAgo`;
- `isAbandoned`:
  если последний коммит старше 7 дней.

## Правила расчета progress

1. В `memory_bank/projectbrief.md` ищется секция `## Project Deliverables`.
2. Канонически секция должна быть оформлена как Markdown-таблица с колонками `ID | Deliverable | Status | Weight`.
3. Для обратной совместимости parser также принимает legacy-блоки вида `### DLV-001: Название` с многострочными полями `ID`, `Название`, `Статус`, `Вес`.
4. Допустимые статусы только канонические: `completed`, `in_progress`, `pending`, `blocked`.
5. Сумма всех `Weight` должна быть ровно `100`.
6. В progress идет только сумма `Weight` строк со статусом `completed`.
7. Если секция отсутствует, не парсится или сумма весов не равна `100`, процент считается невалидным и остается `0`.

## Роль AI

AI не определяет процент реализации и не меняет rule-based флаги. AI получает уже рассчитанный snapshot и возвращает только:

- `summary`;
- `next_steps`;
- `implemented_items`;
- `partial_items`;
- `missing_items`;
- `risks` как текстовые наблюдения.

До первого запуска AI-анализа teacher UI не должен показывать `missing_memory_bank`, `missing_spec` или `missing_plan`.
В этом состоянии отображается нейтральный статус `данные отсутствуют`, потому что проверка репозитория еще не выполнялась.

## Risk Flags

- `invalid_github_repo`:
  репозиторий невалиден, недоступен или GitHub API не отдал данные;
- `missing_memory_bank`:
  в репозитории не найдено ни одного ключевого файла `memory_bank`;
- `missing_spec`:
  нет осмысленного ТЗ;
- `missing_plan`:
  нет осмысленного плана;
- `abandoned`:
  нет коммитов больше 7 дней;
- `low_progress`:
  progress ниже 25% при наличии задач.

## Диагностика progress

В snapshot дополнительно сохраняется machine-readable причина, почему `completion_percent` не рассчитан корректно:

- отсутствует `memory_bank/projectbrief.md`;
- отсутствует секция `## Project Deliverables`;
- секция есть, но deliverables не распарсились;
- сумма `Weight` не равна `100`.

## Сохранение результата

- агрегированное состояние пишется в `projects.project_state_json`;
- AI snapshot, progress и risk считаются один раз на project record и шарятся между всеми участниками группового проекта;
- история каждого запуска сохраняется в `project_ai_reports`;
- полный snapshot `Project brief`, `Product context`, `Active context` и `Progress notes` хранится внутри `report_payload_json.inputSnapshotJson` в сжатом виде, чтобы detail page мог показать весь текст и не упереться в лимит Appwrite;
- teacher UI показывает summary, task metrics, commit metrics и список источников.
