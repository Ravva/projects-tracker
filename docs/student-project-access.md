# Student Project Access

## Цель

Добавить безопасный student-access через GitHub OAuth, чтобы ученик после подтверждения личности через Telegram мог войти в приложение, выбрать свой GitHub-репозиторий как новый проект и участвовать в групповом проекте с общим репозиторием.

## Бизнес-результат

- преподаватель перестает вручную связывать GitHub-аккаунт ученика по изменяемому username;
- ученик получает self-service сценарий выбора проекта;
- преподаватель может подключить второго ученика к уже существующему project record без дублирования репозитория и AI-отчетов;
- teacher-only контроль attendance, student profile и ручных оценок сохраняется.

## Основной flow

1. Преподаватель выпускает персональную Telegram deep-link из карточки ученика.
2. Ученик нажимает `Start` в боте.
3. Сервер сохраняет подтвержденный `telegram_chat_id` и выдает одноразовый `github_link_token`.
4. Бот отправляет ученику ссылку на GitHub login.
5. После GitHub OAuth маршрут `/student/link` связывает ученика по стабильному `github_user_id`.
6. Ученик попадает на `/my-project` и видит только свои GitHub-репозитории.
7. Выбранный репозиторий создается как `draft`-проект в `projects`.
8. Если проект выполняется в паре, преподаватель добавляет второго ученика в этот же project record через teacher-only detail page проекта.
9. После teacher-only AI-анализа проект автоматически переводится в `active`, если в репозитории найдены `memory_bank`, осмысленные `spec/plan` и валидный repository snapshot.

## Ограничения доступа

- teacher по-прежнему управляет маршрутами `/`, `/students`, `/attendance`, `/projects`;
- student имеет доступ только к `/my-project`;
- привязка идет только по `github_user_id`, не по `github_username`;
- один `github_link_token` одноразовый и имеет срок действия.
- второй ученик группы не создает отдельный duplicate project: он получает доступ к общему проекту через membership, который добавляет преподаватель.

## Технические решения

- auth построен на `next-auth` + GitHub OAuth;
- teacher определяется по `TEACHER_GITHUB_USER_ID` или fallback `TEACHER_GITHUB_LOGIN`;
- student определяется поиском в Appwrite `students.github_user_id`;
- для bind flow в `students` добавлены поля `github_link_token` и `github_link_expires_at`;
- список student repositories читается из GitHub API по OAuth access token;
- student может создать проект только из собственного GitHub repository list;
- коллекция `project_memberships` хранит участие учеников в одном каноническом проекте;
- teacher-only detail page проекта добавляет и удаляет участников, не создавая второй project record;
- выбор нового проекта сериализуется per-student блокировкой, чтобы два параллельных запроса не создали несколько текущих проектов одновременно.

## Не входит в текущий этап

- student editing профиля;
- student editing attendance;
- student доступ к teacher dashboard;
- полноценный student CRUD по нескольким проектам с ручным редактированием полей проекта.
