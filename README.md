# Quarto (Telegram)

Классическое **Кварто 1v1** в Telegram: challenge-карточка → Mini App → give / place / declare.

- Бот: [@tgquarto_bot](https://t.me/tgquarto_bot)
- Mini App (Pages): https://buravchik.github.io/quarto/
- API (Cloud Run): https://quarto-bot-4lwkxnuf4q-ew.a.run.app

Разработка идёт через **Spec Kit** (см. `specs/`, конституция `.specify/memory/constitution.md`). Sudoku в соседних репо — только архитектурный ориентир, не UX.

---

## Что уже в продукте (v1)

- Classic 4×4, give-and-place, объявление Кварто с указанием набора
- Галочки сессии: **Miss** (Void / Persistent) и **Pie Rule** (лок на join)
- Авто-ничья при полной доске без неразрешённого выигрыша
- Карточка до **8** независимых 1v1-слотов; Open Mini App целится в preferred-слот (waiting → active → первый)
- Сервер авторитетен (`initData`); UI — presentation

---

## Правила v1 (Classic)

### Поле и фигуры

- Доска **4×4**, **16** уникальных фигур
- **4 бинарных признака**: тон (светлая/тёмная), рост (высокая/низкая), план (круглая/квадратная), отверстие (полая/сплошная)

### Ход (give-and-place)

1. Игрок **A выбирает** фигуру из пула и **отдаёт** сопернику  
2. Игрок **B ставит** её на пустую клетку  
3. Затем **B выбирает** следующую фигуру для A  
4. И так далее

Открывающий выбирается при старте матча (после join).

### Победа

Четыре фигуры в ряд (горизонталь / вертикаль / диагональ), у которых есть **хотя бы один общий признак**, и игрок **объявляет «Кварто!»**, указав этот набор из 4 клеток. Сервер проверяет легальность объявления.

### Miss (галочка сессии)

| | Miss OFF — **Persistent** | Miss ON — **Void** |
| --- | --- | --- |
| Источник продукта | BGG-proposal (набор не «сгорает») | Gigamic + theworldatplay |
| Когда можно объявить | Только в **свой** ход **сразу после своего place**, набор должен проходить через клетку place | До hand-off после своего place; иначе оппонент может заявить до своего place |
| Если не заявили | Набор **остаётся** доступным при более позднем своём place на этой линии | После place оппонента пропущенная линия **умирает** (void) |
| Скан линий | Через клетку текущего place | Только линии **через клетку текущего place** |

### Pie Rule (галочка сессии)

После **первого** place второй игрок выбирает: **забрать открытие** (стать «первым») или **остаться вторым**.  
Формулировка по Kandrac (BGG); у Classic сильный first-player advantage спорный — поэтому опционально.

### Ничья

Когда доска **полна** и нет неразрешённого выигрыша — **автоматическая** ничья (никто не «объявляет» ничью).

### Таймаут

Ход можно забрать по таймауту (**8 часов** ожидания), если ждать своего хода; в Mini App есть countdown.

### Реванш

После партии: offer / accept / decline; настройки Miss/Pie копируются в новую сессию.

---

## Каталог режимов (исследовано, не всё в v1)

Архитектура: режимы подключаются **модулями**.  
**Правило совместимости:** из каждой conflict-группы — **максимум один** mode.

### Conflict groups

| Group | Members | Notes |
| --- | --- | --- |
| Slide | Quarto+ · Shift | XOR или один mode с параметром |
| Wrap/Torus | Wrap Diagonals · Wrap Squares · Torus | Torus на 4×4 ≈ Classic + оба Wrap |
| Square-geometry | Comp 1 (2×2) · Any Square (20) | Any Square включает Comp 1 |
| Win-polarity | Classic win · Anti-Quarto | взаимоисключение |
| Trait-count-win | Classic (≥1) · Double (≥2) | |
| Pick-model | Classic give · Self-Pick · Blind · Draft · Ban* | Self-Pick ломает give |
| Board-size | Classic 4×4 · 3×3 · 5×5 · 6×6 · 8×8 · 3D · 4D · Starburst · … | ровно один layout |

\* Ban A/B могут быть модификаторами give — решать в семье «ходы».

### Уже в v1 (не дублировать модулями)

Classic 4×4 give-and-place · Miss Void/Persistent · Pie Rule · auto-draw

### Семья A — признаки / выбор фигуры *(будущее)*

| Mode | Суть | Провенанс |
| --- | --- | --- |
| Beginner Traits-N | только N осей (1/2/3) | Gigamic / BGG kids |
| Self-Pick | сам берёшь и ставишь | при идеальной игре 2-й выигрывает → рекомендовать с Pie |
| Five-Trait | 4×4; 32 фигуры; ≤16 на поле | PlayPendium Quartet |
| Double Quarto | победа при ≥2 общих признаках | house |
| Anti-Quarto | кто закрыл набор — проигрывает | BGG Koch |

### Семья B — геометрия 4×4 *(будущее)*

| Mode | Суть | Провенанс |
| --- | --- | --- |
| Comp 1 | + девять смежных 2×2 | Gigamic advanced |
| Any Square | + ровно **20** квадратов из 4 клеток | BGG Russ |
| Wrap Diagonals | + 6 wrap-диагоналей | Magliery Set Quarto |
| Wrap Squares | + 7 wrap-2×2 (вкл. 4 угла) | Magliery |
| Torus | Classic lines + оба Wrap | не параллельно отдельным Wrap |

**Any Square — 20 масок** (не parallelogram / не non-square rectangle): 9× смежные 2×2 + 4× углы 3×3 + 1× углы поля + 4× ромбы 45° + 2× knight-skew.

### Семья C — ход / память *(будущее)*

| Mode | Суть | Провенанс |
| --- | --- | --- |
| Blind (house) | по 8 втайне; свой пул виден | ≠ Quarto Access |
| Quarto Access | тактильность + повязка | **другой продукт**, не mode Classic |
| Quarto+ | после place: optional ортогональный slide | BGG Mihaescu |
| Shift | раз за партию, **до** place | house; XOR с Quarto+ |
| Ban A / Ban B | ban trait / ban empty cell при отдаче | house |
| Draft | рука **3**: добрать 1 → отдать 1 из 3 | Pagat Aces and Faces / BGG cards |
| Face-Down Extreme | на поле рубашкой вниз; call solid/hollow; ошибка = lose | BGG Ebi |

### Семья D — другие размеры / раскладки *(будущее)*

| Mode | Суть | Notes |
| --- | --- | --- |
| 5×5 Penta / Hybrid | 32 фигуры | fan; не звать Quinto |
| 6×6 + obstacles | в начале по 2 блока-препятствия | BGG |
| 8×8 Six-Trait | 64 фигуры / 6 признаков | «8 в ряд» = **HOUSE**, если берём |
| 3×3 Ternary | 9 фигур; 2 признака × 3 значения | Chalkdust fit |
| 3D / 4D | 4×4×4 / hypercube | win-sets часто **HOUSE** |
| Starburst | 28 фиксированных winning sets | Magliery |
| Gridless | поле не шире/длиннее 4 фигур | BGG cards |
| Placement-Dictates-Board | ходы задают геометрию | текст обрывается — не готов |

### ~~Icehouse Quinto~~ — OUT

Другая игра. Не модуль Кварто.

### Отдельные типы партии *(не mode на 1v1-слоте)*

Pass-left N-player · Teams 4p (партнёры напротив) · 3p miss house · Elimination · Solitaire  

Дефолт Telegram-продукта = **1v1**. Третьего в ongoing 1v1 не пускать.

### Очередь будущих спек

1. ~~v1 Classic + Telegram + Miss + Pie~~  
2. Modes A — traits / pick  
3. Modes B — geometry 4×4  
4. Modes C — turn / memory  
5. Modes D — other boards  
6. Match types — N-player / teams / elimination / solitaire  

---

## Архитектура (кратко)

| Часть | Стек |
| --- | --- |
| Mini App | Next.js static export → GitHub Pages (`/quarto`) |
| Bot + API | Telegraf + `/api/v1` на Cloud Run |
| DB | Postgres (Supabase) + Drizzle |
| Правила | `src/quarto` state machine (тесты без живого бота) |

Конституция (секреты, auth, rate limit, Spec Kit): `.specify/memory/constitution.md`.

---

## Локальный запуск

```bash
cp .env.example .env   # BOT_TOKEN, DATABASE_URL, TELEGRAM_WEBAPP_URL, NEXT_PUBLIC_API_BASE, …
npm ci
npm test
npm run build
npm run bot:start      # long-poll если WEBHOOK_URL пуст
npm run dev            # Mini App
```

Прод:

- Pages: workflow `.github/workflows/pages.yml` на `master`
- Bot: `gcloud run deploy quarto-bot --source . --region europe-west1 --project sudoku-buravchik`
- Webhook: `WEBHOOK_URL=https://<service>/telegram` (на старте вызывается `setWebhook`)

Smoke: `npm run smoke:api`, `npm run smoke:miniapp`.

---

## Spec Kit

Фичи лежат в `specs/00N-…/`. Процесс: constitution → specify → clarify → plan → tasks → implement → converge.

Не добавлять speculative features вне утверждённой спеки (принцип VIII).

---

## Лицензия / attribution

Игра **Quarto** — товарный знак / дизайн Gigamic; этот репозиторий — независимая Telegram-реализация classic 1v1 и исследовательский каталог вариантов (BGG, Magliery, Chalkdust, Pagat и др.). Провенанс house/HOUSE помечен явно.
