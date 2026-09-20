import React, { useState } from 'react';
import { Alert, Image, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../src/components/ui/Screen';
import IconButton from '../../src/components/ui/IconButton';
import PrimaryButton from '../../src/components/ui/PrimaryButton';
import QuantityStepper from '../../src/components/ui/QuantityStepper';
import EmptyState from '../../src/components/ui/EmptyState';
import AppBadge from '../../src/components/ui/AppBadge';
import ListRow from '../../src/components/ui/ListRow';
import { GradientCard } from '../../src/components/ui/GradientCard';
import { useCartStore } from '../../src/store/cartStore';
import { addressService } from '../../src/services/api';
import { checkoutCart } from '../../src/services/paymentService';
import { Address, OrderItem } from '../../src/models/types';
import { getPaymentMode } from '../../src/constants/payment';
import { Colors } from '../../src/constants/colors';
import { Elevation, Font, Radius, Spacing, Type } from '../../src/constants/theme';

type Step = 'cart' | 'checkout' | 'confirmation';

export default function CartScreen() {
  const router = useRouter();
  const { items, updateQuantity, removeItem, clearCart, total, savingsIfSubscribed, itemCount } =
    useCartStore();

  const [step, setStep] = useState<Step>('cart');
  const [ordering, setOrdering] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [deliveryNote, setDeliveryNote] = useState('');
  const [confirmedNumber, setConfirmedNumber] = useState('');
  const [confirmedTotal, setConfirmedTotal] = useState(0);

  const isDemoMode = getPaymentMode() === 'demo';
  const count = itemCount();
  const subtotal = total();
  const savings = savingsIfSubscribed();

  const prepareCheckout = async () => {
    if (!items.length) return;
    setOrdering(true);
    try {
      const res = await addressService.getAll();
      const list = res.data as Address[];
      if (!list.length) {
        Alert.alert('Adresse requise', 'Ajoutez une adresse de livraison pour commander.', [
          { text: 'Ajouter', onPress: () => router.push('/(main)/addresses' as never) },
          { text: 'Annuler', style: 'cancel' },
        ]);
        return;
      }
      setAddresses(list);
      setSelectedAddressId((list.find((a) => a.isDefault) ?? list[0]).id);
      setStep('checkout');
    } catch (err) {
      Alert.alert('Erreur', err instanceof Error ? err.message : 'Impossible de charger vos adresses');
    } finally {
      setOrdering(false);
    }
  };

  const confirmOrder = async () => {
    if (!selectedAddressId) {
      Alert.alert('Adresse requise', 'Sélectionnez une adresse de livraison.');
      return;
    }
    setOrdering(true);
    try {
      const orderItems: OrderItem[] = items.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: item.product.price,
        totalPrice: item.product.price * item.quantity,
      }));
      const result = await checkoutCart({
        items: orderItems,
        addressId: selectedAddressId,
        notes: deliveryNote.trim() || undefined,
      });
      setConfirmedNumber(result.order.orderNumber);
      setConfirmedTotal(result.order.total || subtotal);
      clearCart();
      setStep('confirmation');
    } catch (err) {
      Alert.alert('Commande impossible', err instanceof Error ? err.message : 'Réessayez dans un instant');
    } finally {
      setOrdering(false);
    }
  };

  // ─── Confirmation ──────────────────────────────────────────
  if (step === 'confirmation') {
    return (
      <Screen tabBarSpace>
        <View style={styles.successWrap}>
          <GradientCard colors="sage" contentStyle={styles.successCard}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark" size={26} color={Colors.textInverse} />
            </View>
            <Text style={styles.successTitle}>Commande confirmée 🎉</Text>
            <Text style={styles.successSubtitle}>
              {isDemoMode
                ? 'Paiement en mode démo. Votre commande est enregistrée et suivie.'
                : 'Votre paiement a été accepté. Merci pour votre confiance !'}
            </Text>
            <View style={styles.successRefs}>
              <View style={styles.successRef}>
                <Text style={styles.successRefLabel}>N° de commande</Text>
                <Text style={styles.successRefValue}>{confirmedNumber || '—'}</Text>
              </View>
              <View style={styles.successRef}>
                <Text style={styles.successRefLabel}>Montant</Text>
                <Text style={styles.successRefValue}>{confirmedTotal.toFixed(2)} €</Text>
              </View>
            </View>
          </GradientCard>

          <PrimaryButton
            label="Suivre ma commande"
            icon="navigate-outline"
            onPress={() => router.replace('/(main)/(orders)/orders' as never)}
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

  // ─── Checkout ──────────────────────────────────────────────
  if (step === 'checkout') {
    return (
      <Screen scroll tabBarSpace>
        <View style={styles.header}>
          <IconButton name="arrow-back" onPress={() => setStep('cart')} accessibilityLabel="Retour" />
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Validation</Text>
            <Text style={styles.headerSubtitle}>Adresse, note de livraison et récapitulatif</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Adresse de livraison</Text>
        <View style={{ gap: 10 }}>
          {addresses.map((address) => {
            const active = address.id === selectedAddressId;
            return (
              <View key={address.id} style={[styles.addressCard, active && styles.addressCardActive]}>
                <ListRow
                  icon={active ? 'radio-button-on' : 'radio-button-off'}
                  iconColor={active ? Colors.primary : Colors.textTertiary}
                  iconBackground={active ? Colors.primaryPale : Colors.surfaceAlt}
                  title={`${address.label}${address.isDefault ? ' · par défaut' : ''}`}
                  subtitle={`${address.firstName} ${address.lastName}, ${address.street}, ${address.zipCode} ${address.city}`}
                  chevron={false}
                  onPress={() => setSelectedAddressId(address.id)}
                />
              </View>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Instructions de livraison</Text>
        <View style={styles.noteWrap}>
          <TextInput
            value={deliveryNote}
            onChangeText={setDeliveryNote}
            placeholder="Code d’entrée, étage, point de dépôt…"
            placeholderTextColor={Colors.textPlaceholder}
            multiline
            numberOfLines={3}
            style={styles.noteInput}
          />
        </View>

        <Text style={styles.sectionTitle}>Récapitulatif</Text>
        <View style={styles.summary}>
          <Row label={`Sous-total (${count} article${count > 1 ? 's' : ''})`} value={`${subtotal.toFixed(2)} €`} />
          <Row label="Livraison" value="Offerte 🚚" success />
          {isDemoMode ? <Row label="Paiement" value="Mode démo" /> : null}
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total à payer</Text>
            <Text style={styles.totalValue}>{subtotal.toFixed(2)} €</Text>
          </View>
        </View>

        <PrimaryButton
          testID="cart-confirm-btn"
          label={ordering ? 'Traitement…' : `Confirmer · ${subtotal.toFixed(2)} €`}
          icon="checkmark-circle-outline"
          loading={ordering}
          onPress={() => void confirmOrder()}
          style={{ marginTop: Spacing.lg }}
        />
        <Text style={styles.legal}>
          Les prix sont recalculés côté serveur pour garantir le montant affiché.
        </Text>
      </Screen>
    );
  }

  // ─── Empty cart ────────────────────────────────────────────
  if (!items.length) {
    return (
      <Screen tabBarSpace>
        <View style={styles.header}>
          <IconButton name="arrow-back" onPress={() => router.back()} accessibilityLabel="Retour" />
          <Text style={styles.headerTitle}>Panier</Text>
        </View>
        <EmptyState
          icon="bag-outline"
          title="Votre panier est vide"
          description="Ajoutez vos essentiels — ou abonnez-vous pour ne plus jamais y penser."
          actionLabel="Découvrir le catalogue"
          onAction={() => router.replace('/(main)/catalog' as never)}
          secondaryLabel="Voir les abonnements"
          onSecondary={() => router.replace('/(main)/(subs)/subscriptions' as never)}
        />
      </Screen>
    );
  }

  // ─── Cart ──────────────────────────────────────────────────
  return (
    <Screen scroll tabBarSpace>
      <View style={styles.header}>
        <IconButton name="arrow-back" onPress={() => router.back()} accessibilityLabel="Retour" />
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Panier</Text>
          <Text style={styles.headerSubtitle}>
            {count} article{count > 1 ? 's' : ''} prêt{count > 1 ? 's' : ''} à partir
          </Text>
        </View>
        <IconButton
          name="trash-outline"
          color={Colors.error}
          accessibilityLabel="Vider le panier"
          onPress={() =>
            Alert.alert('Vider le panier ?', 'Cette action est réversible.', [
              { text: 'Annuler', style: 'cancel' },
              { text: 'Vider', style: 'destructive', onPress: clearCart },
            ])
          }
        />
      </View>

      <View style={{ gap: 12 }}>
        {items.map((item) => (
          <View key={item.product.id} style={styles.itemCard}>
            <View style={styles.itemImageWrap}>
              {item.product.images?.[0] ? (
                <Image source={{ uri: item.product.images[0] }} style={styles.itemImage} resizeMode="cover" />
              ) : (
                <View style={[styles.itemImage, styles.itemPlaceholder]}>
                  <Ionicons name="cube-outline" size={20} color={Colors.primaryDark} />
                </View>
              )}
            </View>

            <View style={styles.itemBody}>
              <Text style={styles.itemBrand}>{item.product.brand}</Text>
              <Text style={styles.itemName} numberOfLines={2}>
                {item.product.name}
              </Text>
              <Text style={styles.itemPrice}>
                {item.product.price.toFixed(2)} € · unité
              </Text>
              <Text style={styles.itemSubscriber}>
                {item.product.subscriptionPrice.toFixed(2)} € en abonnement
              </Text>

              <View style={styles.itemFooter}>
                <QuantityStepper
                  size="sm"
                  value={item.quantity}
                  min={0}
                  max={20}
                  onChange={(value) => updateQuantity(item.product.id, value)}
                />
                <Text style={styles.itemTotal}>
                  {(item.product.price * item.quantity).toFixed(2)} €
                </Text>
              </View>
            </View>

            <IconButton
              name="close"
              size={28}
              iconSize={15}
              variant="plain"
              onPress={() => removeItem(item.product.id)}
              accessibilityLabel="Retirer"
              style={styles.itemRemove}
            />
          </View>
        ))}
      </View>

      {savings > 0.01 ? (
        <View style={styles.savingsCard}>
          <View style={styles.savingsIcon}>
            <Ionicons name="repeat" size={16} color={Colors.textInverse} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.savingsTitle}>
              Économisez {savings.toFixed(2)} € à chaque livraison
            </Text>
            <Text style={styles.savingsText}>
              Passez ces produits en abonnement : même contenu, prix abonné, sans engagement.
            </Text>
          </View>
          <AppBadge label="Abonnement" variant="primary" icon="pricetag" />
        </View>
      ) : null}

      {/* Summary */}
      <View style={styles.summary}>
        <Row label={`Sous-total (${count} article${count > 1 ? 's' : ''})`} value={`${subtotal.toFixed(2)} €`} />
        <Row label="Livraison" value="Offerte 🚚" success />
        <View style={styles.summaryDivider} />
        <View style={styles.summaryRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{subtotal.toFixed(2)} €</Text>
        </View>
      </View>

      <PrimaryButton
        testID="cart-checkout-btn"
        label="Passer commande"
        icon="arrow-forward"
        iconPosition="right"
        loading={ordering}
        onPress={() => void prepareCheckout()}
        style={{ marginTop: Spacing.lg }}
      />
      <PrimaryButton
        label="Ajouter d’autres produits"
        variant="ghost"
        onPress={() => router.push('/(main)/catalog' as never)}
        style={{ marginTop: Spacing.sm }}
      />
    </Screen>
  );
}

function Row({
  label,
  value,
  success,
}: {
  label: string;
  value: string;
  success?: boolean;
}) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, success && { color: Colors.success }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: Spacing.lg },
  headerTitle: { ...Type.h2, color: Colors.textPrimary },
  headerSubtitle: { ...Type.small, color: Colors.textSecondary, marginTop: 1 },
  itemCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xxl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.sm,
    ...Elevation.xs,
  },
  itemImageWrap: { width: 80, height: 80, borderRadius: Radius.lg, overflow: 'hidden' },
  itemImage: { width: '100%', height: '100%' },
  itemPlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primaryPale },
  itemBody: { flex: 1, gap: 2 },
  itemBrand: { ...Type.caption, color: Colors.textTertiary, textTransform: 'uppercase' },
  itemName: { ...Type.bodyStrong, color: Colors.textPrimary },
  itemPrice: { ...Type.small, color: Colors.textSecondary, marginTop: 2 },
  itemSubscriber: { fontFamily: Font.medium, fontSize: 11.5, color: Colors.success },
  itemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  itemTotal: { ...Type.price, fontSize: 15, color: Colors.textPrimary },
  itemRemove: { position: 'absolute', top: 4, right: 4 },
  savingsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: Spacing.md,
    backgroundColor: Colors.primaryPale,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.primaryMuted,
    padding: Spacing.md,
  },
  savingsIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savingsTitle: { ...Type.smallStrong, color: Colors.primaryDark },
  savingsText: { ...Type.small, color: Colors.textSecondary, marginTop: 2 },
  summary: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xxl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.lg,
    gap: Spacing.sm,
    ...Elevation.xs,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { ...Type.body, color: Colors.textSecondary },
  summaryValue: { ...Type.bodyStrong, color: Colors.textPrimary },
  summaryDivider: { height: 1, backgroundColor: Colors.borderLight, marginVertical: 4 },
  totalLabel: { ...Type.bodyStrong, color: Colors.textPrimary },
  totalValue: { ...Type.h2, color: Colors.textPrimary },
  sectionTitle: { ...Type.h3, color: Colors.textPrimary, marginTop: Spacing.lg, marginBottom: Spacing.sm },
  addressCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.surface,
    overflow: 'hidden',
  },
  addressCardActive: { borderColor: Colors.primaryLight, backgroundColor: Colors.primaryPale },
  noteWrap: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.md,
  },
  noteInput: {
    minHeight: 70,
    fontFamily: Font.regular,
    fontSize: 14,
    color: Colors.textPrimary,
    textAlignVertical: 'top',
  },
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
  successRefs: {
    flexDirection: 'row',
    gap: 12,
    marginTop: Spacing.md,
    alignSelf: 'stretch',
  },
  successRef: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    alignItems: 'center',
  },
  successRefLabel: { fontFamily: Font.medium, fontSize: 11, color: 'rgba(255,255,255,0.85)' },
  successRefValue: { fontFamily: Font.semibold, fontSize: 15, color: Colors.textInverse, marginTop: 2 },
});
