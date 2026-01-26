
# План: Автоматическое обновление списка чатов при новых сообщениях

## Проблема
Когда вы отправляете пост в чат (через "Поделиться"), сообщение успешно отправляется и `updated_at` разговора обновляется в базе данных. Однако список чатов на странице не обновляется в реальном времени — разговор не перемещается наверх, пока вы не обновите страницу вручную.

## Решение
Добавить realtime-подписки на таблицы `conversations`, `group_chats` и `channels`, чтобы при изменении `updated_at` автоматически перезагружать список и пересортировывать чаты.

---

## Технические изменения

### 1. Обновить useConversations (src/hooks/useChat.tsx)
Добавить realtime-подписку на таблицу `conversations` для отслеживания UPDATE событий:

```typescript
// Подписка на обновления conversations
useEffect(() => {
  if (!user) return;
  
  const channel = supabase
    .channel('conversations-updates')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'conversations',
      },
      () => {
        // При обновлении любого разговора — перезагружаем список
        fetchConversations();
      }
    )
    .subscribe();
    
  return () => {
    supabase.removeChannel(channel);
  };
}, [user, fetchConversations]);
```

### 2. Обновить useGroupChats (src/hooks/useGroupChats.tsx)
Аналогичная подписка на таблицу `group_chats`:

```typescript
useEffect(() => {
  if (!user) return;
  
  const channel = supabase
    .channel('group-chats-updates')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'group_chats',
      },
      () => {
        fetchGroups();
      }
    )
    .subscribe();
    
  return () => {
    supabase.removeChannel(channel);
  };
}, [user, fetchGroups]);
```

### 3. Обновить useChannels (src/hooks/useChannels.tsx)
Аналогичная подписка на таблицу `channels`:

```typescript
useEffect(() => {
  if (!user) return;
  
  const channel = supabase
    .channel('channels-updates')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'channels',
      },
      () => {
        fetchChannels();
      }
    )
    .subscribe();
    
  return () => {
    supabase.removeChannel(channel);
  };
}, [user, fetchChannels]);
```

---

## Результат
После этих изменений:
- Когда вы делитесь постом с кем-то — этот чат сразу переместится наверх списка
- Когда кто-то пишет вам — чат также автоматически поднимется наверх
- Когда вы пишете в группу или канал — они тоже обновятся в реальном времени

## Затронутые файлы
- `src/hooks/useChat.tsx` — добавить realtime-подписку на conversations
- `src/hooks/useGroupChats.tsx` — добавить realtime-подписку на group_chats
- `src/hooks/useChannels.tsx` — добавить realtime-подписку на channels
