import { type Locator, type Page } from '@playwright/test';
import { HeaderComponent } from './HeaderComponent';
import { parsePrice } from '../utils/price';
import { nameOf, type ProductRef } from '../data/products';

export const SORT_OPTIONS = {
  nameAsc: 'az',
  nameDesc: 'za',
  priceAsc: 'lohi',
  priceDesc: 'hilo',
} as const;

export type SortOption = (typeof SORT_OPTIONS)[keyof typeof SORT_OPTIONS];

export class InventoryPage {
  readonly header: HeaderComponent;
  readonly items: Locator;
  readonly itemNames: Locator;
  readonly itemPrices: Locator;
  readonly sortSelect: Locator;

  constructor(readonly page: Page) {
    this.header = new HeaderComponent(page);
    this.items = page.getByTestId('inventory-item');
    this.itemNames = page.getByTestId('inventory-item-name');
    this.itemPrices = page.getByTestId('inventory-item-price');
    this.sortSelect = page.getByTestId('product-sort-container');
  }

  async goto(): Promise<void> {
    await this.page.goto('/inventory.html');
  }

  item(product: ProductRef): Locator {
    const name = this.page.getByTestId('inventory-item-name').getByText(nameOf(product), { exact: true });
    return this.items.filter({ has: name });
  }

  /** Adds one or more products: `addToCart(PRODUCTS.backpack, PRODUCTS.onesie)`. */
  async addToCart(...products: ProductRef[]): Promise<void> {
    for (const product of products) await this.item(product).getByRole('button', { name: 'Add to cart' }).click();
  }

  /**
   * The cart button of a card, whatever it currently says ("Add to cart" or "Remove").
   * Assert its text, so a failure reports what the button actually shows.
   */
  cartButton(product: ProductRef): Locator {
    return this.item(product).getByRole('button', { name: /^(Add to cart|Remove)$/ });
  }

  /** Opens the product details page by clicking the product name in its card. */
  async openItem(product: ProductRef): Promise<void> {
    await this.item(product).getByTestId('inventory-item-name').click();
  }

  async removeFromCart(...products: ProductRef[]): Promise<void> {
    for (const product of products) await this.item(product).getByRole('button', { name: 'Remove' }).click();
  }

  async sortBy(option: SortOption): Promise<void> {
    await this.sortSelect.selectOption(option);
  }

  async getNames(): Promise<string[]> {
    return this.itemNames.allInnerTexts();
  }

  async getPrices(): Promise<number[]> {
    return (await this.itemPrices.allInnerTexts()).map(parsePrice);
  }
}
