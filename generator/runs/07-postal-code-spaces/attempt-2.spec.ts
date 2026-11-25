import { test, expect } from '../../../src/fixtures/ui';
import { PRODUCTS, CHECKOUT_INFO } from '../../../src/data/products';
import { ERRORS } from '../../../src/data/users';

// The failure is the application's behaviour, not a test-code error:
// SauceDemo accepts a postal code of only spaces and moves on to /checkout-step-two.html.
// The assertions describe the correct behaviour from the test case and are intentionally kept (red test = open bug).
const WHITESPACE_POSTAL_CODE = '   ';

test.describe('Checkout', () => {
  test(
    'postal code of only spaces is rejected as empty @negative',
    {
      annotation: [
        { type: 'severity', description: 'Medium' },
        {
          type: 'precondition',
          description: `Залогінений \`standard_user\`, у кошику ${PRODUCTS.onesie.name}, відкрито кошик.`,
        },
      ],
    },
    async ({ loggedIn, cartPage, checkoutPage, page }) => {
      const { onesie } = PRODUCTS;

      await test.step(`Додати в кошик ${onesie.name} і відкрити кошик`, async () => {
        await loggedIn.addToCart(onesie.name);
        await expect(loggedIn.header.cartBadge, 'Лічильник кошика — 1').toHaveText('1');
        await loggedIn.header.openCart();
        await expect(page, 'Відкривається сторінка кошика').toHaveURL(/\/cart\.html$/);
        await expect(cartPage.itemNames, `У кошику ${onesie.name}`).toHaveText([onesie.name]);
      });

      await test.step('Натиснути "Checkout"', async () => {
        await cartPage.checkout();
        await expect(page, 'Відкривається крок введення даних покупця').toHaveURL(/\/checkout-step-one\.html$/);
      });

      await test.step('Ввести First Name "Test", Last Name "User", Postal Code — три пробіли', async () => {
        await checkoutPage.firstName.fill(CHECKOUT_INFO.firstName);
        await checkoutPage.lastName.fill(CHECKOUT_INFO.lastName);
        await checkoutPage.postalCode.fill(WHITESPACE_POSTAL_CODE);
      });

      await test.step('Натиснути "Continue"', async () => {
        await checkoutPage.continueButton.click();
        await expect
          .soft(checkoutPage.error, `Показано помилку "${ERRORS.postalCodeRequired}"`)
          .toHaveText(ERRORS.postalCodeRequired);
        await expect
          .soft(page, 'Користувач лишається на сторінці /checkout-step-one.html')
          .toHaveURL(/\/checkout-step-one\.html$/);
      });
    },
  );
});
