import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { adminService } from '../../src/services/api';
import { Colors } from '../../src/constants/colors';
import { Typography, Spacing, BorderRadius, Shadow } from '../../src/constants/spacing';
import { Elevation, Type } from '../../src/constants/theme';

interface Stats {
  usersCount: number;
  activeSubscriptions: number;
  ordersCount: number;
  openTickets: number;
  totalRevenue: number;
}

const KPI_CONFIG = [
  { key: 'usersCount',           label: 'Clients',           icon: 'people-outline',   color: Colors.info,    bg: Colors.infoBg },
  { key: 'activeSubscriptions', label: 'Abonn. actifs',     icon: 'repeat-outline',   color: Colors.primary, bg: Colors.primaryPale },
  { key: 'ordersCount',         label: 'Commandes',         icon: 'bag-outline',      color: Colors.warning, bg: Colors.warningBg },
  { key: 'openTickets',         label: 'Tickets ouverts',   icon: 'chatbubble-outline', color: Colors.error, bg: Colors.errorBg },
];

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await adminService.getDashboard();
      setStats(res.data);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, []);

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />
      }
    >
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Tableau de bord</Text>
        <Text style={styles.pageSubtitle}>Bienvenue sur le panel admin Livrella</Text>
      </View>

      {/* Revenue highlight */}
      <LinearGradient
        colors={['#C6949D', '#B5838D', '#8F5A64']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.revenueCard}
      >
        <View>
          <Text style={styles.revenueLabel}>Chiffre d’affaires total</Text>
          <Text style={styles.revenueAmount}>
            {(stats?.totalRevenue ?? 0).toFixed(2)} €
          </Text>
          <Text style={styles.revenueHint}>Toutes commandes confondues</Text>
        </View>
        <View style={styles.revenueIcon}>
          <Ionicons name="trending-up" size={26} color={Colors.textInverse} />
        </View>
      </LinearGradient>

      {/* KPI Grid */}
      <View style={styles.kpiGrid}>
        {KPI_CONFIG.map(kpi => (
          <View key={kpi.key} style={[styles.kpiCard, { backgroundColor: kpi.bg }]}>
            <View style={[styles.kpiIconWrap, { backgroundColor: kpi.color + '22' }]}>
              <Ionicons name={kpi.icon as any} size={22} color={kpi.color} />
            </View>
            <Text style={styles.kpiValue}>
              {(stats as any)?.[kpi.key] ?? 0}
            </Text>
            <Text style={styles.kpiLabel}>{kpi.label}</Text>
          </View>
        ))}
      </View>

      {/* Quick actions */}
      <Text style={styles.sectionTitle}>Actions rapides</Text>
      <View style={styles.actionsRow}>
        {[
          { label: 'Ajouter un produit', icon: 'add-circle-outline', path: '/admin/products' },
          { label: 'Voir les commandes', icon: 'bag-outline', path: '/admin/orders' },
          { label: 'Gérer utilisateurs', icon: 'people-outline', path: '/admin/users' },
        ].map(action => (
          <TouchableOpacity
            key={action.path}
            style={styles.actionCard}
            onPress={() => router.push(action.path as any)}
          >
            <Ionicons name={action.icon as any} size={24} color={Colors.primary} />
            <Text style={styles.actionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  page: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xl },
  pageHeader: { marginBottom: Spacing.lg },
  pageTitle: { ...Typography.h3, color: Colors.textPrimary },
  pageSubtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  revenueCard: {
    overflow: 'hidden',
    ...Elevation.brand,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  revenueLabel: { fontSize: 12.5, color: 'rgba(255,255,255,0.88)', fontFamily: 'Poppins_500Medium' },
  revenueHint: { fontSize: 11.5, color: 'rgba(255,255,255,0.72)', marginTop: 4, fontFamily: 'Poppins_400Regular' },
  revenueAmount: { fontSize: 32, fontFamily: 'Poppins_700Bold', color: Colors.textInverse, marginTop: 4 },
  revenueIcon: {
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center', justifyContent: 'center',
  },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: Spacing.lg },
  kpiCard: {
    width: '47%', borderRadius: BorderRadius.xxl,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.borderLight,
    ...Elevation.sm,
  },
  kpiIconWrap: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  kpiValue: { ...Type.h1, color: Colors.textPrimary },
  kpiLabel: { fontSize: 12, color: Colors.textSecondary, fontFamily: 'Poppins_500Medium', marginTop: 2 },
  sectionTitle: { ...Typography.subtitle, color: Colors.textPrimary, marginBottom: Spacing.sm },
  actionsRow: { flexDirection: 'row', gap: 12 },
  actionCard: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    padding: Spacing.md, alignItems: 'center', gap: 8, ...Shadow.card,
  },
  actionLabel: { fontSize: 12, textAlign: 'center', color: Colors.textSecondary, fontFamily: 'Poppins_500Medium' },
});
