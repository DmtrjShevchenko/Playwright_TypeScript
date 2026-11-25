# Інструкції для AI-агента

Проєкт: автотести на **Playwright + TypeScript**.
- **UI**: https://www.saucedemo.com, користувач `standard_user` / `secret_sauce`
- **API**: https://restful-booker.herokuapp.com/apidoc, `admin` / `password123`
- **CI**: GitHub Actions (`.github/workflows/playwright.yml`), запуск на кожен push, HTML-звіт як артефакт

## Структура

```
src/
  ui.ts, api.ts  єдина точка імпорту для спек: `import { … } from '@ui'` / `'@api'` (аліаси в tsconfig.json)
  pages/      Page Objects (LoginPage, InventoryPage, CartPage, CheckoutPage, ProductDetailsPage, HeaderComponent)
  api/        BookingApi — тонка обгортка над APIRequestContext, повертає APIResponse
  fixtures/   ui.ts (loginPage, inventoryPage, cartPage, checkoutPage, productPage, loggedIn), api.ts (bookingApi, token, bookings)
  support/    meta() — severity/precondition; matchers — toHaveStatus, toEqualMoney, expectQuick
  data/       products, users, bookings, messages (ERRORS), paths (PATHS)
  utils/      parsePrice, toCents
  reporters/  bug-report.ts — генерує баг-репорти з упалих тестів (статус прогону не змінює)
tests/
  ui/         *.spec.ts — Playwright project "ui" (Chromium, baseURL saucedemo, testIdAttribute=data-test)
  api/        *.spec.ts — Playwright project "api" (без браузера, baseURL restful-booker)
tests/{ui,api}/generated/  спеки, згенеровані конвеєром з текстових кейсів (після ручного рев'ю — повноцінні тести пулу)
scripts/
  publish-bugs.mjs   прогін відомих багів (@known-bug) → /BUGS.md
  generate-test.mjs  тест-кейс(и) текстом → Playwright-тест (claude -p): один кейс, папка, шаблон або --all; див. generator/README.md
generator/
  cases/      вхідні тест-кейси текстом
  runs/       докази прогонів конвеєра: промпт, відповіді моделі, логи, summary.json
.claude/
  skills/     скіли агента (додати UI-тест, додати API-тест, розібрати падіння)
  prompts/    ключові промпти, якими генерувався проєкт
AI_WORKLOG.md  журнал роботи агента (у корені — назва з тестового завдання)
```

## Команди

| Що | Команда |
|---|---|
| Регресія (без відомих багів, має бути зеленою) | `npm test` |
| Тільки тести на відомі баги (`@known-bug`) | `npm run test:known-bugs` |
| Усі тести разом | `npm run test:all` |
| Тільки UI / API (без відомих багів) | `npm run test:ui` / `npm run test:api` |
| Тільки негативні | `npx playwright test --grep @negative` |
| Перевірка типів | `npm run typecheck` |
| UI mode (покроково, time-travel) | `npm run test:watch` |
| Один видимий браузер | `npm run test:headed` |
| Без вікна браузера локально | `$env:HEADLESS='1'; npm run test:ui` (PowerShell) / `HEADLESS=1 npm run test:ui` (bash) |
| Уповільнення дій, мс | ручний (headed) запуск — 300 мс за замовчуванням; `$env:SLOWMO='800'` — сильніше, `$env:SLOWMO='0'` — вимкнути. Headless і CI — без затримки |
| Звіт | `npm run report` |

Локально UI-тести за замовчуванням **headed** (видно браузер), у CI (`CI=true`) — завжди headless.
Агент, що запускає тести у фоні, має ставити `HEADLESS=1`, щоб не відкривати вікна користувачу.

Після будь-якої зміни: `npm run typecheck` і прогін зачепленого project. Не завершуй задачу з червоною регресією — або полагодь, або явно напиши, що впало і чому. Червоні тести в `npm run test:known-bugs` — відкриті баги, це нормально.

## Правила написання тестів

1. **Один імпорт: `from '@ui'` або `from '@api'`** — там `test`, `expect`, `meta`, дані, `PATHS`, `ERRORS`. Не імпортуй з `@playwright/test` і не пиши відносних шляхів у `src/`.
2. **Локатори — тільки в Page Objects.** У спеках жодних `page.locator('...')`, крім разових `getByTestId` всередині вже знайденого елемента.
3. **Пріоритет локаторів**: `getByTestId` (атрибут `data-test`) → `getByRole` → `getByText`. CSS/XPath — заборонено, якщо є `data-test`.
4. **Ніяких `waitForTimeout`** і ручних sleep. Тільки web-first assertions (`await expect(locator).toHave...`).
5. **Кожен тест незалежний**: сам логіниться (фікстура `loggedIn` — сесія через cookie, без форми; форму логіну тестує тільки `login.spec.ts` через `loginPage`), а бронювання створює через фікстуру `bookings` (`create()` / `createRaw()`) — вона видаляє їх після тесту, `try/finally` не потрібен. Бронювання, створене напряму через `bookingApi`, зареєструй `bookings.track(id)`.
6. **Тестові дані** — у `src/data/`. Тексти помилок — `ERRORS`, сторінки — `PATHS` (`expect(page).toHaveURL(PATHS.cart)`), не регулярки й рядки в спеці. Page Objects приймають сам товар: `addToCart(PRODUCTS.backpack, PRODUCTS.onesie)`.
7. **Гроші — `toEqualMoney`** (`expect(total, 'Total = Item total + Tax').toEqualMoney(subtotal + tax)`): порівнює в центах, а в помилці показує долари. API-статус — `await expect(response, '…').toHaveStatus(400)`: при падінні видно URL і тіло відповіді. Перевірки «застосунок НЕ має перейти/зробити» — `expectQuick` (короткий таймаут).
8. Негативні/граничні тести позначаємо тегом `@negative` у назві.
9. Назва тесту описує очікувану поведінку: `'wrong password is rejected'`, а не `'test 3'`.
10. API-флоу з кількох кроків — один тест з `test.step(...)`, а не `describe.serial` з залежними тестами.

