import { checkoutCart, STRIPE_NOT_CONFIGURED_MESSAGE, type CheckoutCartPayload } from '../paymentService';
import { orderService } from '../api';
import { resolvePaymentMode } from '../../constants/payment';

jest.mock('../api', () => ({
  orderService: {
    create: jest.fn(),
  },
}));

const mockedCreate = orderService.create as jest.Mock;

describe('paymentService', () => {
  const originalPaymentMode = process.env.EXPO_PUBLIC_PAYMENT_MODE;

  const checkoutPayload: CheckoutCartPayload = {
    addressId: 'addr_1',
    items: [
      {
        productId: 'prod_1',
        productName: 'Coton bio',
        quantity: 2,
        unitPrice: 5,
        totalPrice: 10,
      },
    ],
  };

  beforeEach(() => {
    jest.resetAllMocks();
    delete process.env.EXPO_PUBLIC_PAYMENT_MODE;
  });

  afterEach(() => {
    if (originalPaymentMode === undefined) {
      delete process.env.EXPO_PUBLIC_PAYMENT_MODE;
    } else {
      process.env.EXPO_PUBLIC_PAYMENT_MODE = originalPaymentMode;
    }
  });

  it('defaults to demo when the payment mode env var is missing', () => {
    expect(resolvePaymentMode(undefined)).toBe('demo');
  });

  it('creates an order in demo mode', async () => {
    process.env.EXPO_PUBLIC_PAYMENT_MODE = 'demo';
    mockedCreate.mockResolvedValue({ data: { id: 'order_1', paymentStatus: 'paid' } });

    const result = await checkoutCart(checkoutPayload);

    // Prices are computed server-side: only ids & quantities are sent.
    expect(orderService.create).toHaveBeenCalledWith({
      items: [{ productId: 'prod_1', quantity: 2 }],
      addressId: 'addr_1',
      notes: undefined,
    });
    expect(result).toEqual({
      paymentMode: 'demo',
      order: { id: 'order_1', paymentStatus: 'paid' },
    });
  });

  it('throws a clear error when stripe mode is selected without a provider', async () => {
    process.env.EXPO_PUBLIC_PAYMENT_MODE = 'stripe';

    await expect(checkoutCart(checkoutPayload)).rejects.toThrow(STRIPE_NOT_CONFIGURED_MESSAGE);
    expect(orderService.create).not.toHaveBeenCalled();
  });
});
