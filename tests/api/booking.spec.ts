import { test, expect, meta, API_CREDENTIALS, NON_EXISTENT_ID, buildBooking, type Booking, type CreateBookingResponse } from '@api';

test.describe('Booking API', () => {
  test('auth, create, update, delete, then booking is gone', async ({ bookingApi, bookings }) => {
    const token = await test.step('POST /auth returns a token', async () => {
      const response = await bookingApi.createToken(API_CREDENTIALS.username, API_CREDENTIALS.password);
      await expect(response).toHaveStatus(200);
      const { token } = await response.json();
      expect(token).toEqual(expect.any(String));
      return token as string;
    });

    const original = buildBooking();
    const bookingId = await test.step('POST /booking creates a booking', async () => {
      const response = await bookingApi.createBooking(original);
      await expect(response).toHaveStatus(200);
      const body: CreateBookingResponse = await response.json();
      bookings.track(body.bookingid); // cleaned up even if a later step fails
      expect(body.bookingid).toEqual(expect.any(Number));
      expect(body.booking).toEqual(original);
      return body.bookingid;
    });

    await test.step('GET /booking/:id returns the created booking', async () => {
      const response = await bookingApi.getBooking(bookingId);
      await expect(response).toHaveStatus(200);
      expect(await response.json()).toEqual(original);
    });

    const updated: Booking = {
      ...original,
      firstname: 'Updated',
      totalprice: 999,
      depositpaid: false,
      bookingdates: { checkin: '2027-02-01', checkout: '2027-02-03' },
      additionalneeds: 'Late checkout',
    };

    await test.step('PUT /booking/:id updates the booking', async () => {
      const response = await bookingApi.updateBooking(bookingId, updated, token);
      await expect(response).toHaveStatus(200);
      expect(await response.json()).toEqual(updated);
    });

    await test.step('GET /booking/:id reflects the update', async () => {
      const response = await bookingApi.getBooking(bookingId);
      await expect(response).toHaveStatus(200);
      expect(await response.json()).toEqual(updated);
    });

    await test.step('DELETE /booking/:id removes the booking', async () => {
      // 201 Created is the DOCUMENTED response (apidoc), even though 200/204 would match HTTP semantics.
      // Listed in README under "Задокументовано, але розходиться з HTTP-семантикою", not as a bug.
      await expect(await bookingApi.deleteBooking(bookingId, token), 'DELETE returns the documented 201 Created').toHaveStatus(201);
    });

    await test.step('GET /booking/:id returns 404 after delete', async () => {
      await expect(await bookingApi.getBooking(bookingId)).toHaveStatus(404);
    });
  });

  test.describe('negative @negative', () => {
    test('POST /auth with wrong password returns 401 and no token', meta('Medium'), async ({ bookingApi }) => {
      const response = await test.step('POST /auth з username admin і невірним паролем', async () =>
        bookingApi.createToken(API_CREDENTIALS.username, 'wrong-password'),
      );

      await test.step('Перевірити відповідь', async () => {
        expect(await response.json(), 'Токен не видається').not.toHaveProperty('token');
        await expect(response, 'Невірні облікові дані → 401 Unauthorized').toHaveStatus(401);
      });
    });

    test('PUT /booking/:id without token is forbidden and does not change data', meta('Critical'), async ({ bookingApi, bookings }) => {
      const { id, booking } = await test.step('POST /booking — створити бронювання', async () => bookings.create());

      await test.step('PUT /booking/{id} без заголовка Cookie, з firstname "Hacker"', async () => {
        const response = await bookingApi.updateBooking(id, { ...booking, firstname: 'Hacker' });
        await expect(response, 'Зміна без токена заборонена → 403 Forbidden').toHaveStatus(403);
      });

      await test.step('GET /booking/{id} — перевірити, що дані не змінились', async () => {
        expect(await (await bookingApi.getBooking(id)).json(), 'Бронювання лишилось без змін').toEqual(booking);
      });
    });

    test('GET /booking/:id for a non-existent id returns 404', meta('Minor'), async ({ bookingApi }) => {
      await test.step(`GET /booking/${NON_EXISTENT_ID}`, async () => {
        await expect(await bookingApi.getBooking(NON_EXISTENT_ID), 'Неіснуюче бронювання → 404 Not Found').toHaveStatus(404);
      });
    });

    test('PUT and DELETE for a non-existent id return 404', meta('Minor'), async ({ bookingApi, token }) => {
      await test.step(`PUT /booking/${NON_EXISTENT_ID} з валідним тілом і токеном`, async () => {
        const response = await bookingApi.updateBooking(NON_EXISTENT_ID, buildBooking(), token);
        await expect.soft(response, 'Метод PUT підтримується; відсутній саме ресурс, тож коректна відповідь — 404 Not Found').toHaveStatus(404);
      });

      await test.step(`DELETE /booking/${NON_EXISTENT_ID} з токеном`, async () => {
        const response = await bookingApi.deleteBooking(NON_EXISTENT_ID, token);
        await expect.soft(response, 'Метод DELETE підтримується; відсутній саме ресурс, тож коректна відповідь — 404 Not Found').toHaveStatus(404);
      });
    });
  });

  test.describe('validation @negative', () => {
    const { firstname, ...withoutFirstname } = buildBooking();
    const cases = [
      { title: 'without required fields', severity: 'Major', step: 'валідним бронюванням без поля firstname', payload: withoutFirstname },
      { title: 'with non-numeric totalprice', severity: 'Major', step: '"totalprice": "abc"', payload: { ...buildBooking(), totalprice: 'abc' } },
      {
        title: 'with an invalid date',
        severity: 'Major',
        step: 'невалідним "checkin": "2027-13-45" (checkout валідний: "2027-01-10")',
        payload: buildBooking({ bookingdates: { checkin: '2027-13-45', checkout: '2027-01-10' } }),
      },
      {
        title: 'with checkout before checkin',
        severity: 'Major',
        step: '"checkin": "2027-01-15", "checkout": "2027-01-10"',
        payload: buildBooking({ bookingdates: { checkin: '2027-01-15', checkout: '2027-01-10' } }),
      },
      { title: 'with negative totalprice', severity: 'Medium', step: '"totalprice": -100', payload: buildBooking({ totalprice: -100 }) },
    ] as const;

    for (const { title, severity, step, payload } of cases) {
      test(`POST /booking ${title} returns 400`, meta(severity), async ({ bookings }) => {
        // bookings.createRaw cleans up even if the API wrongly creates the booking.
        const response = await test.step(`POST /booking з ${step}`, async () => bookings.createRaw(payload));

        await test.step('Перевірити, що бронювання відхилено', async () => {
          await expect(response, 'Невалідні дані → 400 Bad Request, бронювання не створюється').toHaveStatus(400);
        });
      });
    }
  });
});
