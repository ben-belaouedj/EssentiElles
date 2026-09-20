import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import PrimaryButton from './PrimaryButton';
import { Colors } from '../../constants/colors';
import { Elevation, Font, Gradients, Radius, Spacing, Type } from '../../constants/theme';

interface Props {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  tone?: 'rose' | 'sage' | 'ink';
  compact?: boolean;
  style?: ViewStyle;
}

/** Empty / error state with gradient orb and optional CTAs. */
export default function EmptyState({
  icon = 'cube-outline',
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  tone = 'rose',
  compact = false,
  style,
}: Props) {
  const palette =
    tone === 'sage' ? Gradients.sage : tone === 'ink' ? Gradients.ink : Gradients.blush;
  const iconColor = tone === 'rose' ? Colors.primaryDark : Colors.textInverse;

  return (
    <View style={[styles.container, compact && styles.containerCompact, style]}>
      <LinearGradient
        colors={palette as unknown as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.orb}
      >
        <Ionicons name={icon} size={30} color={iconColor} />
      </LinearGradient>

      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.desc}>{description}</Text> : null}

      {actionLabel && onAction ? (
        <PrimaryButton label={actionLabel} onPress={onAction} style={styles.cta} />
      ) : null}

      {secondaryLabel && onSecondary ? (
        <Text onPress={onSecondary} style={styles.link}>
          {secondaryLabel}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
  },
  containerCompact: { paddingVertical: Spacing.xl },
  orb: {
    width: 78,
    height: 78,
    borderRadius: 39,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    ...Elevation.sm,
  },
  title: { ...Type.h3, color: Colors.textPrimary, textAlign: 'center' },
  desc: {
    ...Type.small,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 300,
  },
  cta: { marginTop: Spacing.lg, alignSelf: 'stretch', maxWidth: 280 },
  link: {
    marginTop: Spacing.md,
    fontFamily: Font.medium,
    fontSize: 13.5,
    color: Colors.primaryDark,
  },
  orbRadius: { borderRadius: Radius.full },
});
