import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, TextInput, Alert, KeyboardAvoidingView, Platform,
  ScrollView, RefreshControl, Switch, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { adminService } from '../../src/services/api';
import { Product } from '../../src/models/types';
import { Colors } from '../../src/constants/colors';
import { Radius, Spacing } from '../../src/constants/spacing';
import { Elevation, Font, Type } from '../../src/constants/theme';
import { Chip, ChipRow } from '../../src/components/ui/Chip';
import IconButton from '../../src/components/ui/IconButton';
import PrimaryButton from '../../src/components/ui/PrimaryButton';
import EmptyState from '../../src/components/ui/EmptyState';
import { SkeletonListItem } from '../../src/components/ui/SkeletonCard';

const FREQ_OPTIONS = [
  { key: 'weekly', label: 'Hebdo' },
  { key: 'biweekly', label: '2 sem.' },
  { key: 'monthly', label: 'Mensuel' },
];

const EMPTY_FORM = {
  name: '', brand: '', description: '', shortDescription: '',
  categoryId: '', price: '', subscriptionPrice: '', discountPercentage: '',
  unit: '', quantity: '1', stockCount: '100',
  availableFrequencies: ['monthly'],
  isFeatured: false, isNewArrival: false, isBestSeller: false,
  images: [''],
};

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [prodRes, catRes] = await Promise.allSettled([
        adminService.getAllProducts(),
        adminService.getCategories(),
      ]);
      if (prodRes.status === 'fulfilled') {
        const data = prodRes.value.data;
        setProducts(Array.isArray(data) ? data : (data.products || []));
      }
      if (catRes.status === 'fulfilled') setCategories(catRes.value.data);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { loadData(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, categoryId: categories[0]?.id || '' });
    setShowModal(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name, brand: p.brand, description: p.description,
      shortDescription: p.shortDescription || '',
      categoryId: p.categoryId,
      price: String(p.price), subscriptionPrice: String(p.subscriptionPrice),
      discountPercentage: String(p.discountPercentage || ''),
      unit: p.unit, quantity: String(p.quantity),
      stockCount: String(p.stockCount || 100),
      availableFrequencies: [...p.availableFrequencies],
      isFeatured: p.isFeatured || false,
      isNewArrival: p.isNewArrival || false,
      isBestSeller: p.isBestSeller || false,
      images: p.images?.length ? p.images : [''],
    });
    setShowModal(true);
  };

  const toggleFreq = (key: string) => {
    setForm(prev => ({
      ...prev,
      availableFrequencies: prev.availableFrequencies.includes(key)
        ? prev.availableFrequencies.filter(f => f !== key)
        : [...prev.availableFrequencies, key],
    }));
  };

  const handleSave = async () => {
    if (!form.name || !form.brand || !form.price || !form.subscriptionPrice) {
      Alert.alert('Champs requis', 'Nom, marque, prix et prix abonné sont obligatoires.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price),
        subscriptionPrice: parseFloat(form.subscriptionPrice),
        discountPercentage: parseFloat(form.discountPercentage || '0'),
        quantity: parseInt(form.quantity) || 1,
        stockCount: parseInt(form.stockCount) || 100,
        images: form.images.filter(Boolean),
        inStock: true, isActive: true,
      };
      if (editing) {
        await adminService.updateProduct(editing.id, payload);
      } else {
        await adminService.createProduct(payload);
      }
      setShowModal(false);
      loadData();
      Alert.alert('✓', editing ? 'Produit mis à jour' : 'Produit créé');
    } catch (err: any) {
      Alert.alert('Erreur', err.response?.data?.detail || err.message);
    } finally { setSaving(false); }
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert(`Supprimer "${name}" ?`, 'Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: async () => {
          try { await adminService.deleteProduct(id); loadData(); }
          catch { Alert.alert('Erreur', 'Impossible de supprimer'); }
        }}
      ]
    );
  };

  const handleToggle = async (id: string) => {
    try { await adminService.toggleProduct(id); loadData(); }
    catch { Alert.alert('Erreur', 'Impossible de modifier'); }
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.brand.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.pageTitle}>Produits</Text>
          <Text style={styles.pageSubtitle}>
            {products.length} produit{products.length > 1 ? 's' : ''} au catalogue
          </Text>
        </View>
        <PressableRow onPress={openAdd}>
          <Ionicons name="add" size={18} color={Colors.textInverse} />
          <Text style={styles.addBtnText}>Ajouter</Text>
        </PressableRow>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={17} color={Colors.textTertiary} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Rechercher par nom ou marque…"
          placeholderTextColor={Colors.textPlaceholder}
        />
        {search ? (
          <Ionicons name="close-circle" size={17} color={Colors.textTertiary} onPress={() => setSearch('')} />
        ) : null}
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.list}>
          <SkeletonListItem />
          <SkeletonListItem />
          <SkeletonListItem />
        </View>
      ) : filtered.length === 0 ? (
        <EmptyState icon="cube-outline" title="Aucun produit" description="Ajustez votre recherche ou créez un produit." />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={Colors.primary} />
          }
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={styles.rowIcon}>
                <Ionicons name="cube-outline" size={19} color={Colors.primaryDark} />
              </View>
              <View style={styles.rowBody}>
                <Text style={styles.rowName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.rowBrand} numberOfLines={1}>{item.brand} · {item.unit}</Text>
                <Text style={styles.rowPrice}>{item.subscriptionPrice.toFixed(2)} € / abonné</Text>
              </View>
              <View style={styles.rowActions}>
                <Switch
                  value={item.isActive}
                  onValueChange={() => handleToggle(item.id)}
                  trackColor={{ false: Colors.borderMedium, true: Colors.primaryLight }}
                  thumbColor={item.isActive ? Colors.primary : Colors.textTertiary}
                />
                <IconButton
                  name="pencil-outline"
                  variant="soft"
                  size={34}
                  iconSize={16}
                  color={Colors.info}
                  onPress={() => openEdit(item)}
                  accessibilityLabel="Modifier"
                />
                <IconButton
                  name="trash-outline"
                  variant="plain"
                  size={34}
                  iconSize={16}
                  color={Colors.error}
                  onPress={() => handleDelete(item.id, item.name)}
                  accessibilityLabel="Supprimer"
                />
              </View>
            </View>
          )}
        />
      )}

      {/* Add/Edit Modal */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalSafe}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editing ? 'Modifier le produit' : 'Nouveau produit'}</Text>
              <IconButton name="close" variant="plain" size={38} onPress={() => setShowModal(false)} accessibilityLabel="Fermer" />
            </View>
            <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
              {[
                { label: 'Nom *', key: 'name', placeholder: 'Ex : Couches Taille 2' },
                { label: 'Marque *', key: 'brand', placeholder: 'Ex : Pampers' },
                { label: 'Description courte', key: 'shortDescription', placeholder: 'Résumé en une ligne' },
                { label: 'Unité', key: 'unit', placeholder: 'Ex : paquet de 84' },
                { label: 'Prix normal (€) *', key: 'price', placeholder: '0.00', keyboardType: 'decimal-pad' },
                { label: 'Prix abonné (€) *', key: 'subscriptionPrice', placeholder: '0.00', keyboardType: 'decimal-pad' },
                { label: 'Remise (%)', key: 'discountPercentage', placeholder: '10', keyboardType: 'decimal-pad' },
                { label: 'Stock', key: 'stockCount', placeholder: '100', keyboardType: 'numeric' },
                { label: 'Image URL', key: 'images', placeholder: 'https://…', value: form.images[0], onChange: (v: string) => setForm(p => ({ ...p, images: [v] })) },
              ].map(field => (
                <View key={field.key} style={{ marginBottom: 12 }}>
                  <Text style={styles.inputLabel}>{field.label}</Text>
                  <TextInput
                    style={styles.textInput}
                    value={field.value !== undefined ? field.value : (form as any)[field.key]}
                    onChangeText={field.onChange || ((v: string) => setForm(p => ({ ...p, [field.key]: v })))}
                    placeholder={field.placeholder}
                    placeholderTextColor={Colors.textPlaceholder}
                    keyboardType={(field as any).keyboardType || 'default'}
                  />
                </View>
              ))}

              {/* Category */}
              <Text style={styles.inputLabel}>Catégorie</Text>
              <ChipRow contentStyle={{ paddingBottom: 12, gap: 8 }}>
                {categories.map(cat => (
                  <Chip
                    key={cat.id}
                    label={cat.name}
                    active={form.categoryId === cat.id}
                    onPress={() => setForm(p => ({ ...p, categoryId: cat.id }))}
                  />
                ))}
              </ChipRow>

              {/* Frequencies */}
              <Text style={styles.inputLabel}>Fréquences disponibles</Text>
              <ChipRow contentStyle={{ paddingBottom: 12, gap: 8 }}>
                {FREQ_OPTIONS.map(f => (
                  <Chip
                    key={f.key}
                    label={f.label}
                    tone="sage"
                    active={form.availableFrequencies.includes(f.key)}
                    onPress={() => toggleFreq(f.key)}
                  />
                ))}
              </ChipRow>

              {/* Badges */}
              <Text style={styles.inputLabel}>Badges</Text>
              {[
                { key: 'isFeatured', label: 'Mis en avant' },
                { key: 'isNewArrival', label: 'Nouveauté' },
                { key: 'isBestSeller', label: 'Best-seller' },
              ].map(badge => (
                <View key={badge.key} style={styles.toggleRow}>
                  <Text style={styles.toggleLabel}>{badge.label}</Text>
                  <Switch
                    value={(form as any)[badge.key]}
                    onValueChange={v => setForm(p => ({ ...p, [badge.key]: v }))}
                    trackColor={{ false: Colors.borderMedium, true: Colors.primaryLight }}
                    thumbColor={(form as any)[badge.key] ? Colors.primary : Colors.textTertiary}
                  />
                </View>
              ))}

              <PrimaryButton
                label={editing ? 'Enregistrer' : 'Créer le produit'}
                onPress={handleSave}
                loading={saving}
                fullWidth
                style={{ marginTop: Spacing.lg }}
              />
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

