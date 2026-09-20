import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../../src/components/ui/Screen';
import IconButton from '../../../src/components/ui/IconButton';
import AppBadge from '../../../src/components/ui/AppBadge';
import PrimaryButton from '../../../src/components/ui/PrimaryButton';
import QuantityStepper from '../../../src/components/ui/QuantityStepper';
import { Chip } from '../../../src/components/ui/Chip';
import EmptyState from '../../../src/components/ui/EmptyState';
import ProductCard from '../../../src/components/cards/ProductCard';
import SectionHeader from '../../../src/components/layout/SectionHeader';
import { complementaryProducts } from '../../../src/services/recommendations';
import { SkeletonBox } from '../../../src/components/ui/SkeletonCard';
import { productService } from '../../../src/services/api';
import { Product } from '../../../src/models/types';
import { useCartStore } from '../../../src/store/cartStore';
import { useFavoritesStore } from '../../../src/store/favoritesStore';
import { Colors } from '../../../src/constants/colors';
import { Elevation, Font, Radius, Spacing, Type } from '../../../src/constants/theme';

const FREQUENCIES: { key: 'weekly' | 'biweekly' | 'monthly'; label: string; hint: string }[] = [
  { key: 'weekly', label: 'Chaque semaine', hint: 'Jamais à court' },
  { key: 'biweekly', label: 'Toutes les 2 semaines', hint: 'Le bon équilibre' },
  { key: 'monthly', label: 'Chaque mois', hint: 'Le plus souple' },
];

