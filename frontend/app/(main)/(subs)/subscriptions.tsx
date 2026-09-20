import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../../src/components/ui/Screen';
import SectionHeader from '../../../src/components/layout/SectionHeader';
import AppBadge from '../../../src/components/ui/AppBadge';
import PrimaryButton from '../../../src/components/ui/PrimaryButton';
import EmptyState from '../../../src/components/ui/EmptyState';
import QuantityStepper from '../../../src/components/ui/QuantityStepper';
import Sheet from '../../../src/components/ui/Sheet';
import PressableScale from '../../../src/components/ui/PressableScale';
import OfflineBanner from '../../../src/components/ui/OfflineBanner';
import { Chip, ChipRow } from '../../../src/components/ui/Chip';
import { SkeletonRows } from '../../../src/components/ui/SkeletonCard';
import { useOfflineQuery } from '../../../src/hooks/useOfflineQuery';
import { subscriptionService } from '../../../src/services/api';
import { Subscription } from '../../../src/models/types';
import { Colors } from '../../../src/constants/colors';
import { Elevation, Font, Radius, Spacing, Type } from '../../../src/constants/theme';

type Filter = 'all' | 'active' | 'paused' | 'cancelled';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Tous' },
  { key: 'active', label: 'Actifs' },
  { key: 'paused', label: 'En pause' },
  { key: 'cancelled', label: 'Annulés' },
];

const FREQUENCY_LABELS: Record<string, string> = {
  weekly: 'Chaque semaine',
  biweekly: 'Toutes les 2 semaines',
  monthly: 'Chaque mois',
};

