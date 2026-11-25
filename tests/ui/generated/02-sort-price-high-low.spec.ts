import { test, expect, meta, ALL_PRODUCTS, PRODUCTS, SORT_OPTIONS } from '@ui';

test.describe('Inventory sorting', () => {
  test(
    'sorting by price high to low puts the most expensive item first and prices descend',
    meta('Medium', 'Залогінений `standard_user`, відкрито каталог товарів.'),
    async ({ loggedIn }) => {
      const { fleeceJacket, onesie } = PRODUCTS;

      await test.step('У списку сортування обрати "Price (high to low)"', async () => {
        await loggedIn.sortBy(SORT_OPTIONS.priceDesc);
      });

      await test.step('Перевірити порядок товарів і обране сортування', async () => {
        await expect(loggedIn.items, `У каталозі ${ALL_PRODUCTS.length} товарів`).toHaveCount(ALL_PRODUCTS.length);

        await expect.soft(loggedIn.itemNames.first(), `Першим іде найдорожчий товар — ${fleeceJacket.name}`).toHaveText(fleeceJacket.name);
        await expect.soft(loggedIn.itemNames.last(), `Останнім іде найдешевший товар — ${onesie.name}`).toHaveText(onesie.name);

        const prices = await loggedIn.getPrices();
        expect.soft(prices[0], `Перша ціна — $${fleeceJacket.price}`).toEqualMoney(fleeceJacket.price);
        expect.soft(prices.at(-1)!, `Остання ціна — $${onesie.price}`).toEqualMoney(onesie.price);
        expect.soft(prices, 'Ціни всіх товарів ідуть за спаданням').toEqual([...prices].sort((a, b) => b - a));

        await expect.soft(loggedIn.sortSelect, 'У списку сортування обрано "Price (high to low)"').toHaveValue(SORT_OPTIONS.priceDesc);
      });
    },
  );
});
