import React from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PrimaryButton from './PrimaryButton';
import { Colors } from '../../constants/colors';
import { Type } from '../../constants/theme';

interface Props {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** Alias of PrimaryButton with the softer secondary treatment. */
export default function SecondaryButton({
  label,
  onPress,
  loading,
  disabled,
  icon,
  style,
  testID,
}: Props) {
  return (
    <PrimaryButton
      testID={testID}
      label={label}
      onPress={onPress}
      loading={loading}
      disabled={disabled}
      variant="secondary"
      icon={icon}
      style={style}
      textStyle={styles.text}
    />
  );
}

const styles = StyleSheet.create({
  text: { ...Type.button, color: Colors.textPrimary },
});
