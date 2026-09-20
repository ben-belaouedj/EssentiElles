import React, { useMemo } from 'react';
import { Image, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../../src/components/ui/Screen';
import SectionHeader from '../../../src/components/layout/SectionHeader';
import ProductCard from '../../../src/components/cards/ProductCard';
import { HeroCard } from '../../../src/components/ui/GradientCard';
import PressableScale from '../../../src/components/ui/PressableScale';
import IconButton from '../../../src/components/ui/IconButton';
import AppBadge from '../../../src/components/ui/AppBadge';
import OfflineBanner from '../../../src/components/ui/OfflineBanner';
import { SkeletonBox, SkeletonRows } from '../../../src/components/ui/SkeletonCard';
import EmptyState from '../../../src/components/ui/EmptyState';
import { Chip, ChipRow } from '../../../src/components/ui/Chip';
import { useAuthStore } from '../../../src/store/authStore';
import { useCartStore } from '../../../src/store/cartStore';
import { useConnectivityStore } from '../../../src/store/connectivityStore';
import { useFavoritesStore } from '../../../src/store/favoritesStore';
import { usePreferencesStore } from '../../../src/store/preferencesStore';
import { useOfflineQuery } from '../../../src/hooks/useOfflineQuery';
import {
  categoryService,
  notificationService,
  offerService,
  orderService,
  productService,
  subscriptionService,
} from '../../../src/services/api';
import { recommendProducts } from '../../../src/services/recommendations';
import { buildReminders } from '../../../src/services/reminders';
import { Category, Notification, Offer, Order, Product, Subscription } from '../../../src/models/types';
import { GUIDES } from '../../../src/constants/guides';
import { Colors } from '../../../src/constants/colors';
import { Elevation, Font, Radius, Spacing, Type } from '../../../src/constants/theme';

const QUICK_CATEGORIES = [
  { key: 'all', label: 'Tout', icon: 'sparkles-outline' as const, slug: undefined },
  { key: 'hygiene', label: 'Hygiène', icon: 'water-outline' as const, slug: 'feminine-hygiene' },
  { key: 'baby', label: 'Bébé', icon: 'happy-outline' as const, slug: 'baby' },
  { key: 'postpartum', label: 'Postpartum', icon: 'leaf-outline' as const, slug: 'postpartum' },
  { key: 'wellness', label: 'Bien-être', icon: 'heart-outline' as const, slug: 'wellness' },
];

function formatLongDate(date?: string | null): string {
  if (!date) return 'À planifier';
  return new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const cartCount = useCartStore((s) => s.itemCount());
  const favoriteCount = useFavoritesStore((s) => s.ids.length);
  const favoriteIds = useFavoritesStore((s) => s.ids);
  const recentlyViewed = useFavoritesStore((s) => s.recentlyViewed);
  const savedTips = usePreferencesStore((s) => s.savedTips);
  const online = useConnectivityStore((s) => s.online);

  const subscriptions = useOfflineQuery<Subscription[]>(
    () => subscriptionService.getAll().then((res) => res.data as Subscription[]),
    { cacheKey: 'subscriptions' }
  );
  const categories = useOfflineQuery<Category[]>(
    () => categoryService.getAll().then((res) => res.data as Category[]),
    { cacheKey: 'categories' }
  );
  const featured = useOfflineQuery<Product[]>(
    () => productService.getFeatured().then((res) => res.data as Product[]),
    { cacheKey: 'products-featured' }
  );
  const newProducts = useOfflineQuery<Product[]>(
    () => productService.getAll({ sort: 'rating', limit: 6 }).then((res) => (res.data?.products ?? []) as Product[]),
    { cacheKey: 'products-top' }
  );
  const notifications = useOfflineQuery<Notification[]>(
    () => notificationService.getAll().then((res) => res.data as Notification[]),
    { cacheKey: 'notifications' }
  );
  const offers = useOfflineQuery<Offer[]>(
    () => offerService.getAll().then((res) => res.data as Offer[]),
    { cacheKey: 'offers' }
  );
  const orders = useOfflineQuery<Order[]>(
    () => orderService.getAll().then((res) => res.data as Order[]),
    { cacheKey: 'orders' }
  );
  const catalog = useOfflineQuery<Product[]>(
    () => productService.getAll({ limit: 60 }).then((res) => (res.data?.products ?? []) as Product[]),
    { cacheKey: 'products-all' }
  );

  const activeSubscriptions = useMemo(
    () => (subscriptions.data ?? []).filter((sub) => sub.status === 'active'),
    [subscriptions.data]
  );
  const nextDelivery = useMemo(() => buildReminders(activeSubscriptions)[0], [activeSubscriptions]);
  const unread = (notifications.data ?? []).filter((n) => !n.isRead).length;
  const rails = featured.data?.length ? featured.data : newProducts.data ?? [];

  const orderHistory = orders.data ?? [];
  const subscriptionHistory = subscriptions.data ?? [];

  /** Personalised rail — ranked from the local history (offline-friendly). */
  const recommendations = useMemo(() => {
    const ranked = recommendProducts(
      catalog.data?.length ? catalog.data : rails,
      {
        subscribedProductIds: subscriptionHistory.map((sub) => sub.productId),
        orderedProductIds: orderHistory.flatMap((order) => (order.items ?? []).map((item) => item.productId)),
        favoriteProductIds: favoriteIds,
        recentlyViewedIds: recentlyViewed,
      },
      8
    );
    return ranked;
  }, [catalog.data, rails, subscriptionHistory, orderHistory, favoriteIds, recentlyViewed]);

  const hasHistory =
    subscriptionHistory.length > 0 || orderHistory.length > 0 || favoriteIds.length > 0;
  const suggestedGuides = useMemo(() => {
    const saved = GUIDES.filter((guide) => savedTips.includes(guide.id));
    return saved.length ? saved.slice(0, 2) : GUIDES.slice(0, 2);
  }, [savedTips]);

  const refreshing =
    subscriptions.refreshing ||
    featured.refreshing ||
    notifications.refreshing ||
    newProducts.refreshing;

  const refresh = () => {
    void subscriptions.refresh();
    void categories.refresh();
    void featured.refresh();
    void newProducts.refresh();
    void notifications.refresh();
    void offers.refresh();
    void orders.refresh();
    void catalog.refresh();
  };

  const openCategory = (slug?: string) =>
    router.push((slug ? `/(main)/catalog?category=${slug}` : '/(main)/catalog') as never);

  return (
    <Screen
      scroll
      padded={false}
      tabBarSpace
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Colors.primary} />}
      contentContainerStyle={styles.scroll}
    >
      <View style={styles.padded}>
        <OfflineBanner visible={!online} onRetry={refresh} />

        {/* ─── Header ─────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(user?.firstName?.[0] ?? 'L').toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={styles.greeting}>Bonjour {user?.firstName ?? 'à vous'} 👋</Text>
              <Text style={styles.date}>{capitalize(formatLongDate(new Date().toISOString()))}</Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            <IconButton
              testID="home-cart-btn"
              name="bag-outline"
              onPress={() => router.push('/(main)/cart' as never)}
              accessibilityLabel="Panier"
            />
            <View>
              <IconButton
                testID="home-notifications-btn"
                name="notifications-outline"
                onPress={() => router.push('/(main)/notifications' as never)}
                accessibilityLabel="Notifications"
              />
              {unread > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        {/* ─── Next delivery hero ─────────────────────────────── */}
        {subscriptions.loading ? (
          <SkeletonBox height={186} radius={32} style={{ marginBottom: Spacing.lg }} />
        ) : nextDelivery ? (
          <View style={{ marginBottom: Spacing.lg }}>
            <HeroCard
              eyebrow="Prochaine livraison"
              icon="cube"
              colors="brandDeep"
              title={nextDelivery.title}
              subtitle={`${capitalize(formatLongDate(nextDelivery.dueDate))} · ${nextDelivery.productName}`}
              actions={[
                {
                  icon: 'options-outline',
                  label: 'Gérer',
                  onPress: () => router.push('/(main)/(subs)/subscriptions' as never),
                },
                {
                  icon: 'play-skip-forward-outline',
                  label: 'Reporter',
                  onPress: () => router.push('/(main)/(subs)/subscriptions' as never),
                },
              ]}
            >
              <View style={styles.heroStats}>
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatValue}>{activeSubscriptions.length}</Text>
                  <Text style={styles.heroStatLabel}>abonnement{activeSubscriptions.length > 1 ? 's' : ''}</Text>
                </View>
                <View style={styles.heroDivider} />
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatValue}>
                    {activeSubscriptions
                      .reduce((sum, sub) => sum + (sub.totalPrice ?? 0), 0)
                      .toFixed(2)}{' '}
                    €
                  </Text>
                  <Text style={styles.heroStatLabel}>par livraison</Text>
                </View>
              </View>
            </HeroCard>
          </View>
        ) : (
          <View style={{ marginBottom: Spacing.lg }}>
            <HeroCard
              eyebrow="Bienvenue"
              icon="sparkles"
              colors="brand"
              title="Créez votre première routine"
              subtitle="Choisissez vos essentiels, on s’occupe de la livraison — sans rupture."
              actions={[
                {
                  icon: 'grid-outline',
                  label: 'Explorer le catalogue',
                  onPress: () => router.push('/(main)/catalog' as never),
                },
              ]}
            />
          </View>
        )}

        {/* ─── Quick access ───────────────────────────────────── */}
        <View style={styles.quickRow}>
          <QuickTile
            icon="heart"
            label="Favoris"
            value={String(favoriteCount)}
            tone="rose"
            onPress={() => router.push('/(main)/favorites' as never)}
          />
          <QuickTile
            icon="bag"
            label="Panier"
            value={String(cartCount)}
            tone="sage"
            onPress={() => router.push('/(main)/cart' as never)}
          />
          <QuickTile
            icon="receipt"
            label="Commandes"
            value="Suivi"
            tone="ink"
            onPress={() => router.push('/(main)/(orders)/orders' as never)}
          />
        </View>
      </View>

      {/* ─── Categories ───────────────────────────────────────── */}
      <View style={styles.section}>
        <View style={styles.padded}>
          <SectionHeader
            accent
            title="Catégories"
            subtitle="Trouvez vos essentiels en un geste"
            actionLabel="Tout voir"
            onAction={() => openCategory()}
          />
        </View>
        <ChipRow contentStyle={styles.chipRow}>
          {QUICK_CATEGORIES.map((category) => (
            <Chip
              key={category.key}
              label={category.label}
              icon={category.icon}
              onPress={() => openCategory(category.slug)}
            />
          ))}
        </ChipRow>
      </View>

      {/* ─── Recommended ──────────────────────────────────────── */}
      <View style={styles.section}>
        <View style={styles.padded}>
          <SectionHeader
            accent
            title="Recommandé pour vous"
            subtitle={
              hasHistory
                ? 'D\u2019après votre routine et vos favoris'
                : 'Nos essentiels les plus appréciés'
            }
            actionLabel="Catalogue"
            onAction={() => openCategory()}
          />
        </View>
        {featured.loading && !recommendations.length ? (
          <View style={styles.railSkeleton}>
            <SkeletonRows count={2} />
          </View>
        ) : recommendations.length === 0 ? (
          <View style={styles.padded}>
            <EmptyState
              compact
              tone="sage"
              icon="leaf-outline"
              title="Catalogue en préparation"
              description="Vos recommandations apparaîtront ici dès que le catalogue sera disponible."
            />
          </View>
        ) : (
          <ChipRow contentStyle={styles.rail}>
            {recommendations.map(({ product, reason }) => (
              <View key={product.id} style={styles.railItem}>
                <View style={styles.reasonPill}>
                  <Text style={styles.reasonText} numberOfLines={1}>{reason}</Text>
                </View>
                <ProductCard
                  variant="rail"
                  product={product}
                  onPress={() => router.push(`/(main)/(catalog)/${product.id}` as never)}
                  onSubscribe={() => router.push(`/(main)/(subs)/plan?productId=${product.id}` as never)}
                />
              </View>
            ))}
          </ChipRow>
        )}
      </View>

      {/* ─── My routine ───────────────────────────────────────── */}
      {activeSubscriptions.length > 0 ? (
        <View style={[styles.section, styles.padded]}>
          <SectionHeader
            accent
            title="Votre routine"
            subtitle="Modifiable à tout moment"
            actionLabel="Gérer"
            onAction={() => router.push('/(main)/(subs)/subscriptions' as never)}
          />
          <View style={{ gap: 12 }}>
            {activeSubscriptions.slice(0, 3).map((sub) => (
              <SubscriptionMiniCard
                key={sub.id}
                subscription={sub}
                onPress={() => router.push('/(main)/(subs)/subscriptions' as never)}
              />
            ))}
          </View>
        </View>
      ) : null}

      {/* ─── Tips ─────────────────────────────────────────────── */}
      <View style={[styles.section, styles.padded]}>
        <SectionHeader
          accent
          title="Conseils du moment"
          subtitle={savedTips.length ? `${savedTips.length} conseil(s) sauvegardé(s)` : 'Rituels doux et réalistes'}
          actionLabel="Tous les conseils"
          onAction={() => router.push('/(main)/guides' as never)}
        />
        <View style={{ gap: 12 }}>
          {suggestedGuides.map((guide) => (
            <PressableScale
              key={guide.id}
              onPress={() => router.push('/(main)/guides' as never)}
              style={styles.guideCard}
              scaleTo={0.985}
            >
              <Image source={guide.image} style={styles.guideImage} resizeMode="cover" />
              <View style={styles.guideBody}>
                <AppBadge label={guide.category} variant={guide.tone === 'sage' ? 'sage' : 'primary'} />
                <Text style={styles.guideTitle} numberOfLines={2}>
                  {guide.title}
                </Text>
                <Text style={styles.guideMeta}>{guide.readingTime} min de lecture</Text>
              </View>
            </PressableScale>
          ))}
        </View>
      </View>

      {/* ─── Offers ───────────────────────────────────────────── */}
      {(offers.data?.length ?? 0) > 0 ? (
        <View style={[styles.section, styles.padded]}>
          <SectionHeader
            accent
            title="Offres du moment"
            actionLabel="Voir tout"
            onAction={() => router.push('/(main)/offers' as never)}
          />
          <ChipRow contentStyle={{ paddingHorizontal: 0, gap: 12 }}>
            {(offers.data ?? []).slice(0, 4).map((offer) => (
              <PressableScale
                key={offer.id}
                onPress={() => router.push('/(main)/offers' as never)}
                style={[styles.offer, { backgroundColor: offer.color || Colors.primaryPale }]}
              >
                <AppBadge label={`-${offer.discount}%`} variant="ink" />
                <Text style={styles.offerTitle} numberOfLines={2}>
                  {offer.title}
                </Text>
                <Text style={styles.offerDesc} numberOfLines={2}>
                  {offer.description}
                </Text>
              </PressableScale>
            ))}
          </ChipRow>
        </View>
      ) : null}
    </Screen>
  );
}

