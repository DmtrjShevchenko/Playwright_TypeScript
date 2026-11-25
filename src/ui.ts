/**
 * Everything a UI spec needs, in one import:
 *
 *   import { test, expect, meta, PRODUCTS, PATHS } from '@ui';
 */
export { test, expect } from './fixtures/ui';
export { expectQuick } from './support/matchers';
export { meta, type Severity } from './support/meta';
export { PRODUCTS, ALL_PRODUCTS, CHECKOUT_INFO, type Product } from './data/products';
export { USERS, PASSWORD } from './data/users';
export { ERRORS } from './data/messages';
export { PATHS } from './data/paths';
export { SORT_OPTIONS } from './pages/InventoryPage';
export { toCents, parsePrice } from './utils/price';
