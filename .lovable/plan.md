

## Проблема

Сторис в чатах показываются **развёрнутыми** при первой загрузке, хотя должны быть **свёрнутыми** изначально (как на скриншоте — маленькие аватарки в стопке).

### Причина
1. `useScrollCollapse` инициализирует `scrollY = 0` 
2. При `scrollY = 0` → `collapseProgress = 0` → сторис развёрнуты
3. `useEffect` устанавливает `scrollTop = 100` **после** первого рендера
4. Первый кадр показывает развёрнутые сторис, потом они резко сворачиваются

## Решение

### 1. Изменить начальное значение `scrollY` в `useScrollCollapse`

**Файл:** `src/hooks/useScrollCollapse.tsx`

Добавить параметр `initialCollapsed: boolean = false`. Если `true`, начальное значение `scrollY` будет равно `threshold`, чтобы сторис рендерились свёрнутыми с первого кадра.

```typescript
export function useScrollCollapse(threshold: number = 50, initialCollapsed: boolean = false) {
  const containerRef = useScrollContainer();
  const [scrollY, setScrollY] = useState(initialCollapsed ? threshold : 0);
  // ...
}
```

### 2. Обновить `ChatStories` — передать `initialCollapsed: true`

**Файл:** `src/components/chat/ChatStories.tsx`

```typescript
const { collapseProgress } = useScrollCollapse(SCROLL_THRESHOLD, true);
```

### 3. Синхронная установка `scrollTop` в `ChatsPage`

**Файл:** `src/pages/ChatsPage.tsx`

Использовать `useLayoutEffect` вместо `useEffect` для синхронной установки `scrollTop = 100` **до** первого рендера браузером:

```typescript
import { useLayoutEffect } from "react";

// Заменить useEffect на useLayoutEffect
useLayoutEffect(() => {
  if (chatListRef.current && !selectedConversation) {
    chatListRef.current.scrollTop = 100;
  }
}, [selectedConversation]);
```

---

## Итог

После изменений:
- Сторис рендерятся **свёрнутыми** с первого кадра (как на скриншоте Telegram)
- При скролле списка чатов **вверх** (до `scrollTop = 0`) — сторис плавно разворачиваются
- При скролле **вниз** — сторис снова сворачиваются в стопку
- Никакого "прыжка" при загрузке страницы

