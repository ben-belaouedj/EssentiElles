import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCartStore } from '../../src/store/cartStore';
import { addressService } from '../../src/services/api';
import { checkoutCart } from '../../src/services/paymentService';
import { Address, OrderItem } from '../../src/models/types';
import EmptyState from '../../src/components/ui/EmptyState';
import PrimaryButton from '../../src/components/ui/PrimaryButton';
import { Colors } from '../../src/constants/colors';
import { Typography, Spacing, BorderRadius, Shadow } from '../../src/constants/spacing';
import { getPaymentMode } from '../../src/constants/payment';
import { t } from '../../src/constants/strings';

export default function CartScreen() {
  const router = useRouter();
  const { items, updateQuantity, clearCart, total, savingsIfSubscribed, itemCount } = useCartStore();
  const [step, setStep] = useState<'cart' | 'checkout' | 'confirmation'>('cart');
  const [ordering, setOrdering] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [deliveryNote, setDeliveryNote] = useState('');
  const [confirmedOrderNumber, setConfirmedOrderNumber] = useState('');
  const [confirmedTotal, setConfirmedTotal] = useState(0);
  const isDemoMode = getPaymentMode() === 'demo';

  const prepareCheckout = async () => {
    if (items.length === 0) return;
    setOrdering(true);
    try {
      const addrRes = await addressService.getAll();
      const fetchedAddresses: Address[] = addrRes.data;
      if (fetchedAddresses.length === 0) {
        Alert.alert(
          'Adresse requise',
          'Veuillez d\'abord ajouter une adresse de livraison',
          [
            { text: 'Ajouter', onPress: () => router.push('/(main)/addresses' as any) },
            { text: 'Annuler' }
          ]
        );
        return;
      }

      const defAddr = fetchedAddresses.find(a => a.isDefault) || fetchedAddresses[0];
      setAddresses(fetchedAddresses);
      setSelectedAddressId(defAddr.id);
      setStep('checkout');
    } catch (err: any) {
      Alert.alert('Erreur', err.message || 'Impossible de charger vos adresses');
    } finally {
      setOrdering(false);
    }
  };

  const handleConfirmOrder = async () => {
    if (!selectedAddressId) {
      Alert.alert('Adresse requise', 'Sélectionnez une adresse de livraison pour continuer.');
      return;
    }

    setOrdering(true);
    try {
      const orderItems: OrderItem[] = items.map(i => ({
        productId: i.product.id,
        productName: i.product.name,
        quantity: i.quantity,
        unitPrice: i.product.price,
        totalPrice: i.product.price * i.quantity,
      }));
      const result = await checkoutCart({
        items: orderItems,
        addressId: selectedAddressId,
        notes: deliveryNote.trim() || undefined,
      });

      setConfirmedOrderNumber(result.order.orderNumber);
      setConfirmedTotal(result.order.total || total());
      clearCart();
      setStep('confirmation');
    } catch (err: any) {
      Alert.alert('Erreur', err.message || 'Impossible de passer la commande');
    } finally {
      setOrdering(false);
    }
  };

  if (step === 'confirmation') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Commande confirmée</Text>
        </View>

        <View style={styles.confirmationCard}>
          <View style={styles.confirmationIconWrap}>
            <Ionicons name="checkmark" size={28} color={Colors.textInverse} />
          </View>
          <Text style={styles.confirmationTitle}>Merci pour votre commande 🎉</Text>
          <Text style={styles.confirmationSubtitle}>
            Votre commande a bien été enregistrée{isDemoMode ? ' (mode démo)' : ''}.
          </Text>

          <View style={styles.confirmationRow}>
            <Text style={styles.confirmationLabel}>N° de commande</Text>
            <Text style={styles.confirmationValue}>{confirmedOrderNumber || '—'}</Text>
          </View>
          <View style={styles.confirmationRow}>
            <Text style={styles.confirmationLabel}>Montant total</Text>
            <Text style={styles.confirmationValue}>{confirmedTotal.toFixed(2)} €</Text>
          </View>

          <PrimaryButton
            label="Suivre ma commande"
            onPress={() => router.push('/(main)/orders' as any)}
            style={{ marginTop: Spacing.md }}
          />
          <TouchableOpacity style={styles.secondaryAction} onPress={() => router.push('/(main)/catalog' as any)}>
            <Text style={styles.secondaryActionText}>Continuer mes achats</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (step === 'checkout') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setStep('cart')} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Validation de commande</Text>
        </View>

        <FlatList
          data={addresses}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View style={styles.summary}>
              <Text style={styles.sectionTitle}>Adresse de livraison</Text>
              <Text style={styles.sectionSubtitle}>Sélectionnez l'adresse à utiliser pour cette commande.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const selected = item.id === selectedAddressId;
            return (
              <TouchableOpacity
                style={[styles.addressCard, selected && styles.addressCardSelected]}
                onPress={() => setSelectedAddressId(item.id)}
              >
                <View style={styles.addressTopRow}>
                  <Text style={styles.addressLabel}>{item.label}</Text>
                  {item.isDefault && <Text style={styles.defaultBadge}>Par défaut</Text>}
                </View>
                <Text style={styles.addressText}>{item.firstName} {item.lastName}</Text>
                <Text style={styles.addressText}>{item.street}</Text>
                <Text style={styles.addressText}>{item.zipCode} {item.city}, {item.country}</Text>
              </TouchableOpacity>
            );
          }}
          ListFooterComponent={
            <View style={styles.summary}>
              <Text style={styles.sectionTitle}>Instructions de livraison (optionnel)</Text>
              <TextInput
                value={deliveryNote}
                onChangeText={setDeliveryNote}
                placeholder="Code d'entrée, étage, point de dépôt..."
                multiline
                numberOfLines={3}
                placeholderTextColor={Colors.textPlaceholder}
                style={styles.noteInput}
              />

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Sous-total ({itemCount()} articles)</Text>
                <Text style={styles.summaryValue}>{total().toFixed(2)} €</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Livraison</Text>
                <Text style={[styles.summaryValue, { color: Colors.success }]}>Gratuite 🚚</Text>
              </View>
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total à payer</Text>
                <Text style={styles.totalValue}>{total().toFixed(2)} €</Text>
              </View>

              <PrimaryButton
                label="Confirmer la commande"
                onPress={handleConfirmOrder}
                loading={ordering}
                style={{ marginTop: Spacing.md }}
              />
            </View>
          }
        />
      </SafeAreaView>
    );
  }

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Mon Panier</Text>
        </View>
        <EmptyState
          icon="bag-outline"
          title="Panier vide"
          description="Ajoutez des produits depuis le catalogue"
          actionLabel="Voir le catalogue"
          onAction={() => router.push('/(main)/catalog' as any)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Mon Panier ({itemCount()} article{itemCount() > 1 ? 's' : ''})</Text>
        <TouchableOpacity
          onPress={() => Alert.alert('Vider le panier ?', '', [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Vider', style: 'destructive', onPress: clearCart }
          ])}
        >
          <Ionicons name="trash-outline" size={22} color={Colors.error} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={item => item.product.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardLeft}>
              <View style={styles.imgPlaceholder}>
                <Ionicons name="cube-outline" size={24} color={Colors.primaryLight} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.brand}>{item.product.brand}</Text>
                <Text style={styles.name} numberOfLines={2}>{item.product.name}</Text>
                <Text style={styles.price}>{item.product.price.toFixed(2)} €/unité</Text>
                <Text style={styles.subscriberHint}>{item.product.subscriptionPrice.toFixed(2)} € pour les abonnés</Text>
              </View>
            </View>
            <View style={styles.qtyRow}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => updateQuantity(item.product.id, item.quantity - 1)}
              >
                <Ionicons name={item.quantity === 1 ? 'trash-outline' : 'remove'} size={16} color={item.quantity === 1 ? Colors.error : Colors.primary} />
              </TouchableOpacity>
              <Text style={styles.qtyVal}>{item.quantity}</Text>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => updateQuantity(item.product.id, item.quantity + 1)}
              >
                <Ionicons name="add" size={16} color={Colors.primary} />
              </TouchableOpacity>
              <Text style={styles.lineTotal}>{(item.product.price * item.quantity).toFixed(2)} €</Text>
            </View>
          </View>
        )}
        ListFooterComponent={
          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Sous-total ({itemCount()} articles)</Text>
              <Text style={styles.summaryValue}>{total().toFixed(2)} €</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Livraison</Text>
              <Text style={[styles.summaryValue, { color: Colors.success }]}>Gratuite 🚚</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{total().toFixed(2)} €</Text>
            </View>
            {savingsIfSubscribed() > 0 && (
              <View style={styles.savingsBanner}>
                <Ionicons name="pricetag-outline" size={14} color={Colors.primaryDark} />
                <Text style={styles.savingsBannerText}>
                  Économisez {savingsIfSubscribed().toFixed(2)} € avec un abonnement
                </Text>
              </View>
            )}
            {isDemoMode && (
              <View style={styles.demoBadge}>
                <Ionicons name="flask-outline" size={14} color={Colors.info} />
                <Text style={styles.demoBadgeText}>{t('paymentDemoMode')}</Text>
              </View>
            )}
            <PrimaryButton
              label="Valider la commande"
              onPress={prepareCheckout}
              loading={ordering}
              style={{ marginTop: Spacing.md }}
            />
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.screen, paddingTop: Spacing.md, paddingBottom: Spacing.sm, gap: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', ...Shadow.card },
  title: { ...Typography.h3, color: Colors.textPrimary, flex: 1 },
  list: { padding: Spacing.screen, paddingBottom: Spacing.xl },
  card: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.sm, ...Shadow.card },
  cardLeft: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  imgPlaceholder: { width: 56, height: 56, borderRadius: BorderRadius.md, backgroundColor: Colors.primaryPale, alignItems: 'center', justifyContent: 'center' },
  brand: { fontSize: 10, color: Colors.textTertiary, fontFamily: 'Poppins_500Medium', textTransform: 'uppercase' },
  name: { ...Typography.bodySmall, color: Colors.textPrimary, fontFamily: 'Poppins_600SemiBold', marginTop: 2 },
  price: { fontSize: 13, color: Colors.primary, fontFamily: 'Poppins_600SemiBold', marginTop: 4 },
  subscriberHint: { fontSize: 11, color: Colors.accent, fontFamily: 'Poppins_500Medium', marginTop: 2 },
  savingsBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.accentMuted, borderRadius: BorderRadius.md,
    paddingHorizontal: 12, paddingVertical: 10, marginTop: Spacing.sm,
  },
  savingsBannerText: { flex: 1, fontSize: 12, color: Colors.primaryDark, fontFamily: 'Poppins_500Medium' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qtyBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primaryPale, alignItems: 'center', justifyContent: 'center' },
  qtyVal: { fontSize: 16, fontFamily: 'Poppins_700Bold', color: Colors.textPrimary, minWidth: 24, textAlign: 'center' },
  lineTotal: { ...Typography.subtitle, color: Colors.primary, marginLeft: 8 },
  summary: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, marginTop: Spacing.sm, ...Shadow.card },
  sectionTitle: { ...Typography.subtitle, color: Colors.textPrimary, marginBottom: Spacing.xs },
  sectionSubtitle: { ...Typography.caption, color: Colors.textSecondary },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { fontSize: 14, color: Colors.textSecondary },
  summaryValue: { fontSize: 14, color: Colors.textPrimary, fontFamily: 'Poppins_500Medium' },
  totalRow: { borderTopWidth: 1, borderTopColor: Colors.borderLight, paddingTop: 8, marginTop: 4, marginBottom: 0 },
  totalLabel: { ...Typography.subtitle, color: Colors.textPrimary },
  totalValue: { ...Typography.h4, color: Colors.primary },
  demoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.infoBg,
    borderWidth: 1,
    borderColor: Colors.info + '30',
    borderRadius: BorderRadius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  demoBadgeText: {
    fontSize: 12,
    color: Colors.info,
    fontFamily: 'Poppins_500Medium',
  },
  addressCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  addressCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryPale,
  },
  addressTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  addressLabel: { ...Typography.bodyEmphasis, color: Colors.textPrimary },
  defaultBadge: {
    ...Typography.caption,
    color: Colors.primaryDark,
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  addressText: { ...Typography.bodySmall, color: Colors.textSecondary },
  noteInput: {
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    minHeight: 86,
    textAlignVertical: 'top',
    padding: Spacing.md,
    ...Typography.body,
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  confirmationCard: {
    margin: Spacing.screen,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadow.card,
  },
  confirmationIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.success,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  confirmationTitle: { ...Typography.h4, color: Colors.textPrimary, textAlign: 'center' },
  confirmationSubtitle: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.xs, marginBottom: Spacing.lg },
  confirmationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  confirmationLabel: { ...Typography.bodySmall, color: Colors.textSecondary },
  confirmationValue: { ...Typography.bodyEmphasis, color: Colors.textPrimary },
  secondaryAction: { marginTop: Spacing.md, alignSelf: 'center' },
  secondaryActionText: { ...Typography.bodySmall, color: Colors.primaryDark, fontFamily: 'Poppins_500Medium' },
});
