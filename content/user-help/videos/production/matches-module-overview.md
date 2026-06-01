# Модуль «Матчі» — огляд відео

**Модуль увімкнений лише за** `VITE_ENABLE_MATCH_PORTAL=1` (на production shooters-tools.com — за налаштуванням деплою).

## Два повних відео (не 30-сек уривки)

| Slug | Аудиторія | Тривалість | Production pack |
|------|-----------|------------|-----------------|
| **`matches-shooter-register-full`** | Стрілець | **~1:15** | [matches-shooter-register-full.md](./matches-shooter-register-full.md) |
| **`matches-organizer-full`** | Організатор | **~2:00** | [matches-organizer-full.md](./matches-organizer-full.md) |

Короткі `matches-find-and-register` / `matches-organizer-create` — **нарізки** з цих записів (як у Stage Builder).

## Перед зйомкою (спільне)

- [ ] Production або staging з **увімкненими матчами** і **опублікованим демо-матчем** у каталозі (seed або створений вручну).
- [ ] Мова **UK**, вікно **≥ 1280 px**.
- [ ] Для організатора: тестовий акаунт зі статусом організатора **active** (або знімати блок «заявка в акаунті» окремим кадром — позначити в монтажі).
- [ ] Для стрільця: акаунт учасника з заповненим профілем (ім’я, телефон) — швидша заявка.
- [ ] Запис: **OBS**, 16:9 → при потребі crop 9:16 у CapCut.

**Зйомка:** [RECORDING_GUIDE.md](../RECORDING_GUIDE.md)  
**Сценарій на телефон (кроки в кадрі):** [matches-recording-phone.md](./matches-recording-phone.md)

## Після публікації

- `publishedUrl` у [../manifest.json](../manifest.json)
- Статті: `uk/articles/matches/*.md`
- Беклог: **UH-V07**, **UH-V08** у [BACKLOG_USER_HELP.md](../../../../docs/BACKLOG_USER_HELP.md)
