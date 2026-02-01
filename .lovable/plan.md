# ✅ РЕАЛИЗОВАНО: Стабилизация UI звонков для Telegram Mini App

## Что было сделано

### 1. UI-lock в VideoCallContext
- Добавлен флаг `isCallUiActive` который активируется **ДО** `getUserMedia()`
- Флаг сбрасывается только при явном завершении/отклонении звонка
- Это гарантирует что UI остаётся видимым во время permission prompt

### 2. Portal-рендеринг в GlobalCallOverlay  
- Используется `createPortal(component, document.body)` 
- Обходит проблемы iOS WebView с fixed-позиционированием внутри контейнеров с transform/overflow

### 3. Защита от visibility events
- Добавлены обработчики `visibilitychange`, `pagehide`, `pageshow`
- Если звонок активен (`isCallActiveRef.current`), cleanup НЕ вызывается при скрытии страницы
- Критично для Telegram Mini App где permission prompt вызывает visibility change

### 4. Диагностика cleanup
- Функция `cleanup(reason)` теперь принимает причину
- Все вызовы cleanup логируют причину: `cleanup("start_call_error")`, `cleanup("call_timeout")` и т.д.
- Легко отследить что именно сбросило состояние

## Проверка
1. Инициатор: Позвонить → Разрешить микрофон → окно НЕ должно исчезать
2. В логах должно быть:
   - `[VideoCallContext] startCall: Activating UI-lock BEFORE startVideoCall`
   - `[VideoCall] getUserMedia SUCCESS`
   - НЕ должно быть `cleanup(...)` сразу после getUserMedia
