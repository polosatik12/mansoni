

## Цель
Сторис в чатах должны **стартовать свёрнутыми** (маленькая стопка как в Telegram) и **разворачиваться при скролле списка чатов ВВЕРХ** до `scrollTop = 0`.

---

## Причина текущей проблемы

Сейчас происходит следующее:

1. `useLayoutEffect` устанавливает `chatListRef.current.scrollTop = 100` **до рендера**
2. Но затем загружаются данные чатов (async), DOM перерисовывается
3. `useScrollCollapse` в `useEffect` вызывает `handleScroll()` (строка 29), который читает **текущий** `scrollTop` и обновляет state
4. Если браузер сбросил scroll или контент ещё не загрузился, `scrollTop = 0` → `collapseProgress = 0` → сторис развёрнуты

Также `initialCollapsed: true` инициализирует `scrollY = 100`, но первый же `handleScroll()` в useEffect **перезаписывает** это значение на реальный `scrollTop` контейнера.

---

## План изменений

### 1. Сделать устойчивую инициализацию в `useScrollCollapse`

**Файл:** `src/hooks/useScrollCollapse.tsx`

Проблема: `handleScroll()` вызывается сразу в `useEffect` и перезаписывает `initialCollapsed` состояние.

Решение: **Не вызывать** `handleScroll()` при монтировании, если `initialCollapsed = true`. Дать компоненту время установить scrollTop.

```typescript
useEffect(() => {
  const container = containerRef?.current;
  if (!container) return;

  const handleScroll = () => {
    lastScrollY.current = container.scrollTop;
    if (rafId.current === null) {
      rafId.current = requestAnimationFrame(updateScroll);
    }
  };

  container.addEventListener("scroll", handleScroll, { passive: true });
  
  // Только если НЕ initialCollapsed — читаем начальный scroll
  // Если initialCollapsed — оставляем scrollY = threshold до первого скролла
  if (!initialCollapsed) {
    handleScroll();
  }
  
  return () => {
    container.removeEventListener("scroll", handleScroll);
    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current);
    }
  };
}, [containerRef, updateScroll, initialCollapsed]);
```

### 2. Использовать `requestAnimationFrame` для установки scroll в ChatsPage

**Файл:** `src/pages/ChatsPage.tsx`

Проблема: `useLayoutEffect` срабатывает до того, как DOM полностью готов, и браузер может сбросить scroll.

Решение: Использовать `requestAnimationFrame` внутри `useLayoutEffect` чтобы гарантировать, что scroll устанавливается **после** того, как браузер завершил layout.

```typescript
useLayoutEffect(() => {
  if (chatListRef.current && !selectedConversation) {
    // Используем RAF чтобы установить scroll после завершения layout
    requestAnimationFrame(() => {
      if (chatListRef.current) {
        chatListRef.current.scrollTop = 100;
      }
    });
  }
}, [selectedConversation]);
```

### 3. Повторная установка scroll после загрузки чатов

**Файл:** `src/pages/ChatsPage.tsx`

Добавить дополнительный `useEffect`, который устанавливает scroll после того, как чаты загрузились:

```typescript
// Устанавливаем scroll после загрузки чатов
useEffect(() => {
  if (!chatsLoading && chatListRef.current && !selectedConversation) {
    chatListRef.current.scrollTop = 100;
  }
}, [chatsLoading, selectedConversation]);
```

---

## Технические детали

```text
Порядок выполнения ПОСЛЕ исправления:
┌─────────────────────────────────────────────────────────────┐
│ 1. Компонент монтируется                                    │
│ 2. useScrollCollapse: scrollY = 100 (initialCollapsed=true) │
│    НЕ вызывает handleScroll() при монтировании              │
│ 3. ChatStories рендерится со свёрнутыми сторис              │
│ 4. useLayoutEffect + RAF: scrollTop = 100                   │
│ 5. Чаты загружаются (async)                                 │
│ 6. useEffect: ещё раз scrollTop = 100                       │
│ 7. Первый скролл юзера → handleScroll обновляет state       │
└─────────────────────────────────────────────────────────────┘
```

---

## Результат

- Сторис рендерятся **свёрнутыми** с первого кадра и остаются свёрнутыми
- Скролл чатов **вверх** (до `scrollTop = 0`) → сторис плавно разворачиваются  
- Скролл **вниз** → сторис снова сворачиваются в стопку
- Никакого визуального "прыжка" при загрузке страницы
- Работает даже если чатов мало и скролла почти нет (благодаря spacer 100px)

