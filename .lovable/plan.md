

# План: Удаление всех упоминаний Lovable из кода

## Найденные упоминания

### 1. `src/lib/supabase.ts`
Комментарии содержат "Lovable Cloud":
- Строка 2: `// The app runs on Lovable Cloud; keep a single client everywhere...`
- Строка 3: `import { supabase as lovableSupabase }`
- Строка 7: `// Kept for older imports; values come from the environment managed by Lovable Cloud.`

**Исправление:** Убрать все комментарии с упоминанием Lovable и переименовать `lovableSupabase` в `supabaseClient`

### 2. `playwright.config.ts`
Использует пакет от Lovable:
- Строка 1: `import { createLovableConfig } from "lovable-agent-playwright-config/config"`
- Строка 3: `export default createLovableConfig({...})`

**Исправление:** Переписать на стандартный Playwright конфиг

### 3. `package.json`
- Строка 91: `"lovable-tagger": "^1.1.13"`

**Исправление:** Удалить эту зависимость из devDependencies

### 4. Edge Functions (AI Gateway URL)
В двух файлах используется URL `ai.gateway.lovable.dev`:
- `supabase/functions/property-assistant/index.ts` (строки 50-60)
- `supabase/functions/insurance-assistant/index.ts` (строки 51-61)

**ВАЖНО:** Эти edge functions используют внутренний AI Gateway, который работает через переменную окружения `LOVABLE_API_KEY`. Этот API является рабочим backend-сервисом, и его нельзя просто заменить на другой URL без потери функциональности AI-ассистентов. 

**Варианты:**
1. Оставить как есть (функционал важнее) - URL не виден пользователям приложения
2. Если нужно полностью избавиться - потребуется подключить свой AI-провайдер (OpenAI/Google) с собственным API ключом

### 5. Lock-файлы (автоматически)
- `package-lock.json` и `bun.lock` обновятся автоматически после удаления зависимости из package.json

---

## Технические детали изменений

### Файл 1: `src/lib/supabase.ts`
```typescript
// До:
// Backwards-compatible wrapper.
// The app runs on Lovable Cloud; keep a single client everywhere...
import { supabase as lovableSupabase } from "@/integrations/supabase/client";
export const supabase = lovableSupabase;
// Kept for older imports; values come from the environment managed by Lovable Cloud.

// После:
import { supabase as supabaseClient } from "@/integrations/supabase/client";
export const supabase = supabaseClient;
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
```

### Файл 2: `playwright.config.ts`
```typescript
// До:
import { createLovableConfig } from "lovable-agent-playwright-config/config";
export default createLovableConfig({...});

// После:
import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './e2e',
  timeout: 60000,
  use: {
    baseURL: 'http://localhost:8080',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } }
  ]
});
```

### Файл 3: `package.json`
Удалить строку `"lovable-tagger": "^1.1.13"` из `devDependencies`

---

## Что остаётся без изменений

Edge functions (`property-assistant` и `insurance-assistant`) продолжат использовать AI Gateway, так как это рабочий backend-сервис. URL `ai.gateway.lovable.dev` находится только в серверном коде и не виден пользователям приложения.

