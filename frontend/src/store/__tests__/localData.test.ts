/**
 * Offline-first local data: favourites, saved tips, checklist, notifications
 * preferences and delivery reminders — the persistence layer required by the
 * product brief (works without a connection).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFavoritesStore } from '../favoritesStore';
import { usePreferencesStore } from '../preferencesStore';
import { GUIDES, getGuide } from '../../constants/guides';
import { buildReminders, daysUntil, pendingReminders } from '../../services/reminders';
import { clearCache, readCache, writeCache } from '../../services/cache';
import type { Subscription } from '../../models/types';

const product = { id: 'prod-1', name: 'Couches Taille 2' } as never;

describe('favoritesStore', () => {
  beforeEach(() => {
    useFavoritesStore.setState({ ids: [], products: [], recentlyViewed: [], hydrated: false });
  });

  it('toggles a product in and out of favourites', async () => {
    await useFavoritesStore.getState().toggle(product);
    expect(useFavoritesStore.getState().ids).toEqual(['prod-1']);
    expect(useFavoritesStore.getState().isFavorite('prod-1')).toBe(true);

    await useFavoritesStore.getState().toggle(product);
    expect(useFavoritesStore.getState().ids).toEqual([]);
    expect(useFavoritesStore.getState().isFavorite('prod-1')).toBe(false);
  });

  it('persists favourites locally so they survive a cold start', async () => {
    await useFavoritesStore.getState().toggle(product);
    const raw = await AsyncStorage.getItem('livrella_favorites');
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw as string).ids).toEqual(['prod-1']);
  });

  it('keeps a de-duplicated recently viewed trail', async () => {
    const { trackView } = useFavoritesStore.getState();
    await trackView('prod-1');
    await trackView('prod-2');
    await trackView('prod-1');

    expect(useFavoritesStore.getState().recentlyViewed.slice(0, 2)).toEqual(['prod-1', 'prod-2']);
  });

  it('removes a single favourite', async () => {
    await useFavoritesStore.getState().toggle(product);
    await useFavoritesStore.getState().remove('prod-1');
    expect(useFavoritesStore.getState().ids).toEqual([]);
  });
});

describe('preferencesStore', () => {
  beforeEach(() => {
    usePreferencesStore.setState({
      savedTips: [],
      checklist: [],
      deliveryReminders: true,
      promoNotifications: false,
      orderUpdates: true,
      hydrated: false,
    });
  });

  it('saves and unsaves a tip', async () => {
    const first = await usePreferencesStore.getState().toggleTip('postpartum-routine');
    expect(first).toBe(true);
    expect(usePreferencesStore.getState().isTipSaved('postpartum-routine')).toBe(true);

    const second = await usePreferencesStore.getState().toggleTip('postpartum-routine');
    expect(second).toBe(false);
    expect(usePreferencesStore.getState().isTipSaved('postpartum-routine')).toBe(false);
  });

  it('stores notification switches', async () => {
    await usePreferencesStore.getState().setPreference('promoNotifications', true);
    expect(usePreferencesStore.getState().promoNotifications).toBe(true);

    const raw = await AsyncStorage.getItem('livrella_prefs');
    expect(JSON.parse(raw as string)).toMatchObject({ promoNotifications: true });
  });

  it('checks and unchecks checklist items', async () => {
    const { toggleChecklistItem } = usePreferencesStore.getState();
    await toggleChecklistItem('maternity-bag-layette');
    expect(usePreferencesStore.getState().checklist).toContain('maternity-bag-layette');

    await toggleChecklistItem('maternity-bag-layette');
    expect(usePreferencesStore.getState().checklist).not.toContain('maternity-bag-layette');
  });
});

describe('guides content', () => {
  it('ships the five editorial guides required by the brief', () => {
    expect(GUIDES).toHaveLength(5);
    const ids = GUIDES.map((g) => g.id);
    expect(ids).toEqual(
      expect.arrayContaining(['postpartum-routine', 'maternity-bag', 'intimate-care', 'baby-care', 'wellness-ritual'])
    );
    GUIDES.forEach((guide) => {
      expect(guide.title.length).toBeGreaterThan(3);
      expect(guide.sections.length).toBeGreaterThan(0);
      expect(guide.readingTime).toBeGreaterThan(0);
    });
  });

  it('resolves a guide by id', () => {
    expect(getGuide('maternity-bag')?.title).toBeTruthy();
    expect(getGuide('unknown')).toBeUndefined();
  });
});

describe('delivery reminders', () => {
  const sub = (overrides: Partial<Subscription> = {}) =>
    ({
      id: 'sub-1',
      status: 'active',
      nextDeliveryDate: new Date(Date.now() + 86_400_000).toISOString().slice(0, 10),
      product: { id: 'prod-1', name: 'Couches Taille 2' },
      ...overrides,
    }) as unknown as Subscription;

  it('computes days until a date', () => {
    expect(daysUntil(new Date().toISOString().slice(0, 10))).toBe(0);
    expect(daysUntil(new Date(Date.now() + 3 * 86_400_000).toISOString().slice(0, 10))).toBe(3);
    expect(daysUntil(undefined)).toBeNull();
    expect(daysUntil('nope')).toBeNull();
  });

  it('only reminds for active subscriptions and sorts by urgency', () => {
    const reminders = buildReminders([
      sub({ id: 'sub-soon', nextDeliveryDate: new Date(Date.now() + 4 * 86_400_000).toISOString().slice(0, 10) }),
      sub({ id: 'sub-today', nextDeliveryDate: new Date().toISOString().slice(0, 10) }),
      sub({ id: 'sub-paused', status: 'paused' }),
    ]);

    expect(reminders).toHaveLength(2);
    expect(reminders[0].subscriptionId).toBe('sub-today');
    expect(reminders[0].urgency).toBe('today');
    expect(reminders[1].urgency).toBe('upcoming');
  });

  it('filters reminders within a horizon', () => {
    const reminders = pendingReminders([sub()], 3);
    expect(reminders).toHaveLength(1);
  });
});

describe('offline cache', () => {
  it('round-trips data with a timestamp and clears it', async () => {
    await writeCache('products', [{ id: 'p1' }]);
    const entry = await readCache<Array<{ id: string }>>('products');
    expect(entry?.data).toEqual([{ id: 'p1' }]);
    expect(typeof entry?.savedAt).toBe('number');

    await clearCache(['products']);
    expect(await readCache('products')).toBeNull();
  });

  it('ignores corrupted payloads', async () => {
    await AsyncStorage.setItem('livrella_cache:broken', '{not-json');
    expect(await readCache('broken')).toBeNull();
  });
});
