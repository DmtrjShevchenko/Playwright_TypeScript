import { test, expect } from '../../../src/fixtures/ui';
import { PRODUCTS } from '../../../src/data/products';
import { toCents } from '../../../src/utils/price';

test.describe('Product details', () => {
  test(
    'product page shows details, adds item to cart and returns to catalog with cart state kept',
    {
      annotation: [
        { type: 'severity', description: 'Medium' },
        { type: 'precondition', description: 'Залогінений `standard_user`, відкрито каталог товарів, кошик порожній.' },
      ],
    },
    async ({ loggedIn, productPage, page }) => {
      const { backpack } = PRODUCTS;

      await test.step(`Натиснути на назву товару ${backpack.name}`, async () => {
        await loggedIn.openItem(backpack.name);

        await expect(page, 'Відкривається сторінка товару').toHaveURL(/\/inventory-item\.html\?id=\d+$/);
        await productPage.waitForLoaded();
        await expect(productPage.name, 'На сторінці товару показано один товар').toHaveCount(1);
        await expect(productPage.name, `Назва товару — ${backpack.name}`).toHaveText(backpack.name);
        expect(toCents(await productPage.getPrice()), `Ціна товару — $${backpack.price}`).toBe(toCents(backpack.price));
        await expect(productPage.addToCartButton, 'На сторінці товару є кнопка Add to cart').toBeVisible();
      });

      await test.step('На сторінці товару натиснути "Add to cart"', async () => {
        await productPage.addToCart();

        await expect(productPage.removeButton, 'Кнопка змінилася на Remove').toBeVisible();
        await expect(productPage.header.cartBadge, 'Лічильник кошика — 1').toHaveText('1');
      });

      await test.step('Натиснути "Back to products"', async () => {
        await productPage.backToProducts();

        await expect(page, 'Відкривається каталог /inventory.html').toHaveURL(/\/inventory\.html$/);
        await expect.soft(
          loggedIn.item(backpack.name).getByRole('button', { name: 'Remove' }),
          `У картки ${backpack.name} кнопка Remove`,
        ).toBeVisible();
        await expect.soft(loggedIn.header.cartBadge, 'Лічильник кошика — 1').toHaveText('1');
      });
    },
  );
});
