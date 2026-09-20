import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product } from '../models/types';

const FAVORITES_KEY = 'livrella_favorites';
const RECENT_KEY = 'livrella_recently_viewed';

interface FavoritesState {
  ids: string[];
  products: Product[];
  hydrated: boolean;
  recentlyViewed: string[];
  hydrate: () => Promise<void>;
  isFavorite: (productId: string) => boolean;
  toggle: (product: Product) => Promise<boolean>;
  remove: (productId: string) => Promise<void>;
  trackView: (productId: string) => Promise<void>;
}

async function persistFavorites(ids: string[], products: Product[]) {
  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify({ ids, products }));
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  ids: [],
  products: [],
  hydrated: false,
  recentlyViewed: [],

  hydrate: async () => {
    try {
      const [favRaw, recentRaw] = await Promise.all([
        AsyncStorage.getItem(FAVORITES_KEY),
        AsyncStorage.getItem(RECENT_KEY),
      ]);
      const parsed = favRaw ? JSON.parse(favRaw) : null;
      set({
        ids: parsed?.ids ?? [],
        products: parsed?.products ?? [],
        recentlyViewed: recentRaw ? JSON.parse(recentRaw) : [],
        hydrated: true,
      });
    } catch {
      set({ hydrated: true });
    }
  },

  isFavorite: (productId) => get().ids.includes(productId),

  toggle: async (product) => {
    const { ids, products } = get();
    const exists = ids.includes(product.id);
    const nextIds = exists ? ids.filter((id) => id !== product.id) : [product.id, ...ids];
    const nextProducts = exists
      ? products.filter((p) => p.id !== product.id)
      : [product, ...products];

    set({ ids: nextIds, products: nextProducts });
    await persistFavorites(nextIds, nextProducts);
    return !exists;
  },

  remove: async (productId) => {
    const nextIds = get().ids.filter((id) => id !== productId);
    const nextProducts = get().products.filter((p) => p.id !== productId);
    set({ ids: nextIds, products: nextProducts });
    await persistFavorites(nextIds, nextProducts);
  },

  trackView: async (productId) => {
    const next = [productId, ...get().recentlyViewed.filter((id) => id !== productId)].slice(0, 12);
    set({ recentlyViewed: next });
    try {
      await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
      /* offline-first: ignore persistence errors */
    }
  },
}));
