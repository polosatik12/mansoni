
  <goal>
    Исправить StoryViewer так, чтобы:
    1) тапы справа/слева реально листали сторис (вперед/назад),
    2) крестик закрытия всегда работал,
    3) не появлялась “полоска/подсветка” при нажатии (в твоем случае — в браузере на ПК),
    4) свайпы тоже продолжали работать.
  </goal>

  <what_is_happening_now>
    <issues>
      <issue>
        “Не листается”: сейчас при каждом рендере создается новый массив activeUsers = usersWithStories.filter(...). Он указан в зависимостях useEffect “Reset when opening”, поэтому эффект срабатывает снова и снова и сбрасывает текущий индекс/прогресс обратно. Визуально выглядит как “нажал — ничего не произошло”.
      </issue>
      <issue>
        Крестик “не работает”: две прозрачные кнопки-зоны навигации (левая/правая) имеют z-index выше (z-20), чем верхняя панель с крестиком (z-10). Поэтому клики по крестику перехватываются навигационными зонами.
      </issue>
      <issue>
        “Полоска” при нажатии: это фокус/outline/активное выделение у пустых кнопок, растянутых на половину экрана. В браузерах это может выглядеть как линия/рамка/подсветка.
      </issue>
    </issues>
  </what_is_happening_now>

  <approach>
    <step_1 title="Стабилизировать activeUsers, чтобы не было авто-сброса">
      <actions>
        <action>
          В StoryViewer вынести activeUsers в useMemo, чтобы ссылка на массив была стабильной, пока usersWithStories реально не меняется.
        </action>
        <action>
          Переписать useEffect “Reset when opening” так, чтобы он срабатывал только при открытии (isOpen=true) и смене initialUserIndex/usersWithStories (по смыслу), а не из‑за новой ссылки activeUsers на каждом рендере.
        </action>
      </actions>
      <expected_result>
        Нажатия “вперед/назад” будут менять currentStoryInUser/currentUserIndex и это не будет тут же сбрасываться обратно.
      </expected_result>
    </step_1>

    <step_2 title="Починить кликабельность крестика и верхних элементов">
      <actions>
        <action>
          Поднять z-index у хедера (панель с аватаркой/именем/крестиком) выше зон навигации (например, header z-30, зоны z-10).
        </action>
        <action>
          Альтернатива/дополнение: ограничить зоны навигации по высоте (например, top: 64px), чтобы они не перекрывали область хедера.
        </action>
      </actions>
      <expected_result>
        Крестик всегда кликается и закрывает сторис.
      </expected_result>
    </step_3>

    <step_3 title="Убрать “полоску/подсветку” от кнопок-зон">
      <actions>
        <action>
          Задать кнопкам навигации: type=&quot;button&quot;, className с отключением стилей: bg-transparent border-0 outline-none focus:outline-none focus-visible:outline-none ring-0, appearance-none.
        </action>
        <action>
          Добавить CSS/inline-style для отключения подсветки тапа (для webkit): style={{ WebkitTapHighlightColor: 'transparent' }} (не повредит и на ПК).
        </action>
      </actions>
      <expected_result>
        При нажатии не будет появляться вертикальная линия/рамка/подсветка.
      </expected_result>
    </step_3>

    <step_4 title="Свести тапы и свайпы к одному источнику правды (без конфликтов)">
      <actions>
        <action>
          Оставить swipe-логику (onTouchStart/onTouchMove/onTouchEnd) как есть, но убедиться, что тапы не ставят isPaused в странное состояние.
        </action>
        <action>
          Для ПК добавить поддержку pointer events (onPointerDown/Up) для “тапа” мышкой без задержек, если нужно — но клики по кнопкам-зонам обычно достаточно.
        </action>
      </actions>
      <expected_result>
        На ПК: клики слева/справа листают. На тач-устройствах: свайпы листают, тапы листают.
      </expected_result>
    </step_4>

    <step_5 title="Быстрая проверка после правок">
      <checks>
        <check>Открыть сторис, кликать справа: должна идти следующая сторис/следующий пользователь.</check>
        <check>Кликать слева: должна идти предыдущая сторис/предыдущий пользователь.</check>
        <check>Крестик закрывает всегда (и не листает вместо закрытия).</check>
        <check>Никаких линий/подсветок при кликах по экрану.</check>
      </checks>
    </step_5>
  </approach>

  <files_to_change>
    <file>src/components/feed/StoryViewer.tsx (основные фиксы: useMemo для activeUsers, z-index, стили зон, очистка лишнего handleTap если не нужен)</file>
  </files_to_change>

  <notes>
    Главная причина “не листается” — именно эффект “Reset when opening” из-за зависимости от activeUsers (новый массив на каждый рендер). Даже если клики работают, состояние тут же откатывается, поэтому кажется что ничего не происходит.
  </notes>

  <tech_details>
    <details>
      <item>Использовать useMemo(() =&gt; usersWithStories.filter(...), [usersWithStories])</item>
      <item>В reset-effect не включать activeUsers как зависимость; вместо этого вычислять activeIndex внутри эффекта на основе memo activeUsers</item>
      <item>Нав-зоны: z-10, header: z-30 (или nav-зоны top ниже хедера)</item>
      <item>Nav-зоны: className=&quot;bg-transparent border-0 outline-none focus:outline-none focus-visible:outline-none ring-0 appearance-none&quot; + WebkitTapHighlightColor</item>
    </details>
  </tech_details>
