import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { adminService } from '../../src/services/api';
import { Order } from '../../src/models/types';
import { Colors } from '../../src/constants/colors';
import { Radius, Spacing } from '../../src/constants/spacing';
import { Elevation, Font, Type } from '../../src/constants/theme';
import StatusBadge from '../../src/components/ui/StatusBadge';
import Screen from '../../src/components/ui/Screen';
import { Chip, ChipRow } from '../../src/components/ui/Chip';
import IconButton from '../../src/components/ui/IconButton';
import PressableScale from '../../src/components/ui/PressableScale';
import { SkeletonListItem } from '../../src/components/ui/SkeletonCard';
import EmptyState from '../../src/components/ui/EmptyState';

const ORDER_STATUSES = [
  { key: 'confirmed', label: 'Confirmée' },
  { key: 'preparing', label: 'Préparation' },
  { key: 'shipped', label: 'Expédiée' },
  { key: 'delivered', label: 'Livrée' },
  { key: 'cancelled', label: 'Annulée' },
];

const FILTERS = [
  { key: 'all', label: 'Toutes' },
  { key: 'confirmed', label: 'Confirmées' },
  { key: 'preparing', label: 'Préparation' },
  { key: 'shipped', label: 'Expédiées' },
  { key: 'delivered', label: 'Livrées' },
  { key: 'cancelled', label: 'Annulées' },
];

function formatDate(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    try {
      const res = await adminService.getOrders();
      setOrders(res.data);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, []);

  const handleStatusUpdate = (order: Order) => {
    const options = ORDER_STATUSES.map(s => ({
      text: s.label,
      onPress: async () => {
        try {
          await adminService.updateOrderStatus(order.id, s.key);
          load();
          Alert.alert('✓', `Statut mis à jour : ${s.label}`);
        } catch { Alert.alert('Erreur', 'Impossible de mettre à jour'); }
      },
    }));
    Alert.alert(
      `Changer le statut de ${order.orderNumber}`,
      'Sélectionnez le nouveau statut :',
      [...options, { text: 'Annuler', style: 'cancel' as any }]
    );
  };

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  return (
    <Screen
      background="blush"
      scroll
      tabBarSpace
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); load(); }}
          tintColor={Colors.primary}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Commandes</Text>
        <Text style={styles.pageSubtitle}>
          {orders.length} commande{orders.length > 1 ? 's' : ''} au total
        </Text>
      </View>

      <ChipRow contentStyle={styles.chipRow}>
        {FILTERS.map(f => (
          <Chip
            key={f.key}
            label={f.label}
            active={filter === f.key}
            onPress={() => setFilter(f.key)}
            count={f.key === 'all' ? orders.length : orders.filter(o => o.status === f.key).length}
          />
        ))}
      </ChipRow>

      {loading ? (
        <View style={styles.skeletons}>
          <SkeletonListItem />
          <SkeletonListItem />
          <SkeletonListItem />
        </View>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="bag-outline"
          title="Aucune commande"
          description="Les commandes clients apparaîtront ici."
        />
      ) : (
        <View style={styles.list}>
          {filtered.map(item => (
            <PressableScale key={item.id} style={styles.row} onPress={() => handleStatusUpdate(item)}>
              <View style={styles.rowIcon}>
                <Ionicons name="bag-handle-outline" size={19} color={Colors.primaryDark} />
              </View>

              <View style={styles.rowBody}>
                <View style={styles.rowTop}>
                  <Text style={styles.rowName} numberOfLines={1}>{item.orderNumber}</Text>
                  <StatusBadge status={item.status} small />
                </View>
                <Text style={styles.rowSub}>
                  {formatDate(item.createdAt)} · {item.items?.length || 0} article{item.items?.length === 1 ? '' : 's'}
                </Text>
                <Text style={styles.rowPrice}>{(item.total || 0).toFixed(2)} €</Text>
              </View>

              <IconButton
                name="swap-horizontal-outline"
                variant="soft"
                size={36}
                color={Colors.primaryDark}
                onPress={() => handleStatusUpdate(item)}
                accessibilityLabel="Changer le statut"
              />
            </PressableScale>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: Spacing.xxl },
  header: { paddingTop: Spacing.md, paddingBottom: Spacing.lg },
  pageTitle: { ...Type.display, color: Colors.textPrimary },
  pageSubtitle: { ...Type.body, color: Colors.textSecondary, marginTop: 4 },
  chipRow: { paddingBottom: Spacing.lg, gap: 8 },
  skeletons: { gap: 10 },
  list: { gap: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.md,
    ...Elevation.sm,
  },
  rowIcon: {
    width: 46,
    height: 46,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1 },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  rowName: { ...Type.h3, color: Colors.textPrimary, flexShrink: 1 },
  rowSub: { ...Type.small, color: Colors.textTertiary, marginTop: 3 },
  rowPrice: { fontFamily: Font.semibold, fontSize: 13.5, color: Colors.primaryDark, marginTop: 3 },
});