function formatDate(value?: string | null) {
  if (!value) return 'À planifier';
  return new Date(value).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function daysLabel(value?: string | null) {
  if (!value) return null;
  const days = Math.round((new Date(value).getTime() - Date.now()) / 86_400_000);
  if (days <= 0) return "Aujourd'hui";
  if (days === 1) return 'Demain';
  return `Dans ${days} jours`;
}

export default function SubscriptionsScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>('all');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Subscription | null>(null);
  const [draftQuantity, setDraftQuantity] = useState(1);

  const query = useOfflineQuery<Subscription[]>(
    () => subscriptionService.getAll().then((res) => res.data as Subscription[]),
    { cacheKey: 'subscriptions' }
  );

  const subscriptions = useMemo(() => {
    const list = query.data ?? [];
    if (filter === 'all') return list;
    return list.filter((sub) => sub.status === filter);
  }, [query.data, filter]);

  const active = (query.data ?? []).filter((sub) => sub.status === 'active');
  const perDelivery = active.reduce((sum, sub) => sum + (sub.totalPrice ?? 0), 0);
  const monthlyEstimate = active.reduce((sum, sub) => {
    const cycle = sub.frequency === 'weekly' ? 4.3 : sub.frequency === 'biweekly' ? 2.15 : 1;
    return sum + (sub.totalPrice ?? 0) * cycle;
  }, 0);
  const nextDate = active
    .map((sub) => sub.nextDeliveryDate)
    .filter(Boolean)
    .sort()[0];

  const runAction = async (id: string, action: () => Promise<unknown>, message?: string) => {
    setBusyId(id);
    try {
      await action();
      await query.refresh();
      if (message) Alert.alert('C’est noté ✨', message);
    } catch (err) {
      Alert.alert('Oups', err instanceof Error ? err.message : 'Action impossible pour le moment');
    } finally {
      setBusyId(null);
    }
  };

  const openEditor = (subscription: Subscription) => {
    setEditing(subscription);
    setDraftQuantity(subscription.quantity ?? 1);
  };

  const saveQuantity = async () => {
    if (!editing) return;
    const target = editing;
    setEditing(null);
    await runAction(
      target.id,
      () => subscriptionService.update(target.id, { quantity: draftQuantity }),
      'Quantité mise à jour.'
    );
  };

  const changeFrequency = async (subscription: Subscription, frequency: string) => {
    setEditing(null);
    await runAction(
      subscription.id,
      () => subscriptionService.update(subscription.id, { frequency }),
      'Nouvelle fréquence enregistrée.'
    );
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
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Mon abonnement</Text>
          <Text style={styles.subtitle}>
            {active.length
              ? `Prochaine livraison ${formatDate(nextDate)}`
              : 'Créez votre routine en 1 minute'}
          </Text>
        </View>
        <PrimaryButton
          label="Ajouter"
          icon="add"
          size="sm"
          fullWidth={false}
          onPress={() => router.push('/(main)/catalog' as never)}
        />
      </View>

      <OfflineBanner cacheOnly onRetry={() => void query.refresh()} />

      {query.loading && !query.data ? (
        <SkeletonRows count={2} />
      ) : (
        <>
          {/* Summary */}
          {active.length > 0 ? (
            <View style={styles.summary}>
              <SummaryStat label="Par livraison" value={`${perDelivery.toFixed(2)} €`} />
              <View style={styles.summaryDivider} />
              <SummaryStat label="Estimation / mois" value={`${monthlyEstimate.toFixed(2)} €`} />
              <View style={styles.summaryDivider} />
              <SummaryStat label="Actifs" value={String(active.length)} />
            </View>
          ) : null}

          <ChipRow contentStyle={styles.chipRow}>
            {FILTERS.map((option) => (
              <Chip
                key={option.key}
                label={option.label}
                active={filter === option.key}
                onPress={() => setFilter(option.key)}
                count={
                  option.key === 'all'
                    ? query.data?.length
                    : (query.data ?? []).filter((sub) => sub.status === option.key).length
                }
                testID={`subs-filter-${option.key}`}
              />
            ))}
          </ChipRow>

          {/* List */}
          <View style={styles.list}>
            {subscriptions.length === 0 ? (
              <EmptyState
                icon="repeat-outline"
                title={filter === 'all' ? 'Aucun abonnement' : 'Rien à afficher ici'}
                description={
                  filter === 'all'
                    ? 'Choisissez un produit et sa fréquence : nous livrons automatiquement, sans rupture.'
                    : 'Changez de filtre pour voir vos autres abonnements.'
                }
                actionLabel={filter === 'all' ? 'Choisir un produit' : undefined}
                onAction={filter === 'all' ? () => router.push('/(main)/catalog' as never) : undefined}
                secondaryLabel={filter !== 'all' ? 'Voir tous les abonnements' : undefined}
                onSecondary={filter !== 'all' ? () => setFilter('all') : undefined}
              />
            ) : (
              subscriptions.map((subscription) => (
                <SubscriptionCard
                  key={subscription.id}
                  subscription={subscription}
                  busy={busyId === subscription.id}
                  onEdit={() => openEditor(subscription)}
                  onPause={() =>
                    runAction(
                      subscription.id,
                      () => subscriptionService.pause(subscription.id),
                      'Abonnement en pause. Reprenez quand vous voulez.'
                    )
                  }
                  onResume={() =>
                    runAction(
                      subscription.id,
                      () => subscriptionService.resume(subscription.id),
                      'Abonnement réactivé !'
                    )
                  }
                  onSkip={() =>
                    runAction(
                      subscription.id,
                      () => subscriptionService.skipNextDelivery(subscription.id),
                      'Prochaine livraison reportée d’un cycle.'
                    )
                  }
                  onCancel={() =>
                    Alert.alert(
                      'Annuler cet abonnement ?',
                      'Vous pourrez en créer un nouveau à tout moment.',
                      [
                        { text: 'Garder', style: 'cancel' },
                        {
                          text: 'Annuler l’abonnement',
                          style: 'destructive',
                          onPress: () =>
                            runAction(
                              subscription.id,
                              () => subscriptionService.cancel(subscription.id),
                              'Abonnement annulé.'
                            ),
                        },
                      ]
                    )
                  }
                />
              ))
            )}
          </View>

          {/* Upsell */}
          <View style={styles.upsell}>
            <SectionHeader accent title="Compléter ma routine" subtitle="Ajoutez un essentiel en un geste" />
            <PrimaryButton
              label="Parcourir le catalogue"
              variant="ghost"
              icon="grid-outline"
              onPress={() => router.push('/(main)/catalog' as never)}
            />
          </View>
        </>
      )}

      {/* Editor sheet */}
      <Sheet
        visible={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing?.product?.name ?? 'Modifier l’abonnement'}
        subtitle="Ajustez la quantité ou la fréquence de livraison"
        footer={
          <PrimaryButton label="Enregistrer la quantité" icon="checkmark" onPress={() => void saveQuantity()} />
        }
      >
        {editing ? (
          <View style={{ gap: Spacing.lg }}>
            <View style={styles.sheetRow}>
              <View>
                <Text style={styles.sheetLabel}>Quantité par livraison</Text>
                <Text style={styles.sheetHint}>
                  Total : {((editing.unitPrice ?? 0) * draftQuantity).toFixed(2)} €
                </Text>
              </View>
              <QuantityStepper value={draftQuantity} onChange={setDraftQuantity} max={12} />
            </View>

            <View>
              <Text style={styles.sheetLabel}>Fréquence</Text>
              <View style={styles.sheetFrequencies}>
                {(['weekly', 'biweekly', 'monthly'] as const).map((key) => (
                  <Chip
                    key={key}
                    label={FREQUENCY_LABELS[key]}
                    active={editing.frequency === key}
                    onPress={() => void changeFrequency(editing, key)}
                  />
                ))}
              </View>
            </View>

            <View style={styles.sheetInfo}>
              <Ionicons name="information-circle-outline" size={16} color={Colors.primaryDark} />
              <Text style={styles.sheetInfoText}>
                La prochaine livraison est recalculée automatiquement après chaque changement.
              </Text>
            </View>
          </View>
        ) : null}
      </Sheet>
    </Screen>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryStat}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function SubscriptionCard({
  subscription,
  busy,
  onEdit,
  onPause,
  onResume,
  onSkip,
  onCancel,
}: {
  subscription: Subscription;
  busy: boolean;
  onEdit: () => void;
  onPause: () => void;
  onResume: () => void;
  onSkip: () => void;
  onCancel: () => void;
}) {
  const router = useRouter();
  const product = subscription.product;
  const statusTone =
    subscription.status === 'active'
      ? { variant: 'sage' as const, label: 'Actif' }
      : subscription.status === 'paused'
        ? { variant: 'warning' as const, label: 'En pause' }
        : { variant: 'neutral' as const, label: 'Annulé' };

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <PressableScale
          onPress={() => product && router.push(`/(main)/(catalog)/${product.id}` as never)}
          style={styles.cardImageWrap}
        >
          {product?.images?.[0] ? (
            <Image source={{ uri: product.images[0] }} style={styles.cardImage} resizeMode="cover" />
          ) : (
            <View style={[styles.cardImage, styles.cardPlaceholder]}>
              <Ionicons name="repeat" size={20} color={Colors.primaryDark} />
            </View>
          )}
        </PressableScale>

        <View style={styles.cardBody}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {product?.name ?? 'Abonnement'}
            </Text>
            <AppBadge label={statusTone.label} variant={statusTone.variant} />
          </View>

          <Text style={styles.cardMeta}>
            ×{subscription.quantity} · {FREQUENCY_LABELS[subscription.frequency] ?? 'Chaque mois'}
          </Text>

          <View style={styles.cardDates}>
            <Ionicons name="calendar-outline" size={13} color={Colors.textSecondary} />
            <Text style={styles.cardDateText}>
              {subscription.status === 'paused'
                ? 'En pause — reprenez quand vous voulez'
                : `${formatDate(subscription.nextDeliveryDate)} · ${daysLabel(subscription.nextDeliveryDate) ?? ''}`}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.cardPrice}>{(subscription.totalPrice ?? 0).toFixed(2)} €</Text>
        {busy ? (
          <ActivityIndicator color={Colors.primary} />
        ) : (
          <View style={styles.cardActions}>
            {subscription.status === 'active' ? (
              <>
                <ActionButton icon="options-outline" label="Modifier" onPress={onEdit} testID="subs-edit-btn" />
                <ActionButton icon="play-skip-forward-outline" label="Reporter" onPress={onSkip} />
                <ActionButton icon="pause-outline" label="Pause" onPress={onPause} />
              </>
            ) : subscription.status === 'paused' ? (
              <>
                <ActionButton icon="options-outline" label="Modifier" onPress={onEdit} />
                <ActionButton icon="play-outline" label="Reprendre" onPress={onResume} tone="sage" />
              </>
            ) : (
              <ActionButton icon="add-outline" label="Recréer" onPress={() => router.push('/(main)/catalog' as never)} />
            )}
          </View>
        )}
      </View>

      {subscription.status !== 'cancelled' ? (
        <PressableScale onPress={onCancel} style={styles.cancelRow}>
          <Ionicons name="close-circle-outline" size={14} color={Colors.error} />
          <Text style={styles.cancelText}>Annuler cet abonnement</Text>
        </PressableScale>
      ) : null}
    </View>
  );
}

