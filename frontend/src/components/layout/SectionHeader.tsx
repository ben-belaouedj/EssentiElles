import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Font, Spacing, Type } from '../../constants/theme';

interface Props {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
  /** Show a leading accent bar next to the title */
  accent?: boolean;
}

/** Modern section header: title (+ optional subtitle) and a soft "Voir tout" pill. */
export default function SectionHeader({
  title,
  subtitle,
  actionLabel,
  onAction,
  style,
  accent = false,
}: Props) {
  return (
    <View style={[styles.row, style]}>
      <View style={styles.titleWrap}>
        {accent ? <View style={styles.accent} /> : null}
        <View style={styles.texts}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      {actionLabel && onAction ? (
        <TouchableOpacity
          onPress={onAction}
          testID={`section-header-action-${title}`}
          style={styles.actionButton}
          activeOpacity={0.8}
        >
          <Text style={styles.action}>{actionLabel}</Text>
          <Ionicons name="arrow-forward" size={13} color={Colors.primaryDark} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: 12,
  },
  titleWrap: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 },
  accent: {
    width: 4,
    height: 22,
    borderRadius: 2,
    backgroundColor: Colors.primaryLight,
  },
  texts: { flex: 1 },
  title: { ...Type.h3, color: Colors.textPrimary },
  subtitle: { ...Type.small, color: Colors.textSecondary, marginTop: 1 },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 9999,
    backgroundColor: Colors.primaryPale,
    borderWidth: 1,
    borderColor: Colors.primaryMuted,
  },
  action: {
    fontFamily: Font.semibold,
    fontSize: 12.5,
    color: Colors.primaryDark,
  },
});
