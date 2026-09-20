/**
 * Offline layer contract: local cache + delivery reminders.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearCache, readCache, writeCache } from '../cache';
import { buildReminders, daysUntil, pendingReminders } from '../reminders';
import type { Subscription } from '../../models/types';

function makeSub(overrides: Partial<Subscription> = {}): Subscription {
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 2);
  return {
    id: 'sub-1',
    userId: 'user-1',
    productId: 'prod-1',
    status: 'active',
    quantity: 1,
    frequency: 'monthly',
    unitPrice: 9.9,
    totalPrice: 9.9,
    nextDeliveryDate: dueDate.toISOString().slice(0, 10),
    startDate: '2026-01-01',
    product: { id: 'prod-1', name: 'Couches Taille 2' },
    ...(overrides as object),
  } as Subscription;
}

describe('cache', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('round-trips data with a timestamp', async () => {
    await writeCache('products', [{ id: 'p1' }]);
    const entry = await readCache<Array<{ id: string }>>('products');
    expect(entry?.data).toEqual([{ id: 'p1' }]);
    expect(typeof entry?.savedAt).toBe('number');
  });

  it('returns null when nothing is cached', async () => {
    await expect(readCache('missing')).resolves.toBeNull();
  });

  it('returns null when the payload is corrupted', async () => {
    await AsyncStorage.setItem('livrella_cache:broken', 'not-json{');
    await expect(readCache('broken')).resolves.toBeNull();
  });

  it('clears only namespaced keys', async () => {
    await writeCache('a', 1);
    await writeCache('b', 2);
    await AsyncStorage.setItem('other_key', 'keep-me');
    await clearCache();
    await expect(readCache('a')).resolves.toBeNull();
    await expect(readCache('b')).resolves.toBeNull();
    await expect(AsyncStorage.getItem('other_key')).resolves.toBe('keep-me');
  });
});

describe('delivery reminders', () => {
  it('computes the number of days until a date', () => {
    const today = new Date();
    const iso = (d: Date) => d.toISOString().slice(0, 10);
    expect(daysUntil(iso(today))).toBe(0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(daysUntil(iso(tomorrow))).toBe(1);

    expect(daysUntil(undefined)).toBeNull();
    expect(daysUntil('not-a-date')).toBeNull();
  });

  it('builds sorted reminders for active subscriptions only', () => {
    const reminders = buildReminders([
      makeSub({ id: 'sub-paused', status: 'paused' }),
      makeSub({ id: 'sub-1' }),
    ]);

    expect(reminders).toHaveLength(1);
    expect(reminders[0].subscriptionId).toBe('sub-1');
    expect(reminders[0].urgency).toBe('soon');
    expect(reminders[0].title).toContain('Livraison');
    expect(reminders[0].body).toContain('Couches Taille 2');
  });

  it('flags today deliveries', () => {
    const today = new Date().toISOString().slice(0, 10);
    const [reminder] = buildReminders([makeSub({ nextDeliveryDate: today })]);
    expect(reminder.urgency).toBe('today');
    expect(reminder.daysUntil).toBe(0);
  });

  it('filters reminders by horizon', () => {
    const far = new Date();
    far.setDate(far.getDate() + 20);
    const reminders = pendingReminders([
      makeSub({ id: 'near' }),
      makeSub({ id: 'far', nextDeliveryDate: far.toISOString().slice(0, 10) }),
    ]);
    expect(reminders.map((r) => r.subscriptionId)).toEqual(['near']);
  });
});
