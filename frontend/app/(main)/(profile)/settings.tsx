import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Screen from '../../../src/components/ui/Screen';
import IconButton from '../../../src/components/ui/IconButton';
import AppTextField from '../../../src/components/ui/AppTextField';
import PrimaryButton from '../../../src/components/ui/PrimaryButton';
import ListRow, { ListGroup } from '../../../src/components/ui/ListRow';
import { GradientCard } from '../../../src/components/ui/GradientCard';
import { useAuthStore } from '../../../src/store/authStore';
import { authService } from '../../../src/services/api';
import { Colors } from '../../../src/constants/colors';
import { Radius, Spacing, Type } from '../../../src/constants/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, updateUser, logout } = useAuthStore();

  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [saving, setSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const saveProfile = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Champs requis', 'Prénom et nom sont nécessaires.');
      return;
    }
    setSaving(true);
    try {
      const res = await authService.updateMe({ firstName, lastName, phone });
      await updateUser(res.data);
      Alert.alert('Profil mis à jour ✓', 'Vos informations ont été enregistrées.');
    } catch (err) {
      Alert.alert('Erreur', err instanceof Error ? err.message : 'Enregistrement impossible');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (newPassword.length < 8) {
      Alert.alert('Mot de passe trop court', '8 caractères minimum.');
      return;
    }
    setChangingPassword(true);
    try {
      await authService.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      Alert.alert('Mot de passe modifié ✓', 'Utilisez-le à votre prochaine connexion.');
    } catch (err) {
      Alert.alert('Erreur', err instanceof Error ? err.message : 'Modification impossible');
    } finally {
      setChangingPassword(false);
    }
  };

  const deleteAccount = async () => {
    if (!deletePassword) {
      Alert.alert('Mot de passe requis', 'Confirmez avec votre mot de passe actuel.');
      return;
    }
    setDeleting(true);
    try {
      await authService.deleteAccount(deletePassword);
      await logout();
      router.replace('/(auth)/login' as never);
      Alert.alert('Compte supprimé', 'Vos données personnelles ont été effacées.');
    } catch (err) {
      Alert.alert('Erreur', err instanceof Error ? err.message : 'Suppression impossible');
    } finally {
      setDeleting(false);
      setShowDelete(false);
    }
  };

  return (
    <Screen scroll tabBarSpace>
      <View style={styles.header}>
        <IconButton name="arrow-back" onPress={() => router.back()} accessibilityLabel="Retour" />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Paramètres</Text>
          <Text style={styles.subtitle}>Informations, sécurité et confidentialité</Text>
        </View>
      </View>

      <GradientCard colors="blush" contentStyle={styles.summary}>
        <Text style={styles.summaryTitle}>Votre compte</Text>
        <Text style={styles.summaryText}>{user?.email}</Text>
        <Text style={styles.summaryMeta}>
          Membre depuis{' '}
          {user?.createdAt
            ? new Date(user.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
            : '—'}
        </Text>
      </GradientCard>

      <Text style={styles.sectionTitle}>Informations personnelles</Text>
      <View style={styles.card}>
        <AppTextField label="Prénom" value={firstName} onChangeText={setFirstName} icon="person-outline" />
        <AppTextField label="Nom" value={lastName} onChangeText={setLastName} icon="person-outline" />
        <AppTextField
          label="Téléphone"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          icon="call-outline"
        />
        <PrimaryButton
          label={saving ? 'Enregistrement…' : 'Enregistrer'}
          icon="checkmark"
          loading={saving}
          onPress={() => void saveProfile()}
        />
      </View>

      <Text style={styles.sectionTitle}>Sécurité</Text>
      <View style={styles.card}>
        <AppTextField
          label="Mot de passe actuel"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
          secureToggle
          icon="lock-closed-outline"
        />
        <AppTextField
          label="Nouveau mot de passe"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          secureToggle
          icon="key-outline"
        />
        <PrimaryButton
          label={changingPassword ? 'Modification…' : 'Changer le mot de passe'}
          variant="secondary"
          loading={changingPassword}
          onPress={() => void changePassword()}
        />
      </View>

      <ListGroup title="Confidentialité & données" style={styles.group}>
        <ListRow
          icon="shield-checkmark-outline"
          title="Données stockées localement"
          subtitle="Favoris, conseils sauvegardés et préférences restent sur votre appareil"
          chevron={false}
        />
        <ListRow
          icon="trash-outline"
          iconColor={Colors.error}
          iconBackground={Colors.errorBg}
          title="Supprimer mon compte"
          subtitle="Effacement définitif (RGPD)"
          danger
          chevron={!showDelete}
          onPress={() => setShowDelete((prev) => !prev)}
        />
      </ListGroup>

      {showDelete ? (
        <View style={styles.dangerZone}>
          <Text style={styles.dangerTitle}>Confirmer la suppression</Text>
          <Text style={styles.dangerText}>
            Cette action est définitive : compte, adresses, abonnements et notifications seront
            supprimés. Les commandes sont anonymisées pour des raisons comptables.
          </Text>
          <AppTextField
            label="Mot de passe actuel"
            value={deletePassword}
            onChangeText={setDeletePassword}
            secureTextEntry
            secureToggle
            icon="lock-closed-outline"
          />
          <PrimaryButton
            label={deleting ? 'Suppression…' : 'Supprimer définitivement'}
            variant="ink"
            icon="trash"
            loading={deleting}
            onPress={() => void deleteAccount()}
          />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: Spacing.lg },
  title: { ...Type.h1, color: Colors.textPrimary },
  subtitle: { ...Type.small, color: Colors.textSecondary, marginTop: 2 },
  summary: { gap: 4, paddingVertical: Spacing.lg },
  summaryTitle: { ...Type.caption, color: Colors.textTertiary, textTransform: 'uppercase' },
  summaryText: { ...Type.h3, color: Colors.textPrimary },
  summaryMeta: { ...Type.small, color: Colors.textSecondary },
  sectionTitle: { ...Type.h3, color: Colors.textPrimary, marginTop: Spacing.xl, marginBottom: Spacing.sm },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xxl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.md,
  },
  group: { marginTop: Spacing.xl },
  dangerZone: {
    marginTop: Spacing.md,
    backgroundColor: Colors.errorBg,
    borderRadius: Radius.xxl,
    borderWidth: 1,
    borderColor: '#F0C9C9',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  dangerTitle: { ...Type.h3, color: Colors.error },
  dangerText: { ...Type.small, color: Colors.textSecondary },
});
