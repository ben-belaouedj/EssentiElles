import React, { useMemo } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../src/components/ui/Screen';
import IconButton from '../../src/components/ui/IconButton';
import PressableScale from '../../src/components/ui/PressableScale';
import EmptyState from '../../src/components/ui/EmptyState';
import AppBadge from '../../src/components/ui/AppBadge';
import OfflineBanner from '../../src/components/ui/OfflineBanner';
import SectionHeader from '../../src/components/layout/SectionHeader';
import { SkeletonRows } from '../../src/components/ui/SkeletonCard';
import { useOfflineQuery } from '../../src/hooks/useOfflineQuery';
import { notificationService, subscriptionService } from '../../src/services/api';
import { Notification, Subscription } from '../../src/models/types';
import { buildReminders } from '../../src/services/reminders';
import { usePreferencesStore } from '../../src/store/preferencesStore';
import { Colors } from '../../src/constants/colors';
import { Elevation, Font, Radius, Spacing, Type } from '../../src/constants/theme';

const TYPE_META: Record<
  Notification['type'],
  { icon: keyof typeof Ionicons.glyphMap; bg: string; fg: string; label: string }
> = {
  delivery: { icon: 'cube', bg: Colors.primaryPale, fg: Colors.primaryDark, label: 'Livraison' },
  subscription: { icon: 'repeat', bg: Colors.accentSageSoft, fg: '#5F7358', label: 'Abonnement' },
  promo: { icon: 'pricetag', bg: Colors.warningBg, fg: '#9A7635', label: 'Offre' },
  support: { icon: 'chatbubbles', bg: Colors.infoBg, fg: '#4C7099', label: 'Support' },
  system: { icon: 'information-circle', bg: Colors.surfaceAlt, fg: Colors.textSecondary, label: 'Info' },
};

