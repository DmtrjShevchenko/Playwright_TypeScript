/** SauceDemo pages as URL patterns: `await expect(page).toHaveURL(PATHS.cart)`. */
export const PATHS = {
  /** Site root, whatever the host (baseURL can be overridden with UI_BASE_URL). */
  login: /^https?:\/\/[^/]+\/$/,
  inventory: /\/inventory\.html$/,
  productDetails: /\/inventory-item\.html\?id=\d+$/,
  cart: /\/cart\.html$/,
  checkoutInfo: /\/checkout-step-one\.html$/,
  checkoutOverview: /\/checkout-step-two\.html$/,
  checkoutComplete: /\/checkout-complete\.html$/,
} as const;
