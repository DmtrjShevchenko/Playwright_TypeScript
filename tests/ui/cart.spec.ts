import { test, expect } from '../../src/fixtures/ui';
import { PRODUCTS } from '../../src/data/products';

test.describe('Cart', () => {
  test('adds and removes items, badge and cart contents stay in sync', async ({ loggedIn, cartPage, page }) => {
    const { backpack, bikeLight } = PRODUCTS;

    await loggedIn.addToCart(backpack.name);
    await loggedIn.addToCart(bikeLight.name);
    await expect(loggedIn.header.cartBadge).toHaveText('2');

    await loggedIn.header.openCart();
    await expect(page).toHaveURL(/\/cart\.html$/);
    await expect(cartPage.itemNames).toHaveText([backpack.name, bikeLight.name]);

    await cartPage.removeItem(backpack.name);
    await expect(cartPage.itemNames).toHaveText([bikeLight.name]);
    await expect(cartPage.header.cartBadge).toHaveText('1');

    await cartPage.removeItem(bikeLight.name);
    await expect(cartPage.items).toHaveCount(0);
    await expect(cartPage.header.cartBadge).toBeHidden();
  });
});
