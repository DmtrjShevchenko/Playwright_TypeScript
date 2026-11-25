import { test, expect } from '../../src/fixtures/ui';
import { ALL_PRODUCTS } from '../../src/data/products';
import { SORT_OPTIONS } from '../../src/pages/InventoryPage';

const meta = (severity: string) => ({
  annotation: [
    { type: 'severity', description: severity },
    { type: 'precondition', description: 'Залогінений `standard_user`, відкрито каталог.' },
  ],
});

test.describe('Catalog', () => {
  test('shows all 6 products with name, price and Add to cart button', meta('Major'), async ({ loggedIn }) => {
    await test.step('Перевірити кількість товарів', async () => {
      await expect(loggedIn.items, `У каталозі ${ALL_PRODUCTS.length} товарів`).toHaveCount(ALL_PRODUCTS.length);
    });

    await test.step('Перевірити назви товарів', async () => {
      expect(await loggedIn.getNames(), 'Показано всі очікувані товари').toEqual(
        expect.arrayContaining(ALL_PRODUCTS.map((p) => p.name)),
      );
    });

    await test.step('Перевірити ціну й кнопку Add to cart кожного товару', async () => {
      for (const product of ALL_PRODUCTS) {
        const item = loggedIn.item(product.name);
        await expect(item.getByTestId('inventory-item-price'), `Ціна ${product.name}`).toHaveText(`$${product.price}`);
        await expect(item.getByRole('button', { name: 'Add to cart' }), `Кнопка Add to cart у ${product.name}`).toBeEnabled();
      }
    });
  });
});

test.describe('Sorting', () => {
  test('sorts products by price, low to high', meta('Medium'), async ({ loggedIn }) => {
    await test.step('Обрати сортування Price (low to high)', async () => {
      await loggedIn.sortBy(SORT_OPTIONS.priceAsc);
    });

    await test.step('Перевірити порядок цін', async () => {
      const prices = await loggedIn.getPrices();
      expect(prices, 'Ціни йдуть за зростанням').toEqual([...prices].sort((a, b) => a - b));
      expect(prices, 'Після сортування показано всі товари').toHaveLength(ALL_PRODUCTS.length);
    });
  });

  test('sorts products by name, Z to A', meta('Minor'), async ({ loggedIn }) => {
    await test.step('Обрати сортування Name (Z to A)', async () => {
      await loggedIn.sortBy(SORT_OPTIONS.nameDesc);
    });

    await test.step('Перевірити порядок назв', async () => {
      const names = await loggedIn.getNames();
      expect(names, 'Назви йдуть у зворотному алфавітному порядку').toEqual([...names].sort((a, b) => b.localeCompare(a)));
      await expect(loggedIn.sortSelect, 'У списку сортування обрано Name (Z to A)').toHaveValue(SORT_OPTIONS.nameDesc);
    });
  });
});
