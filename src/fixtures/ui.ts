import { test as base } from '@playwright/test';
import { expect } from '../support/matchers';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { ProductDetailsPage } from '../pages/ProductDetailsPage';
import { PASSWORD, USERS } from '../data/users';
import { PATHS } from '../data/paths';

interface UiFixtures {
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
  productPage: ProductDetailsPage;
  /** Logs in as standard_user and returns the inventory page. */
  loggedIn: InventoryPage;
}

export const test = base.extend<UiFixtures>({
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  inventoryPage: async ({ page }, use) => use(new InventoryPage(page)),
  cartPage: async ({ page }, use) => use(new CartPage(page)),
  checkoutPage: async ({ page }, use) => use(new CheckoutPage(page)),
  productPage: async ({ page }, use) => use(new ProductDetailsPage(page)),

  loggedIn: async ({ loginPage, inventoryPage, page }, use) => {
    await loginPage.goto();
    await loginPage.login(USERS.standard, PASSWORD);
    await expect(page).toHaveURL(PATHS.inventory);
    await use(inventoryPage);
  },
});

export { expect };
