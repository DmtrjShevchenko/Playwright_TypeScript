import { test, expect, expectQuick, meta, PATHS, PRODUCTS } from '@ui';

const { backpack, bikeLight } = PRODUCTS;

test.describe('Cart', () => {
  test(
    'adds and removes items, badge and cart contents stay in sync',
    meta('Major', 'Залогінений `standard_user`, відкрито каталог, кошик порожній.'),
    async ({ loggedIn, cartPage, page }) => {
      await test.step(`Додати в кошик ${backpack.name} і ${bikeLight.name}`, async () => {
        await loggedIn.addToCart(backpack, bikeLight);
        await expect(loggedIn.header.cartBadge, 'Лічильник кошика — 2').toHaveText('2');
      });

      await test.step('Відкрити кошик', async () => {
        await loggedIn.header.openCart();
        await expect(page, 'Відкривається сторінка кошика').toHaveURL(PATHS.cart);
        await expect(cartPage.itemNames, 'У кошику обидва товари в порядку додавання').toHaveText([backpack.name, bikeLight.name]);
      });

      await test.step(`Видалити ${backpack.name}`, async () => {
        await cartPage.removeItem(backpack);
        await expect(cartPage.itemNames, `У кошику лишився тільки ${bikeLight.name}`).toHaveText([bikeLight.name]);
        await expect(cartPage.header.cartBadge, 'Лічильник кошика — 1').toHaveText('1');
      });

      await test.step(`Видалити ${bikeLight.name}`, async () => {
        await cartPage.removeItem(bikeLight);
        await expect(cartPage.items, 'Кошик порожній').toHaveCount(0);
        await expect(cartPage.header.cartBadge, 'Лічильник кошика зник').toBeHidden();
      });
    },
  );

  test(
    'Reset App State clears the cart and restores Add to cart buttons',
    meta('Medium', 'Залогінений `standard_user`, відкрито каталог.'),
    async ({ loggedIn }) => {
      await test.step(`Додати в кошик ${backpack.name}`, async () => {
        await loggedIn.addToCart(backpack);
        await expect(loggedIn.header.cartBadge).toHaveText('1');
      });

      await test.step('Відкрити бургер-меню, натиснути Reset App State', async () => {
        await loggedIn.header.resetAppState();
      });

      await test.step('Перевірити стан кошика і кнопок на каталозі', async () => {
        await expect(loggedIn.header.cartBadge, 'Лічильник кошика зникає').toBeHidden();
        await expectQuick(loggedIn.cartButton(backpack), `У ${backpack.name} знову кнопка Add to cart`).toHaveText('Add to cart');
      });
    },
  );
});
