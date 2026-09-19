import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../../src/store/authStore';
import { categoryService, notificationService, productService, subscriptionService } from '../../../src/services/api';
import { Category, Notification, Product, Subscription } from '../../../src/models/types';
import SectionHeader from '../../../src/components/layout/SectionHeader';
import { Colors } from '../../../src/constants/colors';
import { Typography, Spacing, BorderRadius, Shadow } from '../../../src/constants/spacing';

type QuickCategory = {
  key: string;
  label: string;
  subtitle: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  route: '/(main)/catalog' | '/(main)/guides';
  categorySlug?: string;
};

type GuideCard = {
  key: string;
  title: string;
  description: string;
  image: string;
};

const QUICK_CATEGORIES: QuickCategory[] = [
  {
    key: 'hygiene',
    label: 'Hygiène',
    subtitle: 'Les essentiels du quotidien',
    icon: 'water-outline',
    route: '/(main)/catalog',
    categorySlug: 'feminine-hygiene',
  },
  {
    key: 'baby',
    label: 'Bébé',
    subtitle: 'Des soins doux pour bébé',
    icon: 'happy-outline',
    route: '/(main)/catalog',
    categorySlug: 'baby',
  },
  {
    key: 'postpartum',
    label: 'Postpartum',
    subtitle: 'Routines pour récupérer en douceur',
    icon: 'leaf-outline',
    route: '/(main)/guides',
  },
  {
    key: 'wellness',
    label: 'Bien-être',
    subtitle: 'Gestes simples pour se recentrer',
    icon: 'sparkles-outline',
    route: '/(main)/guides',
  },
];

const GUIDE_CARDS: GuideCard[] = [
  {
    key: 'postpartum-routine',
    title: 'Routine postpartum',
    description: "Soulager, hydrater et s'accorder un vrai temps calme.",
    image: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=900&q=80',
  },
  {
    key: 'maternity-bag',
    title: 'Préparer son sac maternité',
    description: 'Les indispensables à garder prêts avant le grand jour.',
    image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80',
  },
  {
    key: 'intimate-care',
    title: 'Hygiène intime quotidienne',
    description: 'Des habitudes simples, apaisantes et rassurantes.',
    image: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=900&q=80',
  },
];

function formatLongDate(date?: string): string {
  if (!date) return 'À planifier';
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
  });
}

function formatWeekday(date?: string): string {
  if (!date) return 'bientôt';
  return new Date(date).toLocaleDateString('fr-FR', {
    weekday: 'long',
  });
}

