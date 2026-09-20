import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Font, Radius, Type } from '../../constants/theme';

export type BadgeVariant =
  | 'neutral'
  | 'primary'
  | 'sage'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'ink'
  | 'glass';

interface AppBadgeProps {
  label: string;
  variant?: BadgeVariant;
  icon?: keyof typeof Ionicons.glyphMap;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

/** Pill badge — statuses, badges dynamiques (recommandé / nouveau / stock). */
export default function AppBadge({
  label,
  variant = 'neutral',
  icon,
  size = 'sm',
  style,
}: AppBadgeProps) {
  const tone = VARIANTS[variant];
  return (
    <View style={[styles.base, size === 'md' && styles.baseMd, tone.container, style]}>
      {icon ? <Ionicons name={icon} size={size === 'md' ? 13 : 11} color={tone.text} /> : null}
      <Text
        style={[styles.label, size === 'md' && styles.labelMd, { color: tone.text }]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    borderRadius: Radius.full,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  baseMd: { paddingHorizontal: 12, paddingVertical: 6, gap: 6 },
  label: {
    fontFamily: Font.semibold,
    fontSize: 11,
    letterSpacing: 0.1,
  },
  labelMd: { ...Type.smallStrong, fontSize: 12.5 },
});

const VARIANTS: Record<BadgeVariant, { container: ViewStyle; text: string }> = {
  neutral: {
    container: { backgroundColor: Colors.surfaceAlt, borderWidth: 1, borderColor: Colors.borderLight },
    text: Colors.textSecondary,
  },
  primary: {
    container: { backgroundColor: Colors.primaryPale, borderWidth: 1, borderColor: Colors.primaryMuted },
    text: Colors.primaryDark,
  },
  sage: {
    container: { backgroundColor: Colors.accentSageSoft, borderWidth: 1, borderColor: Colors.accentLight },
    text: '#5F7358',
  },
  success: {
    container: { backgroundColor: Colors.successBg, borderWidth: 1, borderColor: Colors.accentLight },
    text: '#4F7A61',
  },
  warning: {
    container: { backgroundColor: Colors.warningBg, borderWidth: 1, borderColor: '#EFD9B4' },
    text: '#9A7635',
  },
  error: {
    container: { backgroundColor: Colors.errorBg, borderWidth: 1, borderColor: '#F0C9C9' },
    text: '#A85B5B',
  },
  info: {
    container: { backgroundColor: Colors.infoBg, borderWidth: 1, borderColor: '#C9DCEB' },
    text: '#4C7099',
  },
  ink: {
    container: { backgroundColor: Colors.textPrimary },
    text: Colors.textInverse,
  },
  glass: {
    container: { backgroundColor: 'rgba(255,255,255,0.9)' },
    text: Colors.textPrimary,
  },
};
