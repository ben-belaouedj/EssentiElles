import React from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../src/components/ui/Screen';
import IconButton from '../../src/components/ui/IconButton';
import PressableScale from '../../src/components/ui/PressableScale';
import EmptyState from '../../src/components/ui/EmptyState';
import AppBadge from '../../src/components/ui/AppBadge';
import { SkeletonRows } from '../../src/components/ui/SkeletonCard';
import { useOfflineQuery } from '../../src/hooks/useOfflineQuery';
import { offerService } from '../../src/services/api';
import { Offer } from '../../src/models/types';
import { Colors } from '../../src/constants/colors';
import { Elevation, Font, Radius, Spacing, Type } from '../../src/constants/theme';

export default function OffersScreen() {
  const router = useRouter();
  const query = useOfflineQuery<Offer[]>(
    () => offerService.getAll().then((res) => res.data as Offer[]),
    { cacheKey: 'offers' }
  );

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
          <Text style={styles.title}>Offres du moment</Text>
          <Text style={styles.subtitle}>Profitez-en avant la fin de la promo</Text>
        </View>
      </View>

      {query.loading && !query.data ? (
        <SkeletonRows count={2} />
      ) : (query.data ?? []).length === 0 ? (
        <EmptyState
          icon="pricetag-outline"
          tone="sage"
          title="Pas d’offre en cours"
          description="Revenez bientôt : nous préparons de belles surprises."
          actionLabel="Voir le catalogue"
          onAction={() => router.push('/(main)/catalog' as never)}
        />
      ) : (
        <View style={{ gap: 14 }}>
          {(query.data ?? []).map((offer) => (
            <PressableScale
              key={offer.id}
              onPress={() => router.push('/(main)/catalog' as never)}
              style={[styles.card, { backgroundColor: offer.color || Colors.primaryPale }]}
              scaleTo={0.985}
            >
              <View style={styles.cardTop}>
                <AppBadge
                  label={offer.badgeText || `-${offer.discount}%`}
                  variant="ink"
                  icon="pricetag"
                  size="md"
                />
                <View style={styles.discountCircle}>
                  <Text style={styles.discountValue}>{offer.discount}%</Text>
                  <Text style={styles.discountLabel}>économisés</Text>
                </View>
              </View>

              <Text style={styles.cardTitle}>{offer.title}</Text>
              <Text style={styles.cardDescription}>{offer.description}</Text>

              <View style={styles.cta}>
                <Text style={styles.ctaText}>J’en profite</Text>
                <Ionicons name="arrow-forward" size={14} color={Colors.textPrimary} />
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
    borderRadius: Radius.xxl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.lg,
    gap: 8,
    ...Elevation.sm,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  discountCircle: { alignItems: 'center' },
  discountValue: { fontFamily: Font.bold, fontSize: 22, color: Colors.textPrimary },
  discountLabel: { fontFamily: Font.medium, fontSize: 10.5, color: Colors.textSecondary },
  cardTitle: { ...Type.h2, color: Colors.textPrimary },
  cardDescription: { ...Type.small, color: Colors.textSecondary },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: Radius.full,
    paddingHorizontal: 14,
    height: 36,
    marginTop: 4,
  },
  ctaText: { fontFamily: Font.semibold, fontSize: 12.5, color: Colors.textPrimary },
});
