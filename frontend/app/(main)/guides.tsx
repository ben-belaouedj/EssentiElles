import React, { useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../src/components/ui/Screen';
import PressableScale from '../../src/components/ui/PressableScale';
import AppBadge from '../../src/components/ui/AppBadge';
import Sheet from '../../src/components/ui/Sheet';
import PrimaryButton from '../../src/components/ui/PrimaryButton';
import IconButton from '../../src/components/ui/IconButton';
import SectionHeader from '../../src/components/layout/SectionHeader';
import { Chip, ChipRow } from '../../src/components/ui/Chip';
import { GUIDES, Guide } from '../../src/constants/guides';
import { usePreferencesStore } from '../../src/store/preferencesStore';
import { Colors } from '../../src/constants/colors';
import { Elevation, Font, Radius, Spacing, Type } from '../../src/constants/theme';

const CATEGORIES = ['Tout', 'Hygiène féminine', 'Postpartum', 'Bébé', 'Bien-être'] as const;

export default function GuidesScreen() {
  const router = useRouter();
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('Tout');
  const [openGuide, setOpenGuide] = useState<Guide | null>(null);

  const { savedTips, toggleTip, isTipSaved, checklist, toggleChecklistItem } = usePreferencesStore();

  const guides = useMemo(
    () => (category === 'Tout' ? GUIDES : GUIDES.filter((guide) => guide.category === category)),
    [category]
  );
  const savedGuides = useMemo(
    () => GUIDES.filter((guide) => savedTips.includes(guide.id)),
    [savedTips]
  );

  return (
    <Screen scroll padded={false} tabBarSpace contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Conseils</Text>
          <Text style={styles.subtitle}>Rituels doux, vérifiés et sauvegardables hors connexion</Text>
        </View>
        <IconButton
          name="bookmark-outline"
          accessibilityLabel="Conseils sauvegardés"
          onPress={() => setCategory('Tout')}
        />
      </View>

      <ChipRow contentStyle={styles.chipRow}>
        {CATEGORIES.map((item) => (
          <Chip
            key={item}
            label={item}
            active={category === item}
            onPress={() => setCategory(item)}
          />
        ))}
      </ChipRow>

      {/* Featured guides */}
      <View style={styles.list}>
        {guides.map((guide) => {
          const saved = isTipSaved(guide.id);
          return (
            <PressableScale
              key={guide.id}
              onPress={() => setOpenGuide(guide)}
              style={styles.card}
              scaleTo={0.985}
            >
              <Image source={guide.image} style={styles.cardImage} resizeMode="cover" />
              <View style={styles.cardBody}>
                <View style={styles.cardTop}>
                  <AppBadge
                    label={guide.category}
                    variant={guide.tone === 'sage' ? 'sage' : 'primary'}
                  />
                  <PressableScale
                    onPress={() => void toggleTip(guide.id)}
                    style={[styles.bookmark, saved && styles.bookmarkActive]}
                    scaleTo={0.9}
                  >
                    <Ionicons
                      name={saved ? 'bookmark' : 'bookmark-outline'}
                      size={15}
                      color={saved ? Colors.textInverse : Colors.primaryDark}
                    />
                  </PressableScale>
                </View>
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {guide.title}
                </Text>
                <Text style={styles.cardExcerpt} numberOfLines={2}>
                  {guide.excerpt}
                </Text>
                <View style={styles.cardMeta}>
                  <Ionicons name="time-outline" size={12} color={Colors.textTertiary} />
                  <Text style={styles.cardMetaText}>{guide.readingTime} min de lecture</Text>
                </View>
              </View>
            </PressableScale>
          );
        })}
      </View>

      {/* Saved tips */}
      {savedGuides.length ? (
        <View style={styles.savedBlock}>
          <SectionHeader
            accent
            title="Sauvegardés"
            subtitle={`${savedGuides.length} conseil(s) disponible(s) hors connexion`}
          />
          <View style={{ gap: 10 }}>
            {savedGuides.map((guide) => (
              <PressableScale
                key={guide.id}
                onPress={() => setOpenGuide(guide)}
                style={styles.savedRow}
                scaleTo={0.99}
              >
                <Image source={guide.image} style={styles.savedImage} resizeMode="cover" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.savedTitle} numberOfLines={1}>
                    {guide.title}
                  </Text>
                  <Text style={styles.savedMeta}>{guide.readingTime} min · {guide.category}</Text>
                </View>
                <Ionicons name="chevron-forward" size={17} color={Colors.textTertiary} />
              </PressableScale>
            ))}
          </View>
        </View>
      ) : null}

      {/* Checklist */}
      <View style={styles.savedBlock}>
        <SectionHeader
          accent
          title="Ma checklist maternité"
          subtitle="Cochez au fil des jours, tout est conservé localement"
        />
        <View style={styles.checklist}>
          {CHECKLIST_ITEMS.map((item) => {
            const done = checklist.includes(item.id);
            return (
              <PressableScale
                key={item.id}
                onPress={() => void toggleChecklistItem(item.id)}
                style={styles.checkRow}
                scaleTo={0.99}
              >
                <View style={[styles.checkBox, done && styles.checkBoxDone]}>
                  {done ? <Ionicons name="checkmark" size={13} color={Colors.textInverse} /> : null}
                </View>
                <Text style={[styles.checkLabel, done && styles.checkLabelDone]}>{item.label}</Text>
              </PressableScale>
            );
          })}
        </View>
      </View>

      {/* Guide detail */}
      <Sheet
        visible={Boolean(openGuide)}
        onClose={() => setOpenGuide(null)}
        title={openGuide?.title}
        subtitle={openGuide ? `${openGuide.category} · ${openGuide.readingTime} min de lecture` : undefined}
        footer={
          openGuide ? (
            <View style={styles.sheetFooter}>
              <PrimaryButton
                label={isTipSaved(openGuide.id) ? 'Retirer des sauvegardés' : 'Sauvegarder ce conseil'}
                variant={isTipSaved(openGuide.id) ? 'secondary' : 'primary'}
                icon={isTipSaved(openGuide.id) ? 'bookmark' : 'bookmark-outline'}
                onPress={() => void toggleTip(openGuide.id)}
                style={{ flex: 1 }}
              />
              <PrimaryButton
                label="Produits"
                variant="ghost"
                icon="grid-outline"
                fullWidth={false}
                onPress={() => {
                  setOpenGuide(null);
                  router.push('/(main)/catalog' as never);
                }}
              />
            </View>
          ) : null
        }
      >
        {openGuide ? (
          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
            <Image source={openGuide.image} style={styles.sheetImage} resizeMode="cover" />
            {openGuide.sections.map((section) => (
              <View key={section.title} style={styles.sheetSection}>
                <Text style={styles.sheetSectionTitle}>{section.title}</Text>
                <Text style={styles.sheetSectionBody}>{section.body}</Text>
              </View>
            ))}
          </ScrollView>
        ) : null}
      </Sheet>
    </Screen>
  );
}

