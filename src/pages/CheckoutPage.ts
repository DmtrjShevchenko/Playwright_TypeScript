import { type Locator, type Page } from '@playwright/test';
import { HeaderComponent } from './HeaderComponent';
import { parsePrice } from '../utils/price';

export interface CustomerInfo {
  firstName: string;
  lastName: string;
  postalCode: string;
}

/** Covers all three checkout steps: information, overview and completion. */
export class CheckoutPage {
  readonly header: HeaderComponent;
  // Step one — customer information
  readonly firstName: Locator;
  readonly lastName: Locator;
  readonly postalCode: Locator;
  readonly continueButton: Locator;
  readonly error: Locator;
  // Step two — overview
  readonly itemNames: Locator;
  readonly itemPrices: Locator;
  readonly subtotalLabel: Locator;
  readonly taxLabel: Locator;
  readonly totalLabel: Locator;
  readonly finishButton: Locator;
  // Complete
  readonly completeHeader: Locator;
  readonly backHomeButton: Locator;

  constructor(readonly page: Page) {
    this.header = new HeaderComponent(page);
    this.firstName = page.getByTestId('firstName');
    this.lastName = page.getByTestId('lastName');
    this.postalCode = page.getByTestId('postalCode');
    this.continueButton = page.getByTestId('continue');
    this.error = page.getByTestId('error');
    this.itemNames = page.getByTestId('inventory-item-name');
    this.itemPrices = page.getByTestId('inventory-item-price');
    this.subtotalLabel = page.getByTestId('subtotal-label');
    this.taxLabel = page.getByTestId('tax-label');
    this.totalLabel = page.getByTestId('total-label');
    this.finishButton = page.getByTestId('finish');
    this.completeHeader = page.getByTestId('complete-header');
    // The button reads "Back Home", but its data-test is 'back-to-products'.
    this.backHomeButton = page.getByTestId('back-to-products');
  }

  /** Opens the overview step directly by URL, bypassing the customer information step. */
  async gotoOverview(): Promise<void> {
    await this.page.goto('/checkout-step-two.html');
  }

  async fillInfo(info: Partial<CustomerInfo>): Promise<void> {
    if (info.firstName !== undefined) await this.firstName.fill(info.firstName);
    if (info.lastName !== undefined) await this.lastName.fill(info.lastName);
    if (info.postalCode !== undefined) await this.postalCode.fill(info.postalCode);
    await this.continueButton.click();
  }

  async getSummary(): Promise<{ itemPrices: number[]; subtotal: number; tax: number; total: number }> {
    return {
      itemPrices: (await this.itemPrices.allInnerTexts()).map(parsePrice),
      subtotal: parsePrice(await this.subtotalLabel.innerText()),
      tax: parsePrice(await this.taxLabel.innerText()),
      total: parsePrice(await this.totalLabel.innerText()),
    };
  }

  async finish(): Promise<void> {
    await this.finishButton.click();
  }

  /** Completion page → "Back Home" returns to the catalog. */
  async backHome(): Promise<void> {
    await this.backHomeButton.click();
  }
}
