# My Project Page

## Назначение

`/my-project` — первый student-only экран продукта. Он нужен ученику для выбора собственного GitHub-репозитория и создания draft-проекта без доступа к teacher-only модулям.

## Основные блоки

- hero-блок с пояснением student-access сценария;
- список уже выбранных проектов текущего ученика;
- список GitHub-репозиториев владельца, полученных по OAuth access token;
- кнопка `Выбрать проект`, которая создает draft-проект через server action и сразу запускает teacher-side AI-анализ.

## Данные и поток

- доступ требует `requireStudentSession`;
- текущие student projects читаются через `listProjectsByStudentId`;
- GitHub repositories читаются через `listGithubRepositoriesForStudent`;
- выбор репозитория вызывает `chooseStudentProjectAction`, которая создает проект только для текущего `student_id` и пытается сразу собрать первый AI-snapshot.

## Ограничения UX

- student не видит dashboard, attendance, students и teacher review routes;
- один и тот же `github_url` нельзя выбрать повторно для той же карточки ученика;
- teacher-only редактирование метаданных проекта остается в `/projects` и `/projects/[projectId]`.
