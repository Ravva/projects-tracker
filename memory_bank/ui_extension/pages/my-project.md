# My Project Page

## Назначение

`/my-project` — первый student-only экран продукта. Он нужен ученику для выбора собственного GitHub-репозитория, создания draft-проекта и просмотра групповых проектов, в которых он состоит участником, без доступа к teacher-only модулям.

## Основные блоки

- hero-блок с пояснением student-access сценария;
- список уже выбранных проектов текущего ученика, включая групповые;
- список GitHub-репозиториев владельца, полученных по OAuth access token;
- кнопка `Выбрать проект`, которая создает draft-проект через server action и сразу запускает teacher-side AI-анализ.

## Данные и поток

- доступ требует `requireStudentSession`;
- текущие student projects читаются через `listProjectsByStudentId`;
- GitHub repositories читаются через `listGithubRepositoriesForStudent`;
- выбор репозитория вызывает `chooseStudentProjectAction`, которая создает проект для текущего владельца GitHub-репозитория, создает owner-membership и пытается сразу собрать первый AI-snapshot.

## Ограничения UX

- student не видит dashboard, attendance, students и teacher review routes;
- один и тот же `github_url` нельзя выбрать повторно для той же карточки ученика;
- если репозиторий уже привязан к существующему проекту, второй ученик не должен создавать дубль и подключается преподавателем к общему проекту;
- teacher-only редактирование метаданных проекта остается в `/projects` и `/projects/[projectId]`.
