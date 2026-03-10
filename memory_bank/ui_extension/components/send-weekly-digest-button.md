# Send Weekly Digest Button

## Назначение

Teacher-only action-кнопка на dashboard для ручной отправки weekly digest преподавателю в Telegram.

## Поведение

- запускает `sendTeacherWeeklyDigestAction`;
- на время отправки блокирует повторный клик и показывает pending-состояние;
- при успехе открывает `FeedbackModal` со сводкой по неделе, attendance и рисковым проектам;
- при ошибке открывает `FeedbackModal` с диагностическим текстом.

## Зависимости

- `src/app/dashboard-actions.ts`
- `src/lib/server/teacher-weekly-digest.ts`
- `src/components/ui/feedback-modal.tsx`
