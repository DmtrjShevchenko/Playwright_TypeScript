---
name: add-api-test
description: Add or extend a Playwright API test for Restful Booker (restful-booker.herokuapp.com) via the BookingApi client and api fixtures. Use when asked to cover a booking endpoint, an API flow, or an API negative case.
---

# Додати API-тест (Restful Booker)

Документація: https://restful-booker.herokuapp.com/apidoc

## Ендпоінти

| Метод | Шлях | Auth | Успіх |
|---|---|---|---|
| POST | `/auth` | — | 200 `{ token }` (невірні дані → 200 `{ reason: "Bad credentials" }`) |
| GET | `/booking` | — | 200 `[{ bookingid }]` |
| GET | `/booking/:id` | — | 200 booking / 404 |
| POST | `/booking` | — | 200 `{ bookingid, booking }` |
| PUT | `/booking/:id` | Cookie `token=` | 200 booking / 403 без токена |
| PATCH | `/booking/:id` | Cookie `token=` | 200 booking / 403 |
| DELETE | `/booking/:id` | Cookie `token=` | **201** / 403 |

## Кроки

1. Якщо потрібного методу нема в `src/api/BookingApi.ts` — додай його туди (повертає `APIResponse`, без assertions).
2. Тест — у `tests/api/*.spec.ts`, **усе імпортуй з `'@api'`**: `test`, `expect`, `meta`, `buildBooking`, `API_CREDENTIALS`, `NON_EXISTENT_ID`, типи `Booking`, `CreateBookingResponse`. Фікстури: `bookingApi`, `token`, `bookings`.
3. **Бронювання — через фікстуру `bookings`**, вона видаляє їх після тесту, навіть якщо тест упав, тож `try/finally` не потрібен:
   ```ts
   test('PUT without token is forbidden', meta('Critical'), async ({ bookingApi, bookings }) => {
     const { id, booking } = await bookings.create();                 // валідне бронювання; overrides — як у buildBooking
     const response = await bookingApi.updateBooking(id, { ...booking, firstname: 'Hacker' });
     await expect(response, 'Зміна без токена → 403').toHaveStatus(403);
   });
   ```
   - невалідне тіло — `bookings.createRaw(payload)`: якщо API помилково створить бронювання, воно теж буде видалене;
   - бронювання, створене напряму через `bookingApi.createBooking`, зареєструй `bookings.track(id)`.
4. Багатокроковий флоу — **один** тест з `test.step()`, кожен крок перевіряє статус і тіло.
5. **Статус — `await expect(response, '<очікувано>').toHaveStatus(code)`**, не `response.status()`: при падінні в репорті з'являться URL і тіло відповіді.
6. Перевіряй **і статус, і тіло**, а для негативних — що дані не змінились (GET після невдалої зміни).
7. Прожени: `npm run typecheck && npm run test:api`.
8. Запиши в кореневий `AI_WORKLOG.md`.

## Пастки
- Сервер публічний і іноді повільний/перезапускається — не покладайся на чужі id.
- Валідація тіла на POST майже відсутня (невалідне тіло → 500 або 200). Тест перевіряє **правильну** відповідь (400), а не фактичну: червоний тест = баг, репорт згенерує репортер. Бронювання, яке API помилково прийняло, прибирає фікстура `bookings` (через `createRaw`).

## Баг чи задокументована поведінка
- **Задокументоване — не баг**, навіть якщо розходиться з HTTP-семантикою: `DELETE` → 201 описаний в apidoc, тож тест перевіряє 201, а розбіжність іде в README в розділ «Задокументовано, але розходиться з HTTP-семантикою».
- **Не задокументоване й суперечить HTTP** — баг: `POST /auth` з невірним паролем → 200 (має бути 401), `PUT`/`DELETE` неіснуючого id → 405 (має бути 404).

## Типові помилки агента (траплялися в цьому проєкті)
- **Assertion задом наперед.** `expect([200, 204]).toContain(status)` робить `received` масивом, і в баг-репорті «фактично: [200, 204]». Фактичне значення завжди передається в `expect(...)`. Для статусу тепер є `toHaveStatus(code)`; якщо допустимих кодів кілька — `expect(String(status)).toMatch(/^(200|204)$/)`.
- **Задокументований квірк записаний як баг.** `DELETE` → 201 спершу потрапив у список багів, хоча позитивний тест перевіряв саме 201. Рецензент помітив протиріччя. Спершу перевір документацію.
- **Флоу падає через другорядне.** Якщо флоу перевіряє точний код статусу, розбіжність у ньому ховає всі наступні кроки. У флоу — суть кроку, точні коди — окремими тестами.
- **Неточний опис кроку.** «`POST /booking` з датою `2027-13-45`» не каже, яка з двох дат зламана. Пиши явно: «невалідний `checkin`, `checkout` валідний».
