import React, { useCallback, useEffect, useState } from 'react';
import { Alert, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../../src/components/ui/Screen';
import IconButton from '../../../src/components/ui/IconButton';
import PrimaryButton from '../../../src/components/ui/PrimaryButton';
import EmptyState from '../../../src/components/ui/EmptyState';
import AppBadge from '../../../src/components/ui/AppBadge';
import AppTextField from '../../../src/components/ui/AppTextField';
import Sheet from '../../../src/components/ui/Sheet';
import PressableScale from '../../../src/components/ui/PressableScale';
import { SkeletonRows } from '../../../src/components/ui/SkeletonCard';
import { addressService } from '../../../src/services/api';
import { Address } from '../../../src/models/types';
import { Colors } from '../../../src/constants/colors';
import { Elevation, Font, Radius, Spacing, Type } from '../../../src/constants/theme';

const EMPTY_FORM = {
  label: '',
  firstName: '',
  lastName: '',
  street: '',
  city: '',
  zipCode: '',
  country: 'France',
  phone: '',
  isDefault: false,
};

export default function AddressesScreen() {
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await addressService.getAll();
      setAddresses(res.data as Address[]);
    } catch {
      /* offline: keep current list */
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, isDefault: addresses.length === 0 });
    setShowForm(true);
  };

  const openEdit = (address: Address) => {
    setEditing(address);
    setForm({
      label: address.label,
      firstName: address.firstName,
      lastName: address.lastName,
      street: address.street,
      city: address.city,
      zipCode: address.zipCode,
      country: address.country,
      phone: address.phone ?? '',
      isDefault: address.isDefault,
    });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.label.trim() || !form.street.trim() || !form.city.trim() || !form.zipCode.trim()) {
      Alert.alert('Champs requis', 'Libellé, adresse, ville et code postal sont obligatoires.');
      return;
    }
    setSaving(true);
    try {
      if (editing) await addressService.update(editing.id, form);
      else await addressService.create(form);
      setShowForm(false);
      await load();
    } catch (err) {
      Alert.alert('Erreur', err instanceof Error ? err.message : 'Enregistrement impossible');
    } finally {
      setSaving(false);
    }
  };

  const remove = (address: Address) =>
    Alert.alert('Supprimer cette adresse ?', `${address.label} — ${address.street}`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await addressService.delete(address.id);
            await load();
          } catch {
            Alert.alert('Erreur', 'Suppression impossible');
          }
        },
      },
    ]);

  const setDefault = async (address: Address) => {
    try {
      await addressService.setDefault(address.id);
      await load();
    } catch {
      Alert.alert('Erreur', 'Action impossible');
    }
  };

  return (
    <Screen
      scroll
      tabBarSpace
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            void load();
          }}
          tintColor={Colors.primary}
        />
      }
    >
      <View style={styles.header}>
        <IconButton name="arrow-back" onPress={() => router.back()} accessibilityLabel="Retour" />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Mes adresses</Text>
          <Text style={styles.subtitle}>
            {addresses.length} adresse{addresses.length > 1 ? 's' : ''} enregistrée
            {addresses.length > 1 ? 's' : ''}
          </Text>
        </View>
        <IconButton name="add" variant="brand" onPress={openAdd} accessibilityLabel="Ajouter" />
      </View>

      {loading ? (
        <SkeletonRows count={2} />
      ) : addresses.length === 0 ? (
        <EmptyState
          icon="location-outline"
          title="Aucune adresse"
          description="Ajoutez une adresse pour que vos livraisons arrivent au bon endroit."
          actionLabel="Ajouter une adresse"
          onAction={openAdd}
        />
      ) : (
        <View style={{ gap: 12 }}>
          {addresses.map((address) => (
            <View
              key={address.id}
              style={[styles.card, address.isDefault && styles.cardDefault]}
            >
              <View style={styles.cardTop}>
                <View style={styles.iconWrap}>
                  <Ionicons name="home" size={17} color={Colors.primaryDark} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.labelRow}>
                    <Text style={styles.label}>{address.label}</Text>
                    {address.isDefault ? <AppBadge label="Principale" variant="sage" icon="star" /> : null}
                  </View>
                  <Text style={styles.line}>
                    {address.firstName} {address.lastName}
                  </Text>
                  <Text style={styles.line}>{address.street}</Text>
                  <Text style={styles.line}>
                    {address.zipCode} {address.city}, {address.country}
                  </Text>
                  {address.phone ? <Text style={styles.phone}>{address.phone}</Text> : null}
                </View>
              </View>

              <View style={styles.actions}>
                {!address.isDefault ? (
                  <PressableScale onPress={() => void setDefault(address)} style={styles.action} scaleTo={0.94}>
                    <Ionicons name="star-outline" size={14} color={Colors.primaryDark} />
                    <Text style={styles.actionText}>Définir par défaut</Text>
                  </PressableScale>
                ) : null}
                <PressableScale onPress={() => openEdit(address)} style={styles.action} scaleTo={0.94}>
                  <Ionicons name="create-outline" size={14} color={Colors.primaryDark} />
                  <Text style={styles.actionText}>Modifier</Text>
                </PressableScale>
                <PressableScale
                  onPress={() => remove(address)}
                  style={[styles.action, styles.actionDanger]}
                  scaleTo={0.94}
                >
                  <Ionicons name="trash-outline" size={14} color={Colors.error} />
                  <Text style={[styles.actionText, { color: Colors.error }]}>Supprimer</Text>
                </PressableScale>
              </View>
            </View>
          ))}
        </View>
      )}

      <Sheet
        visible={showForm}
        onClose={() => setShowForm(false)}
        title={editing ? 'Modifier l’adresse' : 'Nouvelle adresse'}
        subtitle="Ces informations servent uniquement à la livraison"
        footer={
          <PrimaryButton
            testID="address-save-btn"
            label={saving ? 'Enregistrement…' : 'Enregistrer'}
            icon="checkmark"
            loading={saving}
            onPress={() => void save()}
          />
        }
      >
        <View style={{ gap: Spacing.sm }}>
          <AppTextField
            label="Libellé"
            value={form.label}
            onChangeText={(value) => setForm((prev) => ({ ...prev, label: value }))}
            placeholder="Maison, Bureau…"
            icon="pricetag-outline"
          />
          <View style={styles.fieldRow}>
            <View style={{ flex: 1 }}>
              <AppTextField
                label="Prénom"
                value={form.firstName}
                onChangeText={(value) => setForm((prev) => ({ ...prev, firstName: value }))}
                placeholder="Sarah"
                icon="person-outline"
              />
            </View>
            <View style={{ flex: 1 }}>
              <AppTextField
                label="Nom"
                value={form.lastName}
                onChangeText={(value) => setForm((prev) => ({ ...prev, lastName: value }))}
                placeholder="Martin"
              />
            </View>
          </View>
          <AppTextField
            label="Adresse"
            value={form.street}
            onChangeText={(value) => setForm((prev) => ({ ...prev, street: value }))}
            placeholder="12 rue des Lilas"
            icon="home-outline"
          />
          <View style={styles.fieldRow}>
            <View style={{ flex: 1 }}>
              <AppTextField
                label="Code postal"
                value={form.zipCode}
                onChangeText={(value) => setForm((prev) => ({ ...prev, zipCode: value }))}
                placeholder="75011"
                keyboardType="numeric"
              />
            </View>
            <View style={{ flex: 1 }}>
              <AppTextField
                label="Ville"
                value={form.city}
                onChangeText={(value) => setForm((prev) => ({ ...prev, city: value }))}
                placeholder="Paris"
              />
            </View>
          </View>
          <AppTextField
            label="Téléphone (optionnel)"
            value={form.phone}
            onChangeText={(value) => setForm((prev) => ({ ...prev, phone: value }))}
            placeholder="+33 6 00 00 00 00"
            keyboardType="phone-pad"
            icon="call-outline"
          />
        </View>
      </Sheet>
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
  cardDefault: { borderColor: Colors.primaryLight, backgroundColor: '#FFFCFD' },
  cardTop: { flexDirection: 'row', gap: 12 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: Colors.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { ...Type.bodyStrong, color: Colors.textPrimary },
  line: { ...Type.small, color: Colors.textSecondary, marginTop: 2 },
  phone: { ...Type.small, color: Colors.textTertiary, marginTop: 4 },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: Spacing.sm,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryPale,
    borderWidth: 1,
    borderColor: Colors.primaryMuted,
  },
  actionDanger: { backgroundColor: Colors.errorBg, borderColor: '#F0C9C9' },
  actionText: { fontFamily: Font.semibold, fontSize: 12, color: Colors.primaryDark },
  fieldRow: { flexDirection: 'row', gap: 10 },
});
