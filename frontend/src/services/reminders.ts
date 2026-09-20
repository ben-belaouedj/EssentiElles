/**
 * Local delivery reminders (offline scheduling of in-app alerts).
 *
 * Reminders are derived from the user's subscriptions and stored locally, so
 * the app can surface "livraison demain" alerts even without a connection.
 * The engine is intentionally side-effect free: callers get a list of
 * reminders to display (Home banner, Notifications screen, Profile settings).
 */
import { Subscription } from '../models/types';

export interface Reminder {
  id: string;
  subscriptionId: string;
  productName: string;
  /** Date ISO of the upcoming delivery */
  dueDate: string;
  daysUntil: number;
  title: string;
  body: string;
  urgency: 'today' | 'soon' | 'upcoming';
}

export function daysUntil(dateIso?: string): number | null {
  if (!dateIso) return null;
  const target = new Date(dateIso);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const end = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
}

export function buildReminders(subscriptions: Subscription[]): Reminder[] {
  return subscriptions
    .filter((sub) => sub.status === 'active' && sub.nextDeliveryDate)
    .map((sub) => {
      const days = daysUntil(sub.nextDeliveryDate) ?? 0;
      const productName = sub.product?.name ?? 'Votre abonnement';
      return {
        id: `reminder-${sub.id}`,
        subscriptionId: sub.id,
        productName,
        dueDate: sub.nextDeliveryDate,
        daysUntil: days,
        title:
          days <= 0
            ? 'Livraison aujourd’hui'
            : days === 1
              ? 'Livraison demain'
              : `Livraison dans ${days} jours`,
        body: `${productName} — préparez votre rituel, on s’occupe du reste.`,
        urgency: days <= 0 ? 'today' : days <= 2 ? 'soon' : 'upcoming',
      } satisfies Reminder;
    })
    .sort((a, b) => a.daysUntil - b.daysUntil);
}

export function pendingReminders(subscriptions: Subscription[], horizonDays = 3): Reminder[] {
  return buildReminders(subscriptions).filter((reminder) => reminder.daysUntil <= horizonDays);
}
