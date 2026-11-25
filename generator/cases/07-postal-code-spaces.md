Система: UI · SauceDemo · Пріоритет: P2

# Postal Code із самих пробілів

Передумова: користувач standard_user залогінений, у кошику Sauce Labs Onesie, відкрито кошик.

Кроки:
1. Натиснути "Checkout".
2. Ввести First Name "Test", Last Name "User", Postal Code — три пробіли.
3. Натиснути "Continue".

Очікуваний результат:
- Показано помилку "Error: Postal Code is required".
- Користувач лишається на сторінці /checkout-step-one.html.
