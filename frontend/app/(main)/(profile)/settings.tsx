import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../../src/store/authStore';
import { authService } from '../../../src/services/api';
import AppTextField from '../../../src/components/ui/AppTextField';
import PrimaryButton from '../../../src/components/ui/PrimaryButton';
import { Colors } from '../../../src/constants/colors';
import { Typography, Spacing, BorderRadius, Shadow } from '../../../src/constants/spacing';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, updateUser, logout } = useAuthStore();
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);
  const [notifs, setNotifs] = useState(user?.preferences?.notifications ?? true);
  const [newsletter, setNewsletter] = useState(user?.preferences?.newsletter ?? true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await authService.updateMe({ firstName, lastName, phone });
      await updateUser(res.data);
      Alert.alert('✓ Profil mis à jour', 'Vos informations ont été enregistrées.');
    } catch (err: any) {
      Alert.alert('Erreur', err.message || 'Impossible de mettre à jour');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteError('');
    if (!deletePassword) {
      setDeleteError('Saisissez votre mot de passe pour confirmer');
      return;
    }
    setDeleting(true);
    try {
      await authService.deleteAccount(deletePassword);
      setShowDeleteModal(false);
      await logout();
      router.replace('/(auth)/login' as any);
      Alert.alert('Compte supprimé', 'Votre compte et vos données personnelles ont été supprimés.');
    } catch (err: any) {
      setDeleteError(err.message || 'Impossible de supprimer le compte');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Paramètres</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          <Text style={styles.sectionTitle}>Mon profil</Text>
          <View style={styles.card}>
            <AppTextField label="Prénom" value={firstName} onChangeText={setFirstName} icon="person-outline" />
            <AppTextField label="Nom" value={lastName} onChangeText={setLastName} icon="person-outline" />
            <AppTextField label="Téléphone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" icon="call-outline" />
            <PrimaryButton label="Enregistrer" onPress={handleSave} loading={saving} style={{ marginTop: Spacing.sm }} />
          </View>

          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.card}>
            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleLabel}>Notifications push</Text>
                <Text style={styles.toggleSub}>Rappels livraison, promotions</Text>
              </View>
              <Switch
                value={notifs}
                onValueChange={setNotifs}
                trackColor={{ false: Colors.borderMedium, true: Colors.primaryLight }}
                thumbColor={notifs ? Colors.primary : Colors.textTertiary}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleLabel}>Newsletter</Text>
                <Text style={styles.toggleSub}>Offres exclusives par email</Text>
              </View>
              <Switch
                value={newsletter}
                onValueChange={setNewsletter}
                trackColor={{ false: Colors.borderMedium, true: Colors.primaryLight }}
                thumbColor={newsletter ? Colors.primary : Colors.textTertiary}
              />
            </View>
          </View>

          <Text style={styles.sectionTitle}>Compte</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.dangerBtn}
              onPress={() => { setDeletePassword(''); setDeleteError(''); setShowDeleteModal(true); }}
            >
              <Ionicons name="trash-outline" size={18} color={Colors.error} />
              <Text style={styles.dangerText}>Supprimer mon compte</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Delete account confirmation (GDPR) */}
      <Modal visible={showDeleteModal} transparent animationType="fade" onRequestClose={() => setShowDeleteModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <Ionicons name="alert-outline" size={32} color={Colors.error} />
            </View>
            <Text style={styles.modalTitle}>Supprimer définitivement ?</Text>
            <Text style={styles.modalSubtitle}>
              Votre compte et toutes vos données personnelles (adresses, abonnements, demandes) seront
              supprimés. Cette action est irréversible.
            </Text>
            <AppTextField
              label="Confirmez avec votre mot de passe"
              value={deletePassword}
              onChangeText={setDeletePassword}
              secureTextEntry
              autoCapitalize="none"
              icon="lock-closed-outline"
              error={deleteError || undefined}
            />
            <PrimaryButton
              label="Supprimer définitivement"
              onPress={handleDeleteAccount}
              loading={deleting}
              style={{ marginTop: Spacing.sm, backgroundColor: Colors.error }}
            />
            <TouchableOpacity style={styles.modalCancel} onPress={() => setShowDeleteModal(false)}>
              <Text style={styles.modalCancelText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.screen, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', ...Shadow.card },
  headerTitle: { ...Typography.subtitle, color: Colors.textPrimary },
  content: { padding: Spacing.screen, paddingBottom: Spacing.xl },
  sectionTitle: { fontSize: 12, color: Colors.textTertiary, fontFamily: 'Poppins_600SemiBold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: Spacing.md },
  card: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, ...Shadow.card, marginBottom: Spacing.sm },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  toggleLabel: { ...Typography.bodySmall, color: Colors.textPrimary, fontFamily: 'Poppins_500Medium' },
  toggleSub: { fontSize: 11, color: Colors.textTertiary, marginTop: 2 },
  divider: { height: 1, backgroundColor: Colors.borderLight, marginVertical: 4 },
  dangerBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  dangerText: { ...Typography.body, color: Colors.error },
  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  modalCard: { width: '100%', maxWidth: 420, backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.lg, ...Shadow.card },
  modalIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.errorBg, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: Spacing.md },
  modalTitle: { ...Typography.h4, color: Colors.textPrimary, textAlign: 'center' },
  modalSubtitle: { ...Typography.bodySmall, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm, marginBottom: Spacing.md, lineHeight: 20 },
  modalCancel: { marginTop: Spacing.md, alignSelf: 'center' },
  modalCancelText: { ...Typography.body, color: Colors.primary, fontFamily: 'Poppins_500Medium' },
});
