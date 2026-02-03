
# План: Унификация дизайна — белый фон с нотками градиента

## Концепция
Все страницы будут иметь **белый основной фон** с **лёгкими, приглушёнными градиентными акцентами** — не яркие aurora-шейдеры как сейчас на чатах/профиле, а subtle намёки на градиент.

## Текущее состояние

| Страница | Фон |
|----------|-----|
| HomePage (Лента) | Чисто белый `bg-background` |
| SearchPage | Чисто белый `bg-background` |
| ChatsPage | Тёмный aurora (indigo/purple/cyan) |
| ProfilePage | Тёмный aurora (indigo/purple/cyan) |
| SettingsPage | Тёмный aurora (slate/purple/cyan) |

## Целевой дизайн

Все страницы получат **единый стиль**:
- Основной фон: **белый** (светлая тема) / **чёрный** (тёмная тема)
- Декоративные элементы: **очень бледные градиентные пятна** (opacity 5-15%)
- Цвета пятен: нежные пастельные — голубой, розовый, фиолетовый с очень низкой насыщенностью

### Визуальное различие от текущего
```
СЕЙЧАС (ChatsPage/ProfilePage):
┌─────────────────────────────┐
│ ██████████████████████████ │  <- Тёмный фон (indigo-900)
│ ███ ЯРКИЕ БЛОБЫ 35% ██████ │  <- Cyan/blue/violet blobs 
│ ██████████████████████████ │
└─────────────────────────────┘

ЦЕЛЬ (Все страницы):
┌─────────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░ │  <- Белый фон
│ ░░░ НЕЖНЫЕ ПЯТНА 8% ░░░░░░ │  <- Pale blue/pink (едва видны)
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░ │
└─────────────────────────────┘
```

## Изменения по файлам

### 1. Создать общий компонент фона
**Новый файл:** `src/components/layout/SubtleGradientBackground.tsx`

Компонент с переиспользуемым нежным градиентом:
- В светлой теме: белый фон + бледные пятна (blue/pink/violet с opacity 5-10%)
- В тёмной теме: чёрный фон + тусклые пятна (с opacity 8-15%)

### 2. HomePage.tsx
- Добавить `SubtleGradientBackground` в контейнер

### 3. SearchPage.tsx  
- Добавить `SubtleGradientBackground` в контейнер

### 4. ChatsPage.tsx
- **Заменить** текущие тёмные aurora-блобы на `SubtleGradientBackground`
- Все элементы UI (карточки, хедер, кнопки) — перевести на `bg-background`, `bg-card`, `text-foreground`
- Убрать все `text-white`, `bg-white/10`, `border-white/20`

### 5. ProfilePage.tsx
- **Заменить** aurora на `SubtleGradientBackground`  
- Все UI элементы — стандартные цвета темы
- Карточки: `bg-card`, текст: `text-foreground`

### 6. SettingsPage.tsx
- **Заменить** aurora на `SubtleGradientBackground`
- Все UI элементы — стандартные цвета темы

## Технические детали

### SubtleGradientBackground
```tsx
// Светлая тема
<div className="fixed inset-0 bg-background">
  <div className="absolute top-20 -left-20 w-96 h-96 bg-blue-200/10 rounded-full blur-3xl" />
  <div className="absolute top-1/3 right-0 w-80 h-80 bg-pink-200/8 rounded-full blur-3xl" />
  <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-violet-200/6 rounded-full blur-3xl" />
</div>

// Тёмная тема (через .dark)
<div className="... dark:bg-background">
  <div className="... dark:bg-blue-500/10" />
  ...
</div>
```

### Адаптация UI элементов (ChatsPage пример)
```tsx
// БЫЛО:
<div className="bg-white/10 backdrop-blur-xl border border-white/20">
  <span className="text-white">Текст</span>
</div>

// СТАНЕТ:
<div className="bg-card/80 backdrop-blur-sm border border-border">
  <span className="text-foreground">Текст</span>
</div>
```

## Итог
После изменений все страницы будут выглядеть консистентно: чистый белый/чёрный фон с едва заметными пастельными градиентными пятнами, создающими ощущение глубины без агрессивных шейдеров.