export default function ProductDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [similar, setSimilar] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [frequency, setFrequency] = useState<'weekly' | 'biweekly' | 'monthly'>('monthly');
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const addItem = useCartStore((s) => s.addItem);
  const ids = useFavoritesStore((s) => s.ids);
  const toggleFavorite = useFavoritesStore((s) => s.toggle);
  const trackView = useFavoritesStore((s) => s.trackView);
  const isFavorite = product ? ids.includes(product.id) : false;

  const load = async (mode: 'initial' | 'refresh') => {
    if (!id) return;
    if (mode === 'refresh') setRefreshing(true);
    try {
      const res = await productService.getById(id);
      const data = res.data as Product;
      setProduct(data);
      setFrequency(data.availableFrequencies?.[0] ?? 'monthly');
      setError(null);
      void trackView(data.id);
      void productService
        .getAll({ limit: 8 })
        .then((r) => {
          const list = ((r.data?.products ?? []) as Product[]).filter((p) => p.id !== data.id);
          // Prefer shared tags + complementary categories over an arbitrary slice.
          setSimilar(complementaryProducts(data, list, 6));
        })
        .catch(() => setSimilar([]));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Produit indisponible');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void load('initial');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const benefits = useMemo(() => {
    if (!product) return [];
    const tags = (product.tags ?? []).filter(Boolean).slice(0, 4);
    if (tags.length) return tags;
    return (product.shortDescription || product.description || '')
      .split(/[.,|]/)
      .map((part) => part.trim())
      .filter(Boolean)
      .slice(0, 4);
  }, [product]);

  const savings = product ? Math.max(0, product.price - product.subscriptionPrice) : 0;
  const availableFrequencies: string[] = product?.availableFrequencies?.length
    ? product.availableFrequencies
    : ['monthly'];

  if (loading) {
    return (
      <Screen>
        <SkeletonBox height={320} radius={32} />
        <SkeletonBox height={28} width="70%" style={{ marginTop: Spacing.lg }} />
        <SkeletonBox height={18} width="45%" style={{ marginTop: 10 }} />
        <SkeletonBox height={120} radius={24} style={{ marginTop: Spacing.lg }} />
      </Screen>
    );
  }

  if (error || !product) {
    return (
      <Screen>
        <IconButton name="arrow-back" onPress={() => router.back()} style={{ marginBottom: Spacing.md }} />
        <EmptyState
          tone="sage"
          icon="alert-circle-outline"
          title="Produit indisponible"
          description={error ?? 'Ce produit n’est plus au catalogue.'}
          actionLabel="Retour au catalogue"
          onAction={() => router.replace('/(main)/catalog' as never)}
        />
      </Screen>
    );
  }

  const inStock = product.inStock !== false && product.stockCount > 0;
  const lowStock = inStock && product.stockCount <= 5;

  return (
    <View style={styles.root}>
      <Screen
        scroll
        padded={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void load('refresh')}
            tintColor={Colors.primary}
          />
        }
        contentContainerStyle={styles.scroll}
      >
        {/* ─── Visual ─────────────────────────────────────────── */}
        <View style={styles.imageWrap}>
          {product.images?.[0] ? (
            <Image source={{ uri: product.images[0] }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={[styles.image, styles.placeholder]}>
              <Text style={styles.placeholderText}>{product.name.charAt(0)}</Text>
            </View>
          )}
          <LinearGradient
            colors={['rgba(43,45,66,0.38)', 'rgba(43,45,66,0)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.imageTopScrim}
            pointerEvents="none"
          />
          <View style={styles.imageActions}>
            <IconButton
              testID="product-back-btn"
              name="arrow-back"
              onPress={() => router.back()}
              accessibilityLabel="Retour"
            />
            <IconButton
              testID="product-detail-favorite"
              name={isFavorite ? 'heart' : 'heart-outline'}
              variant={isFavorite ? 'brand' : 'glass'}
              onPress={() => void toggleFavorite(product)}
              accessibilityLabel="Favori"
            />
          </View>
          <View style={styles.imageBadges}>
            {product.discountPercentage > 0 ? (
              <AppBadge
                label={`-${Math.round(product.discountPercentage)}% avec l'abonnement`}
                variant="glass"
                size="md"
              />
            ) : null}
          </View>
        </View>

        {/* ─── Body ───────────────────────────────────────────── */}
        <View style={styles.body}>
          <Text style={styles.brand}>{product.brand}</Text>
          <Text style={styles.name}>{product.name}</Text>

          <View style={styles.metaRow}>
            {product.rating ? (
              <View style={styles.rating}>
                <Ionicons name="star" size={13} color={Colors.warning} />
                <Text style={styles.ratingText}>
                  {product.rating.toFixed(1)}
                  {product.reviewCount ? ` · ${product.reviewCount} avis` : ''}
                </Text>
              </View>
            ) : null}
            <AppBadge
              label={lowStock ? `Plus que ${product.stockCount} en stock` : inStock ? 'En stock' : 'Bientôt de retour'}
              variant={lowStock ? 'warning' : inStock ? 'sage' : 'neutral'}
              icon={lowStock ? 'alert-circle-outline' : 'checkmark-circle-outline'}
            />
          </View>

          {/* Price card */}
          <View style={styles.priceCard}>
            <View style={styles.priceTop}>
              <View>
                <Text style={styles.priceLabel}>Prix abonné</Text>
                <Text style={styles.priceValue}>{product.subscriptionPrice.toFixed(2)} €</Text>
                <Text style={styles.priceUnit}>/ {product.unit || 'livraison'}</Text>
              </View>
              <View style={styles.priceRight}>
                <Text style={styles.priceNormal}>{product.price.toFixed(2)} €</Text>
                <Text style={styles.priceNormalLabel}>achat unique</Text>
              </View>
            </View>

            {savings > 0.01 ? (
              <View style={styles.savingRow}>
                <Ionicons name="pricetag" size={13} color={Colors.success} />
                <Text style={styles.savingText}>
                  Vous économisez {savings.toFixed(2)} € à chaque livraison
                </Text>
              </View>
            ) : null}
          </View>

          {/* Frequency */}
          <Text style={styles.blockTitle}>Fréquence de livraison</Text>
          <View style={styles.frequencyList}>
            {FREQUENCIES.filter((f) => availableFrequencies.includes(f.key)).map((option) => {
              const active = frequency === option.key;
              return (
                <Chip
                  key={option.key}
                  label={option.label}
                  active={active}
                  onPress={() => setFrequency(option.key)}
                  testID={`product-frequency-${option.key}`}
                />
              );
            })}
          </View>

          <View style={styles.quantityRow}>
            <View>
              <Text style={styles.blockTitle}>Quantité</Text>
              <Text style={styles.quantityHint}>Ajustable à tout moment</Text>
            </View>
            <QuantityStepper value={quantity} onChange={setQuantity} max={12} />
          </View>

          {/* Description */}
          <Text style={styles.blockTitle}>Description</Text>
          <Text style={styles.description}>{product.description || product.shortDescription}</Text>

          {/* Benefits */}
          {benefits.length ? (
            <View style={styles.benefits}>
              <Text style={styles.blockTitle}>Pourquoi vous allez aimer</Text>
              {benefits.map((benefit) => (
                <View key={benefit} style={styles.benefitRow}>
                  <View style={styles.benefitIcon}>
                    <Ionicons name="checkmark" size={12} color={Colors.textInverse} />
                  </View>
                  <Text style={styles.benefitText}>{benefit}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* Info blocks */}
          <View style={styles.infoRow}>
            <InfoTile icon="cube-outline" title="Livraison offerte" subtitle="Sur tous les abonnements" />
            <InfoTile icon="refresh-outline" title="Sans engagement" subtitle="Pause ou annulation" />
            <InfoTile icon="shield-checkmark-outline" title="Paiement sécurisé" subtitle="Données chiffrées" />
          </View>

          {similar.length ? (
            <View style={styles.similar}>
              <SectionHeader
                accent
                title="Souvent associé"
                actionLabel="Catalogue"
                onAction={() => router.push('/(main)/catalog' as never)}
              />
            </View>
          ) : null}
        </View>

        {similar.length ? (
          <View style={styles.similarRail}>
            {similar.map((item) => (
              <ProductCard
                key={item.id}
                variant="rail"
                product={item}
                onPress={() => router.push(`/(main)/(catalog)/${item.id}` as never)}
                onSubscribe={() => router.push(`/(main)/(subs)/plan?productId=${item.id}` as never)}
              />
            ))}
          </View>
        ) : null}
      </Screen>

      {/* ─── Sticky CTA ───────────────────────────────────────── */}
      <View style={styles.stickyBar}>
        <View style={styles.stickyInfo}>
          <Text style={styles.stickyLabel}>Total abonné</Text>
          <Text style={styles.stickyPrice}>
            {(product.subscriptionPrice * quantity).toFixed(2)} €
          </Text>
        </View>
        <PrimaryButton
          testID="product-add-to-cart-btn"
          label={added ? 'Ajouté ✓' : 'Panier'}
          variant="secondary"
          size="md"
          fullWidth={false}
          icon={added ? undefined : 'bag-add-outline'}
          onPress={() => {
            addItem(product, quantity);
            setAdded(true);
            setTimeout(() => setAdded(false), 1600);
          }}
          style={styles.secondaryCta}
        />
        <PrimaryButton
          testID="product-subscribe-cta"
          label="S’abonner"
          size="md"
          fullWidth={false}
          icon="repeat-outline"
          onPress={() =>
            router.push(
              `/(main)/(subs)/plan?productId=${product.id}&frequency=${frequency}&quantity=${quantity}` as never
            )
          }
          style={styles.primaryCta}
        />
      </View>
    </View>
  );
}

function InfoTile({
  icon,
  title,
  subtitle,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.infoTile}>
      <Ionicons name={icon} size={16} color={Colors.primaryDark} />
      <Text style={styles.infoTitle}>{title}</Text>
      <Text style={styles.infoSubtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: 150 },
  imageWrap: { height: 340, backgroundColor: Colors.surfaceAlt },
  image: { width: '100%', height: '100%' },
  placeholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primaryPale },
  placeholderText: { fontFamily: Font.bold, fontSize: 60, color: Colors.primaryDark },
  imageTopScrim: { position: 'absolute', top: 0, left: 0, right: 0, height: 150 },
  imageActions: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.screen,
    right: Spacing.screen,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  imageBadges: { position: 'absolute', bottom: Spacing.lg, left: Spacing.screen },
  body: {
    paddingHorizontal: Spacing.screen,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  brand: { ...Type.caption, color: Colors.textTertiary, textTransform: 'uppercase' },
  name: { ...Type.h1, color: Colors.textPrimary, marginTop: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { ...Type.smallStrong, color: Colors.textSecondary },
  priceCard: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xxl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.lg,
    ...Elevation.sm,
  },
  priceTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  priceLabel: { ...Type.caption, color: Colors.textTertiary, textTransform: 'uppercase' },
  priceValue: { ...Type.display, color: Colors.textPrimary, marginTop: 2 },
  priceUnit: { ...Type.small, color: Colors.textSecondary },
  priceRight: { alignItems: 'flex-end' },
  priceNormal: {
    ...Type.bodyStrong,
    color: Colors.textTertiary,
    textDecorationLine: 'line-through',
  },
  priceNormalLabel: { ...Type.small, color: Colors.textTertiary },
  savingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.md,
    backgroundColor: Colors.successBg,
    borderRadius: Radius.lg,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  savingText: { ...Type.smallStrong, color: '#4F7A61' },
  blockTitle: { ...Type.h3, color: Colors.textPrimary, marginTop: Spacing.lg },
  frequencyList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: Spacing.sm },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  quantityHint: { ...Type.small, color: Colors.textSecondary, marginTop: 2 },
  description: { ...Type.body, color: Colors.textSecondary, marginTop: Spacing.sm },
  benefits: { marginTop: Spacing.sm },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: Spacing.sm },
  benefitIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitText: { ...Type.body, color: Colors.textPrimary, flex: 1 },
  infoRow: { flexDirection: 'row', gap: 10, marginTop: Spacing.xl },
  infoTile: {
    flex: 1,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  infoTitle: { fontFamily: Font.semibold, fontSize: 11.5, color: Colors.textPrimary },
  infoSubtitle: { fontFamily: Font.regular, fontSize: 10.5, color: Colors.textTertiary },
  similar: { marginTop: Spacing.xl },
  similarRail: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: Spacing.screen },
  stickyBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: Spacing.screen,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    ...Elevation.md,
  },
  stickyInfo: { flex: 1 },
  stickyLabel: { ...Type.small, color: Colors.textSecondary },
  stickyPrice: { ...Type.price, color: Colors.textPrimary },
  secondaryCta: { paddingHorizontal: Spacing.md },
  primaryCta: { paddingHorizontal: Spacing.lg },
});
