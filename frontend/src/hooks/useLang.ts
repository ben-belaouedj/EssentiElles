import { useAuthStore } from '../store/authStore';
import { setLanguage, t } from '../constants/strings';

/**
 * Bilingual helper (FR/EN).
 *
 * The language comes from the auth store, so any screen using `useLang()`
 * re-renders as soon as the user switches language in the profile tab.
 */
export function useLang() {
  const language = useAuthStore((s) => s.language);
  setLanguage((language as 'fr' | 'en') ?? 'fr');
  return { t, lang: (language ?? 'fr') as 'fr' | 'en' };
}

export default useLang;
