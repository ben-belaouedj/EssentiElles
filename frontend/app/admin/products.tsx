import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, TextInput, Alert, KeyboardAvoidingView, Platform,
  ScrollView, RefreshControl, Switch, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { adminService } from '../../src/services/api';
import { Product } from '../../src/models/types';
import { Colors } from '../../src/constants/colors';
import { Typography, Spacing, BorderRadius, Shadow } from '../../src/constants/spacing';

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
        <View>
          <Text style={styles.pageTitle}>Gestion des produits</Text>
          <Text style={styles.pageSubtitle}>{products.length} produit(s) au catalogue</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
          <Ionicons name="add" size={18} color={Colors.textInverse} />
          <Text style={styles.addBtnText}>Ajouter</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={16} color={Colors.textTertiary} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Rechercher par nom ou marque..."
          placeholderTextColor={Colors.textPlaceholder}
        />
      </View>

      {/* List */}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={Colors.primary} />
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
              <View style={styles.rowLeft}>
                <View style={styles.rowIcon}>
                  <Ionicons name="cube-outline" size={20} color={Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.rowBrand}>{item.brand} — {item.unit}</Text>
                  <Text style={styles.rowPrice}>{item.subscriptionPrice.toFixed(2)} €/abonné</Text>
                </View>
              </View>
              <View style={styles.rowActions}>
                <Switch
                  value={item.isActive}
                  onValueChange={() => handleToggle(item.id)}
                  trackColor={{ false: Colors.borderMedium, true: Colors.primaryLight }}
                  thumbColor={item.isActive ? Colors.primary : Colors.textTertiary}
                />
                <TouchableOpacity onPress={() => openEdit(item)} style={styles.iconBtn}>
                  <Ionicons name="pencil-outline" size={18} color={Colors.info} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item.id, item.name)} style={styles.iconBtn}>
                  <Ionicons name="trash-outline" size={18} color={Colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {/* Add/Edit Modal */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaSection>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editing ? 'Modifier le produit' : 'Nouveau produit'}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalContent}>
              {[
                { label: 'Nom *', key: 'name', placeholder: 'Ex: Couches Taille 2' },
                { label: 'Marque *', key: 'brand', placeholder: 'Ex: Pampers' },
                { label: 'Description courte', key: 'shortDescription', placeholder: 'Résumé en une ligne' },
                { label: 'Unité', key: 'unit', placeholder: 'Ex: paquet de 84' },
                { label: 'Prix normal (€) *', key: 'price', placeholder: '0.00', keyboardType: 'decimal-pad' },
                { label: 'Prix abonné (€) *', key: 'subscriptionPrice', placeholder: '0.00', keyboardType: 'decimal-pad' },
                { label: 'Remise (%)', key: 'discountPercentage', placeholder: '10', keyboardType: 'decimal-pad' },
                { label: 'Stock', key: 'stockCount', placeholder: '100', keyboardType: 'numeric' },
                { label: 'Image URL', key: 'images', placeholder: 'https://...', value: form.images[0], onChange: (v: string) => setForm(p => ({ ...p, images: [v] })) },
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
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {categories.map(cat => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.chip, form.categoryId === cat.id && styles.chipActive]}
                      onPress={() => setForm(p => ({ ...p, categoryId: cat.id }))}
                    >
                      <Text style={[styles.chipText, form.categoryId === cat.id && styles.chipTextActive]}>{cat.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              {/* Frequencies */}
              <Text style={styles.inputLabel}>Fréquences disponibles</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                {FREQ_OPTIONS.map(f => (
                  <TouchableOpacity
                    key={f.key}
                    style={[styles.chip, form.availableFrequencies.includes(f.key) && styles.chipActive]}
                    onPress={() => toggleFreq(f.key)}
                  >
                    <Text style={[styles.chipText, form.availableFrequencies.includes(f.key) && styles.chipTextActive]}>{f.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

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

              <TouchableOpacity
                style={[styles.saveBtn, saving && { opacity: 0.7 }]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={Colors.textInverse} />
                ) : (
                  <Text style={styles.saveBtnText}>{editing ? 'Enregistrer' : 'Créer le produit'}</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaSection>
      </Modal>
    </View>
  );
}

function SafeAreaSection({ children }: { children: React.ReactNode }) {
  const { SafeAreaView } = require('react-native-safe-area-context');
  return <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>{children}</SafeAreaView>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.borderLight, backgroundColor: Colors.surface },
  pageTitle: { ...Typography.h4, color: Colors.textPrimary },
  pageSubtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingHorizontal: 16, paddingVertical: 10 },
  addBtnText: { color: Colors.textInverse, fontFamily: 'Poppins_600SemiBold', fontSize: 14 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, margin: Spacing.md, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: Colors.borderLight },
  searchInput: { flex: 1, fontSize: 14, color: Colors.textPrimary },
  list: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xl },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: 8, ...Shadow.card },
  rowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 },
  rowIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.primaryPale, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  rowName: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: Colors.textPrimary },
  rowBrand: { fontSize: 12, color: Colors.textTertiary, marginTop: 2 },
  rowPrice: { fontSize: 13, color: Colors.primary, fontFamily: 'Poppins_600SemiBold', marginTop: 2 },
  rowActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconBtn: { padding: 8, borderRadius: 8 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.screen, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  modalTitle: { ...Typography.h4, color: Colors.textPrimary },
  modalContent: { padding: Spacing.screen, paddingBottom: Spacing.xl },
  inputLabel: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: Colors.textPrimary, marginBottom: 6 },
  textInput: { backgroundColor: Colors.surface, borderRadius: BorderRadius.md, borderWidth: 1.5, borderColor: Colors.borderLight, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: Colors.textPrimary },
  chip: { borderRadius: BorderRadius.pill, borderWidth: 1.5, borderColor: Colors.borderLight, paddingHorizontal: 12, paddingVertical: 6 },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 12, fontFamily: 'Poppins_500Medium', color: Colors.textSecondary },
  chipTextActive: { color: Colors.textInverse },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  toggleLabel: { fontSize: 14, color: Colors.textPrimary },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.lg, padding: 14, alignItems: 'center', marginTop: Spacing.lg },
  saveBtnText: { color: Colors.textInverse, fontFamily: 'Poppins_600SemiBold', fontSize: 15 },
});
