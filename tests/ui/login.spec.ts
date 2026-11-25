import { test, expect } from '../../src/fixtures/ui';
import { ERRORS, PASSWORD, USERS } from '../../src/data/users';

test.describe('Login', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test('standard_user logs in and lands on the catalog', async ({ loginPage, inventoryPage, page }) => {
    await loginPage.login(USERS.standard, PASSWORD);

    await expect(page).toHaveURL(/\/inventory\.html$/);
    await expect(inventoryPage.header.title).toHaveText('Products');
  });

  test('locked_out_user sees "locked out" error @negative', async ({ loginPage, page }) => {
    await loginPage.login(USERS.lockedOut, PASSWORD);

    await expect(loginPage.error).toHaveText(ERRORS.lockedOut);
    await expect(page).not.toHaveURL(/inventory/);
  });

  test('wrong password is rejected @negative', async ({ loginPage, page }) => {
    await loginPage.login(USERS.standard, 'wrong_password');

    await expect(loginPage.error).toHaveText(ERRORS.invalidCredentials);
    await expect(page).not.toHaveURL(/inventory/);
  });
});
