import { test, expect, meta, type Booking } from '@api';

test.describe('Booking API — PATCH', () => {
  test('PATCH /booking/:id updates only the sent fields and keeps the rest unchanged', meta('Medium'), async ({ bookingApi, bookings, token }) => {
    const patch: Partial<Booking> = { firstname: 'Patched', totalprice: 777 };
    const { id, booking: original } = await test.step('POST /booking — створити бронювання', async () => bookings.create());

    await test.step('PATCH /booking/{id} з токеном і тілом {"firstname": "Patched", "totalprice": 777}', async () => {
      const response = await bookingApi.partialUpdateBooking(id, patch, token);
      await expect(response, 'Часткове оновлення з токеном → 200 OK').toHaveStatus(200);
      const body: Booking = await response.json();
      expect.soft(body.firstname, 'У відповіді firstname = "Patched"').toBe('Patched');
      expect.soft(body.totalprice, 'У відповіді totalprice = 777').toBe(777);
    });

    await test.step('GET /booking/{id}', async () => {
      const response = await bookingApi.getBooking(id);
      await expect(response, 'Бронювання доступне → 200 OK').toHaveStatus(200);
      const body: Booking = await response.json();
      expect.soft(body.firstname, 'firstname змінився на "Patched"').toBe('Patched');
      expect.soft(body.totalprice, 'totalprice змінився на 777').toBe(777);
      expect.soft(body.lastname, 'lastname не змінився').toBe(original.lastname);
      expect.soft(body.depositpaid, 'depositpaid не змінився').toBe(original.depositpaid);
      expect.soft(body.bookingdates, 'bookingdates не змінились').toEqual(original.bookingdates);
      expect.soft(body.additionalneeds, 'additionalneeds не змінився').toBe(original.additionalneeds);
    });
  });
});
