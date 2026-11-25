import { test as base } from '@playwright/test';
import { expect } from '../support/matchers';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { ProductDetailsPage } from '../pages/ProductDetailsPage';
import { USERS } from '../data/users';
import { PATHS } from '../data/paths';

/** Set by SauceDemo after a successful form login; value = username. */
const SESSION_COOKIE = 'session-username';

interface UiFixtures {
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
  productPage: ProductDetailsPage;
  /**
   * standard_user session via cookie (no login form) + catalog opened. The login form itself is covered by
   * tests/ui/login.spec.ts, every other test only needs to be logged in — so it skips the form and its flakiness.
   */
  loggedIn: InventoryPage;
}

export const test = base.extend<UiFixtures>({
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  inventoryPage: async ({ page }, use) => use(new InventoryPage(page)),
  cartPage: async ({ page }, use) => use(new CartPage(page)),
  checkoutPage: async ({ page }, use) => use(new CheckoutPage(page)),
  productPage: async ({ page }, use) => use(new ProductDetailsPage(page)),

  loggedIn: async ({ context, inventoryPage, page, baseURL }, use) => {
    // SauceDemo keeps the whole session in one cookie; the cart lives in localStorage of a fresh context (empty).
    await context.addCookies([{ name: SESSION_COOKIE, value: USERS.standard, url: baseURL! }]);
    await inventoryPage.goto();
    await expect(page, 'Сесія standard_user через cookie відкриває каталог').toHaveURL(PATHS.inventory);
    await use(inventoryPage);
  },
});

export { expect };
