# Тест-кейси

Опис автоматизованих тест-кейсів проєкту. Кожен кейс відповідає одному автотесту в `tests/`.

| Файл | Система | Кейсів |
|---|---|---|
| [ui-saucedemo.md](ui-saucedemo.md) | UI — https://www.saucedemo.com | 15 (9 позитивних, 6 негативних; 2 згенеровані) |
| [api-restful-booker.md](api-restful-booker.md) | API — https://restful-booker.herokuapp.com | 11 (2 позитивні, 9 негативних; 1 згенерований) |

## Умовні позначення

- **ID**: `UI-<область>-NN` / `API-<область>-NN`.
- **Тип**: `Позитивний`, `Негативний` (у назві автотесту є тег `@negative`).
- **Пріоритет**: `P1` — критичний шлях користувача або безпека (доступ без прав має бути заборонений), `P2` — важлива перевірка функціональності, `P3` — другорядна.
- **Статус**: ✅ — проходить; ❌ — падає через баг продукту. Баг-репорт генерується з падіння автоматично, див. [`BUGS.md`](../BUGS.md).
- **Автотест**: файл і назва тесту в Playwright (`describe › test`).
- 🤖 — тест згенеровано конвеєром із текстового кейсу (див. [`generator/`](../generator/README.md)). Вхідний кейс лежить у `generator/cases/`, тому окремого опису в цьому каталозі немає.

Кейс описує **правильну** поведінку системи. Якщо система поводиться інакше, тест падає — це і є баг.

## Матриця покриття

| ID | Назва | Тип | Пріоритет | Статус | Автотест |
|---|---|---|---|---|---|
| UI-LOGIN-01 | Успішний логін `standard_user` | Позитивний | P1 | ✅ | `tests/ui/login.spec.ts` › Login › standard_user logs in and lands on the catalog |
| UI-LOGIN-02 | Логін заблокованого користувача | Негативний | P1 | ✅ | `tests/ui/login.spec.ts` › Login › locked_out_user sees locked-out error @negative |
| UI-LOGIN-03 | Логін з невірним паролем | Негативний | P1 | ✅ | `tests/ui/login.spec.ts` › Login › wrong password is rejected @negative |
| UI-LOGOUT-01 | Вихід із системи 🤖 | Позитивний | P1 | ✅ | `tests/ui/generated/01-logout.spec.ts` › Logout › logout returns to an empty login form and blocks direct access to inventory |
| UI-CAT-01 | Каталог показує всі товари | Позитивний | P1 | ✅ | `tests/ui/catalog.spec.ts` › Catalog › shows all 6 products with name, price and Add to cart button |
| UI-SORT-01 | Сортування за ціною від дешевших | Позитивний | P2 | ✅ | `tests/ui/catalog.spec.ts` › Sorting › sorts products by price, low to high |
| UI-SORT-02 | Сортування за назвою Z→A | Позитивний | P3 | ✅ | `tests/ui/catalog.spec.ts` › Sorting › sorts products by name, Z to A |
| UI-SORT-03 | Сортування за ціною від дорожчих 🤖 | Позитивний | P2 | ✅ | `tests/ui/generated/02-sort-price-high-low.spec.ts` › Inventory sorting › sorting by price high to low puts the most expensive item first and prices descend |
| UI-CART-01 | Додавання та видалення товарів з кошика | Позитивний | P1 | ✅ | `tests/ui/cart.spec.ts` › Cart › adds and removes items, badge and cart contents stay in sync |
| UI-CART-02 | Reset App State очищує кошик і кнопки | Позитивний | P2 | ❌ | `tests/ui/cart.spec.ts` › Cart › Reset App State clears the cart and restores Add to cart buttons |
| UI-CHK-01 | Чекаут: успішне оформлення замовлення | Позитивний | P1 | ✅ | `tests/ui/checkout.spec.ts` › Checkout › completes an order with correct totals |
| UI-CHK-02 | Чекаут без поштового індексу | Негативний | P2 | ✅ | `tests/ui/checkout.spec.ts` › Checkout › cannot continue without postal code @negative |
| UI-CHK-03 | Чекаут з полями з самих пробілів | Негативний | P2 | ❌ | `tests/ui/checkout.spec.ts` › Checkout › whitespace-only customer info is rejected @negative |
| UI-CHK-04 | Чекаут з порожнім кошиком | Негативний | P1 | ❌ | `tests/ui/checkout.spec.ts` › Checkout with an empty cart › order cannot be placed with an empty cart @negative |
| UI-CHK-05 | Обхід кроку з даними покупця прямим URL | Негативний | P1 | ❌ | `tests/ui/checkout.spec.ts` › Checkout step order › overview step cannot be opened by URL without customer info @negative |
| API-BOOK-01 | CRUD-флоу бронювання | Позитивний | P1 | ✅ | `tests/api/booking.spec.ts` › Booking API › auth, create, update, delete, then booking is gone |
| API-BOOK-06 | Часткове оновлення бронювання (PATCH) 🤖 | Позитивний | P2 | ✅ | `tests/api/generated/03-patch-booking.spec.ts` › Booking API — PATCH › PATCH /booking/:id updates only the sent fields and keeps the rest unchanged |
| API-AUTH-01 | Авторизація з невірним паролем | Негативний | P1 | ❌ | `tests/api/booking.spec.ts` › Booking API › negative › POST /auth with wrong password returns 401 and no token |
| API-BOOK-02 | Оновлення бронювання без токена | Негативний | P1 | ✅ | `tests/api/booking.spec.ts` › Booking API › negative › PUT /booking/:id without token is forbidden and does not change data |
| API-BOOK-03 | Отримання неіснуючого бронювання | Негативний | P3 | ✅ | `tests/api/booking.spec.ts` › Booking API › negative › GET /booking/:id for a non-existent id returns 404 |
| API-BOOK-05 | Зміна й видалення неіснуючого бронювання | Негативний | P3 | ❌ | `tests/api/booking.spec.ts` › Booking API › negative › PUT and DELETE for a non-existent id return 404 |
| API-VAL-01 | Бронювання без обов'язкових полів | Негативний | P2 | ❌ | `tests/api/booking.spec.ts` › Booking API › validation › POST /booking without required fields returns 400 |
| API-VAL-02 | Нечислова ціна | Негативний | P1 | ❌ | `tests/api/booking.spec.ts` › Booking API › validation › POST /booking with non-numeric totalprice returns 400 |
| API-VAL-03 | Невалідна дата | Негативний | P2 | ❌ | `tests/api/booking.spec.ts` › Booking API › validation › POST /booking with an invalid date returns 400 |
| API-VAL-04 | Дата виїзду раніше за дату заїзду | Негативний | P2 | ❌ | `tests/api/booking.spec.ts` › Booking API › validation › POST /booking with checkout before checkin returns 400 |
| API-VAL-05 | Від'ємна ціна | Негативний | P1 | ❌ | `tests/api/booking.spec.ts` › Booking API › validation › POST /booking with negative totalprice returns 400 |

## Як підтримувати

Додаєш або змінюєш автотест — онови відповідний файл і рядок у матриці вище.
Запустити один кейс: `npx playwright test -g "<назва тесту>"`.
Статус ✅/❌ відповідає останньому повному прогону; актуальний список падінь — у [`BUGS.md`](../BUGS.md) (`npm run bugs:publish`).
