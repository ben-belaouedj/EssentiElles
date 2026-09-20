import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../../src/components/ui/Screen';
import IconButton from '../../../src/components/ui/IconButton';
import AppBadge from '../../../src/components/ui/AppBadge';
import PrimaryButton from '../../../src/components/ui/PrimaryButton';
import ListRow from '../../../src/components/ui/ListRow';
import QuantityStepper from '../../../src/components/ui/QuantityStepper';
import EmptyState from '../../../src/components/ui/EmptyState';
import { GradientCard } from '../../../src/components/ui/GradientCard';
import { Chip } from '../../../src/components/ui/Chip';
import { SkeletonBox } from '../../../src/components/ui/SkeletonCard';
import { productService, addressService, subscriptionService } from '../../../src/services/api';
import { Address, Product } from '../../../src/models/types';
import { Colors } from '../../../src/constants/colors';
import { Elevation, Font, Radius, Spacing, Type } from '../../../src/constants/theme';

type Frequency = 'weekly' | 'biweekly' | 'monthly';

const FREQUENCIES: { key: Frequency; label: string; hint: string; icon: 'flash-outline' | 'calendar-outline' | 'moon-outline' }[] = [
  { key: 'weekly', label: 'Chaque semaine', hint: 'Jamais à court', icon: 'flash-outline' },
  { key: 'biweekly', label: 'Toutes les 2 semaines', hint: 'Le bon équilibre', icon: 'calendar-outline' },
  { key: 'monthly', label: 'Chaque mois', hint: 'Le plus souple', icon: 'moon-outline' },
];

