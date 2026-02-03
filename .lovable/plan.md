
# План: Исправление "призрачных" звонков

## Проблема

При входе в приложение показываются входящие звонки от пользователей, которых нет в сети. Причина:

1. В базе данных остался звонок со статусом `ringing` от **1 февраля** (более 24 часов назад)
2. Polling-механизм (`useIncomingCalls`) каждые 2 секунды находит этот старый звонок
3. Нет проверки на возраст звонка — старые "зависшие" звонки показываются как актуальные
4. Функция `check_missed_calls()` существует, но не вызывается автоматически

## Решение

### Этап 1: Немедленная очистка старых звонков

Выполнить SQL для очистки всех зависших звонков старше 60 секунд:

```sql
UPDATE video_calls 
SET status = 'missed', ended_at = NOW() 
WHERE status = 'ringing' 
AND created_at < NOW() - INTERVAL '60 seconds';
```

### Этап 2: Добавить проверку возраста в polling

В `useIncomingCalls.ts` — игнорировать звонки старше 60 секунд:

```typescript
const { data: ringingCalls } = await supabase
  .from("video_calls")
  .select("*")
  .eq("callee_id", user.id)
  .eq("status", "ringing")
  .gt("created_at", new Date(Date.now() - 60000).toISOString()) // Только последние 60 сек
  .order("created_at", { ascending: false })
  .limit(1);
```

### Этап 3: Автоочистка при загрузке

При инициализации хука — автоматически помечать свои старые звонки как `missed`:

```typescript
useEffect(() => {
  if (!user) return;
  
  // Очистить зависшие звонки при загрузке
  const cleanupStaleRingingCalls = async () => {
    const cutoff = new Date(Date.now() - 60000).toISOString();
    await supabase
      .from("video_calls")
      .update({ status: "missed", ended_at: new Date().toISOString() })
      .eq("callee_id", user.id)
      .eq("status", "ringing")
      .lt("created_at", cutoff);
  };
  
  cleanupStaleRingingCalls();
  // ... остальной код
}, [user]);
```

### Этап 4: Добавить проверку при получении через Realtime

Даже для INSERT событий — проверять что звонок свежий:

```typescript
.on("postgres_changes", { event: "INSERT", ... }, async (payload) => {
  const call = payload.new as VideoCall;
  const callAge = Date.now() - new Date(call.created_at).getTime();
  
  // Игнорировать звонки старше 60 секунд
  if (callAge > 60000 || call.status !== "ringing") return;
  
  await processIncomingCall(call);
})
```

---

## Файлы для изменения

| Файл | Изменения |
|------|-----------|
| `src/hooks/useIncomingCalls.ts` | Добавить фильтр по возрасту, автоочистку при загрузке |
| SQL миграция | Очистить существующие зависшие звонки |
| `src/components/dev/BugsTab.tsx` | Добавить этот баг в список |

---

## Результат

После исправления:
- Старые "призрачные" звонки не будут показываться
- При входе в приложение зависшие звонки автоматически очищаются
- Только звонки младше 60 секунд будут отображаться как входящие
