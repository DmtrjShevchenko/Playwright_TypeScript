Система: API · Restful Booker · Пріоритет: P2

# Часткове оновлення бронювання (PATCH)

Передумова: отримано токен (POST /auth, admin / password123), створено бронювання.

Кроки:
1. PATCH /booking/{id} з токеном і тілом {"firstname": "Patched", "totalprice": 777}.
2. GET /booking/{id}.

Очікуваний результат:
- Крок 1: статус 200, у відповіді firstname = "Patched", totalprice = 777.
- Крок 2: змінились тільки firstname і totalprice; lastname, depositpaid, bookingdates і additionalneeds такі самі, як при створенні.
- Створене бронювання видаляється після тесту.
