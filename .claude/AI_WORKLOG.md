# AI Worklog

Журнал роботи AI-агента над проєктом. Новий запис — зверху.
Формат: дата · задача · що зроблено · рішення · перевірка · відкриті питання.

---

## 2026-11-25 · Каталог тест-кейсів, коміт і push

### Що зроблено
- **Каталог `test-cases/`** з описом усіх 13 автотестів, складений за кодом тестів (кроки, дані й тексти помилок узяті з самих тестів):
  - `README.md` — умовні позначення (ID, тип, пріоритет) і матриця покриття «кейс → файл і назва автотесту»;
  - `ui-saucedemo.md` — 9 кейсів: логін (3), каталог (1), сортування (2), кошик (1), чекаут (2);
  - `api-restful-booker.md` — 4 кейси: CRUD-флоу (7 кроків) і 3 негативні.
  - Посилання на каталог додано в кореневий `README.md`.
- **Пріоритети за зауваженням користувача:** негативні кейси авторизації `UI-LOGIN-02`, `UI-LOGIN-03`, `API-AUTH-01` підвищено P2 → P1. Шкалу уточнено: P1 = критичний шлях користувача **або безпека**. `UI-CHK-02` (валідація форми) лишився P2, `API-BOOK-03` (404) — P3.
- **Перейменування:** `UI-CHK-01` тепер називається «Чекаут: успішне оформлення замовлення». Користувач не знайшов позитивного кейсу чекауту за старою назвою «Оформлення замовлення від кошика до підтвердження».
- **Коміти й push у `master`:**
  - `d27615a` — видимий браузер локально, headless у CI;
  - `206166e` — проєкти розділені через `testMatch` замість окремого `testDir`, назви тестів без `"` і `->`;
  - `377af9c` — каталог `test-cases/`.

### Рішення та чому
- Пріоритет визначається ризиком, а не типом кейсу: негативний кейс, який захищає доступ, критичніший за позитивну дрібницю на кшталт сортування Z→A.
- Тест-кейси прив'язані до автотестів через назву тесту, а не номер рядка, бо номери рядків зсуваються при правках.

### Перевірка
- Push пройшов з сеансу агента (`cfaffce..377af9c`). Результат CI для `377af9c` на момент запису ще невідомий.

---

## 2026-11-25 · Візуалізація браузера

- `playwright.config.ts`: project `ui` локально запускається headed, у CI — headless (`headless = CI || HEADLESS=1`). Додано `SLOWMO` (мс) через `launchOptions.slowMo`.
- `package.json`: `test:headed` тепер з `--workers=1` (одне вікно, тести по черзі), додано `test:watch` (Playwright UI mode).
- Перевірено: login.spec headed + `SLOWMO=300` — 3/3; `CI=1` project ui — 9/9 headless; typecheck ок.

---

## 2026-11-25 · Перевірка GitHub Actions після публікації репозиторію

- Репозиторій: https://github.com/DmtrjShevchenko/Playwright_TypeScript (гілка `master`).
- Перший run на push (`91f242c`): [45580304934](https://github.com/DmtrjShevchenko/Playwright_TypeScript/actions/runs/45580304934) — **success**.
  Усі кроки зелені (install → typecheck → Chromium → tests → upload). Артефакт `playwright-report` (~200 KB) завантажено; `test-results` пропущено, бо падінь не було.
- Змін у workflow не знадобилось. У README бейдж замінено на абсолютний URL, бо відносний шлях до картинки GitHub не рендерить.
- Перевірено через публічний GitHub REST API (`gh` CLI локально не встановлений). Логи job'а вимагають авторизації, тому кількість пройдених тестів у CI видно тільки у звіті-артефакті.

---

## 2026-11-25 · Початкове налаштування проєкту

**Агент:** Claude Code (Claude Opus 5.5)
**Промпт:** `.claude/prompts/PROMPTS.md` → №1

### Стартовий стан
Голий `npm init playwright`: `example.spec.ts` для playwright.dev, 3 браузери, дефолтний workflow тільки на `main/master`.

### Що зроблено
- **Агентський каталог `.claude/`**: `CLAUDE.md` (правила), `skills/` (`add-ui-test`, `add-api-test`, `debug-failing-test`), `prompts/PROMPTS.md`, цей worklog.
- **Конфіг** `playwright.config.ts`: два projects — `ui` (Chromium, `baseURL` saucedemo, `testIdAttribute: 'data-test'`) і `api` (без браузера, `baseURL` restful-booker, JSON-заголовки). Trace/screenshot/video — тільки для падінь. Reporters: `list` + `html`.
- **Page Objects** (`src/pages/`): `LoginPage`, `InventoryPage`, `CartPage`, `CheckoutPage`, `HeaderComponent`.
- **Фікстури** (`src/fixtures/`): `loggedIn` логіниться як `standard_user`; `bookingApi`, `token` для API.
- **UI-тести (9)**:
  - позитивні (6): логін; каталог (6 товарів, ціни, кнопки); сортування ціна ↑; сортування назва Z→A; кошик add/remove + бейдж; чекаут end-to-end з перевіркою subtotal/tax/total.
  - негативні (3): `locked_out_user`; невірний пароль; чекаут без postal code.
- **API-тести (4)**:
  - флоу (1 тест, 7 `test.step`): auth → create → get → update (PUT) → get → delete → get 404.
  - негативні (3): auth з невірним паролем; PUT без токена → 403 і дані не змінились; GET неіснуючого id → 404.
- **CI** `.github/workflows/playwright.yml`: на кожен `push` (усі гілки) + `pull_request` + ручний запуск; кеш npm; typecheck; тільки Chromium; артефакт `playwright-report` завжди, `test-results` (trace) — при падінні.
- Додано `typescript` у devDependencies і `tsconfig.json` (strict) для `npm run typecheck`.
- Видалено шаблонний `tests/example.spec.ts`.

### Рішення та чому
- **Тільки Chromium** — для тестового завдання крос-браузерність не потрібна, а CI в 3 рази швидший.
- **API-флоу одним тестом з `test.step`**, а не `describe.serial`: кроки логічно залежні, а так тест атомарний, паралелиться з іншими і звіт показує, на якому кроці впало.
- **Порівняння грошей у центах** — `29.99 + 7.99` у float ≠ `37.98`.
- **Квірки Restful Booker зафіксовані в тестах як є** (DELETE → 201, bad auth → 200) з коментарями, а не "виправлені".
- Креденшели — публічні демо, але читаються з env з дефолтами (`SAUCE_PASSWORD`, `BOOKER_USERNAME`, `BOOKER_PASSWORD`), щоб їх можна було перевизначити через GitHub Secrets.

### Перевірка
- `npm run typecheck` — без помилок.
- `npx playwright test` локально (Windows, Node 22) — **13 passed за 7.2s**.
- `npx playwright test --repeat-each=3` — **39/39 passed**, нестабільних тестів не виявлено.
- CI на GitHub ще не запускався: проєкт поки не git-репозиторій.

### Відкрито / наступні кроки
- `git init` + push на GitHub, переконатися, що workflow зелений і артефакт з'являється.
- Можливе розширення: `problem_user`/`performance_glitch_user`, логаут, сортування A→Z / ціна ↓, PATCH у API, перевірка схеми відповіді.
