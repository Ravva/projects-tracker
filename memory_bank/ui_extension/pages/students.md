# Students Pages

## Назначение

Teacher-only модуль управления учениками.

## Маршруты

- `/students` - список учеников, teacher-only таблица и быстрый переход к редактированию;
- `/students/[studentId]` - teacher-only страница редактирования карточки ученика.

## Основные зоны

### `/students`

- toolbar с действиями `Импорт XLSX` и `Добавить ученика`;
- teacher-only таблица с GitHub и Telegram данными;
- статусы weekly attendance;
- переход к редактированию карточки.

### `/students/[studentId]`

- карточка профиля;
- teacher-only редактирование заметки;
- просмотр `github_user_id`, `github_username`, `telegram_username`, `telegram_chat_id`;
- правый сайд-блок со статусом недели и контрольными сигналами.

## Потоки данных

Пока модуль использует mock-данные из `src/lib/mock-data.ts`. Следующий этап - заменить их на Appwrite CRUD.
