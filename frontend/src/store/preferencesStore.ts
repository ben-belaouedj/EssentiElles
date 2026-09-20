import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SAVED_TIPS_KEY = 'livrella_saved_tips';
const PREFS_KEY = 'livrella_prefs';
const CHECKLIST_KEY = 'livrella_checklist';

interface PreferencesState {
  savedTips: string[];
  /** Local delivery reminders (offline-friendly) */
  deliveryReminders: boolean;
  promoNotifications: boolean;
  orderUpdates: boolean;
  /** Maternity-bag / routine checklist items marked as done */
  checklist: string[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  toggleTip: (tipId: string) => Promise<boolean>;
  isTipSaved: (tipId: string) => boolean;
  setPreference: (key: 'deliveryReminders' | 'promoNotifications' | 'orderUpdates', value: boolean) => Promise<void>;
  toggleChecklistItem: (itemId: string) => Promise<void>;
}

const DEFAULT_PREFS = {
  deliveryReminders: true,
  promoNotifications: false,
  orderUpdates: true,
};

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  savedTips: [],
  checklist: [],
  hydrated: false,
  ...DEFAULT_PREFS,

  hydrate: async () => {
    try {
      const [tipsRaw, prefsRaw, checklistRaw] = await Promise.all([
        AsyncStorage.getItem(SAVED_TIPS_KEY),
        AsyncStorage.getItem(PREFS_KEY),
        AsyncStorage.getItem(CHECKLIST_KEY),
      ]);
      const prefs = prefsRaw ? JSON.parse(prefsRaw) : {};
      set({
        savedTips: tipsRaw ? JSON.parse(tipsRaw) : [],
        checklist: checklistRaw ? JSON.parse(checklistRaw) : [],
        deliveryReminders: prefs.deliveryReminders ?? DEFAULT_PREFS.deliveryReminders,
        promoNotifications: prefs.promoNotifications ?? DEFAULT_PREFS.promoNotifications,
        orderUpdates: prefs.orderUpdates ?? DEFAULT_PREFS.orderUpdates,
        hydrated: true,
      });
    } catch {
      set({ hydrated: true });
    }
  },

  isTipSaved: (tipId) => get().savedTips.includes(tipId),

  toggleTip: async (tipId) => {
    const saved = get().savedTips;
    const exists = saved.includes(tipId);
    const next = exists ? saved.filter((id) => id !== tipId) : [tipId, ...saved];
    set({ savedTips: next });
    try {
      await AsyncStorage.setItem(SAVED_TIPS_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    return !exists;
  },

  setPreference: async (key, value) => {
    set({ [key]: value } as never);
    const state = get();
    try {
      await AsyncStorage.setItem(
        PREFS_KEY,
        JSON.stringify({
          deliveryReminders: state.deliveryReminders,
          promoNotifications: state.promoNotifications,
          orderUpdates: state.orderUpdates,
        })
      );
    } catch {
      /* ignore */
    }
  },

  toggleChecklistItem: async (itemId) => {
    const current = get().checklist;
    const next = current.includes(itemId)
      ? current.filter((id) => id !== itemId)
      : [...current, itemId];
    set({ checklist: next });
    try {
      await AsyncStorage.setItem(CHECKLIST_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  },
}));
