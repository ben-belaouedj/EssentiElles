import React, { useMemo } from 'react';
import { Image, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import PressableScale from '../ui/PressableScale';
import IconButton from '../ui/IconButton';
import AppBadge from '../ui/AppBadge';
import { Colors } from '../../constants/colors';
import { Elevation, Font, Radius, Spacing, Type } from '../../constants/theme';
import { Product } from '../../models/types';
import { useFavoritesStore } from '../../store/favoritesStore';

export type ProductCardVariant = 'grid' | 'rail' | 'row';

interface Props {
  product: Product;
  onPress: () => void;
  onSubscribe?: () => void;
  variant?: ProductCardVariant;
  style?: StyleProp<ViewStyle>;
}

function useBadges(product: Product) {
  return useMemo(() => {
    const badges: { label: string; variant: 'primary' | 'sage' | 'warning' | 'ink'; icon?: keyof typeof Ionicons.glyphMap }[] = [];
    if (product.discountPercentage > 0) {
      badges.push({ label: `-${Math.round(product.discountPercentage)}%`, variant: 'primary', icon: 'pricetag' });
    }
    if (product.isNewArrival) badges.push({ label: 'Nouveau', variant: 'sage', icon: 'sparkles' });
    else if (product.isBestSeller) badges.push({ label: 'Best-seller', variant: 'ink', icon: 'flame' });
    else if (product.isFeatured) badges.push({ label: 'Recommandé', variant: 'sage', icon: 'heart' });

    const lowStock = product.stockCount > 0 && product.stockCount <= 5;
    if (lowStock) badges.push({ label: 'Bientôt épuisé', variant: 'warning', icon: 'alert-circle' });
    if (product.stockCount <= 0 || product.inStock === false) {
      badges.push({ label: 'Rupture', variant: 'warning', icon: 'close-circle' });
    }
    return badges.slice(0, 2);
  }, [product]);
}

/** Modern product card — grid tile, carousel rail tile or list row. */
export default function ProductCard({
  product,
  onPress,
  onSubscribe,
  variant = 'grid',
  style,
}: Props) {
  const ids = useFavoritesStore((s) => s.ids);
  const toggleFavorite = useFavoritesStore((s) => s.toggle);
  const isFavorite = ids.includes(product.id);
  const badges = useBadges(product);

  const image = product.images?.[0];
  const savings = Math.max(0, product.price - product.subscriptionPrice);

  const heart = (
    <IconButton
      testID={`product-favorite-${product.id}`}
      name={isFavorite ? 'heart' : 'heart-outline'}
      iconSize={17}
      size={34}
      variant={isFavorite ? 'brand' : 'glass'}
      onPress={() => void toggleFavorite(product)}
      accessibilityLabel={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
    />
  );

  if (variant === 'row') {
    return (
      <PressableScale
        testID={`product-card-${product.id}`}
        onPress={onPress}
        scaleTo={0.985}
        style={[styles.row, style]}
      >
        <View style={styles.rowImageWrap}>
          {image ? (
            <Image source={{ uri: image }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={[styles.image, styles.placeholder]}>
              <Text style={styles.placeholderText}>{product.name.charAt(0).toUpperCase()}</Text>
            </View>
          )}
        </View>

        <View style={styles.rowBody}>
          <Text style={styles.brand} numberOfLines={1}>
            {product.brand}
          </Text>
          <Text style={styles.rowTitle} numberOfLines={2}>
            {product.name}
          </Text>
          <View style={styles.rowPriceLine}>
            <Text style={styles.price}>{product.subscriptionPrice.toFixed(2)} €</Text>
            {savings > 0.01 ? (
              <Text style={styles.compareAt}>{product.price.toFixed(2)} €</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.rowActions}>
          {heart}
          <PressableScale
            testID={`product-subscribe-btn-${product.id}`}
            onPress={onSubscribe || onPress}
            style={styles.rowCta}
            scaleTo={0.94}
          >
            <Ionicons name="add" size={18} color={Colors.textInverse} />
          </PressableScale>
        </View>
      </PressableScale>
    );
  }

  const isRail = variant === 'rail';

  return (
    <PressableScale
      testID={`product-card-${product.id}`}
      onPress={onPress}
      scaleTo={0.975}
      style={[styles.card, isRail && styles.cardRail, style]}
    >
      <View style={[styles.imageWrap, isRail && styles.imageWrapRail]}>
        {image ? (
          <Image source={{ uri: image }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <Text style={styles.placeholderText}>{product.name.charAt(0).toUpperCase()}</Text>
          </View>
        )}

        <LinearGradient
          colors={['rgba(43,45,66,0.16)', 'rgba(43,45,66,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.imageScrim}
          pointerEvents="none"
        />

        <View style={styles.badges}>
          {badges.map((badge) => (
            <AppBadge key={badge.label} label={badge.label} variant={badge.variant} icon={badge.icon} />
          ))}
        </View>

        <View style={styles.heart}>{heart}</View>
      </View>

      <View style={styles.body}>
        <Text style={styles.brand} numberOfLines={1}>
          {product.brand}
        </Text>
        <Text style={[styles.title, isRail && styles.titleRail]} numberOfLines={2}>
          {product.name}
        </Text>

        {product.rating ? (
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={11} color={Colors.warning} />
            <Text style={styles.rating}>
              {product.rating.toFixed(1)}
              {product.reviewCount ? ` · ${product.reviewCount} avis` : ''}
            </Text>
          </View>
        ) : null}

        <View style={styles.priceRow}>
          <View style={styles.priceColumn}>
            <Text style={styles.price}>{product.subscriptionPrice.toFixed(2)} €</Text>
            {savings > 0.01 ? (
              <Text style={styles.savings}>abonné · -{savings.toFixed(2)} €</Text>
            ) : (
              <Text style={styles.savingsMuted}>prix abonné</Text>
            )}
          </View>

          <PressableScale
            testID={`product-subscribe-btn-${product.id}`}
            onPress={onSubscribe || onPress}
            style={styles.cta}
            scaleTo={0.93}
          >
            <Ionicons name="add" size={18} color={Colors.textInverse} />
          </PressableScale>
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xxl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: 'hidden',
    ...Elevation.sm,
  },
  cardRail: { flex: 0, width: 176 },
  imageWrap: {
    width: '100%',
    aspectRatio: 1.05,
    backgroundColor: Colors.surfaceAlt,
    position: 'relative',
  },
  imageWrapRail: { aspectRatio: 1.15 },
  image: { width: '100%', height: '100%' },
  imageScrim: { position: 'absolute', top: 0, left: 0, right: 0, height: '45%' },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryPale,
  },
  placeholderText: {
    fontFamily: Font.bold,
    fontSize: 30,
    color: Colors.primaryDark,
  },
  badges: {
    position: 'absolute',
    top: 10,
    left: 10,
    gap: 4,
  },
  heart: { position: 'absolute', top: 8, right: 8 },
  body: { padding: 13, gap: 3 },
  brand: {
    ...Type.caption,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
  },
  title: { ...Type.bodyStrong, color: Colors.textPrimary },
  titleRail: { fontSize: 13.5, lineHeight: 19 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  rating: { ...Type.small, fontSize: 11.5, color: Colors.textSecondary },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 8,
  },
  priceColumn: { flex: 1 },
  price: { ...Type.price, color: Colors.textPrimary },
  compareAt: {
    ...Type.small,
    fontSize: 12,
    color: Colors.textTertiary,
    textDecorationLine: 'line-through',
    marginLeft: 6,
  },
  savings: { fontFamily: Font.medium, fontSize: 11, color: Colors.success },
  savingsMuted: { fontFamily: Font.medium, fontSize: 11, color: Colors.textTertiary },
  cta: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Elevation.brand,
  },
  // Row variant
  row: {
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
  rowImageWrap: {
    width: 74,
    height: 74,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceAlt,
  },
  rowBody: { flex: 1, gap: 2 },
  rowTitle: { ...Type.bodyStrong, color: Colors.textPrimary },
  rowPriceLine: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  rowActions: { alignItems: 'center', gap: 8 },
  rowCta: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
