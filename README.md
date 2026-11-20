# Quarto

Telegram 1v1: карточка → Mini App → give / place / declare.

| | |
| --- | --- |
| Бот | [@tgquarto_bot](https://t.me/tgquarto_bot) |
| Mini App | https://buravchik.github.io/quarto/ |
| API | https://quarto-bot-4lwkxnuf4q-ew.a.run.app |
| Спеки | `specs/` |
| Конституция | `.specify/memory/constitution.md` |

Состояние матча считает сервер (`initData`). UI ничего не решает.

## v1

- Classic 4×4, give-and-place, объявление набора из 4 клеток
- Miss: Void или Persistent; Pie Rule; оба локаются на join
- Ничья сама, когда доска полна и выигрыша нет
- До 8 слотов на карточке; Open ведёт в waiting → active → первый
- Таймаут хода: 8 ч
- Реванш: offer / accept / decline (Miss/Pie копируются)

## Classic

Доска 4×4, 16 фигур. Признаки: светлая/тёмная, высокая/низкая, круглая/квадратная, полая/сплошная.

Ход: A отдаёт фигуру → B ставит → B отдаёт следующую A. Открывающий после join.

Победа: 4 в ряд (ряд/столбец/диагональ) с ≥1 общим признаком + объявление «Кварто!» с клетками. Сервер проверяет.

### Miss

| | Persistent (OFF) | Void (ON) |
| --- | --- | --- |
| Откуда | BGG-proposal | Gigamic / theworldatplay |
| Когда declare | Свой ход сразу после своего place, линия через клетку place | До hand-off; иначе оппонент до своего place |
| Пропуск | Линия жива для более позднего своего place | После place оппонента линия мёртвая |
| Скан | Через клетку place | Только через клетку place |

### Pie

После первого place второй: взять открытие или остаться вторым (Kandrac, BGG). Галочка опциональна.

## Режимы (каталог, почти всё не в коде)

Из каждой conflict-группы — не больше одного mode.

| Group | Members |
| --- | --- |
| Slide | Quarto+ · Shift |
| Wrap/Torus | Wrap Diagonals · Wrap Squares · Torus |
| Square | Comp 1 · Any Square (20) |
| Win polarity | Classic · Anti-Quarto |
| Trait-count | Classic (≥1) · Double (≥2) |
| Pick | Classic give · Self-Pick · Blind · Draft · Ban |
| Board | 4×4 · 3×3 · 5×5 · 6×6 · 8×8 · 3D · 4D · Starburst · Gridless · … |

### A — признаки / выбор

| Mode | Суть | Откуда |
| --- | --- | --- |
| Traits-N | только N осей | Gigamic / BGG kids |
| Self-Pick | сам берёшь и ставишь (2-й сильнее → с Pie) | Holshouser / TU Graz |
| Five-Trait | 32 фигуры на 4×4, ≤16 на поле | PlayPendium Quartet |
| Double | ≥2 общих признака | house |
| Anti-Quarto | закрыл набор — проиграл | BGG Koch |

### B — геометрия 4×4

| Mode | Суть | Откуда |
| --- | --- | --- |
| Comp 1 | +9 смежных 2×2 | Gigamic advanced |
| Any Square | +20 квадратов (не параллелограммы) | BGG Russ |
| Wrap Diagonals | +6 | Magliery |
| Wrap Squares | +7 (вкл. 4 угла) | Magliery |
| Torus | линии + оба wrap | = не ставить wrap отдельно |

Any Square: 9×2×2 + 4×углы 3×3 + 1×углы поля + 4×ромбы 45° + 2×knight-skew = 20.

### C — ход / память

| Mode | Суть | Откуда |
| --- | --- | --- |
| Blind | по 8 скрытых; свой пул виден | house (≠ Access) |
| Quarto Access | тактильность + повязка | другой продукт |
| Quarto+ | после place optional ортогональный slide | BGG |
| Shift | раз за партию до place | house; XOR с Quarto+ |
| Ban A/B | ban trait / клетку при отдаче | house |
| Draft | рука 3: добор → отдать одну | Pagat / BGG cards |
| Face-Down Extreme | на поле рубашкой; call solid/hollow; ошибка = lose | BGG Ebi |

### D — другие поля

| Mode | Суть | Note |
| --- | --- | --- |
| 5×5 Penta | 32 фигуры | не Quinto |
| 6×6 + obstacles | по 2 блока в начале | BGG |
| 8×8 / 6 traits | 64 фигуры | «8 в ряд» = HOUSE |
| 3×3 Ternary | 2 признака × 3 значения | Chalkdust |
| 3D / 4D | куб / гиперкуб | win-sets часто HOUSE |
| Starburst | 28 фиксированных сетов | Magliery |
| Gridless | не шире/длиннее 4 | BGG |
| Placement-Dictates | геометрия от ходов | текст обрывается |

Icehouse Quinto — другая игра, не модуль.

Отдельные типы партии (не mode на 1v1): N-player pass-left, teams 4p, 3p miss house, elimination, solitaire. Продукт по умолчанию — 1v1.

Очередь спек: Modes A → B → C → D → match types.

## Стек

Mini App: Next static → Pages `/quarto`. Bot+API: Telegraf на Cloud Run. DB: Postgres/Supabase, Drizzle. Правила: `src/quarto`.

## Запуск

```bash
cp .env.example .env
npm ci
npm test
npm run build
npm run bot:start    # long-poll без WEBHOOK_URL
npm run dev
```

Прод: Pages на push в `master`;  
`gcloud run deploy quarto-bot --source . --region europe-west1 --project sudoku-buravchik`;  
`WEBHOOK_URL=https://<service>/telegram`.

Smoke: `npm run smoke:api`, `npm run smoke:miniapp`.

## Attribution

Quarto — Gigamic. Здесь независимая Telegram-сборка classic 1v1 и каталог вариантов (BGG, Magliery, Chalkdust, Pagat). HOUSE помечен явно.
