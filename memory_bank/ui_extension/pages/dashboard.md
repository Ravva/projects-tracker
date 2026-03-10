# Dashboard Page

## Назначение

Главный teacher-only экран продукта. Служит центром недельного контроля по посещаемости, рискам проектов и последним AI-отчетам.

## Основные зоны

- верхний app header с быстрыми действиями;
- sidebar-навигация по основным teacher-only разделам;
- hero-блок с ближайшим занятием и weekly focus;
- teacher-only кнопка ручной отправки weekly digest в Telegram преподавателя и отдельная кнопка перехода в `/attendance`;
- KPI-карточки по посещаемости, проектам и AI;
- список учеников, требующих действия;
- таблица проектов в зоне контроля;
- блок последних AI-отчетов и каналов контроля.

## Используемые компоненты

- `TeacherSidebar`
- `MetricCard`
- `SendWeeklyDigestButton`
- `Badge`
- `Button`
- `Card`
- `DropdownMenu`
- `Table`
- `Avatar`
- `Sidebar`

## Потоки данных

Страница читает агрегаты через server-side repositories `students`, `projects` и `attendance`, а доступ к ней закрыт teacher-only GitHub OAuth. Кнопка weekly digest вызывает server action, который собирает сводку по текущей неделе и отправляет её в Telegram преподавателя через `TEACHER_TELEGRAM_CHAT_ID`; успех и ошибки показываются в `FeedbackModal`. При отсутствии Appwrite-конфигурации или записей страница показывает пустые состояния без локального mock-слоя.
