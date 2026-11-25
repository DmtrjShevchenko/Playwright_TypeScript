```ts
import { test, expect } from '../../../src/fixtures/ui';
import { SORT_OPTIONS } from '../../../src/pages/InventoryPage';
import { ALL_PRODUCTS, PRODUCTS } from '../../../src/data/products';
import { toCents } from '../../../src/utils/price';

test.describe('Inventory sorting', () => {
  test(
    'sorting by price high to low puts the most expensive item first and prices descend',
    {
      annotation: [
        { type: 'severity', description: 'Medium' },
        { type: 'precondition', description: 'Залогінений `standard_user`, відкрито каталог товарів.' },
      ],
    },
    async ({ loggedIn }) => {
      const { fleeceJacket, onesie } = PRODUCTS;

      await test.step('У списку сортування обрати "Price (high to low)"', async () => {
        await loggedIn.sortBy(SORT_OPTIONS.priceDesc);
      });

      await test.step('Перевірити порядок товарів і обране сортування', async () => {
        await expect(loggedIn.items, `У каталозі ${ALL_PRODUCTS.length} товарів`).toHaveCount(ALL_PRODUCTS.length);

        await expect
          .soft(loggedIn.itemNames.first(), `Першим іде найдорожчий товар — ${fleeceJacket.name}`)
          .toHaveText(fleeceJacket.name);
        await expect
          .soft(loggedIn.itemNames.last(), `Останнім іде найдешевший товар — ${onesie.name}`)
          .toHaveText(onesie.name);

        const pricesCents = (await loggedIn.getPrices()).map(toCents);
        const expectedDesc = [...pricesCents].sort((a, b) => b - a);

        expect.soft(pricesCents[0], `Перша ціна — $${fleeceJacket.price}`).toBe(toCents(fleeceJacket.price));
        expect.soft(pricesCents[pricesCents.length - 1], `Остання ціна — $${onesie.price}`).toBe(toCents(onesie.price));
        expect.soft(pricesCents, 'Ціни всіх товарів ідуть за спаданням').toEqual(expectedDesc);

        await expect
          .soft(loggedIn.sortSelect, 'У списку сортування обрано "Price (high to low)"')
          .toHaveValue(SORT_OPTIONS.priceDesc);
      });
    },
  );
});
```