function QuickTile({
  icon,
  label,
  value,
  tone,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  tone: 'rose' | 'sage' | 'ink';
  onPress: () => void;
}) {
  const palette =
    tone === 'sage'
      ? { bg: Colors.accentSageSoft, fg: '#5F7358' }
      : tone === 'ink'
        ? { bg: Colors.surfaceAlt, fg: Colors.textPrimary }
        : { bg: Colors.primaryPale, fg: Colors.primaryDark };

  return (
    <PressableScale onPress={onPress} style={styles.quickTile} lift>
      <View style={[styles.quickIcon, { backgroundColor: palette.bg }]}>
        <Ionicons name={icon} size={17} color={palette.fg} />
      </View>
      <Text style={styles.quickValue}>{value}</Text>
      <Text style={styles.quickLabel}>{label}</Text>
    </PressableScale>
  );
}

function SubscriptionMiniCard({
  subscription,
  onPress,
}: {
  subscription: Subscription;
  onPress: () => void;
}) {
  const product = subscription.product;
  const days = subscription.nextDeliveryDate
    ? Math.max(
        0,
        Math.round(
          (new Date(subscription.nextDeliveryDate).getTime() - Date.now()) / 86_400_000
        )
      )
    : null;

  return (
    <PressableScale onPress={onPress} style={styles.subCard} scaleTo={0.985}>
      <View style={styles.subImageWrap}>
        {product?.images?.[0] ? (
          <Image source={{ uri: product.images[0] }} style={styles.subImage} resizeMode="cover" />
        ) : (
          <View style={[styles.subImage, styles.subPlaceholder]}>
            <Ionicons name="repeat" size={20} color={Colors.primaryDark} />
          </View>
        )}
      </View>

      <View style={styles.subBody}>
        <Text style={styles.subTitle} numberOfLines={1}>
          {product?.name ?? 'Abonnement'}
        </Text>
        <Text style={styles.subMeta}>
          ×{subscription.quantity} ·{' '}
          {subscription.frequency === 'weekly'
            ? 'chaque semaine'
            : subscription.frequency === 'biweekly'
              ? 'toutes les 2 semaines'
              : 'chaque mois'}
        </Text>
        <View style={styles.subFooter}>
          <AppBadge
            label={days === null ? 'À planifier' : days <= 0 ? "Aujourd'hui" : `dans ${days} j`}
            variant={days !== null && days <= 2 ? 'warning' : 'sage'}
            icon="time-outline"
          />
          <Text style={styles.subPrice}>{(subscription.totalPrice ?? 0).toFixed(2)} €</Text>
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingTop: Spacing.sm },
  padded: { paddingHorizontal: Spacing.screen },
  section: { marginTop: Spacing.xl },
  chipRow: { paddingLeft: Spacing.screen, paddingRight: Spacing.screen },
  rail: { paddingHorizontal: Spacing.screen, gap: 12 },
  railItem: { width: 176, gap: 6 },
  reasonPill: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primaryPale,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    maxWidth: 168,
  },
  reasonText: { ...Type.caption, color: Colors.primaryDark },
  railSkeleton: { paddingHorizontal: Spacing.screen },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.primaryPale,
    borderWidth: 1,
    borderColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: Font.bold, fontSize: 18, color: Colors.primaryDark },
  greeting: { ...Type.h3, color: Colors.textPrimary },
  date: { ...Type.small, color: Colors.textSecondary, marginTop: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { fontFamily: Font.bold, fontSize: 10, color: Colors.textInverse },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: Radius.lg,
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
  },
  heroStat: { flex: 1 },
  heroStatValue: { fontFamily: Font.semibold, fontSize: 16, color: Colors.textInverse },
  heroStatLabel: { fontFamily: Font.regular, fontSize: 11, color: 'rgba(255,255,255,0.82)' },
  heroDivider: { width: 1, height: 26, backgroundColor: 'rgba(255,255,255,0.25)', marginHorizontal: 12 },
  quickRow: { flexDirection: 'row', gap: 10 },
  quickTile: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.sm,
    ...Elevation.xs,
  },
  quickIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickValue: { ...Type.h3, color: Colors.textPrimary },
  quickLabel: { ...Type.small, color: Colors.textSecondary },
  guideCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: 'hidden',
    ...Elevation.xs,
  },
  guideImage: { width: 96, height: 108 },
  guideBody: { flex: 1, padding: Spacing.sm, gap: 6, justifyContent: 'center' },
  guideTitle: { ...Type.bodyStrong, color: Colors.textPrimary },
  guideMeta: { ...Type.small, color: Colors.textTertiary },
  offer: {
    width: 200,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  offerTitle: { ...Type.bodyStrong, color: Colors.textPrimary },
  offerDesc: { ...Type.small, color: Colors.textSecondary },
  subCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.sm,
    ...Elevation.xs,
  },
  subImageWrap: {
    width: 62,
    height: 62,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceAlt,
  },
  subImage: { width: '100%', height: '100%' },
  subPlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primaryPale },
  subBody: { flex: 1, gap: 3 },
  subTitle: { ...Type.bodyStrong, color: Colors.textPrimary },
  subMeta: { ...Type.small, color: Colors.textSecondary },
  subFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  subPrice: { ...Type.price, fontSize: 14.5, color: Colors.textPrimary },
});
