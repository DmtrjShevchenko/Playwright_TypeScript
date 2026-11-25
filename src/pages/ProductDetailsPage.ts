import { type Locator, type Page } from '@playwright/test';
import { HeaderComponent } from './HeaderComponent';
import { parsePrice } from '../utils/price';

/** Product details page: /inventory-item.html?id=<n>. */
export class ProductDetailsPage {
  readonly header: HeaderComponent;
  readonly name: Locator;
  readonly description: Locator;
  readonly price: Locator;
  readonly addToCartButton: Locator;
  readonly removeButton: Locator;
  readonly backToProductsButton: Locator;

  constructor(readonly page: Page) {
    this.header = new HeaderComponent(page);
    // Same data-test values as on catalog cards; unique once the catalog DOM is gone (see waitForLoaded).
    this.name = page.getByTestId('inventory-item-name');
    this.description = page.getByTestId('inventory-item-desc');
    this.price = page.getByTestId('inventory-item-price');
    this.addToCartButton = page.getByTestId('add-to-cart');
    this.removeButton = page.getByTestId('remove');
    this.backToProductsButton = page.getByTestId('back-to-products');
  }

  /**
   * SauceDemo is an SPA: the URL changes before the catalog DOM is replaced. Wait for an element that exists only
   * on the details page, otherwise `name`/`price` still resolve to all 6 catalog cards (strict mode violation).
   */
  async waitForLoaded(): Promise<void> {
    await this.backToProductsButton.waitFor();
  }

  async getPrice(): Promise<number> {
    return parsePrice(await this.price.innerText());
  }

  async addToCart(): Promise<void> {
    await this.addToCartButton.click();
  }

  async removeFromCart(): Promise<void> {
    await this.removeButton.click();
  }

  async backToProducts(): Promise<void> {
    await this.backToProductsButton.click();
  }
}
