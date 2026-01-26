

# План: Исправление счётчиков постов (лайки, комментарии, просмотры)

## Проблема

1. **Комментарии не отображаются** — таблица `comments` пустая (0 записей), но в `posts.comments_count` стоит 78, 67, 92 и т.д. — это фейковые значения.

2. **Фейковые счётчики** — все `likes_count`, `comments_count`, `views_count` в постах были заполнены случайными числами при создании тестовых данных:
   - Пример: `stored_likes: 425` vs `real_likes: 2`
   - Пример: `stored_comments: 78` vs `real_comments: 0`
   - Пример: `stored_views: 3774` vs `real_views: 374`

3. **Нет триггеров синхронизации** — при добавлении лайка/комментария/просмотра счётчик в `posts` не обновляется автоматически.

---

## Решение

### Шаг 1: Создать триггеры для автоматической синхронизации счётчиков

Добавить триггеры на таблицы `post_likes`, `comments`, `post_views`, которые будут автоматически обновлять соответствующие поля в `posts`.

```sql
-- Триггер для likes_count
CREATE OR REPLACE FUNCTION public.update_post_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER on_post_like_change
AFTER INSERT OR DELETE ON post_likes
FOR EACH ROW
EXECUTE FUNCTION update_post_likes_count();

-- Аналогичные триггеры для comments_count и views_count
```

### Шаг 2: Сбросить фейковые счётчики на реальные значения

Обновить все посты, пересчитав счётчики по реальным данным:

```sql
UPDATE posts p SET
  likes_count = (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id),
  comments_count = (SELECT COUNT(*) FROM comments WHERE post_id = p.id),
  views_count = (SELECT COUNT(*) FROM post_views WHERE post_id = p.id);
```

### Шаг 3: Проверка RLS на таблице comments

Убедиться, что политики RLS на `comments` позволяют:
- Всем читать комментарии к постам
- Авторизованным пользователям добавлять комментарии
- Авторам удалять свои комментарии

---

## Ожидаемый результат

После применения изменений:
- Посты будут показывать реальные счётчики (не фейковые 446/78/3.6k)
- Комментарии будут отображаться (если их добавят пользователи)
- При лайке/комментировании/просмотре счётчики будут обновляться автоматически

---

## Технические детали

### Файлы для изменения
Только миграция базы данных (SQL) — код фронтенда уже корректно читает данные из `posts.likes_count`, `comments_count`, `views_count`.

### Миграция включает
1. Функция `update_post_likes_count()` + триггер `on_post_like_change`
2. Функция `update_post_comments_count()` + триггер `on_post_comment_change`
3. Функция `update_post_views_count()` + триггер `on_post_view_change`
4. UPDATE-запрос для пересчёта всех существующих счётчиков
5. Проверка/добавление RLS политик для `comments`

