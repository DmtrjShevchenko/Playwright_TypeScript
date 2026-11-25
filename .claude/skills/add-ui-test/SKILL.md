---
name: add-ui-test
description: Add or extend a Playwright UI test for SauceDemo (www.saucedemo.com) using the project's Page Objects and fixtures. Use when asked to cover a new UI scenario, page, or negative case on SauceDemo.
---

# Додати UI-тест (SauceDemo)

## Кроки

1. **Уточни сценарій**: передумова → дії → очікуваний результат. Позитивний чи `@negative`?
2. **Перевір локатори на живому сайті.** SauceDemo має `data-test` майже на всьому; у конфігу `testIdAttribute: 'data-test'`, тож використовуй `page.getByTestId('<value>')`.
   Відомі значення: `username`, `password`, `login-button`, `error`, `title`, `inventory-item`, `inventory-item-name`,
   `inventory-item-price`, `product-sort-container`, `shopping-cart-link`, `shopping-cart-badge`, `checkout`,
   `firstName`, `lastName`, `postalCode`, `continue`, `finish`, `subtotal-label`, `tax-label`, `total-label`, `complete-header`.
3. **Якщо потрібного локатора/дії нема в Page Object — додай його туди** (`src/pages/*.ts`), а не в спеку.
   Нова сторінка → новий клас у `src/pages/` + фікстура в `src/fixtures/ui.ts`.
4. **Напиши тест** у відповідному файлі `tests/ui/<area>.spec.ts`:
   ```ts
   import { test, expect } from '../../src/fixtures/ui';

   test('<очікувана поведінка>', async ({ loggedIn, cartPage, page }) => {
     await loggedIn.addToCart(PRODUCTS.backpack.name);
     await expect(loggedIn.header.cartBadge).toHaveText('1');
   });
   ```
   - Для залогіненого стану — фікстура `loggedIn` (повертає `InventoryPage`).
   - Дані — з `src/data/products.ts`, тексти помилок — з `ERRORS` у `src/data/users.ts`.
   - Тільки web-first assertions, ніяких `waitForTimeout`.
5. **Прожени**: `npm run typecheck && npx playwright test tests/ui/<file> --project=ui`.
   Для перевірки стабільності: `--repeat-each=3`.
6. **Запиши** в кореневий `AI_WORKLOG.md`.

## Чекліст перед завершенням
- [ ] Локатори тільки в Page Objects
- [ ] Тест незалежний, не залежить від порядку запуску
- [ ] Негативний тест має тег `@negative` і перевіряє і текст помилки, і те, що навігації не сталося
- [ ] typecheck + тест зелені (або червоний через **підтверджений** баг продукту, див. нижче)

## Якщо тест знаходить баг
- Тест лишається в загальній спеці своєї області й перевіряє **правильну** поведінку. Без `test.fail()` і без окремих `known-bugs`-спек.
- Кроки — через `test.step('<дія користувача>')`, у ключових assertion — повідомлення з очікуваною поведінкою, анотації `severity` і `precondition`. З цього репортер збирає баг-репорт.

## Типові помилки агента (траплялися в цьому проєкті)
- **Неточний локатор кнопки в картці товару.** `getByRole('button')` усередині `inventory-item` знаходить ще й посилання-зображення та назву (у них `role="button"`) → strict mode violation. Завжди уточнюй ім'я: `getByRole('button', { name: 'Add to cart' })`.
- **Вигадана вимога.** «Postal Code має бути лише цифрами» не випливає з жодної вимоги. Якщо очікувану поведінку не визначено, це пункт «Питання до вимог» у README, а не тест.
- **Пріоритет за типом кейсу замість ризику.** Негативні кейси логіну спершу отримали P2. Перевірки доступу (невірний пароль, заблокований користувач) — це P1, як і сам успішний логін.
- **Назва кейсу, яку неможливо знайти.** Позитивний чекаут спершу називався «Оформлення замовлення від кошика до підтвердження», без слова «Чекаут». Назва починається з області: «Чекаут: …».
