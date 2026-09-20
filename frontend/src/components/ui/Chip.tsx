import React from 'react';
import { ScrollView, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PressableScale from './PressableScale';
import { Colors } from '../../constants/colors';
import { Elevation, Font, Radius } from '../../constants/theme';

interface ChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  count?: number;
  style?: ViewStyle;
  tone?: 'default' | 'sage' | 'ink';
  testID?: string;
}

export function Chip({
  label,
  active = false,
  onPress,
  icon,
  count,
  style,
  tone = 'default',
  testID,
}: ChipProps) {
  const activeTone =
    tone === 'sage'
      ? { backgroundColor: Colors.accent, borderColor: Colors.accent }
      : tone === 'ink'
        ? { backgroundColor: Colors.textPrimary, borderColor: Colors.textPrimary }
        : { backgroundColor: Colors.primary, borderColor: Colors.primaryDark };

  return (
    <PressableScale
      testID={testID}
      onPress={onPress}
      scaleTo={0.96}
      style={[
        styles.chip,
        active ? { ...activeTone, ...Elevation.brand } : styles.idle,
        style as ViewStyle,
      ]}
    >
      {icon ? (
        <Ionicons
          name={icon}
          size={14}
          color={active ? Colors.textInverse : Colors.textSecondary}
          style={styles.icon}
        />
      ) : null}
      <Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>
        {label}
      </Text>
      {typeof count === 'number' ? (
        <View style={[styles.count, active && styles.countActive]}>
          <Text style={[styles.countText, active && styles.countTextActive]}>{count}</Text>
        </View>
      ) : null}
    </PressableScale>
  );
}

interface ChipRowProps {
  children: React.ReactNode;
  contentStyle?: ViewStyle;
  style?: ViewStyle;
}

/** Horizontally scrollable chip rail with edge padding. */
export function ChipRow({ children, contentStyle, style }: ChipRowProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={style}
      contentContainerStyle={[styles.row, contentStyle]}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    height: 38,
    borderRadius: Radius.full,
    borderWidth: 1,
    gap: 6,
  },
  idle: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
  },
  label: {
    fontFamily: Font.medium,
    fontSize: 13,
    color: Colors.textSecondary,
    letterSpacing: 0.1,
  },
  labelActive: { color: Colors.textInverse, fontFamily: Font.semibold },
  icon: { marginRight: -1 },
  count: {
    minWidth: 20,
    paddingHorizontal: 6,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countActive: { backgroundColor: 'rgba(255,255,255,0.24)' },
  countText: {
    fontFamily: Font.semibold,
    fontSize: 11,
    color: Colors.textSecondary,
  },
  countTextActive: { color: Colors.textInverse },
  row: {
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 4,
  },
});

export default Chip;
