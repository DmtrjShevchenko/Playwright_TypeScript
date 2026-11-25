# AI Worklog

Журнал роботи AI-агента над проєктом. Новий запис — зверху.
Формат: дата · задача · що зроблено · рішення · перевірка · відкриті питання.

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
