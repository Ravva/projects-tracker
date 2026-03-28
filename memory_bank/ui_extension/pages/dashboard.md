# Dashboard Page

## Назначение

Главный teacher-only экран. Компактный обзор недели: KPI, проекты в зоне риска, ученики требующие внимания и последние AI-отчеты.

## Основные зоны

- header с кнопками `SendWeeklyDigestButton` и быстрым переходом в `/attendance`;
- строка из 4 KPI-карточек (нарушители, рисковые проекты, посещаемость, AI-отчеты);
- split-view: слева — таблица проектов в зоне контроля с датой ближайшего занятия, справа — списки "Требуют внимания" и "Последние AI-отчеты";
- все элементы кликабельны и ведут на соответствующие страницы.

## Используемые компоненты

- `TeacherShell`
- `SendWeeklyDigestButton`
- `StatusPill`
- `KpiCard` (локальный компонент)
- `Avatar`
- `Button`
- `Card`
- `Table`

## Потоки данных

Страница читает агрегаты через server-side repositories `students`, `projects` и `attendance`, доступ teacher-only через GitHub OAuth. Кнопка weekly digest вызывает server action для отправки сводки в Telegram.
