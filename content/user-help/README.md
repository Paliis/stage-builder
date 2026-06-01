# User help — локальний контент (не прод)

Користувацькі інструкції для **Shooters Tools** / **Stage Builder**: проста мова, сценарії, FAQ, метадані відео.

**Статус:** чернетки в репозиторії. Публічний розділ на сайті — після [фази 4](../../docs/USER_HELP_ONBOARDING_PLAN.md#фаза-4--інтеграція-в-продукт-прод) у [USER_HELP_ONBOARDING_PLAN.md](../../docs/USER_HELP_ONBOARDING_PLAN.md).

## Правила

- **Не** копіювати сюди `docs/FUNCTIONALITY.md` — лише переклад у «що натиснути».
- Технічні терміни (PWA, Supabase, RPC) — **заборонені** в текстах для користувача.
- Кожен файл — **frontmatter** + markdown-тіло.
- Статуси: `draft` → `review` → `ready` (див. `manifest.json`).

## Схема frontmatter

```yaml
---
id: UH-uk-quick-start          # унікальний, стабільний
slug: quick-start                # URL-сегмент (майбутній /help/quick-start)
locale: uk
title: "Швидкий старт"
summary: "Перша вправа за кілька хвилин"
audience: [organizer, ro, trainer]
module: stage-builder            # stage-builder | matches | portal | hit-factor | ro-helper
status: draft
relatedVideos: [field-size, place-target]
---
```

## Папки

| Шлях | Призначення |
|------|-------------|
| `uk/`, `en/` | Локалізований контент |
| `uk/_index.md` | Хаб «Допомога» |
| `uk/quick-start.md` | 4 кроки |
| `uk/faq.md` | Питання-відповіді |
| `uk/onboarding/in-app-dialog.md` | Текст для діалогу в редакторі |
| `uk/articles/*/` | Статті за сценаріями |
| `videos/manifest.json` | Рілси: slug, назва, пріоритет, URL після публікації |
| `assets/` | GIF, постери (без великих відео в git) |

## Маніфест і контент-план

| Файл | Призначення |
|------|-------------|
| [manifest.json](./manifest.json) | Реєстр матеріалів (21 стаття, статуси) |
| [docs/USER_HELP_CONTENT_PLAN.md](../docs/USER_HELP_CONTENT_PLAN.md) | Детальний план по модулях, FAQ, таймінг рілсів |
| [videos/manifest.json](./videos/manifest.json) | 17 рілсів + `durationSec` |
| [videos/scripts/](./videos/scripts/) | Покадрові сценарії з субтитрами |
| [videos/production/](./videos/production/) | Пакет для зйомки (чекліст, SRT, пости) |
| [PROGRESS.md](./PROGRESS.md) | Прогрес по рілсах і статтях |

## Дерево (актуальне)

```text
content/user-help/
  uk/_index.md, quick-start.md, faq.md
  uk/onboarding/          in-app-dialog, context-hints
  uk/articles/
    portal/               overview, ro-helper-tips
    stage-builder/        10 статей
    matches/              5 статей
    share/                publish-policy-user
    hit-factor/           basics
    account/              profile
  en/                     (дзеркало — частково)
  videos/scripts/         17 × .md
```

## Редагування

1. Змінити markdown.  
2. Оновити `status` у файлі та в `manifest.json`.  
3. За планом UH — рев’ю, потім інтеграція в i18n / `/help`.
