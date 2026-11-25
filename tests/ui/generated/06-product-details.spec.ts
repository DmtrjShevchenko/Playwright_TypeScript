import { test, expect, meta, PATHS, PRODUCTS } from '@ui';

test.describe('Product details', () => {
  test(
    'product page shows details, adds item to cart and returns to catalog with cart state kept',
    meta('Medium', 'Залогінений `standard_user`, відкрито каталог товарів, кошик порожній.'),
    async ({ loggedIn, productPage, page }) => {
      const { backpack } = PRODUCTS;

      await test.step(`Натиснути на назву товару ${backpack.name}`, async () => {
        await loggedIn.openItem(backpack);

        await expect(page, 'Відкривається сторінка товару').toHaveURL(PATHS.productDetails);
        await productPage.waitForLoaded();
        await expect(productPage.name, 'На сторінці товару показано один товар').toHaveCount(1);
        await expect(productPage.name, `Назва товару — ${backpack.name}`).toHaveText(backpack.name);
        expect(await productPage.getPrice(), `Ціна товару — $${backpack.price}`).toEqualMoney(backpack.price);
        await expect(productPage.addToCartButton, 'На сторінці товару є кнопка Add to cart').toBeVisible();
      });

      await test.step('На сторінці товару натиснути "Add to cart"', async () => {
        await productPage.addToCart();

        await expect(productPage.removeButton, 'Кнопка змінилася на Remove').toBeVisible();
        await expect(productPage.header.cartBadge, 'Лічильник кошика — 1').toHaveText('1');
      });

      await test.step('Натиснути "Back to products"', async () => {
        await productPage.backToProducts();

        await expect(page, 'Відкривається каталог /inventory.html').toHaveURL(PATHS.inventory);
        await expect.soft(loggedIn.cartButton(backpack), `У картки ${backpack.name} кнопка Remove`).toHaveText('Remove');
        await expect.soft(loggedIn.header.cartBadge, 'Лічильник кошика — 1').toHaveText('1');
      });
    },
  );
});
