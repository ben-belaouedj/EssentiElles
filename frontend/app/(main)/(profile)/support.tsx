import React, { useCallback, useEffect, useState } from 'react';
import { Alert, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../../src/components/ui/Screen';
import IconButton from '../../../src/components/ui/IconButton';
import PrimaryButton from '../../../src/components/ui/PrimaryButton';
import PressableScale from '../../../src/components/ui/PressableScale';
import StatusBadge from '../../../src/components/ui/StatusBadge';
import EmptyState from '../../../src/components/ui/EmptyState';
import AppTextField from '../../../src/components/ui/AppTextField';
import Sheet from '../../../src/components/ui/Sheet';
import OfflineBanner from '../../../src/components/ui/OfflineBanner';
import { Chip, ChipRow } from '../../../src/components/ui/Chip';
import { SkeletonRows } from '../../../src/components/ui/SkeletonCard';
import { supportService } from '../../../src/services/api';
import { SupportTicket } from '../../../src/models/types';
import { Colors } from '../../../src/constants/colors';
import { Elevation, Font, Radius, Spacing, Type } from '../../../src/constants/theme';

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const TICKET_CATEGORIES = [
  { key: 'delivery', label: 'Livraison' },
  { key: 'subscription', label: 'Abonnement' },
  { key: 'payment', label: 'Paiement' },
  { key: 'account', label: 'Compte' },
  { key: 'other', label: 'Autre' },
];

function formatDate(value?: string) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export default function SupportScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<'faq' | 'tickets'>('faq');
  const [faq, setFaq] = useState<FaqItem[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('delivery');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    const [faqRes, ticketsRes] = await Promise.allSettled([
      supportService.getFaq(),
      supportService.getTickets(),
    ]);
    if (faqRes.status === 'fulfilled') setFaq(faqRes.value.data as FaqItem[]);
    if (ticketsRes.status === 'fulfilled') setTickets(ticketsRes.value.data as SupportTicket[]);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const createTicket = async () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert('Champs requis', 'Renseignez le sujet et votre message.');
      return;
    }
    setSubmitting(true);
    try {
      await supportService.createTicket({ subject, category, message });
      setShowForm(false);
      setSubject('');
      setMessage('');
      setCategory('delivery');
      setTab('tickets');
      await load();
      Alert.alert('Message envoyé ✨', 'Notre équipe vous répond sous 24 h ouvrées.');
    } catch (err) {
      Alert.alert('Erreur', err instanceof Error ? err.message : 'Envoi impossible');
    } finally {
      setSubmitting(false);
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
          <Text style={styles.title}>Aide & support</Text>
          <Text style={styles.subtitle}>Réponse sous 24 h ouvrées</Text>
        </View>
        <IconButton name="add" variant="brand" onPress={() => setShowForm(true)} accessibilityLabel="Nouveau message" />
      </View>

      <OfflineBanner visible={false} />

      <View style={styles.tabs}>
        <PressableScale
          onPress={() => setTab('faq')}
          style={[styles.tab, tab === 'faq' && styles.tabActive]}
          scaleTo={0.97}
        >
          <Text style={[styles.tabText, tab === 'faq' && styles.tabTextActive]}>Questions fréquentes</Text>
        </PressableScale>
        <PressableScale
          onPress={() => setTab('tickets')}
          style={[styles.tab, tab === 'tickets' && styles.tabActive]}
          scaleTo={0.97}
        >
          <Text style={[styles.tabText, tab === 'tickets' && styles.tabTextActive]}>
            Mes messages{tickets.length ? ` (${tickets.length})` : ''}
          </Text>
        </PressableScale>
      </View>

      {loading ? (
        <SkeletonRows count={3} />
      ) : tab === 'faq' ? (
        <View style={{ gap: 10 }}>
          {faq.map((item) => {
            const open = expanded === item.id;
            return (
              <PressableScale
                key={item.id}
                onPress={() => setExpanded(open ? null : item.id)}
                style={styles.faqItem}
                scaleTo={0.99}
              >
                <View style={styles.faqHeader}>
                  <Text style={styles.faqQuestion}>{item.question}</Text>
                  <Ionicons
                    name={open ? 'chevron-up' : 'chevron-down'}
                    size={17}
                    color={Colors.textTertiary}
                  />
                </View>
                {open ? <Text style={styles.faqAnswer}>{item.answer}</Text> : null}
              </PressableScale>
            );
          })}

          <View style={styles.contactCard}>
            <Ionicons name="chatbubbles-outline" size={18} color={Colors.primaryDark} />
            <View style={{ flex: 1 }}>
              <Text style={styles.contactTitle}>Une autre question ?</Text>
              <Text style={styles.contactText}>Écrivez-nous, nous répondons chaque jour.</Text>
            </View>
            <PrimaryButton
              label="Écrire"
              size="sm"
              fullWidth={false}
              onPress={() => setShowForm(true)}
            />
          </View>
        </View>
      ) : tickets.length === 0 ? (
        <EmptyState
          icon="chatbubbles-outline"
          tone="sage"
          title="Aucun message"
          description="Une question sur une livraison, un abonnement ou un paiement ? Écrivez-nous."
          actionLabel="Créer un message"
          onAction={() => setShowForm(true)}
        />
      ) : (
        <View style={{ gap: 12 }}>
          {tickets.map((ticket) => (
            <PressableScale
              key={ticket.id}
              onPress={() => router.push({ pathname: '/(main)/(profile)/ticket', params: { id: ticket.id } } as never)}
              style={styles.ticketCard}
              scaleTo={0.985}
            >
              <View style={styles.ticketTop}>
                <View style={styles.ticketIcon}>
                  <Ionicons name="chatbubble-ellipses" size={16} color={Colors.primaryDark} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ticketSubject} numberOfLines={1}>
                    {ticket.subject}
                  </Text>
                  <Text style={styles.ticketMeta}>
                    {ticket.ticketNumber} · {formatDate(ticket.updatedAt ?? ticket.createdAt)}
                  </Text>
                </View>
                <StatusBadge status={ticket.status} small />
              </View>
              <Text style={styles.ticketPreview} numberOfLines={2}>
                {ticket.messages[ticket.messages.length - 1]?.message ?? ''}
              </Text>
              <View style={styles.ticketFooter}>
                <Text style={styles.ticketCount}>{ticket.messages.length} message(s)</Text>
                <View style={styles.openRow}>
                  <Text style={styles.openText}>Ouvrir</Text>
                  <Ionicons name="arrow-forward" size={14} color={Colors.primaryDark} />
                </View>
              </View>
            </PressableScale>
          ))}
        </View>
      )}

      <Sheet
        visible={showForm}
        onClose={() => setShowForm(false)}
        title="Écrire au support"
        subtitle="Nous répondons sous 24 h ouvrées"
        footer={
          <PrimaryButton
            label={submitting ? 'Envoi…' : 'Envoyer mon message'}
            icon="send"
            loading={submitting}
            onPress={() => void createTicket()}
          />
        }
      >
        <View style={{ gap: Spacing.sm }}>
          <AppTextField
            label="Sujet"
            value={subject}
            onChangeText={setSubject}
            placeholder="Ma livraison est en retard"
            icon="create-outline"
          />
          <Text style={styles.chipsLabel}>Catégorie</Text>
          <ChipRow contentStyle={{ paddingHorizontal: 0, gap: 8 }}>
            {TICKET_CATEGORIES.map((item) => (
              <Chip
                key={item.key}
                label={item.label}
                active={category === item.key}
                onPress={() => setCategory(item.key)}
              />
            ))}
          </ChipRow>
          <AppTextField
            label="Message"
            value={message}
            onChangeText={setMessage}
            placeholder="Décrivez votre situation…"
            multiline
            numberOfLines={5}
            style={{ minHeight: 120 }}
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
  tabs: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.full,
    padding: 4,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  tab: {
    flex: 1,
    height: 38,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: { backgroundColor: Colors.surface, ...Elevation.xs },
  tabText: { fontFamily: Font.medium, fontSize: 13, color: Colors.textSecondary },
  tabTextActive: { fontFamily: Font.semibold, color: Colors.textPrimary },
  faqItem: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.md,
    ...Elevation.xs,
  },
  faqHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  faqQuestion: { ...Type.bodyStrong, color: Colors.textPrimary, flex: 1 },
  faqAnswer: { ...Type.small, color: Colors.textSecondary, marginTop: Spacing.sm, lineHeight: 20 },
  contactCard: {
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
  contactTitle: { ...Type.bodyStrong, color: Colors.textPrimary },
  contactText: { ...Type.small, color: Colors.textSecondary, marginTop: 1 },
  ticketCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xxl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Elevation.sm,
  },
  ticketTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ticketIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: Colors.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketSubject: { ...Type.bodyStrong, color: Colors.textPrimary },
  ticketMeta: { ...Type.small, color: Colors.textTertiary, marginTop: 1 },
  ticketPreview: { ...Type.small, color: Colors.textSecondary },
  ticketFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: Spacing.sm,
  },
  ticketCount: { ...Type.small, color: Colors.textTertiary },
  openRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  openText: { fontFamily: Font.semibold, fontSize: 12.5, color: Colors.primaryDark },
  chipsLabel: { ...Type.smallStrong, color: Colors.textSecondary },
});
