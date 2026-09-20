import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../../src/components/ui/Screen';
import IconButton from '../../../src/components/ui/IconButton';
import StatusBadge from '../../../src/components/ui/StatusBadge';
import ProgressSteps, { ProgressStep } from '../../../src/components/ui/ProgressSteps';
import EmptyState from '../../../src/components/ui/EmptyState';
import AppBadge from '../../../src/components/ui/AppBadge';
import PrimaryButton from '../../../src/components/ui/PrimaryButton';
import { orderService } from '../../../src/services/api';
import { Order } from '../../../src/models/types';
import { Colors } from '../../../src/constants/colors';
import { Elevation, Font, Radius, Spacing, Type } from '../../../src/constants/theme';

const STEPS = [
  { key: 'confirmed', label: 'Commande confirmée', icon: 'checkmark' as const },
  { key: 'preparing', label: 'En préparation', icon: 'construct-outline' as const },
  { key: 'shipped', label: 'Expédiée', icon: 'car-outline' as const },
  { key: 'delivered', label: 'Livrée', icon: 'home-outline' as const },
];

function formatDateTime(value?: string) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function TrackingScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    orderService
      .getById(id)
      .then((res) => setOrder(res.data as Order))
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [id]);

  const steps: ProgressStep[] = useMemo(() => {
    if (!order) return [];
    const currentIndex = STEPS.findIndex((step) => step.key === order.status);
    const timelineByStatus = new Map(order.timeline?.map((entry) => [entry.status, entry]) ?? []);

    return STEPS.map((step, index) => {
      const entry = timelineByStatus.get(step.key);
      const state: ProgressStep['state'] =
        order.status === 'cancelled'
          ? step.key === 'confirmed'
            ? 'done'
            : 'todo'
          : index < currentIndex
            ? 'done'
            : index === currentIndex
              ? 'current'
              : 'todo';
      return {
        key: step.key,
        label: step.label,
        icon: step.icon,
        date: entry ? formatDateTime(entry.date) : state === 'todo' ? 'À venir' : undefined,
        description: entry?.description,
        state,
      };
    });
  }, [order]);

  if (loading) {
    return (
      <Screen>
        <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.xl }} />
      </Screen>
    );
  }

  if (!order) {
    return (
      <Screen>
        <EmptyState
          icon="alert-circle-outline"
          title="Commande introuvable"
          description="Nous n’avons pas retrouvé cette commande."
          actionLabel="Voir mes commandes"
          onAction={() => router.replace('/(main)/(orders)/orders' as never)}
        />
      </Screen>
    );
  }

  return (
    <Screen scroll tabBarSpace>
      <View style={styles.header}>
        <IconButton name="arrow-back" onPress={() => router.back()} accessibilityLabel="Retour" />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{order.orderNumber}</Text>
          <Text style={styles.subtitle}>Commandée le {formatDateTime(order.createdAt)}</Text>
        </View>
        <StatusBadge status={order.status} small />
      </View>

      {/* Tracking card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardIcon}>
            <Ionicons name="navigate" size={17} color={Colors.textInverse} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>
              {order.status === 'delivered'
                ? 'Colis livré'
                : order.status === 'cancelled'
                  ? 'Commande annulée'
                  : 'Votre colis est en route'}
            </Text>
            <Text style={styles.cardSubtitle}>
              {order.estimatedDelivery
                ? `Livraison estimée le ${new Date(order.estimatedDelivery).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                  })}`
                : 'Nous vous préviendrons à chaque étape'}
            </Text>
          </View>
        </View>

        {order.trackingNumber ? (
          <View style={styles.trackingRow}>
            <Text style={styles.trackingLabel}>Numéro de suivi</Text>
            <Text style={styles.trackingValue}>{order.trackingNumber}</Text>
          </View>
        ) : null}
      </View>

      {/* Timeline */}
      <Text style={styles.sectionTitle}>Étapes de livraison</Text>
      <View style={styles.timelineCard}>
        <ProgressSteps steps={steps} />
      </View>

      {/* Items */}
      <Text style={styles.sectionTitle}>Contenu du colis</Text>
      <View style={styles.itemsCard}>
        {order.items.map((item, index) => (
          <View key={`${item.productId}-${index}`} style={[styles.itemRow, index > 0 && styles.itemRowBordered]}>
            <View style={styles.itemIcon}>
              <Ionicons name="cube-outline" size={16} color={Colors.primaryDark} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName} numberOfLines={2}>
                {item.productName}
              </Text>
              <Text style={styles.itemMeta}>
                ×{item.quantity} · {item.unitPrice.toFixed(2)} € / unité
              </Text>
            </View>
            <Text style={styles.itemTotal}>{item.totalPrice.toFixed(2)} €</Text>
          </View>
        ))}

        <View style={styles.itemsFooter}>
          <Text style={styles.totalLabel}>Total payé</Text>
          <Text style={styles.totalValue}>{order.total.toFixed(2)} €</Text>
        </View>
      </View>

      <View style={styles.badges}>
        <AppBadge
          label={order.paymentStatus === 'paid' ? 'Paiement confirmé' : 'Paiement en attente'}
          variant={order.paymentStatus === 'paid' ? 'success' : 'warning'}
          icon="card-outline"
        />
        <AppBadge label="Livraison offerte" variant="sage" icon="cube-outline" />
      </View>

      <PrimaryButton
        label="Besoin d’aide sur cette commande ?"
        variant="ghost"
        icon="chatbubbles-outline"
        onPress={() => router.push('/(main)/(profile)/support' as never)}
        style={{ marginTop: Spacing.lg }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: Spacing.lg },
  title: { ...Type.h2, color: Colors.textPrimary },
  subtitle: { ...Type.small, color: Colors.textSecondary, marginTop: 1 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xxl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.md,
    gap: Spacing.md,
    ...Elevation.sm,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { ...Type.bodyStrong, color: Colors.textPrimary },
  cardSubtitle: { ...Type.small, color: Colors.textSecondary, marginTop: 1 },
  trackingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.lg,
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
  },
  trackingLabel: { ...Type.small, color: Colors.textSecondary },
  trackingValue: { fontFamily: Font.semibold, fontSize: 13, color: Colors.textPrimary },
  sectionTitle: { ...Type.h3, color: Colors.textPrimary, marginTop: Spacing.xl, marginBottom: Spacing.sm },
  timelineCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xxl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.md,
    ...Elevation.xs,
  },
  itemsCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xxl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.md,
    ...Elevation.xs,
  },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  itemRowBordered: { borderTopWidth: 1, borderTopColor: Colors.borderLight },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemName: { ...Type.bodyStrong, color: Colors.textPrimary },
  itemMeta: { ...Type.small, color: Colors.textSecondary, marginTop: 2 },
  itemTotal: { ...Type.bodyStrong, color: Colors.textPrimary },
  itemsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: Spacing.sm,
    marginTop: Spacing.sm,
  },
  totalLabel: { ...Type.bodyStrong, color: Colors.textPrimary },
  totalValue: { ...Type.h3, color: Colors.textPrimary },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: Spacing.md },
});
