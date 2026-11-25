import { test, expect } from '../../src/fixtures/ui';
import { CHECKOUT_INFO, PRODUCTS } from '../../src/data/products';
import { ERRORS } from '../../src/data/users';
import { toCents } from '../../src/utils/price';

test.describe('Checkout', () => {
  test.beforeEach(async ({ loggedIn }) => {
    await loggedIn.addToCart(PRODUCTS.backpack.name);
    await loggedIn.addToCart(PRODUCTS.onesie.name);
    await loggedIn.header.openCart();
  });

  test('completes an order with correct totals', async ({ cartPage, checkoutPage, page }) => {
    await cartPage.checkout();
    await expect(page).toHaveURL(/checkout-step-one\.html$/);

    await checkoutPage.fillInfo(CHECKOUT_INFO);
    await expect(page).toHaveURL(/checkout-step-two\.html$/);
    await expect(checkoutPage.itemNames).toHaveText([PRODUCTS.backpack.name, PRODUCTS.onesie.name]);

    const summary = await checkoutPage.getSummary();
    const expectedSubtotal = PRODUCTS.backpack.price + PRODUCTS.onesie.price;
    expect(toCents(summary.subtotal)).toBe(toCents(expectedSubtotal));
    expect(summary.tax).toBeGreaterThan(0);
    expect(toCents(summary.total)).toBe(toCents(summary.subtotal + summary.tax));

    await checkoutPage.finish();
    await expect(page).toHaveURL(/checkout-complete\.html$/);
    await expect(checkoutPage.completeHeader).toHaveText('Thank you for your order!');
    await expect(checkoutPage.header.cartBadge).toBeHidden();
  });

  test('cannot continue without postal code @negative', async ({ cartPage, checkoutPage, page }) => {
    await cartPage.checkout();

    await checkoutPage.fillInfo({ firstName: CHECKOUT_INFO.firstName, lastName: CHECKOUT_INFO.lastName });

    await expect(checkoutPage.error).toHaveText(ERRORS.postalCodeRequired);
    await expect(page).toHaveURL(/checkout-step-one\.html$/);
  });

  test(
    'whitespace-only customer info is rejected @negative',
    {
      annotation: [
        { type: 'severity', description: 'Medium' },
        { type: 'precondition', description: 'Залогінений `standard_user`, у кошику Sauce Labs Backpack і Sauce Labs Onesie, відкрито кошик.' },
      ],
    },
    async ({ cartPage, checkoutPage, page }) => {
      await test.step('Натиснути Checkout', async () => {
        await cartPage.checkout();
      });

      await test.step('Ввести в First Name, Last Name і Postal Code по три пробіли, натиснути Continue', async () => {
        await checkoutPage.fillInfo({ firstName: '   ', lastName: '   ', postalCode: '   ' });
      });

      await test.step('Перевірити, що форма не пропускає порожні дані', async () => {
        await expect(page, 'Користувач лишається на кроці введення даних').toHaveURL(/checkout-step-one\.html$/, {
          timeout: 3_000,
        });
        await expect(checkoutPage.error, 'Показано помилку валідації').toHaveText(ERRORS.firstNameRequired);
      });
    },
  );
});

test.describe('Checkout step order', () => {
  test(
    'overview step cannot be opened by URL without customer info @negative',
    {
      annotation: [
        { type: 'severity', description: 'Major' },
        { type: 'precondition', description: 'Залогінений `standard_user`, у кошику Sauce Labs Backpack, дані покупця не вводились.' },
      ],
    },
    async ({ loggedIn, checkoutPage, page }) => {
      await test.step(`Додати в кошик ${PRODUCTS.backpack.name}`, async () => {
        await loggedIn.addToCart(PRODUCTS.backpack.name);
      });

      await test.step('Відкрити напряму /checkout-step-two.html, минаючи крок з даними покупця', async () => {
        await checkoutPage.gotoOverview();
      });

      await test.step('Перевірити, що крок з даними покупця не пропущено', async () => {
        await expect(
          page,
          'Без даних покупця користувача повертає на /checkout-step-one.html',
        ).toHaveURL(/checkout-step-one\.html$/, { timeout: 3_000 });
      });
    },
  );
});

test.describe('Checkout with an empty cart', () => {
  test(
    'order cannot be placed with an empty cart @negative',
    {
      annotation: [
        { type: 'severity', description: 'Major' },
        { type: 'precondition', description: 'Залогінений `standard_user`, кошик порожній.' },
      ],
    },
    async ({ loggedIn, cartPage, page }) => {
      await test.step('Відкрити кошик', async () => {
        await loggedIn.header.openCart();
        await expect(cartPage.items).toHaveCount(0);
      });

      await test.step('Натиснути Checkout', async () => {
        await cartPage.checkout();
      });

      await test.step('Перевірити, що оформлення не почалося', async () => {
        await expect(page, 'Оформлення з порожнім кошиком неможливе: користувач лишається в кошику').toHaveURL(
          /\/cart\.html$/,
          { timeout: 3_000 },
        );
      });
    },
  );
});
