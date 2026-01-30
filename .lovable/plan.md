
## Исправление ошибки "global is not defined" для simple-peer

### Причина проблемы
Библиотека `simple-peer` использует Node.js-зависимости (`randombytes`), которые обращаются к глобальному объекту `global`. В браузерной среде Vite этот объект не определён, что вызывает крах приложения.

### Решение
Добавить полифилл `global = window` до загрузки приложения.

---

## Шаги реализации

### 1. Добавить полифилл global в index.html
Добавим `<script>` в `<head>` файла `index.html`, который определит `global` до загрузки любого JavaScript:

```html
<script>
  // Polyfill for Node.js 'global' used by simple-peer
  if (typeof global === 'undefined') {
    window.global = window;
  }
</script>
```

### 2. Альтернативный вариант — через Vite config
Добавить `define` в `vite.config.ts`:

```typescript
export default defineConfig(({ mode }) => ({
  // ...
  define: {
    global: 'globalThis',
  },
  // ...
}));
```

**Рекомендую первый вариант (index.html)** — он более надёжен и работает до инициализации Vite.

---

## Затронутые файлы
| Файл | Изменение |
|------|-----------|
| `index.html` | Добавить `<script>` с полифиллом `global` |

---

## Ожидаемый результат
После добавления полифилла:
- Ошибка "global is not defined" исчезнет
- Библиотека `simple-peer` загрузится корректно
- Звонки начнут работать (если нет других проблем)