export default function PlanScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    productId?: string;
    frequency?: string;
    quantity?: string;
  }>();

  const [product, setProduct] = useState<Product | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [frequency, setFrequency] = useState<'weekly' | 'biweekly' | 'monthly'>('monthly');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!params.productId) {
        setLoading(false);
        return;
      }
      try {
        const [productRes, addressRes] = await Promise.all([
          productService.getById(params.productId),
          addressService.getAll(),
        ]);
        const data = productRes.data as Product;
        const list = addressRes.data as Address[];
        setProduct(data);
        setAddresses(list);
        const preferred = list.find((a) => a.isDefault) ?? list[0];
        if (preferred) setSelectedAddress(preferred.id);
        const requested = params.frequency as 'weekly' | 'biweekly' | 'monthly' | undefined;
        setFrequency(requested ?? (data.availableFrequencies?.[0] as 'weekly' | 'biweekly' | 'monthly') ?? 'monthly');
        setQuantity(Number(params.quantity) > 0 ? Number(params.quantity) : 1);
      } catch (err) {
        Alert.alert(
          'Produit indisponible',
          err instanceof Error ? err.message : 'Impossible de charger ce produit.'
        );
      } finally {
        setLoading(false);
      }
    };
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.productId]);

  const total = useMemo(
    () => (product ? product.subscriptionPrice * quantity : 0),
    [product, quantity]
  );
  const savings = useMemo(
    () => (product ? (product.price - product.subscriptionPrice) * quantity : 0),
    [product, quantity]
  );

  const availableFrequencies: string[] = product?.availableFrequencies?.length
    ? product.availableFrequencies
    : ['monthly'];

  const confirm = async () => {
    if (!product) return;
    if (!selectedAddress) {
      Alert.alert('Adresse requise', 'Ajoutez une adresse de livraison pour continuer.', [
        { text: 'Ajouter une adresse', onPress: () => router.push('/(main)/addresses' as never) },
        { text: 'Plus tard', style: 'cancel' },
      ]);
      return;
    }
    setSubmitting(true);
    try {
      await subscriptionService.create({
        productId: product.id,
        addressId: selectedAddress,
        frequency,
        quantity,
      });
      setDone(true);
    } catch (err) {
      Alert.alert(
        'Abonnement impossible',
        err instanceof Error ? err.message : 'Réessayez dans un instant.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Screen>
        <IconButton name="close" onPress={() => router.back()} style={{ marginBottom: Spacing.md }} />
        <SkeletonBox height={120} radius={28} />
        <SkeletonBox height={80} radius={20} style={{ marginTop: Spacing.md }} />
        <SkeletonBox height={180} radius={28} style={{ marginTop: Spacing.md }} />
      </Screen>
    );
  }

  if (!product) {
    return (
      <Screen>
        <EmptyState
          icon="cube-outline"
          title="Produit introuvable"
          description="Ce produit n’est plus disponible au catalogue."
          actionLabel="Retour au catalogue"
          onAction={() => router.replace('/(main)/catalog' as never)}
        />
      </Screen>
    );
  }

  if (done) {
    return (
      <Screen>
        <View style={styles.successWrap}>
          <GradientCard colors="sage" contentStyle={styles.successCard}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark" size={26} color={Colors.textInverse} />
            </View>
            <Text style={styles.successTitle}>Abonnement activé 🎉</Text>
            <Text style={styles.successSubtitle}>
              Votre première livraison de {product.name} est planifiée. Vous pouvez la reporter,
              la mettre en pause ou ajuster la quantité à tout moment.
            </Text>
          </GradientCard>

          <View style={styles.successSummary}>
            <ListRow icon="repeat-outline" title="Fréquence" value={FREQUENCIES.find((f) => f.key === frequency)?.label} chevron={false} />
            <View style={styles.successDivider} />
            <ListRow icon="cube-outline" title="Quantité" value={`×${quantity}`} chevron={false} />
            <View style={styles.successDivider} />
            <ListRow icon="card-outline" title="Total par livraison" value={`${total.toFixed(2)} €`} chevron={false} />
          </View>

          <PrimaryButton
            label="Voir mon abonnement"
            icon="repeat"
            onPress={() => router.replace('/(main)/(subs)/subscriptions' as never)}
            style={{ marginTop: Spacing.lg }}
          />
          <PrimaryButton
            label="Continuer mes achats"
            variant="ghost"
            onPress={() => router.replace('/(main)/catalog' as never)}
            style={{ marginTop: Spacing.sm }}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <View style={styles.header}>
        <IconButton name="close" onPress={() => router.back()} accessibilityLabel="Fermer" />
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Créer mon abonnement</Text>
          <Text style={styles.headerSubtitle}>3 étapes, modifiable à tout moment</Text>
        </View>
      </View>

      {/* Product recap */}
      <View style={styles.productCard}>
        <View style={styles.productImageWrap}>
          {product.images?.[0] ? (
            <Image source={{ uri: product.images[0] }} style={styles.productImage} resizeMode="cover" />
          ) : (
            <View style={[styles.productImage, styles.productPlaceholder]}>
              <Text style={styles.productPlaceholderText}>{product.name.charAt(0)}</Text>
            </View>
          )}
        </View>
        <View style={styles.productBody}>
          <Text style={styles.productBrand}>{product.brand}</Text>
          <Text style={styles.productName} numberOfLines={2}>
            {product.name}
          </Text>
          <View style={styles.productPriceRow}>
            <Text style={styles.productPrice}>{product.subscriptionPrice.toFixed(2)} €</Text>
            {product.price > product.subscriptionPrice ? (
              <Text style={styles.productCompare}>{product.price.toFixed(2)} €</Text>
            ) : null}
          </View>
        </View>
      </View>

      {/* Step 1 — frequency */}
      <Text style={styles.stepLabel}>1 · Fréquence de livraison</Text>
      <View style={{ gap: 10 }}>
        {FREQUENCIES.filter((option) => availableFrequencies.includes(option.key)).map((option) => {
          const active = frequency === option.key;
          return (
            <View key={option.key}>
              <Chip
                label={`${option.label} · ${option.hint}`}
                icon={option.icon}
                active={active}
                onPress={() => setFrequency(option.key)}
              />
            </View>
          );
        })}
      </View>

      {/* Step 2 — quantity */}
      <Text style={styles.stepLabel}>2 · Quantité</Text>
      <View style={styles.quantityCard}>
        <View>
          <Text style={styles.quantityTitle}>{product.unit || 'Par livraison'}</Text>
          <Text style={styles.quantityHint}>Ajustable quand vous voulez</Text>
        </View>
        <QuantityStepper value={quantity} onChange={setQuantity} max={12} />
      </View>

      {/* Step 3 — address */}
      <Text style={styles.stepLabel}>3 · Adresse de livraison</Text>
      {addresses.length === 0 ? (
        <View style={styles.noAddress}>
          <EmptyState
            compact
            icon="location-outline"
            title="Aucune adresse"
            description="Ajoutez une adresse pour recevoir vos livraisons."
            actionLabel="Ajouter une adresse"
            onAction={() => router.push('/(main)/addresses' as never)}
          />
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {addresses.map((address) => {
            const active = selectedAddress === address.id;
            return (
              <View
                key={address.id}
                style={[styles.addressCard, active && styles.addressCardActive]}
              >
                <ListRow
                  icon={active ? 'radio-button-on' : 'radio-button-off'}
                  iconColor={active ? Colors.primary : Colors.textTertiary}
                  iconBackground={active ? Colors.primaryPale : Colors.surfaceAlt}
                  title={`${address.label}${address.isDefault ? ' · par défaut' : ''}`}
                  subtitle={`${address.firstName} ${address.lastName}, ${address.street}, ${address.zipCode} ${address.city}`}
                  chevron={false}
                  onPress={() => setSelectedAddress(address.id)}
                />
              </View>
            );
          })}
          <PrimaryButton
            label="Ajouter une autre adresse"
            variant="ghost"
            icon="add"
            size="sm"
            onPress={() => router.push('/(main)/addresses' as never)}
          />
        </View>
      )}

      {/* Recap */}
      <View style={styles.recap}>
        <View style={styles.recapRow}>
          <Text style={styles.recapLabel}>Prix abonné</Text>
          <Text style={styles.recapValue}>
            {product.subscriptionPrice.toFixed(2)} € × {quantity}
          </Text>
        </View>
        {savings > 0.01 ? (
          <View style={styles.recapRow}>
            <Text style={styles.recapLabel}>Économies</Text>
            <Text style={[styles.recapValue, { color: Colors.success }]}>
              -{savings.toFixed(2)} €
            </Text>
          </View>
        ) : null}
        <View style={styles.recapDivider} />
        <View style={styles.recapRow}>
          <Text style={styles.recapTotal}>Total par livraison</Text>
          <Text style={styles.recapTotalValue}>{total.toFixed(2)} €</Text>
        </View>
        <View style={styles.recapBadges}>
          <AppBadge label="Livraison offerte" variant="sage" icon="cube-outline" />
          <AppBadge label="Sans engagement" variant="neutral" icon="refresh-outline" />
          <AppBadge label="Pause illimitée" variant="primary" icon="pause-outline" />
        </View>
      </View>

      <PrimaryButton
        testID="plan-confirm-btn"
        label={submitting ? 'Activation…' : `Activer pour ${total.toFixed(2)} €`}
        icon="checkmark-circle-outline"
        loading={submitting}
        onPress={() => void confirm()}
        style={{ marginTop: Spacing.lg }}
      />
      <Text style={styles.legal}>
        En confirmant, votre première livraison est planifiée et vous pouvez tout modifier depuis
        l’onglet Abonnement.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: Spacing.lg },
  headerTitle: { ...Type.h2, color: Colors.textPrimary },
  headerSubtitle: { ...Type.small, color: Colors.textSecondary, marginTop: 1 },
  productCard: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xxl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.sm,
    ...Elevation.sm,
  },
  productImageWrap: { width: 88, height: 88, borderRadius: Radius.lg, overflow: 'hidden' },
  productImage: { width: '100%', height: '100%' },
  productPlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primaryPale },
  productPlaceholderText: { fontFamily: Font.bold, fontSize: 32, color: Colors.primaryDark },
  productBody: { flex: 1, justifyContent: 'center', gap: 3 },
  productBrand: { ...Type.caption, color: Colors.textTertiary, textTransform: 'uppercase' },
  productName: { ...Type.bodyStrong, color: Colors.textPrimary },
  productPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  productPrice: { ...Type.price, color: Colors.textPrimary },
  productCompare: {
    ...Type.small,
    color: Colors.textTertiary,
    textDecorationLine: 'line-through',
  },
  stepLabel: { ...Type.h3, color: Colors.textPrimary, marginTop: Spacing.xl, marginBottom: Spacing.sm },
  quantityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.md,
  },
  quantityTitle: { ...Type.bodyStrong, color: Colors.textPrimary },
  quantityHint: { ...Type.small, color: Colors.textSecondary, marginTop: 2 },
  noAddress: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  addressCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.surface,
    overflow: 'hidden',
  },
  addressCardActive: { borderColor: Colors.primaryLight, backgroundColor: Colors.primaryPale },
  recap: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xxl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.lg,
    gap: Spacing.sm,
    ...Elevation.xs,
  },
  recapRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  recapLabel: { ...Type.body, color: Colors.textSecondary },
  recapValue: { ...Type.bodyStrong, color: Colors.textPrimary },
  recapDivider: { height: 1, backgroundColor: Colors.borderLight, marginVertical: 4 },
  recapTotal: { ...Type.bodyStrong, color: Colors.textPrimary },
  recapTotalValue: { ...Type.h2, color: Colors.textPrimary },
  recapBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: Spacing.sm },
  legal: { ...Type.small, color: Colors.textTertiary, marginTop: Spacing.md, textAlign: 'center' },
  successWrap: { paddingTop: Spacing.xl },
  successCard: { alignItems: 'center', gap: 10, paddingVertical: Spacing.xl },
  successIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: { ...Type.h2, color: Colors.textInverse, textAlign: 'center' },
  successSubtitle: {
    ...Type.small,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    paddingHorizontal: Spacing.md,
  },
  successSummary: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: 'hidden',
  },
  successDivider: { height: 1, backgroundColor: Colors.borderLight, marginLeft: 64 },
});
