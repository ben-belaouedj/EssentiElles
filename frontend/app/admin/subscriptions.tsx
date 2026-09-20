import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { adminService } from '../../src/services/api';
import { Colors } from '../../src/constants/colors';
import { Radius, Spacing } from '../../src/constants/spacing';
import { Elevation, Font, Type } from '../../src/constants/theme';
import StatusBadge from '../../src/components/ui/StatusBadge';
import Screen from '../../src/components/ui/Screen';
import StatTile from '../../src/components/ui/StatTile';
import { Chip, ChipRow } from '../../src/components/ui/Chip';
import EmptyState from '../../src/components/ui/EmptyState';
import { SkeletonListItem } from '../../src/components/ui/SkeletonCard';

/** Parse a YYYY-MM-DD date safely (avoids UTC shift on web). */
function formatDate(d?: string) {
  if (!d) return '—';
  const [y, m, day] = d.split('-').map(Number);
  const date = y && m && day ? new Date(y, m - 1, day) : new Date(d);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

const FREQ_LABELS: Record<string, string> = {
  weekly: 'Hebdomadaire',
  biweekly: '2 semaines',
  monthly: 'Mensuel',
};

const FILTERS = [
  { key: 'all', label: 'Toutes' },
  { key: 'active', label: 'Actifs' },
  { key: 'paused', label: 'En pause' },
  { key: 'cancelled', label: 'Annulés' },
];

export default function AdminSubscriptions() {
  const [subs, setSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    try {
      const res = await adminService.getSubscriptions();
      setSubs(res.data);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, []);

  const filtered = filter === 'all' ? subs : subs.filter(s => s.status === filter);
  const activeSubs = subs.filter(s => s.status === 'active');
  const revenue = activeSubs.reduce((sum, s) => sum + (s.totalPrice || 0), 0);

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
        <Text style={styles.pageTitle}>Abonnements</Text>
        <Text style={styles.pageSubtitle}>Suivi des box récurrentes et du revenu mensuel</Text>
      </View>

      <View style={styles.stats}>
        <StatTile icon="repeat-outline" label="Actifs" value={activeSubs.length} tone="sage" style={styles.stat} />
        <StatTile icon="pause-circle-outline" label="En pause" value={subs.filter(s => s.status === 'paused').length} tone="amber" style={styles.stat} />
        <StatTile icon="close-circle-outline" label="Annulés" value={subs.filter(s => s.status === 'cancelled').length} tone="primary" style={styles.stat} />
      </View>

      <View style={styles.revenueCard}>
        <View style={styles.revenueIcon}>
          <Ionicons name="trending-up-outline" size={18} color={Colors.primaryDark} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.revenueLabel}>Revenu mensuel récurrent</Text>
          <Text style={styles.revenueValue}>{revenue.toFixed(2)} €</Text>
        </View>
        <Text style={styles.revenueHint}>{activeSubs.length} box</Text>
      </View>

      <ChipRow contentStyle={styles.chipRow}>
        {FILTERS.map(f => (
          <Chip
            key={f.key}
            label={f.label}
            active={filter === f.key}
            onPress={() => setFilter(f.key)}
            count={f.key === 'all' ? subs.length : subs.filter(s => s.status === f.key).length}
          />
        ))}
      </ChipRow>

      {loading ? (
        <View style={styles.list}>
          <SkeletonListItem />
          <SkeletonListItem />
          <SkeletonListItem />
        </View>
      ) : filtered.length === 0 ? (
        <EmptyState icon="repeat-outline" title="Aucun abonnement" description="Aucun abonnement ne correspond à ce filtre." />
      ) : (
        <View style={styles.list}>
          {filtered.map(item => (
            <View key={item.id} style={styles.row}>
              <View style={styles.rowIcon}>
                <Ionicons name="gift-outline" size={19} color={Colors.primaryDark} />
              </View>
              <View style={styles.rowBody}>
                <Text style={styles.rowName} numberOfLines={1}>
                  Box ×{item.quantity} · {FREQ_LABELS[item.frequency] || item.frequency}
                </Text>
                <Text style={styles.rowSub}>
                  {(item.totalPrice || 0).toFixed(2)} € · depuis le {formatDate(item.startDate)}
                </Text>
              </View>
              <StatusBadge status={item.status} small />
            </View>
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
  stats: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1 },
  revenueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.md,
    ...Elevation.sm,
  },
  revenueIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  revenueLabel: { ...Type.small, color: Colors.textSecondary },
  revenueValue: { fontFamily: Font.bold, fontSize: 21, color: Colors.textPrimary, letterSpacing: -0.4 },
  revenueHint: { ...Type.small, color: Colors.textTertiary },
  chipRow: { paddingVertical: Spacing.lg, gap: 8 },
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
  rowName: { ...Type.h3, color: Colors.textPrimary },
  rowSub: { ...Type.small, color: Colors.textSecondary, marginTop: 3 },
});
