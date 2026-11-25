# Інструкції для AI-агента

Проєкт: автотести на **Playwright + TypeScript**.
- **UI**: https://www.saucedemo.com, користувач `standard_user` / `secret_sauce`
- **API**: https://restful-booker.herokuapp.com/apidoc, `admin` / `password123`
- **CI**: GitHub Actions (`.github/workflows/playwright.yml`), запуск на кожен push, HTML-звіт як артефакт

## Структура

```
src/
  pages/      Page Objects (LoginPage, InventoryPage, CartPage, CheckoutPage, HeaderComponent)
  api/        BookingApi — тонка обгортка над APIRequestContext, повертає APIResponse
  fixtures/   ui.ts (loginPage, inventoryPage, cartPage, checkoutPage, loggedIn), api.ts (bookingApi, token)
  data/       тестові дані та очікувані тексти помилок
  utils/      parsePrice, toCents
tests/
  ui/         *.spec.ts — Playwright project "ui" (Chromium, baseURL saucedemo, testIdAttribute=data-test)
  api/        *.spec.ts — Playwright project "api" (без браузера, baseURL restful-booker)
.claude/
  skills/     скіли агента (додати UI-тест, додати API-тест, розібрати падіння)
  prompts/    ключові промпти, якими генерувався проєкт
  AI_WORKLOG.md  журнал роботи агента
```

## Команди

| Що | Команда |
|---|---|
| Всі тести | `npm test` |
| Тільки UI / API | `npm run test:ui` / `npm run test:api` |
| Тільки негативні | `npx playwright test --grep @negative` |
| Перевірка типів | `npm run typecheck` |
| UI mode (покроково, time-travel) | `npm run test:watch` |
| Один видимий браузер | `npm run test:headed` |
| Без вікна браузера локально | `$env:HEADLESS='1'; npm run test:ui` (PowerShell) / `HEADLESS=1 npm run test:ui` (bash) |
| Уповільнити дії, мс | `$env:SLOWMO='500'; npm run test:ui` |

Локально UI-тести за замовчуванням **headed** (видно браузер), у CI (`CI=true`) — завжди headless.
Агент, що запускає тести у фоні, має ставити `HEADLESS=1`, щоб не відкривати вікна користувачу.
| Звіт | `npm run report` |

Після будь-якої зміни: `npm run typecheck` і прогін зачепленого project. Не завершуй задачу з червоними тестами — або полагодь, або явно напиши, що впало і чому.

## Правила написання тестів

1. **Імпорт `test`/`expect` тільки з `src/fixtures/ui` або `src/fixtures/api`**, не з `@playwright/test` напряму.
2. **Локатори — тільки в Page Objects.** У спеках жодних `page.locator('...')`, крім разових `getByTestId` всередині вже знайденого елемента.
3. **Пріоритет локаторів**: `getByTestId` (атрибут `data-test`) → `getByRole` → `getByText`. CSS/XPath — заборонено, якщо є `data-test`.
4. **Ніяких `waitForTimeout`** і ручних sleep. Тільки web-first assertions (`await expect(locator).toHave...`).
5. **Кожен тест незалежний**: сам логіниться (фікстура `loggedIn`), сам створює і прибирає свої дані (API — `try/finally` + delete).
6. **Тестові дані** — у `src/data/`. Тексти помилок — константами в `ERRORS`, не хардкодом у спеці.
7. **Гроші порівнюємо в центах** (`toCents`) — без float-шуму.
8. Негативні/граничні тести позначаємо тегом `@negative` у назві.
9. Назва тесту описує очікувану поведінку: `'wrong password is rejected'`, а не `'test 3'`.
10. API-флоу з кількох кроків — один тест з `test.step(...)`, а не `describe.serial` з залежними тестами.

## Відомі особливості систем (не "лагодити" їх у тестах)

- Restful Booker: `DELETE` повертає **201**, а не 200/204.
- Restful Booker: `POST /auth` з невірними даними повертає **200** + `{"reason":"Bad credentials"}`.
- Restful Booker: токен передається як `Cookie: token=<token>` (альтернатива — Basic auth).
- Restful Booker — спільний публічний сервер, дані інших людей можуть з'являтися/зникати. Не покладайся на конкретні id, крім створених у тесті.
- SauceDemo: стан кошика зберігається в localStorage; кожен тест у Playwright має свіжий контекст, тому кошик порожній на старті.

## Робочий процес агента

1. Перед змінами прочитай цей файл і відповідний скіл у `.claude/skills/`.
2. Нові локатори перевіряй на живому сайті (через браузер або `npx playwright codegen https://www.saucedemo.com`), не вигадуй `data-test`.
3. Після завершення значимої задачі — допиши запис у `.claude/AI_WORKLOG.md` (що зроблено, рішення, що перевірено, що не вийшло).
4. Не комітити `playwright-report/`, `test-results/`, `.env`.
