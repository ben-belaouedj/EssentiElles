/**
 * Bilingual helper — the tab bar and chrome read their labels through `t()`,
 * so the FR/EN switch in the profile tab must flip them instantly.
 */
import T, { getLanguage, hasTranslation, setLanguage, t } from '../strings';

describe('i18n strings', () => {
  afterEach(() => setLanguage('fr'));

  it('translates chrome labels in French and English', () => {
    setLanguage('fr');
    expect(t('home')).toBe('Accueil');
    expect(t('guides')).toBe('Conseils');
    expect(t('subscriptionTab')).toBe('Abonnement');

    setLanguage('en');
    expect(t('home')).toBe('Home');
    expect(t('guides')).toBe('Tips');
    expect(t('subscriptionTab')).toBe('Plan');
  });

  it('tracks the active language', () => {
    setLanguage('en');
    expect(getLanguage()).toBe('en');
    setLanguage('fr');
    expect(getLanguage()).toBe('fr');
  });

  it('interpolates parameters', () => {
    setLanguage('fr');
    expect(t('inDays', { n: 3 })).toContain('3');
  });

  it('falls back to French when an English entry is missing', () => {
    setLanguage('en');
    const key = (Object.keys(T) as Array<keyof typeof T>).find(
      (candidate) => T[candidate].en === undefined
    );
    if (key) {
      expect(t(key)).toBe(T[key].fr);
    }
    expect(hasTranslation('home')).toBe(true);
    expect(hasTranslation('definitely-not-a-key')).toBe(false);
  });

  it('returns the key when unknown', () => {
    expect(t('unknown-key' as never)).toBe('unknown-key');
  });
});
