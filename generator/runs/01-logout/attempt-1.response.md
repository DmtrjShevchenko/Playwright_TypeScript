```ts
import { test, expect } from '../../../src/fixtures/ui';

// TODO(data): move to ERRORS in src/data/users.ts as ERRORS.inventoryRequiresLogin
const INVENTORY_REQUIRES_LOGIN = "Epic sadface: You can only access '/inventory.html' when you are logged in.";

test.describe('Logout', () => {
  test(
    'logout returns to an empty login form and blocks direct access to inventory',
    {
      annotation: [
        { type: 'severity', description: 'Major' },
        { type: 'precondition', description: 'Залогінений `standard_user`, відкрито каталог товарів.' },
      ],
    },
    async ({ loggedIn, loginPage, page }) => {
      await test.step('Відкрити бургер-меню', async () => {
        // TODO(page-object): add HeaderComponent.openMenu() / menuButton locator
        await page.getByRole('button', { name: 'Open Menu' }).click();
        // TODO(page-object): add HeaderComponent.logoutLink locator
        await expect(page.getByTestId('logout-sidebar-link'), 'У меню є пункт Logout').toBeVisible();
      });

      await test.step('Натиснути Logout', async () => {
        // TODO(page-object): add HeaderComponent.logout()
        await page.getByTestId('logout-sidebar-link').click();

        await expect(page, 'Після виходу відкривається сторінка логіну').toHaveURL(/\/$/);
        await expect(loginPage.loginButton, 'На сторінці логіну видно кнопку Login').toBeVisible();
        await expect.soft(loginPage.username, 'Поле Username порожнє').toHaveValue('');
        await expect.soft(loginPage.password, 'Поле Password порожнє').toHaveValue('');
      });

      await test.step('Спробувати відкрити /inventory.html напряму', async () => {
        await loggedIn.goto();

        await expect(page, 'Каталог не відкривається — користувача повертає на сторінку логіну').not.toHaveURL(
          /\/inventory\.html$/,
        );
        await expect(loggedIn.items, 'Товари каталогу не показуються').toHaveCount(0);
        await expect(
          loginPage.error,
          `Показується помилка "${INVENTORY_REQUIRES_LOGIN}"`,
        ).toHaveText(INVENTORY_REQUIRES_LOGIN);
      });
    },
  );
});
```