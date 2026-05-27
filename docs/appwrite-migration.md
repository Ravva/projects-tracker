# Миграция Appwrite Database

## Обзор

Этот документ описывает процесс миграции данных с облачного Appwrite на локальный сервер.

## Предварительные требования

1. Доступ к облачному Appwrite проекту:
   - Endpoint: `https://cloud.appwrite.io/v1`
   - Project ID: `6a16b1a80039cd5cbb93`
   - API Key с правами на чтение всех коллекций

2. Локальный Appwrite сервер:
   - Endpoint: `https://aw.note-canopus.ts.net/v1`
   - Project ID: `6a16b1a80039cd5cbb93`
   - API Key с правами на создание базы данных и запись документов

3. Установленные зависимости: `bun install`

## Подготовка

### 1. Создание API ключей

**Облачный Appwrite:**
1. Откройте Console: https://cloud.appwrite.io/console/project-6a16b1a80039cd5cbb93
2. Перейдите в Settings → API Keys
3. Создайте новый API Key с правами:
   - `databases.read`
   - `collections.read`
   - `documents.read`
4. Скопируйте ключ

**Локальный Appwrite:**
1. Откройте Console: https://aw.note-canopus.ts.net/console/project-6a16b1a80039cd5cbb93
2. Перейдите в Settings → API Keys
3. Создайте новый API Key с правами:
   - `databases.write`
   - `collections.write`
   - `documents.write`
4. Скопируйте ключ

### 2. Настройка переменных окружения

Создайте или обновите файл `.env`:

```env
CLOUD_APPWRITE_API_KEY=your_cloud_api_key_here
LOCAL_APPWRITE_API_KEY=your_local_api_key_here
```

### 3. Подготовка локальной базы данных

Убедитесь, что на локальном сервере созданы все необходимые коллекции:

```bash
bun run db:provision
```

Эта команда создаст:
- База данных: `projects-tracker`
- Коллекции: `students`, `lessons`, `attendance`, `projects`, `project_memberships`, `project_selection_locks`, `project_ai_reports`
- Все необходимые атрибуты и индексы

## Процесс миграции

### Запуск миграции

```bash
bun run appwrite:migrate
```

### Что происходит во время миграции

1. **Подключение к серверам**: Скрипт устанавливает соединение с облачным и локальным Appwrite
2. **Проверка базы данных**: Проверяется наличие базы `projects-tracker` на локальном сервере
3. **Экспорт данных**: Для каждой коллекции:
   - Выполняется постраничное чтение документов (по 1000 за раз)
   - Документы сохраняются в памяти
4. **Импорт данных**: Для каждой коллекции:
   - Документы записываются на локальный сервер
   - Сохраняются оригинальные ID документов
   - Прогресс выводится каждые 100 документов

### Мониторинг процесса

Скрипт выводит подробные логи:

```
Starting Appwrite database migration...

Local database projects-tracker exists
Exporting collection: students
Exported 25 documents from students
Importing 25 documents to students
Completed import to students
...
Migration completed!
```

### Обработка ошибок

- Если документ не удается импортировать, ошибка логируется, но процесс продолжается
- Пустые коллекции пропускаются автоматически
- Таймаут на импорт одного документа: 60 секунд

## Проверка результата

### 1. Через Appwrite Console

Откройте локальный Console и проверьте количество документов в каждой коллекции:

https://aw.note-canopus.ts.net/console/project-6a16b1a80039cd5cbb93/databases/database-projects-tracker

### 2. Через приложение

1. Обновите `.env` приложения:
   ```env
   APPWRITE_ENDPOINT=https://aw.note-canopus.ts.net/v1
   APPWRITE_PROJECT_ID=6a16b1a80039cd5cbb93
   APPWRITE_API_KEY=your_local_api_key_here
   ```

2. Запустите приложение:
   ```bash
   bun run dev
   ```

3. Проверьте основные функции:
   - Список учеников
   - Посещаемость
   - Проекты

## Откат

Если миграция прошла неудачно:

1. Удалите базу данных на локальном сервере через Console
2. Пересоздайте схему: `bun run db:provision`
3. Повторите миграцию: `bun run appwrite:migrate`

## Известные ограничения

- Скрипт не мигрирует файлы из Storage (если они есть)
- Скрипт не мигрирует пользователей и сессии
- Скрипт не мигрирует настройки проекта
- При больших объемах данных (>10000 документов) процесс может занять несколько минут

## Troubleshooting

### Ошибка: "CLOUD_APPWRITE_API_KEY is required"

Убедитесь, что в `.env` файле указан `CLOUD_APPWRITE_API_KEY`.

### Ошибка: "Collection not found"

Запустите `bun run db:provision` перед миграцией.

### Ошибка: "Document already exists"

Если миграция была прервана и вы запускаете её повторно, некоторые документы могут уже существовать. Удалите базу данных и пересоздайте схему.

### Медленная миграция

- Проверьте скорость сети до локального сервера
- Увеличьте таймаут в скрипте (по умолчанию 60 секунд)
- Уменьшите размер пачки (по умолчанию 1000 документов)
