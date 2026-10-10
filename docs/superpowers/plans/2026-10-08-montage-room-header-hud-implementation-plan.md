# Montage Room Header and HUD Exit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Обновить светлую монтажную комнату «Накладно»: убрать навигацию этапов с изображения комнаты, добавить HUD-выход, замкнуть финальный переход на «Исходники» и сделать управление трейлером компактным.

**Architecture:** Сохранить автономный HTML-прототип и создать следующую версию `light-editing-rooms-v21.html` копированием утверждённой v20. Вся визуальная логика остаётся локальной: шапка и SVG-HUD оформляются CSS, этапы управляются существующим массивом `stages`, а трейлер получает отдельную нижнюю панель без загрузки дополнительных библиотек или HUD-видео.

**Tech Stack:** HTML5, CSS, SVG, vanilla JavaScript, локальные JPEG/PNG/MP4-ассеты, браузерная проверка.

---

### Task 1: Создать безопасную рабочую версию

**Files:**
- Create: `.superpowers/brainstorm/51444-1791364926/content/light-editing-rooms-v21.html`
- Source: `.superpowers/brainstorm/51444-1791364926/content/light-editing-rooms-v20.html`

- [ ] **Step 1: Скопировать утверждённую v20 в v21**

Run: `cp .superpowers/brainstorm/51444-1791364926/content/light-editing-rooms-v20.html .superpowers/brainstorm/51444-1791364926/content/light-editing-rooms-v21.html`

Expected: v20 остаётся без изменений, появляется отдельная v21.

- [ ] **Step 2: Обновить заголовок документа**

Заменить `версия 20` на `версия 21`, чтобы текущую итерацию можно было однозначно определить в браузере.

- [ ] **Step 3: Проверить исходную структуру**

Run: `rg -n "room-nav|room-controls|playTrailerOnScreen|next.onclick" .superpowers/brainstorm/51444-1791364926/content/light-editing-rooms-v21.html`

Expected: найдены навигация этапов, обе катушки, функция трейлера и обработчик правой катушки.

### Task 2: Перенести навигацию этапов в шапку

**Files:**
- Modify: `.superpowers/brainstorm/51444-1791364926/content/light-editing-rooms-v21.html`

- [ ] **Step 1: Переместить DOM навигации**

Вставить `<nav class="room-nav" aria-label="Этапы монтажа"><div class="steps" id="steps"></div></nav>` внутрь `<header class="bar">` между `.brand` и `.bar__meta`; удалить прежний экземпляр из `.room-stage`.

- [ ] **Step 2: Сделать шапку трёхчастной**

Оформить `.bar` как сетку `auto minmax(0,1fr) auto`, расположить `.room-nav` статически, центрировать её и убрать `position:absolute`, `top`, `left`, `transform` и `sticky` из поздних переопределений.

- [ ] **Step 3: Обеспечить узкий экран**

На ширине до 850px скрыть `.bar__meta`, дать `.room-nav` горизонтальную прокрутку и не допустить наложения на бренд.

- [ ] **Step 4: Проверить единственность навигации**

Run: `node -e "const fs=require('fs');const s=fs.readFileSync('.superpowers/brainstorm/51444-1791364926/content/light-editing-rooms-v21.html','utf8');if((s.match(/id=\"steps\"/g)||[]).length!==1)process.exit(1)"`

Expected: exit code 0.

### Task 3: Добавить лёгкую HUD-кнопку выхода

**Files:**
- Modify: `.superpowers/brainstorm/51444-1791364926/content/light-editing-rooms-v21.html`

- [ ] **Step 1: Добавить кнопку в комнату**

Перед `.hud` вставить кнопку `#exit-room` с двумя строками `ЗАВЕРШИТЬ ПРОЦЕСС` и `ВЫЙТИ ИЗ МОНТАЖНОЙ`, круговым inline-SVG, толстой стрелкой влево и скрытым доступным названием.

- [ ] **Step 2: Реализовать движение без видео**