function ActionButton({
  icon,
  label,
  onPress,
  tone = 'default',
  testID,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  tone?: 'default' | 'sage';
  testID?: string;
}) {
  return (
    <PressableScale
      testID={testID}
      onPress={onPress}
      style={[styles.action, tone === 'sage' && styles.actionSage]}
      scaleTo={0.94}
    >
      <Ionicons name={icon} size={14} color={tone === 'sage' ? Colors.textInverse : Colors.primaryDark} />
      <Text style={[styles.actionLabel, tone === 'sage' && styles.actionLabelSage]}>{label}</Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: Spacing.lg,
  },
  title: { ...Type.h1, color: Colors.textPrimary },
  subtitle: { ...Type.small, color: Colors.textSecondary, marginTop: 2 },
  chipRow: { paddingHorizontal: 0, marginBottom: Spacing.md },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.md,
    ...Elevation.xs,
  },
  summaryStat: { flex: 1, alignItems: 'center' },
  summaryValue: { fontFamily: Font.semibold, fontSize: 16, color: Colors.textPrimary },
  summaryLabel: { fontFamily: Font.regular, fontSize: 11, color: Colors.textTertiary, marginTop: 2 },
  summaryDivider: { width: 1, height: 30, backgroundColor: Colors.borderLight },
  list: { gap: 14 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xxl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Elevation.sm,
  },
  cardTop: { flexDirection: 'row', gap: 12 },
  cardImageWrap: { width: 74, height: 74, borderRadius: Radius.lg, overflow: 'hidden' },
  cardImage: { width: '100%', height: '100%' },
  cardPlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primaryPale },
  cardBody: { flex: 1, gap: 4 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  cardTitle: { ...Type.bodyStrong, color: Colors.textPrimary, flex: 1 },
  cardMeta: { ...Type.small, color: Colors.textSecondary },
  cardDates: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  cardDateText: { ...Type.small, color: Colors.textSecondary, flex: 1 },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: Spacing.sm,
    gap: 10,
  },
  cardPrice: { ...Type.price, color: Colors.textPrimary },
  cardActions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryPale,
    borderWidth: 1,
    borderColor: Colors.primaryMuted,
  },
  actionSage: { backgroundColor: Colors.accent, borderColor: '#93A78E' },
  actionLabel: { fontFamily: Font.semibold, fontSize: 12, color: Colors.primaryDark },
  actionLabelSage: { color: Colors.textInverse },
  cancelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-end' },
  cancelText: { fontFamily: Font.medium, fontSize: 12, color: Colors.error },
  sheetRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sheetLabel: { ...Type.bodyStrong, color: Colors.textPrimary },
  sheetHint: { ...Type.small, color: Colors.textSecondary, marginTop: 2 },
  sheetFrequencies: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: Spacing.sm },
  sheetInfo: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: Colors.primaryPale,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
  },
  sheetInfoText: { ...Type.small, color: Colors.primaryDark, flex: 1 },
  upsell: { marginTop: Spacing.xl * 1.5 },
});
