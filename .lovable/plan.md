

## Цель
Сделать анимацию сторис в чатах **идентичной ленте**: сторис сворачиваются при скролле вниз и разворачиваются при скролле вверх — плавно, на основе `collapseProgress` от хука `useScrollCollapse`.

---

## Текущая проблема

Сейчас в `ChatsPage`:
- Сторис управляются через `isExpanded` (boolean) и `swipeProgress` от жестов
- Скролл списка чатов обрабатывается **отдельно** в `handleScroll` внутри самой страницы
- `ChatStories` не использует `useScrollCollapse` и не подключён к `ScrollContainerContext`

В ленте (`HomePage`):
- `FeedHeader` использует `useScrollCollapse(100)` — получает `collapseProgress` (0-1) от скролла
- Скролл происходит в главном контейнере `<main>` через `ScrollContainerProvider`
- Анимация плавная, GPU-ускоренная, зависит напрямую от позиции скролла

---

## План изменений

### 1. Рефакторинг `ChatStories` — убрать внешнее управление состоянием

**Файл:** `src/components/chat/ChatStories.tsx`

- Удалить пропсы `isExpanded`, `onExpandChange`, `swipeProgress`
- Добавить `useScrollCollapse(100)` для получения `collapseProgress` напрямую (как в `FeedHeader`)
- Добавить `useScrollContainer()` для scroll-to-top при клике на свёрнутые сторис
- Использовать `collapseProgress` вместо `effectiveProgress`
- Удалить логику pull-indicator (индикатор потяни вниз)

### 2. Обновить `ChatsPage` — убрать лишнюю логику

**Файл:** `src/pages/ChatsPage.tsx`

- Удалить state `storiesExpanded`
- Удалить `swipeProgress`, `isDragging` от `useSwipeGesture`
- Удалить `handleScroll` callback
- Убрать передачу пропсов `isExpanded`, `onExpandChange`, `swipeProgress` в `ChatStories`
- Убрать `ref={storiesContainerRef}` и связанную логику

### 3. Поведение при клике (как в ленте)

Когда `collapseProgress > 0.1` (сторис свёрнуты):
- Клик по сторис → `scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' })`
- Это прокрутит страницу вверх, и сторис автоматически развернутся

Когда `collapseProgress <= 0.1` (сторис развёрнуты):
- Клик по сторис → открывает `StoryViewer` или запускает загрузку новой сторис

---

## Технические детали

```text
+--------------------------------------------------+
|               Scroll Container (main)            |
|        ↑                                         |
|        | useScrollCollapse(100)                  |
|        ↓                                         |
| +----------------------------------------------+ |
| |  ChatStories (collapseProgress: 0→1)        | |
| |  - Expanded: avatars 64px, row layout       | |
| |  - Collapsed: avatars 32px, stacked         | |
| +----------------------------------------------+ |
| |                                              | |
| |  Chat List (scrollable content)             | |
| |                                              | |
+--------------------------------------------------+
```

**Константы анимации (из FeedHeader):**
- EXPANDED_AVATAR_SIZE = 64px
- COLLAPSED_AVATAR_SIZE = 32px  
- COLLAPSED_OVERLAP = 10px
- MAX_VISIBLE_IN_STACK = 4
- threshold = 100px (порог полного сворачивания)

---

## Итог

После изменений:
- Скролл списка чатов **вниз** → сторис плавно сворачиваются в стопку
- Скролл **вверх до top=0** → сторис плавно разворачиваются  
- Тап по свёрнутым сторис → прокрутка вверх (как в ленте)
- Тап по развёрнутым сторис → открытие просмотрщика
- Никаких pull-down жестов, только скролл

