import React, { useMemo, useState } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Screen from '../../../src/components/ui/Screen';
import OrderCard from '../../../src/components/cards/OrderCard';
import EmptyState from '../../../src/components/ui/EmptyState';
import OfflineBanner from '../../../src/components/ui/OfflineBanner';
import IconButton from '../../../src/components/ui/IconButton';
import { Chip, ChipRow } from '../../../src/components/ui/Chip';
import { SkeletonRows } from '../../../src/components/ui/SkeletonCard';
import { useOfflineQuery } from '../../../src/hooks/useOfflineQuery';
import { orderService } from '../../../src/services/api';
import { Order } from '../../../src/models/types';
import { Colors } from '../../../src/constants/colors';
import { Spacing, Type } from '../../../src/constants/theme';

const FILTERS = [
  { key: 'all', label: 'Toutes' },
  { key: 'confirmed', label: 'Confirmées' },
  { key: 'preparing', label: 'Préparation' },
  { key: 'shipped', label: 'Expédiées' },
  { key: 'delivered', label: 'Livrées' },
  { key: 'cancelled', label: 'Annulées' },
];

export default function OrdersScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState('all');

  const query = useOfflineQuery<Order[]>(
    () => orderService.getAll().then((res) => res.data as Order[]),
    { cacheKey: 'orders' }
  );

  const orders = useMemo(() => {
    const list = query.data ?? [];
    return filter === 'all' ? list : list.filter((order) => order.status === filter);
  }, [query.data, filter]);

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
          <Text style={styles.title}>Mes commandes</Text>
          <Text style={styles.subtitle}>
            {(query.data ?? []).length} commande{(query.data ?? []).length > 1 ? 's' : ''} au total
          </Text>
        </View>
        <IconButton
          name="document-text-outline"
          accessibilityLabel="Factures"
          onPress={() => router.push('/(main)/(orders)/invoices' as never)}
        />
      </View>

      <OfflineBanner cacheOnly onRetry={() => void query.refresh()} />

      <ChipRow contentStyle={styles.chipRow}>
        {FILTERS.map((option) => (
          <Chip
            key={option.key}
            label={option.label}
            active={filter === option.key}
            onPress={() => setFilter(option.key)}
            count={
              option.key === 'all'
                ? (query.data ?? []).length
                : (query.data ?? []).filter((order) => order.status === option.key).length
            }
          />
        ))}
      </ChipRow>

      <View style={styles.list}>
        {query.loading && !query.data ? (
          <SkeletonRows count={3} />
        ) : orders.length === 0 ? (
          <EmptyState
            icon="cube-outline"
            title={filter === 'all' ? 'Aucune commande' : 'Rien à afficher'}
            description={
              filter === 'all'
                ? 'Vos commandes et leurs suivis apparaîtront ici.'
                : 'Essayez un autre filtre pour retrouver votre commande.'
            }
            actionLabel={filter === 'all' ? 'Découvrir le catalogue' : undefined}
            onAction={filter === 'all' ? () => router.push('/(main)/catalog' as never) : undefined}
            secondaryLabel={filter !== 'all' ? 'Voir toutes les commandes' : undefined}
            onSecondary={filter !== 'all' ? () => setFilter('all') : undefined}
          />
        ) : (
          orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onPress={() => router.push({ pathname: '/(main)/tracking', params: { id: order.id } } as never)}
            />
          ))
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: Spacing.lg },
  title: { ...Type.h1, color: Colors.textPrimary },
  subtitle: { ...Type.small, color: Colors.textSecondary, marginTop: 2 },
  chipRow: { paddingHorizontal: 0, marginBottom: Spacing.md },
  list: { gap: 12 },
});
