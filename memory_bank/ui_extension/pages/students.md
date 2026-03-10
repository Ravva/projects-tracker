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
- teacher-only редактирование заметки и `telegram_chat_id` с явными счетчиками символов;
- просмотр `github_user_id`, `github_username`, `telegram_username`, `telegram_chat_id`;
- Telegram notification card показывает лимит 4096 символов, предупреждение про `/start` и более точные ошибки валидации при отправке;
- правый сайд-блок со статусом недели и контрольными сигналами.

## Потоки данных

Модуль читает и изменяет данные через server-side repository `students` и server actions. Создание, редактирование и удаление уже подключены; при отсутствии Appwrite-конфигурации или записей страница показывает empty states.
