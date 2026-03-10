# Telegram Link Card

## Назначение

Teacher-only карточка на странице ученика для автоматической привязки `telegram_chat_id` через персональную deep-link ссылку бота.

## Поведение

- показывает статус `не приглашён / ждёт Start / привязан`;
- выпускает или перевыпускает персональную ссылку `t.me/<bot>?start=<token>`;
- копирует invite-link в буфер обмена;
- объясняет teacher-only flow: отправить ссылку ученику, дождаться `Start`, затем использовать уже сохранённый `chat_id`;
- после успешной привязки показывает текущий `telegram_chat_id` и время привязки.

## Зависимости

- `src/app/students/actions.ts`
- `src/lib/server/telegram-linking.ts`
- `src/components/ui/feedback-modal.tsx`
