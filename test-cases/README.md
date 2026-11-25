# Тест-кейси

Опис автоматизованих тест-кейсів проєкту. Кожен кейс відповідає одному автотесту в `tests/`.

| Файл | Система | Кейсів |
|---|---|---|
| [ui-saucedemo.md](ui-saucedemo.md) | UI — https://www.saucedemo.com | 9 (6 позитивних, 3 негативні) |
| [api-restful-booker.md](api-restful-booker.md) | API — https://restful-booker.herokuapp.com | 4 (1 флоу, 3 негативні) |

## Умовні позначення

- **ID**: `UI-<область>-NN` / `API-<область>-NN`.
- **Тип**: `Позитивний`, `Негативний` (у назві автотесту є тег `@negative`).
- **Пріоритет**: `P1` — критичний шлях користувача або безпека (доступ без прав має бути заборонений), `P2` — важлива перевірка функціональності, `P3` — другорядна.
- **Автотест**: файл і назва тесту в Playwright (`describe › test`).

## Матриця покриття

| ID | Назва | Тип | Пріоритет | Автотест |
|---|---|---|---|---|
| UI-LOGIN-01 | Успішний логін `standard_user` | Позитивний | P1 | `tests/ui/login.spec.ts` › Login › standard_user logs in and lands on the catalog |
| UI-LOGIN-02 | Логін заблокованого користувача | Негативний | P1 | `tests/ui/login.spec.ts` › Login › locked_out_user sees locked-out error @negative |
| UI-LOGIN-03 | Логін з невірним паролем | Негативний | P1 | `tests/ui/login.spec.ts` › Login › wrong password is rejected @negative |
| UI-CAT-01 | Каталог показує всі товари | Позитивний | P1 | `tests/ui/catalog.spec.ts` › Catalog › shows all 6 products with name, price and Add to cart button |
| UI-SORT-01 | Сортування за ціною від дешевших | Позитивний | P2 | `tests/ui/catalog.spec.ts` › Sorting › sorts products by price, low to high |
| UI-SORT-02 | Сортування за назвою Z→A | Позитивний | P3 | `tests/ui/catalog.spec.ts` › Sorting › sorts products by name, Z to A |
| UI-CART-01 | Додавання та видалення товарів з кошика | Позитивний | P1 | `tests/ui/cart.spec.ts` › Cart › adds and removes items, badge and cart contents stay in sync |
| UI-CHK-01 | Чекаут: успішне оформлення замовлення | Позитивний | P1 | `tests/ui/checkout.spec.ts` › Checkout › completes an order with correct totals |
| UI-CHK-02 | Чекаут без поштового індексу | Негативний | P2 | `tests/ui/checkout.spec.ts` › Checkout › cannot continue without postal code @negative |
| API-BOOK-01 | CRUD-флоу бронювання | Позитивний | P1 | `tests/api/booking.spec.ts` › Booking API › auth, create, update, delete, then booking is gone |
| API-AUTH-01 | Авторизація з невірним паролем | Негативний | P1 | `tests/api/booking.spec.ts` › Booking API › negative › POST /auth with wrong password returns Bad credentials and no token |
| API-BOOK-02 | Оновлення бронювання без токена | Негативний | P1 | `tests/api/booking.spec.ts` › Booking API › negative › PUT /booking/:id without token is forbidden and does not change data |
| API-BOOK-03 | Отримання неіснуючого бронювання | Негативний | P3 | `tests/api/booking.spec.ts` › Booking API › negative › GET /booking/:id for a non-existent id returns 404 |

## Як підтримувати

Додаєш або змінюєш автотест — онови відповідний файл і рядок у матриці вище.
Запустити один кейс: `npx playwright test -g "<назва тесту>"`.
