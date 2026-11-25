import { test, expect } from '../../src/fixtures/ui';
import { ALL_PRODUCTS } from '../../src/data/products';
import { SORT_OPTIONS } from '../../src/pages/InventoryPage';

test.describe('Catalog', () => {
  test('shows all 6 products with name, price and Add to cart button', async ({ loggedIn }) => {
    await expect(loggedIn.items).toHaveCount(ALL_PRODUCTS.length);

    expect(await loggedIn.getNames()).toEqual(expect.arrayContaining(ALL_PRODUCTS.map((p) => p.name)));

    for (const product of ALL_PRODUCTS) {
      const item = loggedIn.item(product.name);
      await expect(item.getByTestId('inventory-item-price')).toHaveText(`$${product.price}`);
      await expect(item.getByRole('button', { name: 'Add to cart' })).toBeEnabled();
    }
  });
});

test.describe('Sorting', () => {
  test('sorts products by price, low to high', async ({ loggedIn }) => {
    await loggedIn.sortBy(SORT_OPTIONS.priceAsc);

    const prices = await loggedIn.getPrices();
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
    expect(prices).toHaveLength(ALL_PRODUCTS.length);
  });

  test('sorts products by name, Z to A', async ({ loggedIn }) => {
    await loggedIn.sortBy(SORT_OPTIONS.nameDesc);

    const names = await loggedIn.getNames();
    expect(names).toEqual([...names].sort((a, b) => b.localeCompare(a)));
    await expect(loggedIn.sortSelect).toHaveValue(SORT_OPTIONS.nameDesc);
  });
});
