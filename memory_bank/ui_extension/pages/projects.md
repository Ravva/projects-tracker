# Projects Page

## Назначение

Teacher-only список проектов с фокусом на рисках и стадии progress review.

## Маршрут

- `/projects`
- `/projects/[projectId]`

## Основные зоны

- toolbar с действиями `GitHub sync` и `Новый проект`;
- таблица списка проектов;
- форма создания проекта;
- правая review-панель с акцентом на metadata и Markdown-артефакты.

### `/projects/[projectId]`

- teacher-only review workspace конкретного проекта;
- overview с GitHub metadata и review status;
- табличные индикаторы `Repo sync` и `AI`, которые отдельно показывают новый commit в GitHub и актуальность AI-report;
- верхняя teacher-only кнопка `Синхронизировать все`, которая массово обновляет все stale-проекты и показывает итоговую сводку;
- отдельные панели `spec_markdown` и `plan_markdown`;
- AI summary и блок `next steps`;
- действия `Sync GitHub`, `Run AI analysis`, `Set/Clear override`, `Delete project`; `Sync GitHub` автоматически перезапускает AI-анализ после обновления metadata.

## Потоки данных

Модуль читает список и detail проекта через server-side repository `projects` и пишет изменения через server actions. Для списка выполняется live-check последнего commit в GitHub, чтобы показать stale snapshots. GitHub sync обновляет metadata и последний commit, затем автоматически повторяет AI-анализ; сам AI-анализ создает immutable report и сбрасывает ручной override после завершения.
