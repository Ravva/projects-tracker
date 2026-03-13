# Projects Tracker

## Цель проекта

`Projects Tracker` - внутренний сервис преподавателя для учета посещаемости, контроля ученических GitHub-проектов и AI-оценки прогресса реализации.

## Границы MVP

- доступ только для преподавателя;
- авторизация только через GitHub OAuth;
- занятия создаются по фиксированному шаблону: вторник, четверг, пятница;
- внеплановых занятий нет;
- ученики не входят в систему;
- ученические Telegram-уведомления и weekly digest преподавателю поддерживаются через Telegram Bot API;
- AI-анализ доступен только при наличии ТЗ и плана разработки.

## Future-ready направления

- подготовить модель доступа для будущей роли `student`;
- связывать будущий student-access c GitHub через стабильный `github_user_id`;
- дать ученику возможность после входа выбрать свой репозиторий из списка репозиториев GitHub.

## Project Deliverables

| ID | Deliverable | Status | Weight |
| --- | --- | --- | --- |
| PT-01 | Teacher auth и role guard для teacher-only маршрутов | completed | 12 |
| PT-02 | Teacher workspace для студентов с CRUD и массовой Telegram-рассылкой | completed | 14 |
| PT-03 | Weekly attendance workspace с реальной записью в Appwrite | completed | 14 |
| PT-04 | Student bind flow через Telegram и GitHub OAuth | completed | 12 |
| PT-05 | Student page `/my-project` и создание draft-проекта из GitHub repository | completed | 10 |
| PT-06 | Teacher workspace для проектов, GitHub sync и review-страницы | completed | 10 |
| PT-07 | AI-analysis pipeline проекта с отчетами, risk flags и устойчивым расчетом прогресса | in_progress | 14 |
| PT-08 | Production hardening, deployment и полная smoke-проверка teacher/student сценариев | in_progress | 8 |
| PT-09 | Стабилизация документации и Memory Bank как надежного источника прогресса проекта | in_progress | 6 |
