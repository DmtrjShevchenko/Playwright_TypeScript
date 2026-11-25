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
});
