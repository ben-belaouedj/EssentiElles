import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Elevation, Font, Radius, Spacing, Type } from '../../constants/theme';

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string | number;
  hint?: string;
  tone?: 'primary' | 'sage' | 'amber' | 'info';
  style?: StyleProp<ViewStyle>;
}

const TONES = {
  primary: { bg: Colors.primaryPale, fg: Colors.primaryDark },
  sage: { bg: Colors.accentSageSoft, fg: '#5F7358' },
  amber: { bg: Colors.warningBg, fg: '#9A7635' },
  info: { bg: Colors.infoBg, fg: '#4C7099' },
};

/** Compact KPI tile (admin dashboard, profile stats). */
export default function StatTile({ icon, label, value, hint, tone = 'primary', style }: Props) {
  const palette = TONES[tone];
  return (
    <View style={[styles.tile, style]}>
      <View style={[styles.icon, { backgroundColor: palette.bg }]}>
        <Ionicons name={icon} size={16} color={palette.fg} />
      </View>
      <Text style={styles.value} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minWidth: 140,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.md,
    ...Elevation.sm,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  value: { ...Type.h2, color: Colors.textPrimary },
  label: { ...Type.small, color: Colors.textSecondary, marginTop: 2 },
  hint: { fontFamily: Font.medium, fontSize: 11, color: Colors.textTertiary, marginTop: 4 },
});
