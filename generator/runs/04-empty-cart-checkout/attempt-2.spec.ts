import { test, expect } from '../../../src/fixtures/ui';

test.describe('Checkout', () => {
  test(
    'checkout with an empty cart is not possible @negative',
    {
      annotation: [
        { type: 'severity', description: 'Major' },
        { type: 'precondition', description: 'Залогінений `standard_user`, кошик порожній.' },
      ],
    },
    async ({ loggedIn, cartPage, checkoutPage, page }) => {
      await test.step('Відкрити кошик', async () => {
        await loggedIn.header.openCart();
        await expect(page, 'Відкривається сторінка кошика').toHaveURL(/\/cart\.html$/);
        await expect(cartPage.items, 'Кошик порожній').toHaveCount(0);
      });

      await test.step('Натиснути Checkout', async () => {
        await cartPage.checkout();
        await expect.soft(
          page,
          'Оформлення не починається: користувач лишається на сторінці кошика /cart.html',
        ).toHaveURL(/\/cart\.html$/);
        await expect.soft(
          checkoutPage.firstName,
          'Форма даних покупця (крок 1 оформлення) не відкривається',
        ).toBeHidden();
      });
    },
  );
});