Добавить отдельные CSS-анимации колец, рисок, кораллового сканера и соединительной линии. При `:hover` и `:focus-visible` ускорять кольца, усиливать свет и делать подпись белее; при `prefers-reduced-motion` остановить постоянное вращение.

- [ ] **Step 3: Добавить демонстрацию выхода**

Обработчик `#exit-room` должен добавить `.room-exiting` на `.experience`, проиграть круговое затемнение из верхнего левого угла и через 1700 мс снять класс. В прототипе URL не меняется; постоянный адрес подключается при объединении с FRAME ZERO.

- [ ] **Step 4: Проверить доступность**

Кнопка должна быть обычным `<button type="button">`, иметь `aria-label="Завершить процесс и выйти из монтажной"` и видимое `:focus-visible` состояние.

### Task 4: Замкнуть финал и вынести управление трейлером вниз

**Files:**
- Modify: `.superpowers/brainstorm/51444-1791364926/content/light-editing-rooms-v21.html`

- [ ] **Step 1: Создать нижнюю панель трейлера**

Добавить `.trailer-controls` внутри `.room-viewport`, но вне трансформируемого `.room-canvas`. Панель располагается под центральным экраном между катушками и содержит компактные кнопки play/pause, mute/unmute и ползунок прогресса.

- [ ] **Step 2: Убрать крупные нативные controls с видео**

В `playTrailerOnScreen()` оставить `playsInline`, оригинальную дорожку и `volume=1`, но не устанавливать `clip.controls=true`. Сохранить ссылку на клип и синхронизировать компактную панель через события `play`, `pause`, `timeupdate`, `loadedmetadata` и `volumechange`.

- [ ] **Step 3: Изменить поведение правой катушки**

До запуска трейлера на этапе «Финал» правая катушка запускает его. После запуска получает `aria-label="Вернуться к исходникам"`; следующее нажатие вызывает `moveTo(0)`, а не сбрасывает `currentTime`.

- [ ] **Step 4: Сбрасывать трейлер при смене этапа**

При `commit(i)` для `i !== 3` скрыть `.trailer-controls`, сбросить флаг запущенного трейлера и удалить `.trailer-mode`, чтобы повторный проход начинался с ручного сравнения.

- [ ] **Step 5: Проверить исходный звук**

После пользовательского клика видео устанавливает `muted=false`, `volume=1` и вызывает `play()`. Кнопка громкости доступна с клавиатуры и корректно отражает состояние.

### Task 5: Проверить страницу и открыть результат

**Files:**
- Verify: `.superpowers/brainstorm/51444-1791364926/content/light-editing-rooms-v21.html`

- [ ] **Step 1: Проверить HTML-идентификаторы и обработчики**

Run: `node -e "const fs=require('fs');const s=fs.readFileSync('.superpowers/brainstorm/51444-1791364926/content/light-editing-rooms-v21.html','utf8');for(const x of ['id=\"steps\"','id=\"exit-room\"','id=\"trailer-controls\"','moveTo(0)'])if(!s.includes(x))throw new Error(x)"`

Expected: exit code 0.

- [ ] **Step 2: Проверить страницу в браузере**

Проверить 1440×900 и 390×844: верхняя навигация не перекрывает комнату, HUD находится слева сверху, центральные мониторы полностью видны, катушки доступны.

- [ ] **Step 3: Проверить полный маршрут**

Пройти `Исходники → Отбор → Монтаж → Финал → Трейлер → Исходники`, проверить паузу, звук, прокрутку, ручной before/after и HUD-анимацию выхода.

- [ ] **Step 4: Проверить консоль**

Expected: отсутствуют JavaScript errors и 404 для изображений или видео.

- [ ] **Step 5: Зафиксировать изменения**

Run: `git add docs/superpowers/plans/2026-10-08-montage-room-header-hud-implementation-plan.md && git commit -m "docs: plan montage room HUD integration"`

Expected: план сохранён отдельным коммитом; визуальный прототип остаётся в `.superpowers/` и не смешивается с основной сборкой FRAME ZERO.
