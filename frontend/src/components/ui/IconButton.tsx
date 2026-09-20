import React from 'react';
import { StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PressableScale from './PressableScale';
import { Colors } from '../../constants/colors';
import { Elevation } from '../../constants/theme';

type Variant = 'glass' | 'soft' | 'plain' | 'brand' | 'ink';

interface Props {
  name: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  size?: number;
  iconSize?: number;
  variant?: Variant;
  color?: string;
  style?: ViewStyle;
  iconStyle?: TextStyle;
  testID?: string;
  disabled?: boolean;
  accessibilityLabel?: string;
}

export default function IconButton({
  name,
  onPress,
  size = 40,
  iconSize = 20,
  variant = 'glass',
  color,
  style,
  testID,
  disabled,
  accessibilityLabel,
}: Props) {
  const tint =
    color ??
    (variant === 'brand' ? Colors.textInverse : variant === 'ink' ? Colors.textInverse : Colors.textPrimary);

  return (
    <PressableScale
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.base,
        { width: size, height: size, borderRadius: size / 2 },
        variantStyles[variant],
        disabled && styles.disabled,
        style as ViewStyle,
      ]}
    >
      <Ionicons name={name} size={iconSize} color={tint} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  disabled: { opacity: 0.45 },
});

const variantStyles: Record<Variant, ViewStyle> = {
  glass: {
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderColor: 'rgba(255,255,255,0.9)',
    ...Elevation.xs,
  },
  soft: {
    backgroundColor: Colors.surfaceAlt,
    borderColor: Colors.borderLight,
  },
  plain: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  brand: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryDark,
    ...Elevation.brand,
  },
  ink: {
    backgroundColor: Colors.textPrimary,
    borderColor: Colors.textPrimary,
    ...Elevation.sm,
  },
};
