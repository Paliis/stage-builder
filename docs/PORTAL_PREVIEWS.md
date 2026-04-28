# Портал — превʼю-картинки на головній (`/`)

Як готувати/оновлювати превʼю-зображення для карток продуктів на сторінці порталу
(`PortalHome.tsx`), щоб результат був чистим, легким, ретина-готовим і не псував CLS.

> **Контекст.** Усі 3 картки використовують реальні WebP-скріни з
> `public/portal-previews/`. Stage Builder додатково має SVG-фолбек
> через `<picture>`. Цей документ — про те, як готувати/оновлювати ці скріни.

---

## 1. Контейнер у CSS

У `src/portal/PortalHome.css`:

```css
.portal-home__product-preview {
  aspect-ratio: 16 / 10;
  /* фон-градієнт як підкладка, поки картинка не завантажилась */
}

.portal-home__product-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

- **Логічний розмір** контейнера на десктопі ≈ `360–384 × 225–240 px`.
- **Цільовий розмір файлу** (для retina): мінімум **`1280 × 800`** (2×).
  Можна одразу `1920 × 1200` (3×) — це вигідно для OG-картинок.
- `object-fit: cover` дозволяє знімати з невеликим запасом і кропити в CSS,
  але краще одразу віддавати точне співвідношення `16:10`.

---

## 2. Що знімати для кожного продукту

### 2.1. Stage Builder (`stage-builder.webp`)
- **Унікальна перевага** — 3D. Без 3D у кадрі картка не «продає».
- **Вид:** `Overview` або `Shooter's view` (на твій смак).
- **Що повинно бути в кадрі:**
  - частина поля з **сіткою стіни / щитів / мішеней** (паперові + металеві + No-Shoot для контрасту);
  - топ-ліва плашка `Targets: N · Est. min. shots: M` (соціальний доказ «це справжнє»);
  - **бічна палітра** інструментів зайва — її **прибрати** (звузити вікно, щоб
    UI пішла в mobile-режим, або зняти у Shooter's view, де її не видно).
- **Поверхня:** `Grass` — найбільш «нейтральна» зеленка під будь-яку тему.

### 2.2. Hit Factor (`hit-factor.webp`)
- Калькулятор з **уже введеними** прикладовими значеннями
  (хіти, час, штрафи) — щоб у кадрі читалися числа `HF actual` / `HF max` /
  блок `focus`.
- Ширина вікна — десктопна (`≥ 1024 px`), щоб блоки не стискались у вузькі
  колонки.

### 2.3. RO Helper (`ro-helper.webp` + `ro-helper.png` fallback)
- Екран **категорій** обраної дисципліни (наприклад **Shotgun**): заголовок дисципліни,
  пошук «Search articles…», **п’ять SOS-карток** (Safety / Penalties / Scoring /
  Equipment / Match admin) з кольоровими смужками та короткими описами — типовий вигляд
  модуля для прев’ю на головній порталу.
- У шапці видно **Shooters Tools** і висвітлений пункт **RO Helper** (контекст продукту).
- Скрол у верх сторінки, без зайвих елементів поза кадром `16:10`.

---

## 3. Процедура зйомки (Chrome / Edge DevTools)

1. **Підготувати дані.** Запустити локально (`npm run dev`), у Stage Builder зібрати
   репрезентативну сцену (або відкрити готовий `.stage.json`); у Hit Factor
   увести приклад; в RO Helper відкрити список статей.
2. **Зафіксувати viewport:** `F12` → `Ctrl+Shift+M` (Device Toolbar) →
   `Responsive` → ввести `1280 × 800`. DPR 2 (retina) — у меню три-крапки
   у device toolbar → `Add device pixel ratio` → `2`.
3. **Знімок:**
   - `Ctrl+Shift+P` → `Capture screenshot` (тільки видима частина) — це наш кейс.
   - **НЕ** `Capture full size screenshot` (зробить занадто високий PNG).
4. **Кропнути** до точного `16:10` (наприклад, `1280 × 800` або `1600 × 1000`).
   Інструменти: вбудований `Photos` у Windows, [Photopea](https://www.photopea.com/),
   Paint.NET, GIMP.
5. **Стиснути у WebP**, q ≈ 80 (ціль `< 60 KB` на файл). Доступні шляхи:

   #### A. Скрипт у репо (`portal-preview-prepare.mjs`) — рекомендований

   Кроп або падінг до `16:10`, ресайз до `1280×800` і WebP `q=80` за один
   виклик; використовує `sharp` (вже у `devDependencies`).

   ```bash
   # 1) cover — центр-кроп до 16:10 (для скрінів, що ВИЩЕ за 16:10)
   node scripts/portal-preview-prepare.mjs ./screenshot.png stage-builder

   # 2) contain — падінг (letterbox) до 16:10 (для ШИРОКИХ скрінів,
   #    де нічого не можна обрізати з боків)
   node scripts/portal-preview-prepare.mjs ./screenshot.png ro-helper contain "#f1f5f9"
   ```

   Аргументи:
   - `<input>` — шлях до вихідного PNG/JPG.
   - `<output-name>` — імʼя без розширення (`stage-builder` / `hit-factor` /
     `ro-helper`).
   - `[cover|contain]` — режим вписування (default `cover`).
   - `[bg]` — колір падінгу для `contain` (default `#f1f5f9`, slate-100).

   Файл автоматично кладеться у `public/portal-previews/<output-name>.webp`.

   #### B. Онлайн / CLI

   - онлайн: [squoosh.app](https://squoosh.app/) → формат `WebP`,
     `effort: 6`, `quality: 78–82`;
   - CLI ([cwebp](https://developers.google.com/speed/webp/download)):
     ```bash
     cwebp -q 80 -m 6 stage-builder.png -o stage-builder.webp
     ```

---

## 4. Інтеграція у код

### Варіант A — простий swap (рекомендований)

WebP підтримують усі сучасні браузери (`> 97%` глобально). Достатньо:

1. Покласти файл у `public/portal-previews/stage-builder.webp`.
2. У `src/portal/PortalHome.tsx` замінити шлях:
   ```tsx
   preview="/portal-previews/stage-builder.webp"
   ```
   на ту картку, де хочемо «живий» скрін. SVG-мокап залишається у репо для
   історії — або видаляєш, якщо більше не потрібен.

### Варіант B — `<picture>` з SVG fallback

Корисно, якщо хочемо **подвійну страховку** (старий браузер / проблема CDN /
ще не змайстрували WebP для всіх продуктів):

```tsx
<picture>
  <source srcSet="/portal-previews/stage-builder.webp" type="image/webp" />
  <img
    src="/portal-previews/stage-builder.svg"
    alt={previewAlt}
    loading="lazy"
    width={640}
    height={400}
  />
</picture>
```

> Якщо переходимо на `<picture>` — оновити `ProductCard` так, щоб приймати
> `previewWebp` і `previewFallback` (SVG/PNG) окремо.

### Атрибути зображення

- `width` і `height` тримаємо **завжди** (`640 × 400` або реальні розміри
  файлу) — браузер резервує місце ще до завантаження → нуль CLS.
- `loading="lazy"` — добре для нижніх карток, але **не для першої**: для
  Stage Builder можна виставити `loading="eager"` або просто прибрати
  атрибут (тоді буде дефолт `eager`).
- `decoding="async"` — приємний бонус, не обовʼязковий.

---

## 5. Іменування і розміри

```
public/portal-previews/
  stage-builder.webp      # 1280×800, 16:10
  stage-builder.svg       # <picture>-fallback / архів мокапа
  hit-factor.webp         # 1280×800, 16:10
  ro-helper.webp          # 1280×800, 16:10
  ro-helper.png           # fallback для `<picture>` у `PortalHome` (якщо WebP недоступний)
```

- Не міняємо імена — інакше `<img src>` у `PortalHome.tsx` потрібно буде
  оновлювати в декількох місцях.
- Якщо потрібен мобільний варіант (рідко) — `stage-builder@mobile.webp`
  + `srcSet="… 1x, …@2x 2x"` або `<picture media="(max-width: 600px)">`.

---

## 6. Перевірка перед commit

- [ ] Файл < `100 KB` (бажано `< 60 KB`).
- [ ] Aspect ratio точно `16:10` (інакше CSS-`object-fit: cover` обріже).
- [ ] Чітка картинка на 1080p-екрані (відкрити сторінку `/`,
      перевірити на ширинах `375 / 768 / 1280`).
- [ ] Текст у кадрі (якщо є) — англійською або без локалізованого змісту.
- [ ] Ніяких персональних даних / невипущених фіч / debug-оверлеїв.

---

## 7. Maintenance — коли оновлювати

- Помітний редизайн UI, що змінює forme/кольори блоків.
- Зміна бренду, акцентного кольору, темної теми (потрібен парний скрін).
- Додавання великої фічі, яку хочемо «продати» з головної.

> Рекомендація: внести цей крок у власний release-checklist портального
> релізу, щоб скріни не «застаряли» мовчки.

---

## 8. Бонус — той самий файл як OG-картинка

Якщо знімаємо у `1920 × 1200`, можна одночасно отримати OG-зображення для
`/stage-builder` (Telegram/Facebook рекомендують `≥ 1200 × 630`):

1. Зберегти **повний** скрін окремо як `og-stage-builder.png`
   (Telegram любить PNG/JPG, не WebP).
2. У `middleware.ts` (Edge) для `/stage-builder` підставити
   `og:image` → `https://shooters-tools.com/og-stage-builder.png`.

> Це окрема задача (паралельна із превʼю-картками); тут лише підказка, що
> один скрін можна перевикористати у двох місцях.