const CHECKLIST_ITEMS = [
  { id: 'bag', label: 'Sac maternité prêt dans le coffre' },
  { id: 'hygiene', label: 'Stock hygiène postpartum (2 semaines)' },
  { id: 'baby', label: 'Couches taille naissance + taille 1' },
  { id: 'rest', label: 'Un rituel de repos planifié chaque semaine' },
  { id: 'subscription', label: 'Abonnement vérifié et fréquence ajustée' },
];

const styles = StyleSheet.create({
  content: { paddingBottom: 40, paddingTop: Spacing.sm },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: Spacing.screen,
    marginBottom: Spacing.md,
  },
  title: { ...Type.h1, color: Colors.textPrimary },
  subtitle: { ...Type.small, color: Colors.textSecondary, marginTop: 2 },
  chipRow: { paddingHorizontal: Spacing.screen },
  list: { paddingHorizontal: Spacing.screen, gap: 14, marginTop: Spacing.md },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xxl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: 'hidden',
    ...Elevation.sm,
  },
  cardImage: { width: '100%', height: 168 },
  cardBody: { padding: Spacing.md, gap: 6 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bookmark: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookmarkActive: { backgroundColor: Colors.primary },
  cardTitle: { ...Type.h3, color: Colors.textPrimary },
  cardExcerpt: { ...Type.small, color: Colors.textSecondary },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  cardMetaText: { ...Type.small, color: Colors.textTertiary },
  savedBlock: { paddingHorizontal: Spacing.screen, marginTop: Spacing.xl },
  savedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.sm,
    ...Elevation.xs,
  },
  savedImage: { width: 52, height: 52, borderRadius: Radius.md },
  savedTitle: { ...Type.bodyStrong, color: Colors.textPrimary },
  savedMeta: { ...Type.small, color: Colors.textTertiary, marginTop: 2 },
  checklist: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.sm,
    gap: 4,
    ...Elevation.xs,
  },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 9 },
  checkBox: {
    width: 22,
    height: 22,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Colors.borderMedium,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  checkBoxDone: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  checkLabel: { ...Type.body, color: Colors.textPrimary, flex: 1 },
  checkLabelDone: { color: Colors.textTertiary, textDecorationLine: 'line-through' },
  sheetImage: { width: '100%', height: 160, borderRadius: Radius.lg, marginBottom: Spacing.md },
  sheetSection: { marginBottom: Spacing.md },
  sheetSectionTitle: { ...Type.bodyStrong, color: Colors.textPrimary, marginBottom: 4 },
  sheetSectionBody: { ...Type.small, color: Colors.textSecondary, lineHeight: 20 },
  sheetFooter: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  sheetFooterText: { fontFamily: Font.medium },
});
