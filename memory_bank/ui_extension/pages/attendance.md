# Attendance Page

## Назначение

Teacher-only weekly workspace для контроля посещаемости.

## Маршрут

- `/attendance`

## Основные зоны

- weekly cards по трем плановым занятиям;
- таблица attendance grid по ученикам;
- правый блок с нарушителями недели.

## Потоки данных

Страница читает weekly lessons и student records через server-side repositories. При отсутствии Appwrite-конфигурации или записей показывает empty states; следующий этап - реальные weekly snapshots и массовые действия записи attendance.
