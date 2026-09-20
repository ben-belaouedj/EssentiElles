import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PressableScale from '../ui/PressableScale';
import StatusBadge from '../ui/StatusBadge';
import { Colors } from '../../constants/colors';
import { Elevation, Font, Radius, Spacing, Type } from '../../constants/theme';
import { Order } from '../../models/types';

interface Props {
  order: Order;
  onPress: () => void;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Modern order summary card. */
export default function OrderCard({ order, onPress }: Props) {
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <PressableScale
      testID={`order-card-${order.id}`}
      onPress={onPress}
      scaleTo={0.985}
      style={styles.card}
    >
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Ionicons name="cube" size={18} color={Colors.primaryDark} />
        </View>
        <View style={styles.info}>
          <Text style={styles.orderNum}>{order.orderNumber}</Text>
          <Text style={styles.date}>
            {formatDate(order.createdAt)} · {itemCount} article{itemCount > 1 ? 's' : ''}
          </Text>
        </View>
        <StatusBadge status={order.status} small />
      </View>

      <Text style={styles.items} numberOfLines={2}>
        {order.items.map((item) => `${item.productName} ×${item.quantity}`).join(' · ')}
      </Text>

      <View style={styles.footer}>
        <Text style={styles.total}>{order.total.toFixed(2)} €</Text>
        <View style={styles.trackRow}>
          <Text style={styles.trackText}>Suivre</Text>
          <Ionicons name="arrow-forward" size={14} color={Colors.primaryDark} />
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xxl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Elevation.sm,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: Colors.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1 },
  orderNum: { fontFamily: Font.semibold, fontSize: 14.5, color: Colors.textPrimary },
  date: { ...Type.small, color: Colors.textSecondary, marginTop: 1 },
  items: { ...Type.small, color: Colors.textSecondary },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: Spacing.sm,
  },
  total: { ...Type.price, color: Colors.textPrimary },
  trackRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  trackText: { fontFamily: Font.semibold, fontSize: 12.5, color: Colors.primaryDark },
});
