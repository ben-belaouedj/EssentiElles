import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../models/types';

const TOKEN_KEY = 'livrella_token';
const USER_KEY = 'livrella_user';
const LANG_KEY = 'livrella_lang';

interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  language: 'fr' | 'en';
  setAuth: (token: string, user: User) => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
  setLanguage: (lang: 'fr' | 'en') => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  isLoading: true,
  isAuthenticated: false,
  language: 'fr',

  setAuth: async (token, user) => {
    await AsyncStorage.setItem(TOKEN_KEY, token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    set({ token, user, isAuthenticated: true, isLoading: false });
  },

  updateUser: async (user) => {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    set({ user });
  },

  logout: async () => {
    try {
      await AsyncStorage.removeMany([TOKEN_KEY, USER_KEY]);
    } catch {
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(USER_KEY);
    }
    set({ token: null, user: null, isAuthenticated: false });
  },

  initialize: async () => {
    try {
      const stored = await AsyncStorage.getMany([TOKEN_KEY, USER_KEY, LANG_KEY]);
      const savedToken = stored[TOKEN_KEY];
      const savedUser = stored[USER_KEY];
      const savedLang = (stored[LANG_KEY] as 'fr' | 'en' | null) ?? null;
      if (savedToken && savedUser) {
        set({
          token: savedToken,
          user: JSON.parse(savedUser),
          isAuthenticated: true,
          isLoading: false,
          language: savedLang || 'fr',
        });
      } else {
        set({ isLoading: false, language: savedLang || 'fr' });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  setLanguage: async (lang) => {
    await AsyncStorage.setItem(LANG_KEY, lang);
    set({ language: lang });
  },
}));
