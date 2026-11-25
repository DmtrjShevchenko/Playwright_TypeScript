// Public demo credentials published on https://www.saucedemo.com login page.
export const PASSWORD = process.env.SAUCE_PASSWORD ?? 'secret_sauce';

export const USERS = {
  standard: 'standard_user',
  lockedOut: 'locked_out_user',
} as const;

export const ERRORS = {
  lockedOut: 'Epic sadface: Sorry, this user has been locked out.',
  invalidCredentials: 'Epic sadface: Username and password do not match any user in this service',
  postalCodeRequired: 'Error: Postal Code is required',
} as const;
