# Shooters Tools — Design System v0.1

> **Usage in Cursor:** Reference this file with `@docs/DESIGN_SYSTEM_V0.md` in any chat prompt.  
> For auto-context on every request, copy the contents to `.cursor/rules/design-system.mdc`.

> **Repository note (import, April 2026):** `public/logo.png` is **not** present yet; shipping icons are the files listed in **§0.2** (`icon-512.png`, `favicon-*`, `og-image.png`, etc.). Add a single canonical `logo.png` when assets are consolidated, then align favicon/PWA/OG from it. RO Helper disciplines in code and content are **`handgun` · `pcc` · `rifle` · `mini_rifle` · `shotgun`** — not “Action Air” (see [RO_HELPER_V0.md §5](./RO_HELPER_V0.md#5-інформаційна-архітектура-та-url)). Footer `mailto:` / Telegram / Monobank URLs must be real values before production.

---

## 0. Brand & Logo

### 0.1 Logo mark

The Shooters Tools logo is an **octagon with "ST" lettermark**, wrapped by a stylized hand/bracket shape. Source file: `public/logo.png` (also used for PWA icon, favicon, og:image).

**Usage rules:**
- Monochrome only (black on light, white on dark). Never colorize or apply brand-blue fill to the logo mark.
- Minimum size: 24 × 24 px (favicon). Preferred display sizes: 32 px (shell header), 48 px (splash/about), 512 px (PWA manifest).
- Clear space: minimum 0.5× logo width on all sides. Never place text or UI elements inside the clear zone.
- Do not stretch, rotate, or add drop shadows to the logo mark.
- The "ST" inside the octagon is part of the mark — do not replace it with other text or icons.

### 0.2 Favicon & PWA icons

| Asset | Size | Format | Usage |
|-------|------|--------|-------|
| `favicon.ico` | 16, 32, 48 px | ICO | Browser tab |
| `icon-192.png` | 192 × 192 px | PNG | PWA manifest, Android |
| `icon-512.png` | 512 × 512 px | PNG | PWA manifest splash |
| `apple-touch-icon.png` | 180 × 180 px | PNG | iOS home screen |
| `og-image.png` | 1200 × 630 px | PNG | Social share preview |

All icons: logo mark centered on white background (light mode). The octagon shape reads well at all sizes down to 16 px.

### 0.3 Wordmark

Logo mark + "Shooters Tools" text set in Inter 600, neutral-900. In the shell header, the word "Tools" may be set in brand-400 (`#378ADD`) to add visual accent — or both words in neutral-900 for a more neutral tone. Pick one style and apply consistently across all pages.

---

## 1. Design Principles

1. **Serve people under pressure, outdoors.** Users hold tablets with gloved hands in direct sunlight. Every interaction must work with large touch targets (min 44×44 px), high-contrast text, and no micro-interactions that require precision taps.
2. **Confident, practical tone — not playful at safety moments.** Stage Builder and RO Helper are tools, not games. UI copy is direct and functional. Safety and penalty flows use calm assertiveness — never humor, emoji, or gamification. Educational content frames the app as a helpful reference, never an authority replacing official rulebooks.
3. **One visual language across the portal.** Portal shell and all modules share tokens, spacing, and component patterns. Modules differ by subtitle and icon only — not by a different color scheme or layout language.
4. **Density is earned, not assumed.** Portal home and article views are spacious. The canvas editor can be dense. Density increases as user expertise and intent deepen — novice flows breathe, power-user flows expose controls progressively via drawers and panels.
5. **Error prevention over error recovery.** Confirmations before destructive actions (delete stage, overwrite JSON). Inline validation before publish. The share flow has an explicit consent step. Never lose user work silently.
6. **Motion is subtle and purposeful.** Transitions communicate state changes (panel open/close, mode switch 2D→3D), not decoration. Duration ≤ 200 ms for micro-interactions, ≤ 350 ms for panel slides. Always respect `prefers-reduced-motion`.
7. **i18n-first layout contracts.** Ukrainian strings run 20–40% longer than English. All buttons, labels, and nav items must be designed with the longer string in mind. No fixed-width text containers. Truncation is a last resort — never for primary actions or safety content.

---

## 2. Color Tokens

### 2.1 Neutral palette

| Token | Value | Usage |
|-------|-------|-------|
| `--st-neutral-50` | `#FAFAF9` | Page background |
| `--st-neutral-100` | `#F1EFE8` | Surface / card background |
| `--st-neutral-200` | `#D3D1C7` | Dividers, borders |
| `--st-neutral-300` | `#B0AEA4` | *Optional mid-step for canvas ruler ticks (§5.10) — tune against `#D3D1C7` if unused* |
| `--st-neutral-400` | `#888780` | Muted text, placeholder |
| `--st-neutral-600` | `#5F5E5A` | Secondary text |
| `--st-neutral-800` | `#444441` | Body text |
| `--st-neutral-900` | `#2C2C2A` | Headings |

### 2.2 Brand accent (primary interactive)

| Token | Value | Usage |
|-------|-------|-------|
| `--st-brand-50` | `#E6F1FB` | Hover / active fill |
| `--st-brand-100` | `#B5D4F4` | Light fill, selected state |
| `--st-brand-400` | `#378ADD` | Interactive elements, CTA, links |
| `--st-brand-600` | `#185FA5` | Pressed state |
| `--st-brand-800` | `#0C447C` | Dark text on brand fill |

### 2.3 SOS category colors (RO Helper)

> **Rule:** Never rely on color alone. Always pair colored background + distinct icon + category name text.

| Category | Color | Background token | Text token | Icon pairing |
|----------|-------|-----------------|------------|--------------|
| Safety | Red | `#FCEBEB` | `#791F1F` | Shield with exclamation |
| Penalties | Amber | `#FAEEDA` | `#633806` | Warning triangle |
| Scoring | Green | `#EAF3DE` | `#173404` | Target / bullseye |
| Equipment | Purple | `#EEEDFE` | `#26215C` | Wrench / gear |
| Match admin | Blue | `#E6F1FB` | `#042C53` | Clipboard |

Stroke/border tokens for SOS tiles:

| Category | Border color |
|----------|-------------|
| Safety | `#F09595` |
| Penalties | `#FAC775` |
| Scoring | `#C0DD97` |
| Equipment | `#AFA9EC` |
| Match admin | `#85B7EB` |

### 2.4 Semantic UI aliases

| Alias | Mapped color | Usage |
|-------|-------------|-------|
| `--st-success` | Green-400 `#639922` | Published, saved, link copied |
| `--st-warning` | Amber-400 `#BA7517` | Unsaved changes, noindex preview banner |
| `--st-danger` | Red-400 `#E24B4A` | Destructive actions, validation errors |
| `--st-info` | Blue-400 `#378ADD` | Disclaimers, tips, FPSU toggle banner |

> **Dark mode:** Phase 2. Use -800 fill + -100/-200 text from same ramp. All tokens above are light-mode values.

---

## 3. Typography Tokens

### 3.1 Font stack

| Role | Family |
|------|--------|
| **Primary (UI + body)** | `Inter, system-ui, -apple-system, sans-serif` |
| Monospace (JSON, share codes) | `'JetBrains Mono', 'Fira Code', monospace` |

**Rationale:** Inter has excellent Cyrillic support, is free, and is optimized for screen rendering at 13–16 px.

### 3.2 Type scale

| Token | Size | Weight | Line-height | Usage |
|-------|------|--------|-------------|-------|
| `--st-text-h1` | 28 px | 600 | 1.25 | Page title (portal home) |
| `--st-text-h2` | 22 px | 600 | 1.30 | Module name, section heading |
| `--st-text-h3` | 18 px | 500 | 1.35 | Card title, panel header |
| `--st-text-body` | 16 px | 400 | 1.60 (Latin) / 1.65 (Cyrillic) | Article body, modal text |
| `--st-text-ui` | 14 px | 400 | 1.45 | Button labels, form labels, nav |
| `--st-text-caption` | 12 px | 400 | 1.50 | Tooltips, meta, inline disclaimer |

> **Note:** Use `line-height: 1.65` for body paragraphs containing mixed or Cyrillic-majority text to avoid descender clipping.

---

## 4. Spacing, Radii, and Elevation

### 4.1 Spacing scale

| Token | Value | Typical usage |
|-------|-------|---------------|
| `--st-space-1` | 4 px | Icon gap |
| `--st-space-2` | 8 px | Label padding |
| `--st-space-3` | 12 px | Card inner gap |
| `--st-space-4` | 16 px | Section gap |
| `--st-space-6` | 24 px | Card padding |
| `--st-space-8` | 32 px | Section margin |
| `--st-space-12` | 48 px | Page margin |

### 4.2 Border radius

| Token | Value | Usage |
|-------|-------|-------|
| `--st-radius-sm` | 4 px | Tags, badges |
| `--st-radius-md` | 8 px | Buttons, inputs |
| `--st-radius-lg` | 12 px | Cards, panels |
| `--st-radius-xl` | 16 px | Modals, drawers |

### 4.3 Focus ring

```css
box-shadow: 0 0 0 3px rgba(55, 138, 221, 0.35);
outline: none;
```

Offset: 2 px from element edge. Use `:focus-visible` to suppress mouse-only rings.

### 4.4 Minimum touch targets

| Element | Minimum size |
|---------|-------------|
| All interactive elements | 44 × 44 px |
| Toolbar icon buttons | 48 × 48 px |
| SOS tile touch area | 64 × 64 px |
| Bottom nav items | full width × 48 px tall |

---

## 5. Component Patterns

### 5.1 Buttons

```css
/* Base */
padding: 8px 16px;
border-radius: var(--st-radius-md);
font-size: 14px;
font-weight: 500;
border: 0.5px solid var(--st-neutral-200);
background: transparent;
min-height: 44px;

/* Primary CTA */
background: var(--st-brand-50);
border-color: var(--st-brand-100);
color: var(--st-brand-800);

/* Danger */
background: #FCEBEB;
border-color: #F09595;
color: #791F1F;
```

### 5.2 Cards

```css
background: var(--st-neutral-50); /* or white */
border: 0.5px solid var(--st-neutral-200);
border-radius: var(--st-radius-lg);
padding: var(--st-space-6);
```

### 5.3 Info / disclaimer banner

```css
background: #E6F1FB;
border: 0.5px solid #85B7EB;
border-radius: var(--st-radius-md);
padding: 8px 12px;
font-size: 12px;
color: #042C53;
line-height: 1.5;
role: "note"; /* aria */
```

Used on: every RO Helper article view (top of content), Stage Builder PDF export header.

### 5.4 Toggle (FPSU layer / language switch)

```html
<button
  role="switch"
  aria-checked="true"
  aria-label="Show FPSU / local rules layer"
>
  <!-- visual track + thumb -->
</button>
```

Language segmented control uses `role="radiogroup"` with `role="radio"` children.

### 5.5 SOS tile

```html
<div
  class="sos-tile sos-tile--safety"
  role="button"
  tabindex="0"
  aria-label="Safety — DQ, unsafe acts, 180 rule"
>
  <div class="sos-tile__icon" aria-hidden="true"><!-- SVG --></div>
  <div class="sos-tile__text">
    <span class="sos-tile__name">Safety</span>
    <span class="sos-tile__sub">DQ · unsafe acts · 180°</span>
  </div>
</div>
```

### 5.6 Accordion (left panel groups)

Used in: Stage Builder left panel (Paper / Steel / Ceramic / Moving / Penalty Targets / Infrastructure groups).

```html
<div class="accordion-group">
  <button
    class="accordion-header"
    aria-expanded="true"
    aria-controls="group-paper"
  >
    <svg class="accordion-chevron" aria-hidden="true"><!-- chevron --></svg>
    Paper
  </button>
  <div id="group-paper" class="accordion-body">
    <!-- target pill buttons -->
  </div>
</div>
```

```css
.accordion-header {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 6px 8px;
  font-size: 13px;
  font-weight: 500;
  color: var(--st-neutral-800);
  background: transparent;
  border: none;
  border-radius: var(--st-radius-sm);
  cursor: pointer;
  min-height: 36px;
}
.accordion-header:hover { background: var(--st-neutral-100); }
.accordion-chevron {
  width: 14px; height: 14px;
  transition: transform 150ms ease;
  flex-shrink: 0;
}
[aria-expanded="false"] .accordion-chevron { transform: rotate(-90deg); }
.accordion-body { padding: 4px 0 8px 8px; }
```

### 5.7 Target pill button

Used in: Stage Builder left panel, both regular targets and penalty targets (NS variant styled differently).

```css
/* Base pill */
.target-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 400;
  border: 0.5px solid var(--st-neutral-200);
  background: var(--st-neutral-50);
  color: var(--st-neutral-800);
  cursor: grab;
  min-height: 30px;
  white-space: nowrap;
}
.target-pill:hover { border-color: var(--st-brand-400); color: var(--st-brand-800); }
.target-pill:active { cursor: grabbing; }

/* Penalty / NS variant — red tint */
.target-pill--ns {
  background: #FCEBEB;
  border-color: #F09595;
  color: #791F1F;
}
.target-pill--ns:hover { border-color: #E24B4A; }

/* "+" prefix icon */
.target-pill::before { content: "+"; font-weight: 600; opacity: 0.6; }
```

### 5.8 Floating action panel (canvas right side)

Vertical strip of 4 icon-buttons that floats over the canvas on the right edge. Used in Stage Builder.

```css
.floating-action-panel {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: var(--st-neutral-50);
  border: 0.5px solid var(--st-neutral-200);
  border-radius: var(--st-radius-lg);
  padding: 6px;
  z-index: 10;
}
.floating-action-btn {
  width: 36px; height: 36px;
  border-radius: var(--st-radius-md);
  display: flex; align-items: center; justify-content: center;
  border: none; background: transparent;
  color: var(--st-neutral-600);
  cursor: pointer;
}
.floating-action-btn:hover { background: var(--st-neutral-100); }
.floating-action-btn--danger:hover { background: #FCEBEB; color: #A32D2D; }
```

Actions (top → bottom): delete stage, close/collapse panel, chart/stats, copy/duplicate.

### 5.9 Canvas stat bar

Horizontal strip above the canvas ruler showing live stage statistics. Updates on every canvas change.

```html
<div class="stat-bar" role="status" aria-live="polite" aria-label="Stage statistics">
  <span class="stat-item">Targets: <strong>29</strong></span>
  <span class="stat-sep" aria-hidden="true">·</span>
  <span class="stat-item">Est. min shots (indicative): <strong>28</strong></span>
</div>
```

```css
.stat-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px;
  font-size: 12px;
  color: var(--st-neutral-600);
  border-bottom: 0.5px solid var(--st-neutral-200);
  background: var(--st-neutral-50);
  min-height: 28px;
}
.stat-item strong { color: var(--st-neutral-900); font-weight: 500; }
.stat-sep { color: var(--st-neutral-400); }
```

`aria-live="polite"` ensures screen readers announce updates without interrupting. The "(indicative)" qualifier must remain visible — do not abbreviate.

### 5.10 Canvas ruler & grid

Visual only — not interactive UI components. Defined here for consistent token usage.

```css
/* Grid lines */
--st-canvas-grid-color: rgba(0, 0, 0, 0.06);  /* light mode */
--st-canvas-grid-step: 20px;                    /* 1 m = 20 px at default zoom */

/* Ruler strip */
--st-canvas-ruler-bg: var(--st-neutral-100);
--st-canvas-ruler-text: var(--st-neutral-400);  /* 10px, monospace */
--st-canvas-ruler-size: 20px;                   /* width/height of ruler strip */
--st-canvas-ruler-tick: var(--st-neutral-300);
```

### 5.11 Button variants (full set)

```css
/* Ghost (default) */
.btn { padding: 8px 16px; border-radius: var(--st-radius-md); font-size: 14px; font-weight: 500; border: 0.5px solid var(--st-neutral-200); background: transparent; color: var(--st-neutral-800); min-height: 44px; cursor: pointer; }
.btn:hover { background: var(--st-neutral-100); }

/* Primary — outline style (links, secondary CTA) */
.btn--primary { border-color: var(--st-brand-400); color: var(--st-brand-800); background: var(--st-brand-50); }
.btn--primary:hover { background: var(--st-brand-100); }

/* Primary filled — main download/action CTA (e.g. Download PDF) */
.btn--filled { background: var(--st-brand-400); border-color: var(--st-brand-600); color: #ffffff; font-weight: 600; }
.btn--filled:hover { background: var(--st-brand-600); }

/* Danger */
.btn--danger { background: #FCEBEB; border-color: #F09595; color: #791F1F; }
.btn--danger:hover { background: #F7C1C1; }

/* Ghost small (toolbar actions, accordion controls) */
.btn--sm { padding: 5px 10px; font-size: 12px; min-height: 32px; }
```

### 5.12 Hint text (below CTA)

Small contextual note below a primary action button. Not a disclaimer — just a helper instruction.

```html
<button class="btn btn--filled">Download PDF</button>
<p class="hint-text">
  To include a scene snapshot, open 3D view first, wait for it to render, then click Download PDF.
</p>
```

```css
.hint-text {
  font-size: 12px;
  color: var(--st-neutral-400);
  text-align: center;
  margin-top: 6px;
  line-height: 1.5;
}
```

### 5.13 PDF briefing panel (Stage Builder only)

Collapsible section below the canvas. Not part of the global shell — Stage Builder module only.

```html
<section class="briefing-panel">
  <button class="briefing-panel__toggle" aria-expanded="true" aria-controls="briefing-body">
    <!-- chevron icon -->
    PDF copy (briefing table)
  </button>
  <div id="briefing-body" class="briefing-panel__body">
    <div class="briefing-toolbar">
      <button class="btn btn--primary btn--sm">
        <!-- refresh icon --> Fill targets & shots from scene
      </button>
    </div>
    <div class="form-grid">
      <!-- fields -->
    </div>
    <button class="btn btn--filled">Download PDF</button>
    <p class="hint-text">To include a scene snapshot in the PDF, open 3D view…</p>
  </div>
</section>
```

```css
.briefing-panel {
  border: 1px solid var(--st-neutral-200);
  border-radius: var(--st-radius-lg);
  margin: 16px;
  background: var(--st-neutral-50);
}
.briefing-panel__toggle {
  display: flex; align-items: center; gap: 8px;
  width: 100%; padding: 14px 16px;
  font-size: 14px; font-weight: 500;
  background: transparent; border: none; cursor: pointer;
  color: var(--st-neutral-900);
  border-radius: var(--st-radius-lg);
  min-height: 48px;
}
.briefing-panel__toggle:hover { background: var(--st-neutral-100); }
.briefing-panel__body { padding: 0 16px 20px; }
.briefing-toolbar { margin-bottom: 16px; }
```

### 5.14 Form grid (briefing fields)

Two-column layout for paired short fields (Max points / Start signal). Full-width for textarea fields.

```html
<div class="form-grid">
  <div class="form-field">
    <label class="form-label">Document title</label>
    <input type="text" class="form-input" value="Вправа тренувальна" />
  </div>
  <div class="form-field">
    <label class="form-label">Exercise type</label>
    <select class="form-input"><option>Long</option></select>
  </div>
  <!-- Full-width textarea -->
  <div class="form-field form-field--full">
    <label class="form-label">Course of fire</label>
    <textarea class="form-input form-textarea" rows="3"></textarea>
  </div>
</div>
```

```css
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 16px;
}
.form-field--full { grid-column: 1 / -1; }
.form-label { display: block; font-size: 12px; color: var(--st-neutral-600); margin-bottom: 4px; }
.form-input {
  width: 100%; padding: 7px 10px;
  font-size: 14px; font-family: inherit;
  border: 0.5px solid var(--st-neutral-200);
  border-radius: var(--st-radius-md);
  background: white; color: var(--st-neutral-900);
  min-height: 36px; box-sizing: border-box;
}
.form-input:focus { outline: none; box-shadow: 0 0 0 3px rgba(55,138,221,.25); border-color: var(--st-brand-400); }
.form-textarea { resize: vertical; min-height: 72px; line-height: 1.55; }
```

---

## 6. Information Architecture

```
Portal shell (shooters-tools.com)
├── Language toggle (UK / EN) — persistent in shell header
│
├── /                          Portal home
│   ├── Module tile: Stage Builder
│   ├── Module tile: RO Helper (coming soon → live)
│   └── Trust footer + global disclaimer link
│
├── /stage-builder             Stage Builder (flagship)
│   ├── /v/:shareId            View shared stage (public, stable route)
│   └── /e/:shareId            Edit stage via link (stable route)
│
├── /ro-helper                 RO Helper
│   ├── SOS grid (5 categories)
│   ├── Discipline picker (Handgun, PCC, Rifle, Mini Rifle, Shotgun — codes in content matrix)
│   ├── FPSU layer toggle (independent from locale toggle)
│   └── Article view
│       ├── Disclaimer banner (top, always visible)
│       ├── IPSC body text
│       └── FPSU / local layer block (conditional)
│
└── /publish-policy            Linked from share flow + footer
```

**Disclaimer placement rules:**
- Global: footer of every page — "This app is for reference only. Verify rules against your official federation PDF edition."
- Per-article: info banner at the top of every RO Helper article view.
- Per-export: briefing header in every Stage Builder PDF/JSON export.

---

## 6a. Global Site Footer

The footer appears on **every page** of the portal — portal home, Stage Builder, RO Helper, publish-policy, and any future modules. It is part of the shell, not any individual module.

### Structure

```
[ Logo mark + wordmark ]   [ Disclaimer text ]   [ Links ]
[ Feedback section     ]   [ Support section  ]
```

### 6a.1 Feedback section

Tone: friendly and low-pressure. A bug report or suggestion is welcome; the user owes nothing.

```html
<div class="footer-feedback">
  <p class="footer-section-title">Feedback</p>
  <p class="footer-section-body">
    Found a bug, have a suggestion, or want to leave a review? Reach out:
  </p>
  <div class="footer-contact-row">
    <a href="mailto:..." class="btn btn--sm">
      <!-- envelope icon --> Email
    </a>
    <a href="https://t.me/..." class="btn btn--sm footer-btn--telegram">
      <!-- telegram icon --> Telegram
    </a>
  </div>
</div>
```

```css
.footer-btn--telegram {
  border-color: #2AABEE;
  color: #0077AA;
  background: #E8F7FE;
}
.footer-btn--telegram:hover { background: #C8EDFB; }
```

### 6a.2 Support the project section

Tone: appreciative, never guilt-tripping. The app is free; a donation is a gift, not an obligation. Never use language like "keep us alive" or "we need your support to survive".

```html
<div class="footer-support">
  <p class="footer-section-title">Support the project</p>
  <p class="footer-section-body">
    Stage Builder is free and open. If you find it useful, consider supporting development:
  </p>
  <a href="https://send.monobank.ua/..." class="btn btn--sm footer-btn--donate">
    <!-- heart icon --> Donate (Monobank)
  </a>
</div>
```

```css
.footer-btn--donate {
  border-color: #F09595;
  color: #791F1F;
  background: #FCEBEB;
}
.footer-btn--donate:hover { background: #F7C1C1; }
```

### 6a.3 Footer layout

```css
.site-footer {
  border-top: 0.5px solid var(--st-neutral-200);
  background: var(--st-neutral-100);
  padding: 24px 24px 16px;
  margin-top: auto; /* pushes footer to page bottom in flex column layout */
}
.footer-top {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 16px;
}
.footer-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 0.5px solid var(--st-neutral-200);
  font-size: 12px;
  color: var(--st-neutral-400);
  flex-wrap: wrap;
  gap: 8px;
}
.footer-section-title {
  font-size: 13px; font-weight: 500;
  color: var(--st-neutral-800);
  margin: 0 0 4px;
}
.footer-section-body {
  font-size: 12px; color: var(--st-neutral-600);
  margin: 0 0 10px; line-height: 1.5;
}
.footer-contact-row { display: flex; gap: 8px; flex-wrap: wrap; }

/* Mobile: stack to single column */
@media (max-width: 480px) {
  .footer-top { grid-template-columns: 1fr; }
}
```

### 6a.4 Footer links (bottom row)

Always include: **Publish policy** · **About** · disclaimer text.  
Optional: **GitHub** (if repo is public), **Changelog**.

---

## 7. Stable Public Routes (Do Not Break)

These routes are embedded in QR codes and competition materials. Changing them breaks real events.

| Route | Purpose |
|-------|---------|
| `/` | Portal home |
| `/stage-builder` | Stage Builder module entry |
| `/v/:shareId` | View shared stage (public) |
| `/e/:shareId` | Edit stage via link |
| `/publish-policy` | Publish policy page |

---

## 8. Mobile Constraints (Stage Builder)

On viewports ≤ 480 px:

| Desktop element | Mobile equivalent |
|-----------------|-------------------|
| Left panel (target palette) | Bottom sheet (swipe-up via "Targets" tab) |
| Right panel (properties) | Bottom sheet (opens on element selection) |
| Toolbar (labeled icons) | Icon-only row, 48 × 48 px touch areas |
| Panel tabs | Bottom navigation bar (Canvas / Targets / Props / Share) |
| "New element" | FAB (+) in bottom-right of canvas — opens target picker sheet |

Canvas interactions: tap to select, drag to add/move, pinch to zoom.

---

## 9. Two Independent Toggles (RO Helper)

| Toggle | Location | Controls |
|--------|----------|---------|
| **Locale** (UK / EN) | Shell header, every page | All UI strings + article body language |
| **FPSU layer** | RO Helper header banner + per-article | Whether FPSU/local rules callout block renders in articles |

These are orthogonal. A user can read Ukrainian UI with no FPSU layer, or English UI with FPSU layer shown.

---

## 10. Accessibility Checklist (WCAG 2.2 AA)

1. **Color + icon + text for all SOS categories** — test in grayscale; all 5 must still be distinguishable.
2. **Contrast ratio ≥ 4.5:1** on all colored backgrounds — use darkest ramp stop (800/900) for text on light fills. Amber/yellow on white is the most common failure.
3. **Focus ring** on every button, link, input, and SOS tile — `box-shadow: 0 0 0 3px rgba(55,138,221,.35)`, use `:focus-visible`.
4. **Modal focus trap** — publish/share modal: focus moves inside on open, Tab cycles within, focus returns to trigger on close. Use `inert` attribute on background.
5. **44 × 48 px minimum touch targets** — use `padding` or `::after` pseudo-elements to expand visual-small targets.
6. **All SVG icons have accessible labels** — interactive icons: `aria-label` on button, `aria-hidden="true"` on SVG. Informational SVGs: `role="img" aria-label="..."`.
7. **Toggle controls use `role="switch"`** with `aria-checked="true/false"`. Language segmented control: `role="radiogroup"` + `role="radio"`.
8. **Disclaimer banners not suppressed by AT** — use `role="note"` or `<aside>`, never `aria-hidden`.
9. **Canvas has accessible name** — `<canvas aria-label="Stage canvas">`. Full keyboard editing is Phase 2.
10. **`prefers-reduced-motion`** — wrap all `@keyframes` and transitions: `@media (prefers-reduced-motion: no-preference) { ... }`.

---

## 11. Anti-patterns (Do Not Do)

1. **Color-only SOS encoding** — a red tile with no icon or text label fails color-blind users and outdoor glare. Always: color + icon shape + category name.
2. **Burying the "reference only" disclaimer** — placing it only in a help modal or settings page. Always visible: banner in every article, link in global footer.
3. **Mixing discipline-specific copy without context** — showing Shotgun penalty rules alongside Handgun equipment rules without a visible discipline label. Always show active discipline chip + breadcrumb in article view.
4. **Fixed-width label containers** — Ukrainian "Опублікувати сцену" is ~28% longer than "Publish stage". All buttons and nav items must use flex/auto width. Test every UI string in Ukrainian before shipping.
5. **Desktop-only touch targets on mobile** — a 16 px icon toolbar in a mobile header will cause mis-taps under stress. On mobile: collapse to bottom nav, FAB, bottom sheets; enforce 48 px touch areas.
6. **Implied official partnership** — phrases like "Official IPSC Stage Builder" or "Endorsed by IPSC/FPSU" without a legal agreement. Use: "for IPSC-style stages" / "reference for IPSC rules".
7. **Building a full design system before shipping** — for a solo/small team, formalize incrementally. Phase 1: tokens in one `tokens.css` + shared component folder. Storybook and Figma library come later.

---

## 12. Legal / Trust Copy Guidelines

- **Acceptable:** "for IPSC-style stages", "reference for IPSC rules", "based on IPSC rulebook edition X"
- **Not acceptable:** "official IPSC tool", "endorsed by IPSC", "replaces the rulebook"
- Rule references in UI copy must always include: *"per your edition — verify in the official PDF"*
- The app educates; it does not replace official federation documents.
- `/publish-policy` must be linked from: share flow consent step, global footer.

---

*Updated: April 2026 — added §0 Brand & Logo (logo mark from uploaded asset), §5.6–5.14 new component patterns (accordion, target pill, floating action panel, stat bar, canvas ruler, button variants, hint text, briefing panel, form grid), §6a Global Site Footer (feedback + support sections as sitewide shell components).*  
*Reconcile against `PORTAL_PLAN.md §3` (brand/URL) and `RO_HELPER_V0.md §7` (SOS colors) before React implementation.*