## Баги: тест перевіряє правильну поведінку, репорт генерується з падіння

1. **Тест завжди описує правильну поведінку**, навіть якщо система зараз поводиться інакше. Не підганяй assertion під баг.
2. **Тести на баги лежать у загальних спеках** своєї області (`checkout.spec.ts`, `booking.spec.ts`…). Окремих `known-bugs`-спек немає, `test.fail()` і `test.skip()` для багів не використовуємо: червоний тест = відкритий баг.
   **Підтверджений баг отримує сигнатуру**: `meta(severity, …, { knownBug: '<фрагмент помилки>' })`, зазвичай рядок `Received` (`'Received: 500'`, `'checkout-step-two.html'`). Сигнатуру бери з **реального** падіння (звіт / `KNOWN-BUGS.md`), а не з припущення про формат. `knownBug` додає тег `@known-bug`: тест виходить з регресії (`npm test`, має бути зеленою) і запускається в окремому неблокуючому прогоні `npm run test:known-bugs` (у CI — крок з `continue-on-error`). Репортер статус прогону **не змінює**; сигнатура лише позначає в звіті, чи баг проявився так само. Тег `@known-bug` вручну не ставимо — тільки через `meta()`.
3. **Баг-репорт генерує репортер** `src/reporters/bug-report.ts` (регресія → `bug-reports/BUGS.md`, відомі баги → `bug-reports/KNOWN-BUGS.md`; у CI — артефакт і job summary). Вручну баг-репорти не пишемо. Щоб репорт був якісним:
   - кроки — через `test.step('<дія користувача українською>')`;
   - у кожному ключовому assertion — повідомлення з очікуваною поведінкою: `await expect(response, 'Невалідні дані → 400').toHaveStatus(400)`;
   - severity і передумова — `meta('Major', 'Залогінений standard_user, кошик порожній.')` другим аргументом `test()`;
   - фактичне значення має бути `received`: перевіряй те, що показує застосунок (`toHaveText('Add to cart')` на `cartButton(...)`), а не «чи видно очікуване» (`toBeVisible()` дає лише «not found»); не `expect([200, 204]).toContain(status)`.
4. Кілька незалежних перевірок в одному тесті — `expect.soft`, щоб репорт показав усі розбіжності.
5. Опублікована копія для README — `/BUGS.md`, оновлюється **тільки** командою `npm run bugs:publish` (прогін відомих багів).
6. **Задокументована поведінка — не баг**, навіть якщо вона розходиться з HTTP-семантикою (DELETE → 201 у Restful Booker). Тест перевіряє задокументоване, а розбіжність описується в README в розділі «Задокументовано, але розходиться з HTTP-семантикою».
7. **Не вигадуй вимог.** Якщо очікувана поведінка не випливає ні з документації, ні з очевидної логіки (формат індексу, збереження сортування), це не баг, а пункт у README «Питання до вимог». Тест на таке не пишемо.
8. **Падіння ≠ баг.** Репортер виносить падіння з ознаками проблеми оточення чи тесту (мережа, 502/503/504, таймаут, strict mode, `TypeError`) у «Потребує тріажу». Решту людина підтверджує перед заведенням бага.

## Відомі особливості систем

- Restful Booker: токен передається як `Cookie: token=<token>` (альтернатива — Basic auth).
- Restful Booker — спільний публічний сервер, дані інших людей можуть з'являтися/зникати. Не покладайся на конкретні id, крім створених у тесті.
- SauceDemo: стан кошика зберігається в localStorage; кожен тест у Playwright має свіжий контекст, тому кошик порожній на старті.

## Робочий процес агента

1. Перед змінами прочитай цей файл і відповідний скіл у `.claude/skills/`.
2. Нові локатори перевіряй на живому сайті (через браузер або `npx playwright codegen https://www.saucedemo.com`), не вигадуй `data-test`.
3. Після завершення значимої задачі — допиши запис у кореневий `AI_WORKLOG.md` (що зроблено, рішення, що перевірено, що не вийшло).
4. Не комітити `playwright-report/`, `test-results/`, `bug-reports/`, `.env`.
5. **Команди в документації — без коментарів у тому самому рядку** (`npm run report  # звіт`): у `cmd` і при запуску з IntelliJ `#` стає аргументом команди. Опис — в окремій колонці таблиці або в окремому рядку.
