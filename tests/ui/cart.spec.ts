import { test, expect } from '../../src/fixtures/ui';
import { PRODUCTS } from '../../src/data/products';

test.describe('Cart', () => {
  test(
    'adds and removes items, badge and cart contents stay in sync',
    {
      annotation: [
        { type: 'severity', description: 'Major' },
        { type: 'precondition', description: 'Залогінений `standard_user`, відкрито каталог, кошик порожній.' },
      ],
    },
    async ({ loggedIn, cartPage, page }) => {
      const { backpack, bikeLight } = PRODUCTS;

      await test.step(`Додати в кошик ${backpack.name} і ${bikeLight.name}`, async () => {
        await loggedIn.addToCart(backpack.name);
        await loggedIn.addToCart(bikeLight.name);
        await expect(loggedIn.header.cartBadge, 'Лічильник кошика — 2').toHaveText('2');
      });

      await test.step('Відкрити кошик', async () => {
        await loggedIn.header.openCart();
        await expect(page, 'Відкривається сторінка кошика').toHaveURL(/\/cart\.html$/);
        await expect(cartPage.itemNames, 'У кошику обидва товари в порядку додавання').toHaveText([backpack.name, bikeLight.name]);
      });

      await test.step(`Видалити ${backpack.name}`, async () => {
        await cartPage.removeItem(backpack.name);
        await expect(cartPage.itemNames, `У кошику лишився тільки ${bikeLight.name}`).toHaveText([bikeLight.name]);
        await expect(cartPage.header.cartBadge, 'Лічильник кошика — 1').toHaveText('1');
      });

      await test.step(`Видалити ${bikeLight.name}`, async () => {
        await cartPage.removeItem(bikeLight.name);
        await expect(cartPage.items, 'Кошик порожній').toHaveCount(0);
        await expect(cartPage.header.cartBadge, 'Лічильник кошика зник').toBeHidden();
      });
    },
  );

  test(
    'Reset App State clears the cart and restores Add to cart buttons',
    {
      annotation: [
        { type: 'severity', description: 'Medium' },
        { type: 'precondition', description: 'Залогінений `standard_user`, відкрито каталог.' },
      ],
    },
    async ({ loggedIn }) => {
      const { backpack } = PRODUCTS;

      await test.step(`Додати в кошик ${backpack.name}`, async () => {
        await loggedIn.addToCart(backpack.name);
        await expect(loggedIn.header.cartBadge).toHaveText('1');
      });

      await test.step('Відкрити бургер-меню, натиснути Reset App State', async () => {
        await loggedIn.header.resetAppState();
      });

      await test.step('Перевірити стан кошика і кнопок на каталозі', async () => {
        await expect(loggedIn.header.cartBadge, 'Лічильник кошика зникає').toBeHidden();
        await expect(
          loggedIn.item(backpack.name).getByRole('button', { name: 'Add to cart' }),
          `У ${backpack.name} знову кнопка Add to cart`,
        ).toBeVisible({ timeout: 3_000 });
      });
    },
  );
});
