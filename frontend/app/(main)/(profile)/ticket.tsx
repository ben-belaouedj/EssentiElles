import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../../src/components/ui/Screen';
import IconButton from '../../../src/components/ui/IconButton';
import StatusBadge from '../../../src/components/ui/StatusBadge';
import EmptyState from '../../../src/components/ui/EmptyState';
import PressableScale from '../../../src/components/ui/PressableScale';
import { supportService } from '../../../src/services/api';
import { SupportTicket } from '../../../src/models/types';
import { Colors } from '../../../src/constants/colors';
import { Elevation, Font, Radius, Spacing, Type } from '../../../src/constants/theme';

function formatTime(value?: string) {
  if (!value) return '—';
  return new Date(value).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function formatDay(value?: string) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

export default function TicketScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!id) return;
    supportService
      .getTicket(id)
      .then((res) => setTicket(res.data as SupportTicket))
      .catch(() => setTicket(null))
      .finally(() => setLoading(false));
  }, [id]);

  const send = async () => {
    if (!message.trim() || !id) return;
    setSending(true);
    try {
      const res = await supportService.addMessage(id, message.trim());
      setTicket(res.data as SupportTicket);
      setMessage('');
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
    } catch (err) {
      Alert.alert('Erreur', err instanceof Error ? err.message : 'Envoi impossible');
    } finally {
      setSending(false);
    }
  };

  const closeTicket = () =>
    Alert.alert('Fermer la conversation ?', 'Le ticket sera marqué comme résolu.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Fermer',
        onPress: async () => {
          if (!id) return;
          try {
            const res = await supportService.closeTicket(id);
            setTicket((res.data as SupportTicket) ?? ticket);
          } catch {
            Alert.alert('Erreur', 'Fermeture impossible');
          }
        },
      },
    ]);

  if (loading) {
    return (
      <Screen>
        <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.xl }} />
      </Screen>
    );
  }

  if (!ticket) {
    return (
      <Screen>
        <EmptyState
          icon="chatbubbles-outline"
          title="Conversation introuvable"
          description="Ce ticket n’est plus disponible."
          actionLabel="Retour au support"
          onAction={() => router.replace('/(main)/(profile)/support' as never)}
        />
      </Screen>
    );
  }

  const isClosed = ticket.status === 'closed' || ticket.status === 'resolved';

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <IconButton name="arrow-back" onPress={() => router.back()} accessibilityLabel="Retour" />
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>
            {ticket.subject}
          </Text>
          <Text style={styles.subtitle}>
            {ticket.ticketNumber} · ouvert le {formatDay(ticket.createdAt)}
          </Text>
        </View>
        <StatusBadge status={ticket.status} small />
      </View>

      <ScrollView ref={scrollRef} contentContainerStyle={styles.messages} showsVerticalScrollIndicator={false}>
        {ticket.messages.map((item, index) => {
          const mine = item.sender === 'customer';
          return (
            <View
              key={`${item.createdAt}-${index}`}
              style={[styles.bubbleRow, mine && styles.bubbleRowMine]}
            >
              {!mine ? (
                <View style={styles.supportAvatar}>
                  <Ionicons name="sparkles" size={13} color={Colors.textInverse} />
                </View>
              ) : null}
              <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleSupport]}>
                <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>{item.message}</Text>
                <Text style={[styles.bubbleTime, mine && styles.bubbleTimeMine]}>
                  {formatTime(item.createdAt)}
                </Text>
              </View>
            </View>
          );
        })}

        {isClosed ? (
          <View style={styles.closedNote}>
            <Ionicons name="checkmark-circle" size={15} color={Colors.success} />
            <Text style={styles.closedText}>
              Conversation résolue. Ouvrez un nouveau message si besoin.
            </Text>
          </View>
        ) : null}
      </ScrollView>

      {!isClosed ? (
        <View style={styles.composer}>
          <View style={styles.inputWrap}>
            <TextInput
              testID="ticket-message-input"
              value={message}
              onChangeText={setMessage}
              placeholder="Écrire votre réponse…"
              placeholderTextColor={Colors.textPlaceholder}
              style={styles.input}
              multiline
            />
            <PressableScale onPress={() => void closeTicket()} style={styles.closeTicket} scaleTo={0.94}>
              <Text style={styles.closeTicketText}>Résolu</Text>
            </PressableScale>
          </View>
          <PressableScale
            testID="ticket-send-btn"
            onPress={() => void send()}
            disabled={sending || !message.trim()}
            style={[styles.send, (!message.trim() || sending) && styles.sendDisabled]}
            scaleTo={0.94}
          >
            {sending ? (
              <ActivityIndicator color={Colors.textInverse} size="small" />
            ) : (
              <Ionicons name="arrow-up" size={18} color={Colors.textInverse} />
            )}
          </PressableScale>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: Spacing.screen,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  title: { ...Type.h3, color: Colors.textPrimary },
  subtitle: { ...Type.small, color: Colors.textSecondary, marginTop: 1 },
  messages: { padding: Spacing.screen, gap: 12, paddingBottom: 40 },
  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  bubbleRowMine: { justifyContent: 'flex-end' },
  supportAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    gap: 4,
  },
  bubbleSupport: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderBottomLeftRadius: 6,
    ...Elevation.xs,
  },
  bubbleMine: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 6,
  },
  bubbleText: { ...Type.body, color: Colors.textPrimary },
  bubbleTextMine: { color: Colors.textInverse },
  bubbleTime: { fontFamily: Font.regular, fontSize: 10.5, color: Colors.textTertiary, alignSelf: 'flex-end' },
  bubbleTimeMine: { color: 'rgba(255,255,255,0.75)' },
  closedNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'center',
    backgroundColor: Colors.successBg,
    borderRadius: Radius.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: Spacing.md,
  },
  closedText: { ...Type.small, color: '#4F7A61' },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: Spacing.screen,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    backgroundColor: 'rgba(255,255,255,0.96)',
  },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  input: {
    flex: 1,
    fontFamily: Font.regular,
    fontSize: 14,
    color: Colors.textPrimary,
    maxHeight: 90,
    paddingVertical: 8,
  },
  closeTicket: {
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    height: 30,
    justifyContent: 'center',
  },
  closeTicketText: { fontFamily: Font.semibold, fontSize: 11.5, color: Colors.textSecondary },
  send: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Elevation.brand,
  },
  sendDisabled: { backgroundColor: Colors.disabledBg, opacity: 0.8 },
});
