import React from 'react';
import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PressableScale from './PressableScale';
import { Colors } from '../../constants/colors';
import { Elevation, Font, Radius, Spacing, Type } from '../../constants/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'sage' | 'ink';
type Size = 'sm' | 'md' | 'lg';

interface Props {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: Variant;
  size?: Size;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: TextStyle;
  testID?: string;
}

/** Modern pill button with press spring and 5 variants. */
export default function PrimaryButton({
  label,
  onPress,
  loading,
  disabled,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  fullWidth = true,
  style,
  textStyle,
  testID,
}: Props) {
  const isDisabled = Boolean(disabled || loading);
  const tone = VARIANTS[variant];
  const textColor = tone.text;

  return (
    <PressableScale
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={isDisabled}
      scaleTo={0.97}
      style={[
        styles.btn,
        sizeStyles[size],
        tone.container,
        !isDisabled && variant === 'primary' && Elevation.brand,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style as ViewStyle,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <View style={styles.content}>
          {icon && iconPosition === 'left' ? (
            <Ionicons name={icon} size={size === 'sm' ? 15 : 17} color={textColor} />
          ) : null}
          <Text
            style={[styles.label, size === 'sm' && styles.labelSm, { color: textColor }, textStyle]}
            numberOfLines={1}
          >
            {label}
          </Text>
          {icon && iconPosition === 'right' ? (
            <Ionicons name={icon} size={size === 'sm' ? 15 : 17} color={textColor} />
          ) : null}
        </View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  fullWidth: { alignSelf: 'stretch' },
  content: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { ...Type.button, fontFamily: Font.semibold },
  labelSm: { fontSize: 13.5 },
  disabled: { opacity: 0.55 },
});

const sizeStyles = StyleSheet.create({
  sm: { height: 40, paddingHorizontal: Spacing.md },
  md: { height: 52, paddingHorizontal: Spacing.lg },
  lg: { height: 58, paddingHorizontal: Spacing.xl },
});

const VARIANTS: Record<Variant, { container: ViewStyle; text: string }> = {
  primary: {
    container: { backgroundColor: Colors.primary, borderColor: Colors.primaryDark },
    text: Colors.textInverse,
  },
  secondary: {
    container: { backgroundColor: Colors.surface, borderColor: Colors.border },
    text: Colors.textPrimary,
  },
  ghost: {
    container: { backgroundColor: Colors.primaryPale, borderColor: Colors.primaryMuted },
    text: Colors.primaryDark,
  },
  sage: {
    container: { backgroundColor: Colors.accent, borderColor: '#93A78E' },
    text: Colors.textInverse,
  },
  ink: {
    container: { backgroundColor: Colors.textPrimary, borderColor: Colors.textPrimary },
    text: Colors.textInverse,
  },
};
