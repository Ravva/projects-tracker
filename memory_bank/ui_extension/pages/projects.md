# Projects Page

## Назначение

Teacher-only список проектов с фокусом на рисках и стадии progress review.

## Маршрут

- `/projects`
- `/projects/[projectId]`

## Основные зоны

- toolbar с действиями `GitHub sync` и `Новый проект`;
- таблица списка проектов;
- правая review-панель с акцентом на metadata и Markdown-артефакты.

### `/projects/[projectId]`

- teacher-only review workspace конкретного проекта;
- overview с GitHub metadata и review status;
- отдельные панели `spec_markdown` и `plan_markdown`;
- AI summary и блок `next steps`.

## Потоки данных

Модуль читает список и detail проекта через server-side repository `projects`. При отсутствии Appwrite-конфигурации или записей показывает empty states; следующий этап - связать project detail с реальными sync/AI actions.