function formatToday(): string {
  return new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function getProductBenefits(product: Product): string[] {
  const tagBenefits = (product.tags || [])
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 2);

  if (tagBenefits.length > 0) {
    return tagBenefits;
  }

  const source = product.shortDescription || product.description || product.unit;
  return source
    .split(/[.,|]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2);
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [subsRes, notifRes, catsRes, featuredRes] = await Promise.allSettled([
        subscriptionService.getAll(),
        notificationService.getAll(),
        categoryService.getAll(),
        productService.getFeatured(),
      ]);

      if (subsRes.status === 'fulfilled') {
        setSubscriptions(subsRes.value.data);
      }

      if (notifRes.status === 'fulfilled') {
        setUnreadCount(notifRes.value.data.filter((n: Notification) => !n.isRead).length);
      }

      if (catsRes.status === 'fulfilled') {
        setCategories(catsRes.value.data);
      }

      if (featuredRes.status === 'fulfilled') {
        setRecommendedProducts(featuredRes.value.data.slice(0, 4));
      }
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
  };

  const activeSubscriptions = useMemo(
    () => subscriptions.filter((subscription) => subscription.status === 'active'),
    [subscriptions]
  );

  const nextDelivery = useMemo(
    () => [...activeSubscriptions].sort(
      (a, b) => new Date(a.nextDeliveryDate).getTime() - new Date(b.nextDeliveryDate).getTime()
    )[0],
    [activeSubscriptions]
  );

  const displayedProducts = useMemo(() => {
    if (recommendedProducts.length > 0) {
      return recommendedProducts;
    }

    const subscriptionProducts = activeSubscriptions
      .map((subscription) => subscription.product)
      .filter((product): product is Product => Boolean(product));

    return subscriptionProducts.slice(0, 4);
  }, [activeSubscriptions, recommendedProducts]);

  const quickCategories = useMemo(
    () => QUICK_CATEGORIES.map((item) => ({
      ...item,
      color: item.categorySlug
        ? categories.find((category) => category.slug === item.categorySlug)?.color || Colors.surfaceAlt
        : Colors.surfaceAlt,
    })),
    [categories]
  );

  const includedProducts = activeSubscriptions
    .map((subscription) => subscription.product?.name)
    .filter((name): name is string => Boolean(name))
    .slice(0, 3);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        testID="home-screen"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        <View style={styles.header}>
          <View style={styles.heroHalo} />

          <View style={styles.headerTopRow}>
            <View>
              <Text style={styles.todayLabel}>{formatToday()}</Text>
              <Text style={styles.screenTitle}>Bonjour {user?.firstName || 'Sarah'} 👋</Text>
              <Text style={styles.screenSubtitle}>
                {nextDelivery
                  ? `Votre prochaine livraison arrive ${formatWeekday(nextDelivery.nextDeliveryDate)}.`
                  : 'Créez un abonnement simple et recevez vos essentiels sans y penser.'}
              </Text>
            </View>

            <TouchableOpacity
              testID="home-notifications-btn"
              onPress={() => router.push('/(main)/notifications')}
              style={styles.notifBtn}
              activeOpacity={0.9}
            >
              <Ionicons name="notifications-outline" size={22} color={Colors.textPrimary} />
              {unreadCount > 0 ? (
                <View testID="home-notification-badge" style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          </View>

          <View style={styles.subscriptionCard}>
            <View style={styles.subscriptionTopRow}>
              <View style={styles.subscriptionTopCopy}>
                <Text style={styles.subscriptionEyebrow}>Prochaine livraison</Text>
                <Text style={styles.subscriptionDate}>
                  {nextDelivery ? formatLongDate(nextDelivery.nextDeliveryDate) : 'Votre routine en abonnement'}
                </Text>
                <Text style={styles.subscriptionMeta}>
                  {nextDelivery
                    ? `${activeSubscriptions.length} abonnement${activeSubscriptions.length > 1 ? 's' : ''} actif${activeSubscriptions.length > 1 ? 's' : ''}`
                    : 'Choisissez vos essentiels et personnalisez votre fréquence.'}
                </Text>
              </View>

              <View style={styles.subscriptionIconWrap}>
                <Ionicons name={nextDelivery ? 'bag-handle-outline' : 'sparkles-outline'} size={22} color={Colors.primary} />
              </View>
            </View>

            {nextDelivery ? (
              <>
                <View style={styles.subscriptionStatsRow}>
                  <View style={styles.softPill}>
                    <Ionicons name="cube-outline" size={14} color={Colors.primaryDark} />
                    <Text style={styles.softPillText}>{activeSubscriptions.length} produits inclus</Text>
                  </View>
                  <View style={styles.softPill}>
                    <Ionicons name="repeat-outline" size={14} color={Colors.primaryDark} />
                    <Text style={styles.softPillText}>Fréquence flexible</Text>
                  </View>
                </View>

                <View style={styles.productChipsRow}>
                  {includedProducts.map((name) => (
                    <View key={name} style={styles.productChip}>
                      <Text style={styles.productChipText} numberOfLines={1}>{name}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.subscriptionActionsRow}>
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => router.push('/(main)/subscriptions')}
                    activeOpacity={0.92}
                  >
                    <Text style={styles.primaryButtonText}>Modifier mon abonnement</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => router.push('/(main)/orders')}
                    activeOpacity={0.92}
                  >
                    <Text style={styles.secondaryButtonText}>Mes commandes</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <TouchableOpacity
                testID="home-start-subscription-btn"
                style={styles.primaryButton}
                onPress={() => router.push('/(main)/catalog')}
                activeOpacity={0.92}
              >
                <Text style={styles.primaryButtonText}>Créer mon abonnement</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.section}>
            <SectionHeader title="Catégories rapides" />
            <View style={styles.categoryGrid}>
              {quickCategories.map((item) => (
                <TouchableOpacity
                  key={item.key}
                  style={styles.categoryCard}
                  onPress={() => {
                    if (item.route === '/(main)/catalog' && item.categorySlug) {
                      router.push({ pathname: '/(main)/catalog', params: { category: item.categorySlug } } as any);
                      return;
                    }
                    router.push(item.route);
                  }}
                  activeOpacity={0.94}
                >
                  <View style={[styles.categoryIconWrap, { backgroundColor: item.color }]}>
                    <Ionicons name={item.icon} size={20} color={Colors.primaryDark} />
                  </View>
                  <Text style={styles.categoryTitle}>{item.label}</Text>
                  <Text style={styles.categorySubtitle} numberOfLines={2}>{item.subtitle}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <SectionHeader
              title="Recommandés pour vous"
              actionLabel="Voir le catalogue"
              onAction={() => router.push('/(main)/catalog')}
            />

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
              {displayedProducts.map((product) => {
                const benefits = getProductBenefits(product);
                const image = product.images?.[0];

                return (
                  <TouchableOpacity
                    key={product.id}
                    style={styles.recommendationCard}
                    onPress={() => router.push({ pathname: '/(main)/[id]', params: { id: product.id } } as any)}
                    activeOpacity={0.94}
                  >
                    {image ? (
                      <Image source={{ uri: image }} style={styles.recommendationImage} />
                    ) : (
                      <View style={[styles.recommendationImage, styles.recommendationImageFallback]}>
                        <Ionicons name="leaf-outline" size={28} color={Colors.primary} />
                      </View>
                    )}

                    <View style={styles.recommendationBody}>
                      {(product.isFeatured || product.isBestSeller) ? (
                        <View style={styles.recommendationBadge}>
                      <Text style={styles.recommendationBadgeText}>Recommandé abonnement</Text>
                        </View>
                      ) : null}

                      <Text style={styles.recommendationTitle} numberOfLines={2}>{product.name}</Text>
                      {benefits.map((benefit) => (
                        <Text key={`${product.id}-${benefit}`} style={styles.recommendationBenefit} numberOfLines={1}>
                          {benefit}
                        </Text>
                      ))}

                      <View style={styles.recommendationFooter}>
                        <Text style={styles.recommendationPrice}>{product.subscriptionPrice.toFixed(2)} €</Text>
                        <TouchableOpacity
                          style={styles.recommendationButton}
                          onPress={() => router.push({ pathname: '/(main)/[id]', params: { id: product.id } } as any)}
                          activeOpacity={0.9}
                        >
                          <Text style={styles.recommendationButtonText}>Ajouter à mon abonnement</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.section}>
            <SectionHeader
              title="Conseils & routines"
              actionLabel="Tout voir"
              onAction={() => router.push('/(main)/guides')}
            />

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
              {GUIDE_CARDS.map((card) => (
                <TouchableOpacity
                  key={card.key}
                  style={styles.guideCard}
                  onPress={() => router.push('/(main)/guides')}
                  activeOpacity={0.94}
                >
                  <Image source={{ uri: card.image }} style={styles.guideImage} />
                  <View style={styles.guideBody}>
                    <Text style={styles.guideTitle} numberOfLines={2}>{card.title}</Text>
                    <Text style={styles.guideDescription} numberOfLines={2}>{card.description}</Text>
                    <Text style={styles.guideLink}>Voir la routine</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.screen,
    paddingTop: Spacing.md,
  },
  heroHalo: {
    position: 'absolute',
    top: 10,
    right: 6,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: Colors.primaryPale,
    opacity: 0.8,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
  },
  todayLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textTransform: 'capitalize',
  },
  screenTitle: {
    ...Typography.screenTitle,
    color: Colors.textPrimary,
    marginTop: 6,
  },
  screenSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: 8,
    maxWidth: 270,
  },
  notifBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...Shadow.card,
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 10,
    color: Colors.textInverse,
    fontFamily: 'Poppins_600SemiBold',
  },
  subscriptionCard: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xxl,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadow.card,
  },
  subscriptionTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  subscriptionTopCopy: {
    flex: 1,
  },
  subscriptionEyebrow: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  subscriptionDate: {
    ...Typography.screenTitle,
    color: Colors.textPrimary,
    marginTop: 6,
  },
  subscriptionMeta: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: 6,
  },
  subscriptionIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subscriptionStatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: Spacing.md,
  },
  softPill: {
    height: 36,
    borderRadius: BorderRadius.pill,
    paddingHorizontal: 12,
    backgroundColor: Colors.surfaceAlt,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  softPillText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  productChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: Spacing.md,
  },
  productChip: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  productChipText: {
    ...Typography.bodySmall,
    color: Colors.textPrimary,
  },
  subscriptionActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: Spacing.lg,
  },
  primaryButton: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    borderWidth: 1,
    borderColor: Colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.button,
  },
  primaryButtonText: {
    ...Typography.button,
    color: Colors.textInverse,
  },
  secondaryButton: {
    minWidth: 118,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontFamily: 'Poppins_500Medium',
  },
  content: {
    paddingHorizontal: Spacing.screen,
    paddingBottom: Spacing.xl,
  },
  section: {
    marginTop: Spacing.xl,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  categoryCard: {
    width: '48%',
    minHeight: 136,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: 16,
    ...Shadow.card,
  },
  categoryIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  categoryTitle: {
    ...Typography.cardTitle,
    color: Colors.textPrimary,
  },
  categorySubtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 6,
  },
  horizontalList: {
    paddingRight: Spacing.screen,
    gap: 14,
  },
  recommendationCard: {
    width: 246,
    borderRadius: BorderRadius.xxl,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: 'hidden',
    ...Shadow.card,
  },
  recommendationImage: {
    width: '100%',
    height: 188,
    backgroundColor: Colors.surfaceAlt,
  },
  recommendationImageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  recommendationBody: {
    padding: 16,
  },
  recommendationBadge: {
    alignSelf: 'flex-start',
    borderRadius: BorderRadius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: Colors.primaryPale,
    marginBottom: 10,
  },
  recommendationBadgeText: {
    fontSize: 11,
    color: Colors.primaryDark,
    fontFamily: 'Poppins_500Medium',
  },
  recommendationTitle: {
    ...Typography.cardTitle,
    color: Colors.textPrimary,
  },
  recommendationBenefit: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  recommendationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.lg,
  },
  recommendationPrice: {
    ...Typography.button,
    color: Colors.textPrimary,
    fontFamily: 'Poppins_600SemiBold',
  },
  recommendationButton: {
    height: 40,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  recommendationButtonText: {
    ...Typography.bodySmall,
    color: Colors.textInverse,
    fontFamily: 'Poppins_500Medium',
  },
  guideCard: {
    width: 254,
    borderRadius: BorderRadius.xxl,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: 'hidden',
    ...Shadow.card,
  },
  guideImage: {
    width: '100%',
    height: 160,
  },
  guideBody: {
    padding: 16,
  },
  guideTitle: {
    ...Typography.cardTitle,
    color: Colors.textPrimary,
  },
  guideDescription: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 6,
  },
  guideLink: {
    ...Typography.bodySmall,
    color: Colors.accentSage,
    fontFamily: 'Poppins_500Medium',
    marginTop: 12,
  },
});
