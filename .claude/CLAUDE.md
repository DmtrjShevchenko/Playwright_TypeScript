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
  reporters/  bug-report.ts — генерує баг-репорти з упалих тестів
tests/
  ui/         *.spec.ts — Playwright project "ui" (Chromium, baseURL saucedemo, testIdAttribute=data-test)
  api/        *.spec.ts — Playwright project "api" (без браузера, baseURL restful-booker)
tests/{ui,api}/generated/  спеки, згенеровані конвеєром з текстових кейсів (після ручного рев'ю — повноцінні тести пулу)
scripts/
  publish-bugs.mjs   повний прогін → /BUGS.md
  generate-test.mjs  тест-кейс текстом → Playwright-тест (claude -p), див. generator/README.md
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
| Всі тести | `npm test` |
| Тільки UI / API | `npm run test:ui` / `npm run test:api` |
| Тільки негативні | `npx playwright test --grep @negative` |
| Перевірка типів | `npm run typecheck` |
| UI mode (покроково, time-travel) | `npm run test:watch` |
| Один видимий браузер | `npm run test:headed` |
| Без вікна браузера локально | `$env:HEADLESS='1'; npm run test:ui` (PowerShell) / `HEADLESS=1 npm run test:ui` (bash) |
| Уповільнення дій, мс | ручний (headed) запуск — 300 мс за замовчуванням; `$env:SLOWMO='800'` — сильніше, `$env:SLOWMO='0'` — вимкнути. Headless і CI — без затримки |

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

## Баги: тест перевіряє правильну поведінку, репорт генерується з падіння

1. **Тест завжди описує правильну поведінку**, навіть якщо система зараз поводиться інакше. Не підганяй assertion під баг.
2. **Тести на баги лежать у загальних спеках** своєї області (`checkout.spec.ts`, `booking.spec.ts`…). Окремих `known-bugs`-спек немає, `test.fail()` і `test.skip()` для багів не використовуємо: червоний тест = відкритий баг.
3. **Баг-репорт генерує репортер** `src/reporters/bug-report.ts` (у `bug-reports/BUGS.md`, у CI — артефакт і job summary). Вручну баг-репорти не пишемо. Щоб репорт був якісним:
   - кроки — через `test.step('<дія користувача українською>')`;
   - у кожному ключовому assertion — повідомлення з очікуваною поведінкою: `expect(x, 'Невалідні дані → 400').toBe(400)`;
   - анотації: `{ type: 'severity', description: 'Major' | 'Medium' | 'Minor' }`, для UI — `{ type: 'precondition', description: '...' }`;
   - фактичне значення має бути `received`: `expect(String(status)).toMatch(/^(200|204)$/)`, а не `expect([200, 204]).toContain(status)`.
4. Кілька незалежних перевірок в одному тесті — `expect.soft`, щоб репорт показав усі розбіжності.
5. Опублікована копія для README — `/BUGS.md`, оновлюється **тільки з повного прогону**: `npm run bugs:publish`.
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
