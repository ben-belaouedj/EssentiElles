import React from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../../src/components/ui/Screen';
import IconButton from '../../../src/components/ui/IconButton';
import StatusBadge from '../../../src/components/ui/StatusBadge';
import EmptyState from '../../../src/components/ui/EmptyState';
import PressableScale from '../../../src/components/ui/PressableScale';
import { SkeletonRows } from '../../../src/components/ui/SkeletonCard';
import OfflineBanner from '../../../src/components/ui/OfflineBanner';
import { useOfflineQuery } from '../../../src/hooks/useOfflineQuery';
import { invoiceService } from '../../../src/services/api';
import { Invoice } from '../../../src/models/types';
import { Colors } from '../../../src/constants/colors';
import { Elevation, Font, Radius, Spacing, Type } from '../../../src/constants/theme';

function formatDate(value?: string) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function InvoicesScreen() {
  const router = useRouter();
  const query = useOfflineQuery<Invoice[]>(
    () => invoiceService.getAll().then((res) => res.data as Invoice[]),
    { cacheKey: 'invoices' }
  );

  const paid = (query.data ?? []).filter((invoice) => invoice.status === 'paid');
  const totalPaid = paid.reduce((sum, invoice) => sum + invoice.total, 0);

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
          <Text style={styles.title}>Factures</Text>
          <Text style={styles.subtitle}>
            {paid.length} facture{paid.length > 1 ? 's' : ''} payée{paid.length > 1 ? 's' : ''} ·{' '}
            {totalPaid.toFixed(2)} €
          </Text>
        </View>
      </View>

      <OfflineBanner cacheOnly onRetry={() => void query.refresh()} />

      {query.loading && !query.data ? (
        <SkeletonRows count={3} />
      ) : (query.data ?? []).length === 0 ? (
        <EmptyState
          icon="document-text-outline"
          tone="sage"
          title="Aucune facture"
          description="Vos factures apparaîtront ici après votre première commande."
          actionLabel="Découvrir le catalogue"
          onAction={() => router.push('/(main)/catalog' as never)}
        />
      ) : (
        <View style={{ gap: 12 }}>
          {(query.data ?? []).map((invoice) => (
            <PressableScale
              key={invoice.id}
              onPress={() => router.push('/(main)/(orders)/orders' as never)}
              style={styles.card}
              scaleTo={0.985}
            >
              <View style={styles.cardTop}>
                <View style={styles.iconWrap}>
                  <Ionicons name="document-text" size={17} color={Colors.primaryDark} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.number}>{invoice.invoiceNumber}</Text>
                  <Text style={styles.date}>Émise le {formatDate(invoice.createdAt)}</Text>
                </View>
                <StatusBadge status={invoice.status} small />
              </View>

              <Text style={styles.items} numberOfLines={2}>
                {invoice.items.map((item) => `${item.productName} ×${item.quantity}`).join(' · ')}
              </Text>

              <View style={styles.cardFooter}>
                <View>
                  <Text style={styles.footerLabel}>
                    dont TVA {invoice.tax.toFixed(2)} €
                  </Text>
                  <Text style={styles.footerValue}>{invoice.total.toFixed(2)} €</Text>
                </View>
                <View style={styles.download}>
                  <Ionicons name="download-outline" size={14} color={Colors.primaryDark} />
                  <Text style={styles.downloadText}>Télécharger</Text>
                </View>
              </View>
            </PressableScale>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: Spacing.lg },
  title: { ...Type.h1, color: Colors.textPrimary },
  subtitle: { ...Type.small, color: Colors.textSecondary, marginTop: 2 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xxl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Elevation.sm,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: Colors.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  number: { fontFamily: Font.semibold, fontSize: 14, color: Colors.textPrimary },
  date: { ...Type.small, color: Colors.textSecondary, marginTop: 1 },
  items: { ...Type.small, color: Colors.textSecondary },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: Spacing.sm,
  },
  footerLabel: { ...Type.small, color: Colors.textTertiary },
  footerValue: { ...Type.price, color: Colors.textPrimary },
  download: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.primaryPale,
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    height: 32,
  },
  downloadText: { fontFamily: Font.semibold, fontSize: 12, color: Colors.primaryDark },
});
