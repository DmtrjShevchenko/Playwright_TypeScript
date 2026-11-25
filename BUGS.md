# Баг-репорти

> Згенеровано автоматично з упалих автотестів (`src/reporters/bug-report.ts`) · 2026-11-25 · локальний прогін

> Кожне падіння — це **кандидат** у баги. Падіння з ознаками проблеми оточення або самого тесту
> (мережа, 502/503/504, таймаут, неоднозначний локатор, помилка в коді тесту) винесено в розділ «Потребує тріажу».
> Решту людина підтверджує перед тим, як заводити баг у трекер.

## Баги

| ID | Система | Баг | Серйозність | Автотест |
|---|---|---|---|---|
| [BUG-01](#bug-01) | api | POST /booking without required fields returns 400 — фактично: 500 | Major | `tests/api/booking.spec.ts:161` |
| [BUG-02](#bug-02) | api | POST /booking with non-numeric totalprice returns 400 — фактично: 200 | Major | `tests/api/booking.spec.ts:161` |
| [BUG-03](#bug-03) | api | POST /booking with an invalid date returns 400 — фактично: 200 | Major | `tests/api/booking.spec.ts:161` |
| [BUG-04](#bug-04) | api | POST /booking with checkout before checkin returns 400 — фактично: 200 | Major | `tests/api/booking.spec.ts:161` |
| [BUG-05](#bug-05) | ui | overview step cannot be opened by URL without customer info — фактично: "https://www.saucedemo.com/checkout-step-two.html" | Major | `tests/ui/checkout.spec.ts:70` |
| [BUG-06](#bug-06) | ui | order cannot be placed with an empty cart — фактично: "https://www.saucedemo.com/checkout-step-one.html" | Major | `tests/ui/checkout.spec.ts:98` |
| [BUG-07](#bug-07) | api | POST /booking with negative totalprice returns 400 — фактично: 200 | Medium | `tests/api/booking.spec.ts:161` |
| [BUG-08](#bug-08) | api | POST /auth with wrong password returns 401 and no token — фактично: 200 | Medium | `tests/api/booking.spec.ts:69` |
| [BUG-09](#bug-09) | ui | Reset App State clears the cart and restores Add to cart buttons — фактично: element(s) not found | Medium | `tests/ui/cart.spec.ts:25` |
| [BUG-10](#bug-10) | ui | whitespace-only customer info is rejected — фактично: "https://www.saucedemo.com/checkout-step-two.html" | Medium | `tests/ui/checkout.spec.ts:42` |
| [BUG-11](#bug-11) | api | PUT and DELETE for a non-existent id return 404 — фактично: 405 | Minor | `tests/api/booking.spec.ts:106` |

---

### BUG-01
**POST /booking without required fields returns 400 — фактично: 500**

| | |
|---|---|
| Серйозність | Major |
| Система | https://restful-booker.herokuapp.com |
| Автотест | `tests/api/booking.spec.ts:161` › POST /booking without required fields returns 400 |
| Спроб | 1 (впав у всіх) |

**Кроки:**
1. POST /booking з валідним бронюванням без поля firstname
2. Перевірити, що бронювання відхилено ❌

**Очікуваний результат:**
- Невалідні дані → 400 Bad Request, бронювання не створюється — Expected: 400

**Фактичний результат:**
- Received: 500

<details><summary>Помилка</summary>

```
Error: Невалідні дані → 400 Bad Request, бронювання не створюється

expect(received).toBe(expected) // Object.is equality

Expected: 400
Received: 500
```

</details>

**Вкладення:** `test-results/api-booking-Booking-API-va-3da86-required-fields-returns-400-api/trace.zip`

---

### BUG-02
**POST /booking with non-numeric totalprice returns 400 — фактично: 200**

| | |
|---|---|
| Серйозність | Major |
| Система | https://restful-booker.herokuapp.com |
| Автотест | `tests/api/booking.spec.ts:161` › POST /booking with non-numeric totalprice returns 400 |
| Спроб | 1 (впав у всіх) |

**Кроки:**
1. POST /booking з "totalprice": "abc"
2. Перевірити, що бронювання відхилено ❌

**Очікуваний результат:**
- Невалідні дані → 400 Bad Request, бронювання не створюється — Expected: 400

**Фактичний результат:**
- Received: 200

<details><summary>Помилка</summary>

```
Error: Невалідні дані → 400 Bad Request, бронювання не створюється

expect(received).toBe(expected) // Object.is equality

Expected: 400
Received: 200
```

</details>

**Вкладення:** `test-results/api-booking-Booking-API-va-256fd-eric-totalprice-returns-400-api/trace.zip`

---

### BUG-03
**POST /booking with an invalid date returns 400 — фактично: 200**

| | |
|---|---|
| Серйозність | Major |
| Система | https://restful-booker.herokuapp.com |
| Автотест | `tests/api/booking.spec.ts:161` › POST /booking with an invalid date returns 400 |
| Спроб | 1 (впав у всіх) |

**Кроки:**
1. POST /booking з невалідним "checkin": "2027-13-45" (checkout валідний: "2027-01-10")
2. Перевірити, що бронювання відхилено ❌

**Очікуваний результат:**
- Невалідні дані → 400 Bad Request, бронювання не створюється — Expected: 400

**Фактичний результат:**
- Received: 200

<details><summary>Помилка</summary>

```
Error: Невалідні дані → 400 Bad Request, бронювання не створюється

expect(received).toBe(expected) // Object.is equality

Expected: 400
Received: 200
```

</details>

**Вкладення:** `test-results/api-booking-Booking-API-va-31c0f-an-invalid-date-returns-400-api/trace.zip`

---

### BUG-04
**POST /booking with checkout before checkin returns 400 — фактично: 200**

| | |
|---|---|
| Серйозність | Major |
| Система | https://restful-booker.herokuapp.com |
| Автотест | `tests/api/booking.spec.ts:161` › POST /booking with checkout before checkin returns 400 |
| Спроб | 1 (впав у всіх) |

**Кроки:**
1. POST /booking з "checkin": "2027-01-15", "checkout": "2027-01-10"
2. Перевірити, що бронювання відхилено ❌

**Очікуваний результат:**
- Невалідні дані → 400 Bad Request, бронювання не створюється — Expected: 400

**Фактичний результат:**
- Received: 200

<details><summary>Помилка</summary>

```
Error: Невалідні дані → 400 Bad Request, бронювання не створюється

expect(received).toBe(expected) // Object.is equality

Expected: 400
Received: 200
```

</details>

**Вкладення:** `test-results/api-booking-Booking-API-va-cd407--before-checkin-returns-400-api/trace.zip`

---

### BUG-05
**overview step cannot be opened by URL without customer info — фактично: "https://www.saucedemo.com/checkout-step-two.html"**

| | |
|---|---|
| Серйозність | Major |
| Система | https://www.saucedemo.com |
| Браузер | chromium |
| Автотест | `tests/ui/checkout.spec.ts:70` › overview step cannot be opened by URL without customer info |
| Спроб | 1 (впав у всіх) |

**Передумова:** Залогінений `standard_user`, у кошику Sauce Labs Backpack, дані покупця не вводились.

**Кроки:**
1. Додати в кошик Sauce Labs Backpack
2. Відкрити напряму /checkout-step-two.html, минаючи крок з даними покупця
3. Перевірити, що крок з даними покупця не пропущено ❌

**Очікуваний результат:**
- Без даних покупця користувача повертає на /checkout-step-one.html — Expected pattern: /checkout-step-one\.html$/

**Фактичний результат:**
- Received string:  "https://www.saucedemo.com/checkout-step-two.html"

<details><summary>Помилка</summary>

```
Error: Без даних покупця користувача повертає на /checkout-step-one.html

expect(page).toHaveURL(expected) failed

Expected pattern: /checkout-step-one\.html$/
Received string:  "https://www.saucedemo.com/checkout-step-two.html"
Timeout: 3000ms

Call log:
  - Без даних покупця користувача повертає на /checkout-step-one.html with timeout 3000ms
    10 × locator resolved to <html lang="en">…</html>
       - unexpected value "https://www.saucedemo.com/checkout-step-two.html"
```

</details>

**Вкладення:** `test-results/ui-checkout-Checkout-step--fa54b-hout-customer-info-negative-ui/test-failed-1.png`, `test-results/ui-checkout-Checkout-step--fa54b-hout-customer-info-negative-ui/trace.zip`

---

### BUG-06
**order cannot be placed with an empty cart — фактично: "https://www.saucedemo.com/checkout-step-one.html"**

| | |
|---|---|
| Серйозність | Major |
| Система | https://www.saucedemo.com |
| Браузер | chromium |
| Автотест | `tests/ui/checkout.spec.ts:98` › order cannot be placed with an empty cart |
| Спроб | 1 (впав у всіх) |

**Передумова:** Залогінений `standard_user`, кошик порожній.

**Кроки:**
1. Відкрити кошик
2. Натиснути Checkout
3. Перевірити, що оформлення не почалося ❌

**Очікуваний результат:**
- Оформлення з порожнім кошиком неможливе: користувач лишається в кошику — Expected pattern: /\/cart\.html$/

**Фактичний результат:**
- Received string:  "https://www.saucedemo.com/checkout-step-one.html"

<details><summary>Помилка</summary>

```
Error: Оформлення з порожнім кошиком неможливе: користувач лишається в кошику

expect(page).toHaveURL(expected) failed

Expected pattern: /\/cart\.html$/
Received string:  "https://www.saucedemo.com/checkout-step-one.html"
Timeout: 3000ms

Call log:
  - Оформлення з порожнім кошиком неможливе: користувач лишається в кошику with timeout 3000ms
    10 × locator resolved to <html lang="en">…</html>
       - unexpected value "https://www.saucedemo.com/checkout-step-one.html"
```

</details>

**Вкладення:** `test-results/ui-checkout-Checkout-with--715ed-with-an-empty-cart-negative-ui/test-failed-1.png`, `test-results/ui-checkout-Checkout-with--715ed-with-an-empty-cart-negative-ui/trace.zip`

---

### BUG-07
**POST /booking with negative totalprice returns 400 — фактично: 200**

| | |
|---|---|
| Серйозність | Medium |
| Система | https://restful-booker.herokuapp.com |
| Автотест | `tests/api/booking.spec.ts:161` › POST /booking with negative totalprice returns 400 |
| Спроб | 1 (впав у всіх) |

**Кроки:**
1. POST /booking з "totalprice": -100
2. Перевірити, що бронювання відхилено ❌

**Очікуваний результат:**
- Невалідні дані → 400 Bad Request, бронювання не створюється — Expected: 400

**Фактичний результат:**
- Received: 200

<details><summary>Помилка</summary>

```
Error: Невалідні дані → 400 Bad Request, бронювання не створюється

expect(received).toBe(expected) // Object.is equality

Expected: 400
Received: 200
```

</details>

**Вкладення:** `test-results/api-booking-Booking-API-va-aa08b-tive-totalprice-returns-400-api/trace.zip`

---

### BUG-08
**POST /auth with wrong password returns 401 and no token — фактично: 200**

| | |
|---|---|
| Серйозність | Medium |
| Система | https://restful-booker.herokuapp.com |
| Автотест | `tests/api/booking.spec.ts:69` › POST /auth with wrong password returns 401 and no token |
| Спроб | 1 (впав у всіх) |

**Кроки:**
1. POST /auth з username admin і невірним паролем
2. Перевірити відповідь ❌

**Очікуваний результат:**
- Невірні облікові дані → 401 Unauthorized — Expected: 401

**Фактичний результат:**
- Received: 200

<details><summary>Помилка</summary>

```
Error: Невірні облікові дані → 401 Unauthorized

expect(received).toBe(expected) // Object.is equality

Expected: 401
Received: 200
```

</details>

**Вкладення:** `test-results/api-booking-Booking-API-ne-f83f5-rd-returns-401-and-no-token-api/trace.zip`

---

### BUG-09
**Reset App State clears the cart and restores Add to cart buttons — фактично: element(s) not found**

| | |
|---|---|
| Серйозність | Medium |
| Система | https://www.saucedemo.com |
| Браузер | chromium |
| Автотест | `tests/ui/cart.spec.ts:25` › Reset App State clears the cart and restores Add to cart buttons |
| Спроб | 1 (впав у всіх) |

**Передумова:** Залогінений `standard_user`, відкрито каталог.

**Кроки:**
1. Додати в кошик Sauce Labs Backpack
2. Відкрити бургер-меню, натиснути Reset App State
3. Перевірити стан кошика і кнопок на каталозі ❌

**Очікуваний результат:**
- У Sauce Labs Backpack знову кнопка Add to cart — Expected: visible

**Фактичний результат:**
- Received: element(s) not found

<details><summary>Помилка</summary>

```
Error: У Sauce Labs Backpack знову кнопка Add to cart

expect(locator).toBeVisible() failed

Locator: getByTestId('inventory-item').filter({ has: getByTestId('inventory-item-name').getByText('Sauce Labs Backpack', { exact: true }) }).getByRole('button', { name: 'Add to cart' })
Expected: visible
Timeout: 3000ms
Error: element(s) not found

Call log:
  - У Sauce Labs Backpack знову кнопка Add to cart getByTestId('inventory-item').filter({ has: getByTestId('inventory-item-name').getByText('Sauce Labs Backpack', { exact: true }) }).getByRole('button', { name: 'Add to cart' }) with timeout 3000ms
  - waiting for getByTestId('inventory-item').filter({ has: getByTestId('inventory-item-name').getByText('Sauce Labs Backpack', { exact: true }) }).getByRole('button', { name: 'Add to cart' })
```

</details>

**Вкладення:** `test-results/ui-cart-Cart-Reset-App-Sta-6869b-estores-Add-to-cart-buttons-ui/test-failed-1.png`, `test-results/ui-cart-Cart-Reset-App-Sta-6869b-estores-Add-to-cart-buttons-ui/trace.zip`

---

### BUG-10
**whitespace-only customer info is rejected — фактично: "https://www.saucedemo.com/checkout-step-two.html"**

| | |
|---|---|
| Серйозність | Medium |
| Система | https://www.saucedemo.com |
| Браузер | chromium |
| Автотест | `tests/ui/checkout.spec.ts:42` › whitespace-only customer info is rejected |
| Спроб | 1 (впав у всіх) |

**Передумова:** Залогінений `standard_user`, у кошику Sauce Labs Backpack і Sauce Labs Onesie, відкрито кошик.

**Кроки:**
1. Натиснути Checkout
2. Ввести в First Name, Last Name і Postal Code по три пробіли, натиснути Continue
3. Перевірити, що форма не пропускає порожні дані ❌

**Очікуваний результат:**
- Користувач лишається на кроці введення даних — Expected pattern: /checkout-step-one\.html$/

**Фактичний результат:**
- Received string:  "https://www.saucedemo.com/checkout-step-two.html"

<details><summary>Помилка</summary>

```
Error: Користувач лишається на кроці введення даних

expect(page).toHaveURL(expected) failed

Expected pattern: /checkout-step-one\.html$/
Received string:  "https://www.saucedemo.com/checkout-step-two.html"
Timeout: 3000ms

Call log:
  - Користувач лишається на кроці введення даних with timeout 3000ms
    10 × locator resolved to <html lang="en">…</html>
       - unexpected value "https://www.saucedemo.com/checkout-step-two.html"
```

</details>

**Вкладення:** `test-results/ui-checkout-Checkout-white-50cfc-r-info-is-rejected-negative-ui/test-failed-1.png`, `test-results/ui-checkout-Checkout-white-50cfc-r-info-is-rejected-negative-ui/trace.zip`

---

### BUG-11
**PUT and DELETE for a non-existent id return 404 — фактично: 405**

| | |
|---|---|
| Серйозність | Minor |
| Система | https://restful-booker.herokuapp.com |
| Автотест | `tests/api/booking.spec.ts:106` › PUT and DELETE for a non-existent id return 404 |
| Спроб | 1 (впав у всіх) |

**Кроки:**
1. PUT /booking/2147000000 з валідним тілом і токеном ❌
2. DELETE /booking/2147000000 з токеном ❌

**Очікуваний результат:**
- Метод PUT підтримується; відсутній саме ресурс, тож коректна відповідь — 404 Not Found — Expected: 404
- Метод DELETE підтримується; відсутній саме ресурс, тож коректна відповідь — 404 Not Found — Expected: 404

**Фактичний результат:**
- Received: 405
- Received: 405

<details><summary>Помилка</summary>

```
Error: Метод PUT підтримується; відсутній саме ресурс, тож коректна відповідь — 404 Not Found

expect(received).toBe(expected) // Object.is equality

Expected: 404
Received: 405

Error: Метод DELETE підтримується; відсутній саме ресурс, тож коректна відповідь — 404 Not Found

expect(received).toBe(expected) // Object.is equality

Expected: 404
Received: 405
```

</details>

**Вкладення:** `test-results/api-booking-Booking-API-ne-d2405--non-existent-id-return-404-api/trace.zip`