function formatDateTime(value: string) {
  return new Date(value).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function NotificationsScreen() {
  const router = useRouter();
  const deliveryReminders = usePreferencesStore((s) => s.deliveryReminders);

  const query = useOfflineQuery<Notification[]>(
    () => notificationService.getAll().then((res) => res.data as Notification[]),
    { cacheKey: 'notifications' }
  );
  const subscriptions = useOfflineQuery<Subscription[]>(
    () => subscriptionService.getAll().then((res) => res.data as Subscription[]),
    { cacheKey: 'subscriptions' }
  );

  const unread = (query.data ?? []).filter((n) => !n.isRead).length;
  const reminders = useMemo(
    () => (deliveryReminders ? buildReminders(subscriptions.data ?? []) : []),
    [deliveryReminders, subscriptions.data]
  );

  const markAll = async () => {
    try {
      await notificationService.markAllRead();
      await query.refresh();
    } catch {
      /* offline: keep local state */
    }
  };

  const markOne = async (id: string) => {
    try {
      await notificationService.markRead(id);
      query.setData(
        (query.data ?? []).map((item) => (item.id === id ? { ...item, isRead: true } : item))
      );
    } catch {
      /* ignore */
    }
  };

  return (
    <Screen
      scroll
      tabBarSpace
      refreshControl={
        <RefreshControl
          refreshing={query.refreshing}
          onRefresh={() => void query.refresh()}
          tintColor={Colors.primary}
        />
      }
    >
      <View style={styles.header}>
        <IconButton name="arrow-back" onPress={() => router.back()} accessibilityLabel="Retour" />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Notifications</Text>
          <Text style={styles.subtitle}>
            {unread ? `${unread} non lue${unread > 1 ? 's' : ''}` : 'Tout est à jour ✨'}
          </Text>
        </View>
        {unread > 0 ? (
          <PressableScale onPress={() => void markAll()} style={styles.markAll}>
            <Text style={styles.markAllText}>Tout lire</Text>
          </PressableScale>
        ) : null}
      </View>

      <OfflineBanner cacheOnly onRetry={() => void query.refresh()} />

      {/* Local delivery reminders */}
      {reminders.length ? (
        <View style={styles.remindersBlock}>
          <SectionHeader
            accent
            title="Rappels de livraison"
            subtitle="Planifiés localement sur votre appareil"
          />
          <View style={{ gap: 10 }}>
            {reminders.map((reminder) => (
              <View
                key={reminder.id}
                style={[
                  styles.reminderCard,
                  reminder.urgency === 'today' && styles.reminderCardToday,
                ]}
              >
                <View style={styles.reminderIcon}>
                  <Ionicons name="alarm" size={16} color={Colors.textInverse} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.reminderTitle}>{reminder.title}</Text>
                  <Text style={styles.reminderBody} numberOfLines={2}>
                    {reminder.body}
                  </Text>
                </View>
                <AppBadge
                  label={reminder.daysUntil <= 0 ? 'Aujourd’hui' : `J-${reminder.daysUntil}`}
                  variant={reminder.urgency === 'today' ? 'warning' : 'sage'}
                />
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {/* Server notifications */}
      <Text style={styles.sectionTitle}>Historique</Text>
      {query.loading && !query.data ? (
        <SkeletonRows count={3} />
      ) : (query.data ?? []).length === 0 ? (
        <EmptyState
          compact
          icon="notifications-outline"
          title="Aucune notification"
          description="Vos alertes de livraison, commandes et offres arriveront ici."
        />
      ) : (
        <View style={{ gap: 10 }}>
          {(query.data ?? []).map((notification) => {
            const meta = TYPE_META[notification.type] ?? TYPE_META.system;
            return (
              <PressableScale
                key={notification.id}
                onPress={() => void markOne(notification.id)}
                style={[styles.card, !notification.isRead && styles.cardUnread]}
                scaleTo={0.99}
              >
                <View style={[styles.icon, { backgroundColor: meta.bg }]}>
                  <Ionicons name={meta.icon} size={16} color={meta.fg} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.cardTop}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {notification.title}
                    </Text>
                    {!notification.isRead ? <View style={styles.dot} /> : null}
                  </View>
                  <Text style={styles.cardBody} numberOfLines={3}>
                    {notification.body}
                  </Text>
                  <View style={styles.cardMeta}>
                    <Text style={styles.cardMetaText}>
                      {meta.label} · {formatDateTime(notification.createdAt)}
                    </Text>
                  </View>
                </View>
              </PressableScale>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: Spacing.lg },
  title: { ...Type.h1, color: Colors.textPrimary },
  subtitle: { ...Type.small, color: Colors.textSecondary, marginTop: 2 },
  markAll: {
    backgroundColor: Colors.primaryPale,
    borderRadius: Radius.full,
    paddingHorizontal: 14,
    height: 34,
    justifyContent: 'center',
  },
  markAllText: { fontFamily: Font.semibold, fontSize: 12.5, color: Colors.primaryDark },
  remindersBlock: { marginBottom: Spacing.xl },
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.md,
    ...Elevation.xs,
  },
  reminderCardToday: { borderColor: Colors.warning, backgroundColor: Colors.warningBg },
  reminderIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderTitle: { ...Type.bodyStrong, color: Colors.textPrimary },
  reminderBody: { ...Type.small, color: Colors.textSecondary, marginTop: 2 },
  sectionTitle: { ...Type.h3, color: Colors.textPrimary, marginBottom: Spacing.sm },
  card: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.md,
    ...Elevation.xs,
  },
  cardUnread: { borderColor: Colors.primaryMuted, backgroundColor: '#FFFDFD' },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { ...Type.bodyStrong, color: Colors.textPrimary, flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  cardBody: { ...Type.small, color: Colors.textSecondary, marginTop: 3 },
  cardMeta: { marginTop: 6 },
  cardMetaText: { ...Type.small, fontSize: 11, color: Colors.textTertiary },
});