/** Small brand pill button (admin header CTA). */
function PressableRow({ children, onPress }: { children: React.ReactNode; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.addBtn} onPress={onPress} activeOpacity={0.85}>
      {children}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: Spacing.screen,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  pageTitle: { ...Type.display, color: Colors.textPrimary },
  pageSubtitle: { ...Type.small, color: Colors.textSecondary, marginTop: 2 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingHorizontal: 16,
    paddingVertical: 11,
    ...Elevation.brand,
  },
  addBtnText: { color: Colors.textInverse, fontFamily: Font.semibold, fontSize: 14 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: Spacing.screen,
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Elevation.xs,
  },
  searchInput: { flex: 1, ...Type.body, color: Colors.textPrimary, padding: 0 },
  list: { paddingHorizontal: Spacing.screen, paddingTop: Spacing.md, paddingBottom: Spacing.xxxl, gap: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.md,
    ...Elevation.sm,
  },
  rowIcon: {
    width: 46,
    height: 46,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1 },
  rowName: { ...Type.h3, color: Colors.textPrimary },
  rowBrand: { ...Type.small, color: Colors.textTertiary, marginTop: 2 },
  rowPrice: { fontFamily: Font.semibold, fontSize: 13, color: Colors.primaryDark, marginTop: 2 },
  rowActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  modalSafe: { flex: 1, backgroundColor: Colors.background },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.screen,
    paddingVertical: Spacing.sm,
  },
  modalTitle: { ...Type.h2, color: Colors.textPrimary },
  modalContent: { paddingHorizontal: Spacing.screen, paddingBottom: Spacing.xxxl },
  inputLabel: { ...Type.smallStrong, color: Colors.textPrimary, marginBottom: 6 },
  textInput: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingHorizontal: 14,
    paddingVertical: 12,
    ...Type.body,
    color: Colors.textPrimary,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  toggleLabel: { ...Type.body, color: Colors.textPrimary },
});
