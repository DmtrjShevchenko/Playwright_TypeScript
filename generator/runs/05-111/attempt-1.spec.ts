import { test, expect } from '../../../src/fixtures/ui';
import { PRODUCTS, CHECKOUT_INFO } from '../../../src/data/products';
import { toCents } from '../../../src/utils/price';

const formatPrice = (price: number): string => `$${price.toFixed(2)}`;

// Expected amounts from the test case: Item total $39.98, Tax $3.20, Total $43.18.
const EXPECTED_TAX = 3.2;
const EXPECTED_TOTAL = 43.18;

test.describe('Checkout', () => {
  test(
    'two-item order shows correct items and totals and empties the cart after completion',
    {
      annotation: [
        { type: 'severity', description: 'Major' },
        { type: 'precondition', description: 'Залогінений `standard_user`, відкрито каталог товарів, кошик порожній.' },
      ],
    },
    async ({ loggedIn, cartPage, checkoutPage, page }) => {
      const { backpack, bikeLight } = PRODUCTS;
      const products = [backpack, bikeLight];
      const expectedSubtotalCents = toCents(backpack.price) + toCents(bikeLight.price);

      await test.step(`На картці ${backpack.name} натиснути "Add to cart"`, async () => {
        await loggedIn.addToCart(backpack.name);
        await expect(
          loggedIn.item(backpack.name).getByRole('button', { name: 'Remove' }),
          `На картці ${backpack.name} кнопка змінилася на Remove`,
        ).toBeVisible();
      });

      await test.step(`На картці ${bikeLight.name} натиснути "Add to cart"`, async () => {
        await loggedIn.addToCart(bikeLight.name);
        await expect(
          loggedIn.item(bikeLight.name).getByRole('button', { name: 'Remove' }),
          `На картці ${bikeLight.name} кнопка змінилася на Remove`,
        ).toBeVisible();
        await expect(loggedIn.header.cartBadge, 'Лічильник кошика — 2').toHaveText('2');
      });

      await test.step('Натиснути іконку кошика', async () => {
        await loggedIn.header.openCart();
        await expect(page, 'Відкривається сторінка кошика /cart.html').toHaveURL(/\/cart\.html$/);
        await expect(cartPage.items, 'У кошику рівно 2 позиції').toHaveCount(2);
        await expect.soft(cartPage.itemNames, 'У кошику Sauce Labs Backpack і Sauce Labs Bike Light').toHaveText(
          products.map((p) => p.name),
        );
        await expect
          .soft(cartPage.items.getByTestId('inventory-item-price'), 'Ціни в кошику: $29.99 і $9.99')
          .toHaveText(products.map((p) => formatPrice(p.price)));
        await expect
          .soft(cartPage.items.getByTestId('item-quantity'), 'Кількість кожного товару — 1')
          .toHaveText(['1', '1']);
      });

      await test.step('Натиснути "Checkout"', async () => {
        await cartPage.checkout();
        await expect(page, 'Відкривається крок введення даних покупця').toHaveURL(/\/checkout-step-one\.html$/);
      });

      await test.step(
        `Ввести First Name "${CHECKOUT_INFO.firstName}", Last Name "${CHECKOUT_INFO.lastName}", Postal Code "${CHECKOUT_INFO.postalCode}" і натиснути "Continue"`,
        async () => {
          await checkoutPage.fillInfo(CHECKOUT_INFO);
          await expect(page, 'Відкривається сторінка Overview /checkout-step-two.html').toHaveURL(
            /\/checkout-step-two\.html$/,
          );
        },
      );

      await test.step('Звірити товари й суми на сторінці Overview', async () => {
        await expect.soft(checkoutPage.itemNames, 'На Overview ті самі 2 товари').toHaveText(products.map((p) => p.name));
        const summary = await checkoutPage.getSummary();
        expect
          .soft(summary.itemPrices.map(toCents), 'На Overview ті самі ціни: $29.99 і $9.99')
          .toEqual(products.map((p) => toCents(p.price)));
        expect.soft(toCents(summary.subtotal), 'Item total: $39.98').toBe(expectedSubtotalCents);
        expect.soft(toCents(summary.tax), 'Tax: $3.20').toBe(toCents(EXPECTED_TAX));
        expect.soft(toCents(summary.total), 'Total: $43.18').toBe(toCents(EXPECTED_TOTAL));
      });

      await test.step('Натиснути "Finish"', async () => {
        await checkoutPage.finish();
        await expect(page, 'Відкривається /checkout-complete.html').toHaveURL(/\/checkout-complete\.html$/);
        await expect(checkoutPage.completeHeader, 'Заголовок "Thank you for your order!"').toHaveText(
          'Thank you for your order!',
        );
      });

      await test.step('Натиснути "Back Home"', async () => {
        // TODO(page-object): add backHomeButton locator and backHome() method to CheckoutPage
        await page.getByTestId('back-to-products').click();
        await expect(page, 'Відкривається каталог /inventory.html').toHaveURL(/\/inventory\.html$/);
      });

      await test.step('Перевірити іконку кошика й кнопки на картках товарів', async () => {
        await expect.soft(loggedIn.header.cartBadge, 'Лічильника кошика немає').toBeHidden();
        for (const product of products) {
          await expect
            .soft(
              loggedIn.item(product.name).getByRole('button', { name: 'Add to cart' }),
              `На картці ${product.name} знову кнопка Add to cart`,
            )
            .toBeVisible();
        }
      });
    },
  );
});
