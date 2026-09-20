import { create } from 'zustand';
import { CartItem, Product } from '../models/types';

interface CartState {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  total: () => number;
  savingsIfSubscribed: () => number;
  itemCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  addItem: (product, quantity = 1) => {
    const items = get().items;
    const existing = items.find(i => i.product.id === product.id);
    if (existing) {
      set({
        items: items.map(i =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + quantity }
            : i
        ),
      });
    } else {
      set({ items: [...items, { product, quantity }] });
    }
  },

  removeItem: (productId) => {
    set({ items: get().items.filter(i => i.product.id !== productId) });
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    set({
      items: get().items.map(i =>
        i.product.id === productId ? { ...i, quantity } : i
      ),
    });
  },

  clearCart: () => set({ items: [] }),

  // One-time purchases are billed at the regular catalog price —
  // the subscription price is reserved for subscribers (that's the discount).
  total: () => {
    return get().items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  },

  savingsIfSubscribed: () => {
    return get().items.reduce(
      (sum, item) => sum + (item.product.price - item.product.subscriptionPrice) * item.quantity,
      0,
    );
  },

  itemCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },
}));
