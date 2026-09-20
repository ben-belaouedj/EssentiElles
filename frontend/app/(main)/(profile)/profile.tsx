import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../../src/components/ui/Screen';
import ListRow, { ListGroup } from '../../../src/components/ui/ListRow';
import AppBadge from '../../../src/components/ui/AppBadge';
import OfflineBanner from '../../../src/components/ui/OfflineBanner';
import StatTile from '../../../src/components/ui/StatTile';
import { GradientCard } from '../../../src/components/ui/GradientCard';
import PrimaryButton from '../../../src/components/ui/PrimaryButton';
import { Chip } from '../../../src/components/ui/Chip';
import { useAuthStore } from '../../../src/store/authStore';
import { useFavoritesStore } from '../../../src/store/favoritesStore';
import { usePreferencesStore } from '../../../src/store/preferencesStore';
import { useOfflineQuery } from '../../../src/hooks/useOfflineQuery';
import { orderService, subscriptionService } from '../../../src/services/api';
import { Order, Subscription } from '../../../src/models/types';
import { Colors } from '../../../src/constants/colors';
import { Font, Radius, Spacing, Type } from '../../../src/constants/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, language, setLanguage, logout } = useAuthStore();
  const favorites = useFavoritesStore((s) => s.ids.length);
  const { savedTips, deliveryReminders, promoNotifications, orderUpdates, setPreference } =
    usePreferencesStore();
  const [languageBusy, setLanguageBusy] = useState(false);

  const subscriptions = useOfflineQuery<Subscription[]>(
    () => subscriptionService.getAll().then((res) => res.data as Subscription[]),
    { cacheKey: 'subscriptions' }
  );
  const orders = useOfflineQuery<Order[]>(
    () => orderService.getAll().then((res) => res.data as Order[]),
    { cacheKey: 'orders' }
  );

  const activeSubs = (subscriptions.data ?? []).filter((sub) => sub.status === 'active').length;
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    : null;

  const changeLanguage = async (lang: 'fr' | 'en') => {
    setLanguageBusy(true);
    try {
      await setLanguage(lang);
    } finally {
      setLanguageBusy(false);
    }
  };

  const confirmLogout = () =>
    Alert.alert('Se déconnecter ?', 'Vous pourrez vous reconnecter à tout moment.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnexion',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login' as never);
        },
      },
    ]);

  return (
    <Screen scroll tabBarSpace>
      <OfflineBanner visible={false} />

      {/* Identity card */}
      <GradientCard colors="brandDeep" contentStyle={styles.identity}>
        <View style={styles.identityRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(user?.firstName?.[0] ?? 'L').toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>
              {user?.firstName} {user?.lastName}
            </Text>
            <Text style={styles.email}>{user?.email}</Text>
            {memberSince ? <Text style={styles.since}>Membre depuis {memberSince}</Text> : null}
          </View>
        </View>

        <View style={styles.identityBadges}>
          <AppBadge
            label={user?.role === 'admin' ? 'Administratrice' : 'Cliente fidèle'}
            variant="glass"
            icon={user?.role === 'admin' ? 'shield-checkmark' : 'sparkles'}
          />
          {user?.phone ? <AppBadge label={user.phone} variant="glass" icon="call-outline" /> : null}
        </View>
      </GradientCard>

      {/* Stats */}
      <View style={styles.stats}>
        <StatTile icon="repeat" label="Abonnements actifs" value={activeSubs} tone="primary" />
        <StatTile
          icon="bag-check"
          label="Commandes"
          value={(orders.data ?? []).length}
          tone="sage"
        />
        <StatTile icon="heart" label="Favoris" value={favorites} tone="amber" />
      </View>

      {/* Account */}
      <ListGroup title="Mon compte" style={styles.group}>
        <ListRow
          icon="repeat-outline"
          title="Mes abonnements"
          subtitle="Quantité, fréquence, pause et report"
          badge={activeSubs ? `${activeSubs} actif${activeSubs > 1 ? 's' : ''}` : undefined}
          onPress={() => router.push('/(main)/(subs)/subscriptions' as never)}
        />
        <ListRow
          icon="bag-handle-outline"
          iconColor="#5F7358"
          iconBackground={Colors.accentSageSoft}
          title="Mes commandes"
          subtitle="Historique et suivi de livraison"
          onPress={() => router.push('/(main)/(orders)/orders' as never)}
        />
        <ListRow
          icon="document-text-outline"
          title="Factures"
          subtitle="Téléchargez vos justificatifs"
          onPress={() => router.push('/(main)/(orders)/invoices' as never)}
        />
        <ListRow
          icon="location-outline"
          title="Adresses de livraison"
          subtitle="Gérez vos points de dépôt"
          onPress={() => router.push('/(main)/addresses' as never)}
        />
        <ListRow
          icon="heart-outline"
          title="Favoris"
          subtitle="Vos produits sauvegardés"
          onPress={() => router.push('/(main)/favorites' as never)}
        />
      </ListGroup>

      {/* Preferences */}
      <ListGroup title="Préférences" style={styles.group}>
        <ListRow
          icon="notifications-outline"
          title="Rappels livraison"
          subtitle="Alerte locale avant chaque envoi"
          switchValue={deliveryReminders}
          onSwitchChange={(value) => void setPreference('deliveryReminders', value)}
          onPress={() => undefined}
        />
        <ListRow
          icon="pricetag-outline"
          title="Offres et promos"
          subtitle="Bons plans et nouveautés"
          switchValue={promoNotifications}
          onSwitchChange={(value) => void setPreference('promoNotifications', value)}
          onPress={() => undefined}
        />
        <ListRow
          icon="cube-outline"
          title="Suivi de commande"
          subtitle="Notifications à chaque étape"
          switchValue={orderUpdates}
          onSwitchChange={(value) => void setPreference('orderUpdates', value)}
          onPress={() => undefined}
        />
        <ListRow
          icon="bookmark-outline"
          title="Conseils sauvegardés"
          subtitle="Disponibles hors connexion"
          value={String(savedTips.length)}
          onPress={() => router.push('/(main)/guides' as never)}
        />
      </ListGroup>

      {/* Language */}
      <View style={styles.languageCard}>
        <View style={styles.languageText}>
          <Text style={styles.languageTitle}>Langue de l’application</Text>
          <Text style={styles.languageSubtitle}>
            Interface et contenus traduits progressivement
          </Text>
        </View>
        <View style={styles.languageChips}>
          <Chip
            label="Français"
            active={language === 'fr'}
            onPress={() => void changeLanguage('fr')}
            testID="profile-language-fr"
          />
          <Chip
            label="English"
            active={language === 'en'}
            onPress={() => void changeLanguage('en')}
            testID="profile-language-en"
          />
        </View>
        {languageBusy ? <Text style={styles.languageHint}>Mise à jour…</Text> : null}
      </View>

      {/* Support */}
      <ListGroup title="Aide & sécurité" style={styles.group}>
        <ListRow
          icon="chatbubbles-outline"
          title="Aide & support"
          subtitle="FAQ et tickets"
          onPress={() => router.push('/(main)/(profile)/support' as never)}
        />
        <ListRow
          icon="settings-outline"
          title="Paramètres du compte"
          subtitle="Informations personnelles et mot de passe"
          onPress={() => router.push('/(main)/(profile)/settings' as never)}
        />
        {user?.role === 'admin' ? (
          <ListRow
            icon="shield-outline"
            iconColor={Colors.info}
            iconBackground={Colors.infoBg}
            title="Panel administrateur"
            subtitle="Produits, commandes, utilisateurs"
            onPress={() => router.push('/admin' as never)}
          />
        ) : null}
        <ListRow
          icon="log-out-outline"
          iconColor={Colors.error}
          iconBackground={Colors.errorBg}
          title="Déconnexion"
          danger
          chevron={false}
          onPress={confirmLogout}
        />
      </ListGroup>

      <PrimaryButton
        label="Voir les conseils du moment"
        variant="ghost"
        icon="book-outline"
        onPress={() => router.push('/(main)/guides' as never)}
        style={{ marginTop: Spacing.lg }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  identity: { gap: Spacing.md, paddingVertical: Spacing.lg },
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: 'rgba(255,255,255,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarText: { fontFamily: Font.bold, fontSize: 24, color: Colors.textInverse },
  name: { ...Type.h2, color: Colors.textInverse },
  email: { ...Type.small, color: 'rgba(255,255,255,0.86)', marginTop: 2 },
  since: { ...Type.small, fontSize: 11.5, color: 'rgba(255,255,255,0.72)', marginTop: 2 },
  identityBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stats: { flexDirection: 'row', gap: 10, marginTop: Spacing.lg },
  group: { marginTop: Spacing.xl },
  languageCard: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  languageText: { gap: 2 },
  languageTitle: { ...Type.bodyStrong, color: Colors.textPrimary },
  languageSubtitle: { ...Type.small, color: Colors.textSecondary },
  languageChips: { flexDirection: 'row', gap: 8 },
  languageHint: { ...Type.small, color: Colors.textTertiary },
});
