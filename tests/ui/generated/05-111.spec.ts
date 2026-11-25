import { test, expect, meta, CHECKOUT_INFO, PATHS, PRODUCTS } from '@ui';

// Expected amounts from the test case: Item total $39.98, Tax $3.20, Total $43.18.
const EXPECTED_TAX = 3.2;
const EXPECTED_TOTAL = 43.18;

test.describe('Checkout', () => {
  test(
    'two-item order shows correct items and totals and empties the cart after completion',
    meta('Major', 'Залогінений `standard_user`, відкрито каталог товарів, кошик порожній.'),
    async ({ loggedIn, cartPage, checkoutPage, page }) => {
      const { backpack, bikeLight } = PRODUCTS;
      const products = [backpack, bikeLight];

      await test.step(`На картці ${backpack.name} натиснути "Add to cart"`, async () => {
        await loggedIn.addToCart(backpack);
        await expect(loggedIn.cartButton(backpack), `На картці ${backpack.name} кнопка змінилася на Remove`).toHaveText('Remove');
      });

      await test.step(`На картці ${bikeLight.name} натиснути "Add to cart"`, async () => {
        await loggedIn.addToCart(bikeLight);
        await expect(loggedIn.cartButton(bikeLight), `На картці ${bikeLight.name} кнопка змінилася на Remove`).toHaveText('Remove');
        await expect(loggedIn.header.cartBadge, 'Лічильник кошика — 2').toHaveText('2');
      });

      await test.step('Натиснути іконку кошика', async () => {
        await loggedIn.header.openCart();
        await expect(page, 'Відкривається сторінка кошика /cart.html').toHaveURL(PATHS.cart);
        await expect(cartPage.items, 'У кошику рівно 2 позиції').toHaveCount(2);
        await expect.soft(cartPage.itemNames, 'У кошику Sauce Labs Backpack і Sauce Labs Bike Light').toHaveText(products.map((p) => p.name));
        await expect
          .soft(cartPage.items.getByTestId('inventory-item-price'), 'Ціни в кошику: $29.99 і $9.99')
          .toHaveText(products.map((p) => `$${p.price.toFixed(2)}`));
        await expect.soft(cartPage.items.getByTestId('item-quantity'), 'Кількість кожного товару — 1').toHaveText(['1', '1']);
      });

      await test.step('Натиснути "Checkout"', async () => {
        await cartPage.checkout();
        await expect(page, 'Відкривається крок введення даних покупця').toHaveURL(PATHS.checkoutInfo);
      });

      await test.step(
        `Ввести First Name "${CHECKOUT_INFO.firstName}", Last Name "${CHECKOUT_INFO.lastName}", Postal Code "${CHECKOUT_INFO.postalCode}" і натиснути "Continue"`,
        async () => {
          await checkoutPage.fillInfo(CHECKOUT_INFO);
          await expect(page, 'Відкривається сторінка Overview /checkout-step-two.html').toHaveURL(PATHS.checkoutOverview);
        },
      );

      await test.step('Звірити товари й суми на сторінці Overview', async () => {
        await expect.soft(checkoutPage.itemNames, 'На Overview ті самі 2 товари').toHaveText(products.map((p) => p.name));
        const { itemPrices, subtotal, tax, total } = await checkoutPage.getSummary();
        expect.soft(itemPrices, 'На Overview ті самі ціни: $29.99 і $9.99').toEqual(products.map((p) => p.price));
        expect.soft(subtotal, 'Item total: $39.98').toEqualMoney(backpack.price + bikeLight.price);
        expect.soft(tax, 'Tax: $3.20').toEqualMoney(EXPECTED_TAX);
        expect.soft(total, 'Total: $43.18').toEqualMoney(EXPECTED_TOTAL);
      });

      await test.step('Натиснути "Finish"', async () => {
        await checkoutPage.finish();
        await expect(page, 'Відкривається /checkout-complete.html').toHaveURL(PATHS.checkoutComplete);
        await expect(checkoutPage.completeHeader, 'Заголовок "Thank you for your order!"').toHaveText('Thank you for your order!');
      });

      await test.step('Натиснути "Back Home"', async () => {
        await checkoutPage.backHome();
        await expect(page, 'Відкривається каталог /inventory.html').toHaveURL(PATHS.inventory);
      });

      await test.step('Перевірити іконку кошика й кнопки на картках товарів', async () => {
        await expect.soft(loggedIn.header.cartBadge, 'Лічильника кошика немає').toBeHidden();
        for (const product of products) {
          await expect.soft(loggedIn.cartButton(product), `На картці ${product.name} знову кнопка Add to cart`).toHaveText('Add to cart');
        }
      });
    },
  );
});
