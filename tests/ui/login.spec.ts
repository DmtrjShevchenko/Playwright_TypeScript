import { test, expect, meta, ERRORS, PASSWORD, PATHS, USERS } from '@ui';

test.describe('Login', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test('standard_user logs in and lands on the catalog', meta('Critical'), async ({ loginPage, inventoryPage, page }) => {
    await test.step('Ввести standard_user / secret_sauce, натиснути Login', async () => {
      await loginPage.login(USERS.standard, PASSWORD);
    });

    await test.step('Перевірити, що відкрився каталог', async () => {
      await expect(page, 'Після логіну відкривається каталог').toHaveURL(PATHS.inventory);
      await expect(inventoryPage.header.title, 'Заголовок сторінки — Products').toHaveText('Products');
    });
  });

  test('locked_out_user sees locked-out error @negative', meta('Critical'), async ({ loginPage, page }) => {
    await test.step('Ввести locked_out_user / secret_sauce, натиснути Login', async () => {
      await loginPage.login(USERS.lockedOut, PASSWORD);
    });

    await test.step('Перевірити, що доступ заборонено', async () => {
      await expect(loginPage.error, 'Показано помилку про блокування').toHaveText(ERRORS.lockedOut);
      await expect(page, 'Заблокований користувач не потрапляє в каталог').not.toHaveURL(PATHS.inventory);
    });
  });

  test('wrong password is rejected @negative', meta('Critical'), async ({ loginPage, page }) => {
    await test.step('Ввести standard_user / wrong_password, натиснути Login', async () => {
      await loginPage.login(USERS.standard, 'wrong_password');
    });

    await test.step('Перевірити, що доступ заборонено', async () => {
      await expect(loginPage.error, 'Показано помилку про невірні облікові дані').toHaveText(ERRORS.invalidCredentials);
      await expect(page, 'З невірним паролем користувач не потрапляє в каталог').not.toHaveURL(PATHS.inventory);
    });
  });
});
