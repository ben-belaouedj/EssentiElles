import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PressableScale from './PressableScale';
import { Colors } from '../../constants/colors';
import { Font, Radius } from '../../constants/theme';

interface Props {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md';
  style?: ViewStyle;
  testID?: string;
}

export default function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  size = 'md',
  style,
  testID,
}: Props) {
  const compact = size === 'sm';
  const buttonSize = compact ? 30 : 36;

  return (
    <View testID={testID} style={[styles.container, compact && styles.containerSm, style]}>
      <PressableScale
        accessibilityLabel="Diminuer la quantité"
        onPress={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        style={[
          styles.button,
          { width: buttonSize, height: buttonSize, borderRadius: buttonSize / 2 },
          value <= min && styles.buttonDisabled,
        ]}
      >
        <Ionicons
          name={value <= min ? 'remove' : 'remove'}
          size={compact ? 14 : 16}
          color={value <= min ? Colors.textTertiary : Colors.textPrimary}
        />
      </PressableScale>

      <Text style={[styles.value, compact && styles.valueSm]}>×{value}</Text>

      <PressableScale
        accessibilityLabel="Augmenter la quantité"
        onPress={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        style={[
          styles.button,
          styles.buttonPlus,
          { width: buttonSize, height: buttonSize, borderRadius: buttonSize / 2 },
          value >= max && styles.buttonDisabled,
        ]}
      >
        <Ionicons name="add" size={compact ? 15 : 17} color={Colors.textInverse} />
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.full,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  containerSm: { padding: 3, gap: 8 },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  buttonPlus: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryDark,
  },
  buttonDisabled: { opacity: 0.5 },
  value: {
    fontFamily: Font.semibold,
    fontSize: 15,
    color: Colors.textPrimary,
    minWidth: 34,
    textAlign: 'center',
  },
  valueSm: { fontSize: 13, minWidth: 28 },
});
