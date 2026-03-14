# Project Repo Analysis

## Цель

Перевести teacher-only анализ student-проектов с ручного `spec_markdown` / `plan_markdown` на чтение фактических данных из GitHub-репозитория ученика.

## Источники данных

- выбранный student repository из `/my-project`;
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
  считается по уникальным задачам, извлеченным из `activeContext.md` и `progress.md`;
- `commitCount`;
- `commitsPerWeek`;
- `lastCommitAt`;
- `lastCommitDaysAgo`;
- `isAbandoned`:
  если последний коммит старше 7 дней.

## Правила расчета progress

1. Из `activeContext.md` читается секция `## Задача в работе`.
2. Буллеты со статусами `закрыто`, `выполнено`, `завершено` считаются completed.
3. Буллеты со статусами `в работе`, `начат`, `начата` считаются in progress.
4. Остальные буллеты этой секции считаются pending.
5. Из `progress.md` секция `## Changelog` читается как completed milestones.
6. Повторяющиеся задачи дедуплицируются по нормализованному тексту.
7. `completion_percent = completed / total_unique_tasks * 100`, округление до целого.

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

## Сохранение результата

- агрегированное состояние пишется в `projects.project_state_json`;
- история каждого запуска сохраняется в `project_ai_reports`;
- полный snapshot `Project brief`, `Product context`, `Active context` и `Progress notes` хранится внутри `report_payload_json.inputSnapshotJson` в сжатом виде, чтобы detail page мог показать весь текст и не упереться в лимит Appwrite;
- teacher UI показывает summary, task metrics, commit metrics и список источников.
