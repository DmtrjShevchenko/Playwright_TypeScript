import { type Locator, type Page } from '@playwright/test';

/** Shared header present on every page after login. */
export class HeaderComponent {
  readonly title: Locator;
  readonly cartLink: Locator;
  readonly cartBadge: Locator;

  constructor(readonly page: Page) {
    this.title = page.getByTestId('title');
    this.cartLink = page.getByTestId('shopping-cart-link');
    this.cartBadge = page.getByTestId('shopping-cart-badge');
  }

  async openCart(): Promise<void> {
    await this.cartLink.click();
  }

  async openMenu(): Promise<void> {
    await this.page.getByRole('button', { name: 'Open Menu' }).click();
  }

  get logoutLink(): Locator {
    return this.page.getByTestId('logout-sidebar-link');
  }

  /** Burger menu → "Reset App State": clears the cart and app state. */
  async resetAppState(): Promise<void> {
    await this.openMenu();
    await this.page.getByTestId('reset-sidebar-link').click();
  }

  /** Burger menu → "Logout". */
  async logout(): Promise<void> {
    await this.openMenu();
    await this.logoutLink.click();
  }
}
