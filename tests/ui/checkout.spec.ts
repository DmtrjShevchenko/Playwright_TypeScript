import { test, expect, expectQuick, meta, CHECKOUT_INFO, ERRORS, PATHS, PRODUCTS } from '@ui';

const { backpack, onesie } = PRODUCTS;
const IN_CART = 'Залогінений `standard_user`, у кошику Sauce Labs Backpack і Sauce Labs Onesie, відкрито кошик.';

test.describe('Checkout', () => {
  test.beforeEach(async ({ loggedIn }) => {
    await loggedIn.addToCart(backpack, onesie);
    await loggedIn.header.openCart();
  });

  test('completes an order with correct totals', meta('Critical', IN_CART), async ({ cartPage, checkoutPage, page }) => {
    await test.step('Натиснути Checkout', async () => {
      await cartPage.checkout();
      await expect(page, 'Відкривається крок з даними покупця').toHaveURL(PATHS.checkoutInfo);
    });

    await test.step(`Ввести ${CHECKOUT_INFO.firstName} / ${CHECKOUT_INFO.lastName} / ${CHECKOUT_INFO.postalCode}, натиснути Continue`, async () => {
      await checkoutPage.fillInfo(CHECKOUT_INFO);
      await expect(page, 'Відкривається крок огляду замовлення').toHaveURL(PATHS.checkoutOverview);
      await expect(checkoutPage.itemNames, 'У замовленні обидва товари з кошика').toHaveText([backpack.name, onesie.name]);
    });

    await test.step('Перевірити суми замовлення', async () => {
      const { subtotal, tax, total } = await checkoutPage.getSummary();
      expect(subtotal, 'Item total дорівнює сумі цін товарів').toEqualMoney(backpack.price + onesie.price);
      expect(tax, 'Податок нараховано').toBeGreaterThan(0);
      expect(total, 'Total = Item total + Tax').toEqualMoney(subtotal + tax);
    });

    await test.step('Натиснути Finish', async () => {
      await checkoutPage.finish();
      await expect(page, 'Відкривається сторінка підтвердження').toHaveURL(PATHS.checkoutComplete);
      await expect(checkoutPage.completeHeader, 'Показано подяку за замовлення').toHaveText('Thank you for your order!');
      await expect(checkoutPage.header.cartBadge, 'Кошик після замовлення порожній').toBeHidden();
    });
  });

  test('cannot continue without postal code @negative', meta('Medium', IN_CART), async ({ cartPage, checkoutPage, page }) => {
    await test.step('Натиснути Checkout', async () => {
      await cartPage.checkout();
    });

    await test.step(`Ввести ${CHECKOUT_INFO.firstName} / ${CHECKOUT_INFO.lastName}, Postal Code лишити порожнім, натиснути Continue`, async () => {
      await checkoutPage.fillInfo({ firstName: CHECKOUT_INFO.firstName, lastName: CHECKOUT_INFO.lastName });
    });

    await test.step('Перевірити, що форма не пропускає без індексу', async () => {
      await expect(checkoutPage.error, "Показано помилку про обов'язковий Postal Code").toHaveText(ERRORS.postalCodeRequired);
      await expect(page, 'Користувач лишається на кроці введення даних').toHaveURL(PATHS.checkoutInfo);
    });
  });

  test('whitespace-only customer info is rejected @negative', meta('Medium', IN_CART), async ({ cartPage, checkoutPage, page }) => {
    await test.step('Натиснути Checkout', async () => {
      await cartPage.checkout();
    });

    await test.step('Ввести в First Name, Last Name і Postal Code по три пробіли, натиснути Continue', async () => {
      await checkoutPage.fillInfo({ firstName: '   ', lastName: '   ', postalCode: '   ' });
    });

    await test.step('Перевірити, що форма не пропускає порожні дані', async () => {
      await expectQuick(page, 'Користувач лишається на кроці введення даних').toHaveURL(PATHS.checkoutInfo);
      await expect(checkoutPage.error, 'Показано помилку валідації').toHaveText(ERRORS.firstNameRequired);
    });
  });
});

test.describe('Checkout step order', () => {
  test(
    'overview step cannot be opened by URL without customer info @negative',
    meta('Major', 'Залогінений `standard_user`, у кошику Sauce Labs Backpack, дані покупця не вводились.'),
    async ({ loggedIn, checkoutPage, page }) => {
      await test.step(`Додати в кошик ${backpack.name}`, async () => {
        await loggedIn.addToCart(backpack);
      });

      await test.step('Відкрити напряму /checkout-step-two.html, минаючи крок з даними покупця', async () => {
        await checkoutPage.gotoOverview();
      });

      await test.step('Перевірити, що крок з даними покупця не пропущено', async () => {
        await expectQuick(page, 'Без даних покупця користувача повертає на /checkout-step-one.html').toHaveURL(PATHS.checkoutInfo);
      });
    },
  );
});

test.describe('Checkout with an empty cart', () => {
  test(
    'order cannot be placed with an empty cart @negative',
    meta('Major', 'Залогінений `standard_user`, кошик порожній.'),
    async ({ loggedIn, cartPage, page }) => {
      await test.step('Відкрити кошик', async () => {
        await loggedIn.header.openCart();
        await expect(cartPage.items).toHaveCount(0);
      });

      await test.step('Натиснути Checkout', async () => {
        await cartPage.checkout();
      });

      await test.step('Перевірити, що оформлення не почалося', async () => {
        await expectQuick(page, 'Оформлення з порожнім кошиком неможливе: користувач лишається в кошику').toHaveURL(PATHS.cart);
      });
    },
  );
});
