import { OrderItem, PaymentResult } from '../models/types';
import { getPaymentMode } from '../constants/payment';
import { orderService } from './api';

export interface CheckoutCartPayload {
  items: OrderItem[];
  addressId: string;
  notes?: string;
}

export const STRIPE_NOT_CONFIGURED_MESSAGE =
  "Le paiement Stripe n'est pas encore activé. Réessayez en mode démo ou contactez le support.";

export async function checkoutCart(payload: CheckoutCartPayload): Promise<PaymentResult> {
  const paymentMode = getPaymentMode();

  if (paymentMode === 'stripe') {
    // Full Stripe checkout requires @stripe/stripe-react-native + a live key.
    // The backend server-side payment intent endpoint is ready
    // (POST /api/payments/create-intent) — wire the SDK when going live.
    throw new Error(STRIPE_NOT_CONFIGURED_MESSAGE);
  }

  // The server recomputes prices from the catalog, so we only send
  // product ids and quantities — never client-side prices.
  const response = await orderService.create({
    items: payload.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    })),
    addressId: payload.addressId,
    notes: payload.notes,
  });

  return {
    paymentMode,
    order: response.data,
  };
}
