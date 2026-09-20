import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Alert, Switch, RefreshControl, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { adminService } from '../../src/services/api';
import { Colors } from '../../src/constants/colors';
import { Radius, Spacing } from '../../src/constants/spacing';
import { Elevation, Font, Type } from '../../src/constants/theme';
import Screen from '../../src/components/ui/Screen';
import AppBadge from '../../src/components/ui/AppBadge';
import EmptyState from '../../src/components/ui/EmptyState';
import { SkeletonListItem } from '../../src/components/ui/SkeletonCard';
import StatTile from '../../src/components/ui/StatTile';

function formatDate(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await adminService.getUsers();
      setUsers(res.data);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, []);

  const handleToggle = (id: string, name: string, current: boolean) => {
    Alert.alert(
      current ? `Désactiver ${name} ?` : `Activer ${name} ?`,
      current ? 'Ce compte sera suspendu.' : 'Ce compte sera réactivé.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: current ? 'Désactiver' : 'Activer', onPress: async () => {
          try { await adminService.toggleUser(id); load(); }
          catch { Alert.alert('Erreur', 'Impossible de modifier'); }
        }},
      ]
    );
  };

  const filtered = users.filter(u =>
    `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase())
  );

  const customers = users.filter(u => u.role === 'customer');
  const admins = users.filter(u => u.role === 'admin');
  const suspended = users.filter(u => u.isActive === false);

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
        <Text style={styles.pageTitle}>Utilisateurs</Text>
        <Text style={styles.pageSubtitle}>{users.length} compte{users.length > 1 ? 's' : ''} enregistré{users.length > 1 ? 's' : ''}</Text>
      </View>

      <View style={styles.stats}>
        <StatTile icon="people-outline" label="Clientes" value={customers.length} tone="primary" style={styles.stat} />
        <StatTile icon="shield-checkmark-outline" label="Admins" value={admins.length} tone="sage" style={styles.stat} />
        <StatTile icon="pause-circle-outline" label="Suspendus" value={suspended.length} tone="amber" style={styles.stat} />
      </View>

      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={17} color={Colors.textTertiary} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Rechercher par nom ou email…"
          placeholderTextColor={Colors.textPlaceholder}
        />
        {search ? (
          <Ionicons name="close-circle" size={17} color={Colors.textTertiary} onPress={() => setSearch('')} />
        ) : null}
      </View>

      {loading ? (
        <View style={styles.list}>
          <SkeletonListItem />
          <SkeletonListItem />
          <SkeletonListItem />
        </View>
      ) : filtered.length === 0 ? (
        <EmptyState icon="search-outline" title="Aucun résultat" description="Essayez un autre nom ou email." />
      ) : (
        <View style={styles.list}>
          {filtered.map(item => {
            const initials = `${(item.firstName || '')[0] || ''}${(item.lastName || '')[0] || ''}`.toUpperCase();
            const isAdmin = item.role === 'admin';
            const active = item.isActive !== false;

            return (
              <View key={item.id} style={[styles.row, !active && styles.rowMuted]}>
                <View style={[styles.avatar, isAdmin && styles.avatarAdmin]}>
                  <Text style={styles.avatarText}>{initials || '?'}</Text>
                </View>

                <View style={styles.rowBody}>
                  <View style={styles.rowNameRow}>
                    <Text style={styles.rowName} numberOfLines={1}>
                      {item.firstName} {item.lastName}
                    </Text>
                    {isAdmin ? <AppBadge label="Admin" variant="primary" size="sm" /> : null}
                    {!active ? <AppBadge label="Suspendu" variant="neutral" size="sm" /> : null}
                  </View>
                  <Text style={styles.rowEmail} numberOfLines={1}>{item.email}</Text>
                  <Text style={styles.rowDate}>Inscrit le {formatDate(item.createdAt)}</Text>
                </View>

                {!isAdmin ? (
                  <Switch
                    value={active}
                    onValueChange={() => handleToggle(item.id, `${item.firstName}`, active)}
                    trackColor={{ false: Colors.borderMedium, true: Colors.primaryLight }}
                    thumbColor={active ? Colors.primary : Colors.textTertiary}
                  />
                ) : null}
              </View>
            );
          })}
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
  stats: { flexDirection: 'row', gap: 10, marginBottom: Spacing.md },
  stat: { flex: 1 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Elevation.xs,
  },
  searchInput: { flex: 1, ...Type.body, color: Colors.textPrimary, padding: 0 },
  list: { gap: 10, marginTop: Spacing.md },
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
  rowMuted: { opacity: 0.62 },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: Radius.lg,
    backgroundColor: Colors.accentSageSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarAdmin: { backgroundColor: Colors.primary },
  avatarText: { fontFamily: Font.semibold, fontSize: 15, color: Colors.textInverse },
  rowBody: { flex: 1 },
  rowNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  rowName: { ...Type.h3, color: Colors.textPrimary, flexShrink: 1 },
  rowEmail: { ...Type.small, color: Colors.textSecondary, marginTop: 3 },
  rowDate: { ...Type.small, color: Colors.textTertiary, marginTop: 1 },
});
