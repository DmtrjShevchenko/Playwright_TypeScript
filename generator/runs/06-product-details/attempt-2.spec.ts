import { test, expect } from '../../../src/fixtures/ui';
import { PRODUCTS } from '../../../src/data/products';
import { parsePrice, toCents } from '../../../src/utils/price';

test.describe('Product details', () => {
  test(
    'product page shows details, adds item to cart and returns to catalog with cart state kept',
    {
      annotation: [
        { type: 'severity', description: 'Medium' },
        { type: 'precondition', description: 'Залогінений `standard_user`, відкрито каталог товарів, кошик порожній.' },
      ],
    },
    async ({ loggedIn, page }) => {
      const { backpack } = PRODUCTS;

      await test.step(`Натиснути на назву товару ${backpack.name}`, async () => {
        // TODO(page-object): add InventoryPage.openItem(name) — click on the product name in its card
        await loggedIn.item(backpack.name).getByTestId('inventory-item-name').click();

        await expect(page, 'Відкривається сторінка товару').toHaveURL(/\/inventory-item\.html\?id=\d+$/);
        // SPA: the URL changes before the catalog DOM is replaced. Wait for an element that exists
        // only on the product page, so the name/price locators below resolve to a single element.
        // TODO(page-object): add ProductDetailsPage.backToProductsButton
        await expect(
          page.getByRole('button', { name: 'Back to products' }),
          'На сторінці товару є кнопка Back to products',
        ).toBeVisible();
        await expect(loggedIn.itemNames, 'На сторінці товару показано один товар').toHaveCount(1);

        // TODO(page-object): add ProductDetailsPage with name, price, addToCart/remove and backToProducts locators
        await expect(page.getByTestId('inventory-item-name'), `Назва товару — ${backpack.name}`).toHaveText(backpack.name);
        // TODO(page-object): ProductDetailsPage.price
        const priceText = await page.getByTestId('inventory-item-price').innerText();
        expect(toCents(parsePrice(priceText)), `Ціна товару — $${backpack.price}`).toBe(toCents(backpack.price));
        // TODO(page-object): ProductDetailsPage.addToCartButton
        await expect(page.getByRole('button', { name: 'Add to cart' }), 'На сторінці товару є кнопка Add to cart').toBeVisible();
      });

      await test.step('На сторінці товару натиснути "Add to cart"', async () => {
        // TODO(page-object): ProductDetailsPage.addToCart()
        await page.getByRole('button', { name: 'Add to cart' }).click();

        // TODO(page-object): ProductDetailsPage.removeButton
        await expect(page.getByRole('button', { name: 'Remove' }), 'Кнопка змінилася на Remove').toBeVisible();
        await expect(loggedIn.header.cartBadge, 'Лічильник кошика — 1').toHaveText('1');
      });

      await test.step('Натиснути "Back to products"', async () => {
        // TODO(page-object): ProductDetailsPage.backToProducts()
        await page.getByRole('button', { name: 'Back to products' }).click();

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
