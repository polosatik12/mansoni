

## Цель
Сторис в чатах должны быть **свёрнутыми** с первого кадра (как в Telegram), без "прыжка" из развёрнутого состояния.

## Причина проблемы

Сейчас происходит:
1. `useScrollCollapse` инициализирует `scrollY = 0` (строка 6)
2. При `scrollY = 0` → `collapseProgress = 0` → сторис **развёрнуты**
3. `useEffect` устанавливает `scrollTop = 100` **после** первого рендера (строка 38-43)
4. Результат: первый кадр показывает развёрнутые сторис → резкое сворачивание

## План изменений

### 1. Добавить параметр `initialCollapsed` в `useScrollCollapse`

**Файл:** `src/hooks/useScrollCollapse.tsx`

Добавить второй параметр `initialCollapsed: boolean = false`. Если `true`, начальное значение `scrollY` будет равно `threshold`, чтобы `collapseProgress = 1` с первого кадра.

```typescript
export function useScrollCollapse(threshold: number = 50, initialCollapsed: boolean = false) {
  const containerRef = useScrollContainer();
  const [scrollY, setScrollY] = useState(initialCollapsed ? threshold : 0);
  // ...остальной код без изменений
}
```

### 2. Передать `initialCollapsed: true` в `ChatStories`

**Файл:** `src/components/chat/ChatStories.tsx`

```typescript
// Было:
const { collapseProgress } = useScrollCollapse(SCROLL_THRESHOLD);

// Станет:
const { collapseProgress } = useScrollCollapse(SCROLL_THRESHOLD, true);
```

### 3. Использовать `useLayoutEffect` для синхронной установки scroll

**Файл:** `src/pages/ChatsPage.tsx`

`useLayoutEffect` выполняется синхронно **до** отрисовки браузером, поэтому scroll будет установлен до первого кадра.

```typescript
// Было:
import { useState, useEffect, useRef } from "react";
useEffect(() => {
  if (chatListRef.current && !selectedConversation) {
    chatListRef.current.scrollTop = 100;
  }
}, [selectedConversation]);

// Станет:
import { useState, useEffect, useLayoutEffect, useRef } from "react";
useLayoutEffect(() => {
  if (chatListRef.current && !selectedConversation) {
    chatListRef.current.scrollTop = 100;
  }
}, [selectedConversation]);
```

## Технические детали

```text
Порядок выполнения ДО исправления:
┌─────────────────────────────────────────────────┐
│ 1. Рендер: scrollY=0 → collapseProgress=0       │
│    → Сторис РАЗВЁРНУТЫ                          │
│ 2. Браузер отрисовывает (виден "прыжок")        │
│ 3. useEffect: scrollTop = 100                   │
│ 4. scrollY = 100 → collapseProgress = 1         │
│    → Сторис СВЁРНУТЫ                            │
└─────────────────────────────────────────────────┘

Порядок выполнения ПОСЛЕ исправления:
┌─────────────────────────────────────────────────┐
│ 1. Рендер: scrollY=threshold → collapseProgress=1│
│    → Сторис СВЁРНУТЫ сразу                      │
│ 2. useLayoutEffect: scrollTop = 100 (до paint)  │
│ 3. Браузер отрисовывает → всё уже свёрнуто      │
└─────────────────────────────────────────────────┘
```

## Результат

- Сторис рендерятся **свёрнутыми** с первого кадра
- Скролл чатов **вверх** (до `scrollTop = 0`) → сторис плавно разворачиваются
- Скролл **вниз** → сторис снова сворачиваются в стопку
- **Никакого визуального "прыжка"** при загрузке страницы

