

# Полная доработка каналов (Telegram-style)

## Проблемы

1. **Владелец не может писать** -- в ChannelConversation нет поля ввода сообщений и кнопки прикрепления фото. Интерфейс показывает только ленту постов без возможности публикации
2. **Нет настроек канала** -- нажатие на название/фото канала ничего не делает. Нет экрана с информацией о канале, списком подписчиков, редактированием
3. **Закрепленное сообщение -- заглушка** -- "Закреплённое сообщение" всегда показывает один и тот же текст-заглушку

## Что будет сделано

### 1. Поле ввода для владельца/админа канала

В `ChannelConversation.tsx` добавляется проверка роли: если пользователь -- владелец или админ канала, внизу отображается полноценная панель ввода (текст + кнопка прикрепления фото/медиа + кнопка отправки). Для обычных подписчиков остается текущий вид без поля ввода.

- Определение роли через запрос к `channel_members` (role = 'owner' или 'admin')
- Поле ввода текста с кнопкой Send
- Кнопка прикрепления файлов (загрузка в storage bucket `chat-media`, отправка media_url)
- Обновление `sendMessage` в `useChannels.tsx` для поддержки медиа

### 2. Экран настроек канала (ChannelInfoSheet)

Новый компонент `src/components/chat/ChannelInfoSheet.tsx`, аналогичный `GroupInfoSheet`:

- Аватар канала (большой, по центру)
- Название и описание
- Количество подписчиков
- Кнопки действий: Уведомления, Поиск
- Кнопка "Редактировать" (для owner/admin) -- открывает ChannelEditSheet
- Список подписчиков с ролями (owner, admin, member)
- Кнопка "Добавить подписчика" (для owner/admin)
- Кнопка "Покинуть канал" (для не-владельцев)
- Управление участниками: назначение админов, удаление (только owner)

### 3. Экран редактирования канала (ChannelEditSheet)

Новый компонент `src/components/chat/ChannelEditSheet.tsx`:

- Смена аватара (загрузка в bucket `chat-media`)
- Редактирование названия
- Редактирование описания
- Кнопка "Готово" для сохранения

### 4. Хук управления каналом (useChannelManagement)

Новый хук `src/hooks/useChannelManagement.tsx`, аналогичный `useGroupManagement`:

- `updateChannel(channelId, { name, description, avatar_url })`
- `addMember(channelId, userId)`
- `removeMember(channelId, userId)`
- `updateMemberRole(channelId, userId, role)`
- `uploadChannelAvatar(channelId, file)`
- `getChannelRole(channelId)` -- получить роль текущего пользователя

### 5. Хук для участников канала (useChannelMembers)

Добавление в `useChannels.tsx` функции `useChannelMembers(channelId)` для получения списка участников с профилями, аналогично `useGroupMembers`.

### 6. Убрать заглушку закрепленного сообщения

Заменить статичный текст "Закреплённое сообщение" на условное отображение: показывать только если есть реально закрепленное сообщение (пока скрыть, т.к. функция пиннинга -- отдельная фича).

### 7. Интеграция в ChannelConversation

- Сделать заголовок (аватар + название) кликабельным -- открывает ChannelInfoSheet
- Добавить state для открытия ChannelInfoSheet
- Передавать обновленные данные канала после редактирования

## Технические детали

### База данных (миграция)

Нужно добавить UPDATE-политику для `channel_members`, чтобы владелец мог менять роли:

```text
-- Allow channel owners to update member roles
CREATE POLICY "cm_owner_update" ON public.channel_members
FOR UPDATE USING (
  is_channel_admin(channel_id, auth.uid())
);

-- Allow admins to add new members  
CREATE POLICY "cm_admin_insert" ON public.channel_members
FOR INSERT WITH CHECK (
  is_channel_admin(channel_id, auth.uid())
);

-- Allow admins to remove members
CREATE POLICY "cm_admin_delete" ON public.channel_members
FOR DELETE USING (
  is_channel_admin(channel_id, auth.uid())
);
```

Также нужно добавить UPDATE-политику на `channel_messages` для владельца (для будущего редактирования) и DELETE-политику:

```text
CREATE POLICY "cm_admin_delete_msg" ON public.channel_messages
FOR DELETE USING (
  is_channel_admin(channel_id, auth.uid())
);
```

### Новые файлы

- `src/hooks/useChannelManagement.tsx` -- хук для CRUD операций канала
- `src/components/chat/ChannelInfoSheet.tsx` -- экран профиля канала
- `src/components/chat/ChannelEditSheet.tsx` -- экран редактирования канала

### Изменяемые файлы

- `src/components/chat/ChannelConversation.tsx` -- полная переработка: добавление поля ввода для owner/admin, кликабельный заголовок, медиа-отправка, убрать заглушки
- `src/hooks/useChannels.tsx` -- добавить `useChannelMembers`, расширить `sendMessage` для медиа, добавить функцию определения роли пользователя

### Стилистика

Все компоненты в стиле существующего дизайна:
- BrandBackground с анимированными орбами
- Glassmorphism (backdrop-blur-xl, bg-black/20, border-white/10)
- Акцентный цвет: `#6ab3f3`
- Full-screen overlay компоненты с z-index 210+

