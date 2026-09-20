import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { orderService } from '../../../src/services/api';
import { Order } from '../../../src/models/types';
import OrderCard from '../../../src/components/cards/OrderCard';
import EmptyState from '../../../src/components/ui/EmptyState';
import { SkeletonRows } from '../../../src/components/ui/SkeletonCard';
import Screen from '../../../src/components/ui/Screen';
import { Chip, ChipRow } from '../../../src/components/ui/Chip';
import StatTile from '../../../src/components/ui/StatTile';
import OfflineBanner from '../../../src/components/ui/OfflineBanner';
import { Colors } from '../../../src/constants/colors';
import { Spacing } from '../../../src/constants/spacing';
import { Type } from '../../../src/constants/theme';

/** Orders that have reached the customer. */
const DELIVERED_STATUSES = ['delivered'];

export default function HistoryScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [yearFilter, setYearFilter] = useState<string>('all');

  const load = useCallback(async () => {
    try {
      const res = await orderService.getAll();
      setOrders(res.data.filter((o: Order) => DELIVERED_STATUSES.includes(o.status)));
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const years = useMemo(() => {
    const found = new Set<string>();
    orders.forEach(o => {
      const date = new Date(o.createdAt || '');
      if (!Number.isNaN(date.getTime())) found.add(String(date.getFullYear()));
    });
    return Array.from(found).sort((a, b) => Number(b) - Number(a));
  }, [orders]);

  const visible = useMemo(
    () => (yearFilter === 'all'
      ? orders
      : orders.filter(o => String(new Date(o.createdAt || '').getFullYear()) === yearFilter)),
    [orders, yearFilter]
  );

  const totalSpent = visible.reduce((sum, o) => sum + (o.total || 0), 0);

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
      <OfflineBanner cacheOnly />

      <View style={styles.header}>
        <Text style={styles.title}>Historique</Text>
        <Text style={styles.subtitle}>Vos livraisons passées, en un coup d’œil</Text>
      </View>

      {!loading && orders.length > 0 ? (
        <View style={styles.stats}>
          <StatTile icon="cube-outline" label="Livraisons" value={orders.length} tone="primary" style={styles.stat} />
          <StatTile icon="wallet-outline" label="Total dépensé" value={`${totalSpent.toFixed(0)} €`} tone="sage" style={styles.stat} />
        </View>
      ) : null}

      {years.length > 1 ? (
        <ChipRow contentStyle={styles.chips}>
          <Chip label="Tout" active={yearFilter === 'all'} onPress={() => setYearFilter('all')} count={orders.length} />
          {years.map(y => (
            <Chip
              key={y}
              label={y}
              active={yearFilter === y}
              onPress={() => setYearFilter(y)}
              count={orders.filter(o => String(new Date(o.createdAt || '').getFullYear()) === y).length}
            />
          ))}
        </ChipRow>
      ) : null}

      {loading ? (
        <View style={styles.list}>
          <SkeletonRows count={3} />
        </View>
      ) : visible.length === 0 ? (
        <EmptyState
          icon="checkmark-circle-outline"
          title="Aucune livraison effectuée"
          description="Vos commandes livrées apparaîtront ici, avec leur récapitulatif."
        />
      ) : (
        <View style={styles.list}>
          {visible.map(item => (
            <OrderCard
              key={item.id}
              order={item}
              onPress={() => router.push({ pathname: '/(main)/tracking', params: { id: item.id } } as any)}
            />
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: Spacing.xxl },
  header: { paddingTop: Spacing.md, paddingBottom: Spacing.lg },
  title: { ...Type.display, color: Colors.textPrimary },
  subtitle: { ...Type.body, color: Colors.textSecondary, marginTop: 4 },
  stats: { flexDirection: 'row', gap: 10, marginBottom: Spacing.md },
  stat: { flex: 1 },
  chips: { paddingBottom: Spacing.md, gap: 8 },
  list: { gap: 12 },
});
