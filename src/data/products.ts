export interface Product {
  name: string;
  price: number;
}

export const PRODUCTS = {
  backpack: { name: 'Sauce Labs Backpack', price: 29.99 },
  bikeLight: { name: 'Sauce Labs Bike Light', price: 9.99 },
  boltTShirt: { name: 'Sauce Labs Bolt T-Shirt', price: 15.99 },
  fleeceJacket: { name: 'Sauce Labs Fleece Jacket', price: 49.99 },
  onesie: { name: 'Sauce Labs Onesie', price: 7.99 },
  redTShirt: { name: 'Test.allTheThings() T-Shirt (Red)', price: 15.99 },
} as const satisfies Record<string, Product>;

export const ALL_PRODUCTS: Product[] = Object.values(PRODUCTS);

/** Page Objects accept a product object (`PRODUCTS.backpack`) or its name. */
export type ProductRef = Product | string;
export const nameOf = (product: ProductRef): string => (typeof product === 'string' ? product : product.name);

export const CHECKOUT_INFO = {
  firstName: 'Test',
  lastName: 'User',
  postalCode: '01001',
} as const;
