import React from 'react';
import { StyleProp, StyleSheet, Switch, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PressableScale from './PressableScale';
import { Colors } from '../../constants/colors';
import { Font, Radius, Spacing, Type } from '../../constants/theme';

interface Props {
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBackground?: string;
  title: string;
  subtitle?: string;
  value?: string;
  /** Show a chevron on the right */
  chevron?: boolean;
  onPress?: () => void;
  right?: React.ReactNode;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
  danger?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  badge?: string;
}

/** Settings / profile style row with tinted icon squircle. */
export default function ListRow({
  icon,
  iconColor = Colors.primaryDark,
  iconBackground = Colors.primaryPale,
  title,
  subtitle,
  value,
  chevron = true,
  onPress,
  right,
  switchValue,
  onSwitchChange,
  danger,
  style,
  testID,
  badge,
}: Props) {
  const content = (
    <View style={[styles.row, style]}>
      {icon ? (
        <View style={[styles.icon, { backgroundColor: iconBackground }]}>
          <Ionicons name={icon} size={18} color={danger ? Colors.error : iconColor} />
        </View>
      ) : null}

      <View style={styles.text}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, danger && { color: Colors.error }]} numberOfLines={1}>
            {title}
          </Text>
          {badge ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          ) : null}
        </View>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {value ? <Text style={styles.value}>{value}</Text> : null}
      {right}
      {switchValue !== undefined && onSwitchChange ? (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: Colors.borderMedium, true: Colors.primaryLight }}
          thumbColor={switchValue ? Colors.primary : '#FFFFFF'}
        />
      ) : null}
      {chevron && onPress && switchValue === undefined && !right ? (
        <Ionicons name="chevron-forward" size={17} color={Colors.textTertiary} />
      ) : null}
    </View>
  );

  if (onPress) {
    return (
      <PressableScale testID={testID} onPress={onPress} scaleTo={0.985}>
        {content}
      </PressableScale>
    );
  }
  return <View testID={testID}>{content}</View>;
}

/** Grouped list container — single card holding several rows. */
export function ListGroup({
  children,
  title,
  style,
}: {
  children: React.ReactNode;
  title?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const items = React.Children.toArray(children);
  return (
    <View style={style}>
      {title ? <Text style={styles.groupTitle}>{title.toUpperCase()}</Text> : null}
      <View style={styles.group}>
        {items.map((child, index) => (
          <View key={index}>
            {index > 0 ? <View style={styles.separator} /> : null}
            {child}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: Spacing.md,
    gap: 12,
    minHeight: 58,
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { ...Type.bodyStrong, color: Colors.textPrimary },
  subtitle: { ...Type.small, color: Colors.textSecondary, marginTop: 2 },
  value: { ...Type.smallStrong, color: Colors.textSecondary },
  badge: {
    backgroundColor: Colors.primaryPale,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: { fontFamily: Font.semibold, fontSize: 10.5, color: Colors.primaryDark },
  group: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: 'hidden',
  },
  separator: { height: 1, backgroundColor: Colors.borderLight, marginLeft: 64 },
  groupTitle: {
    ...Type.caption,
    color: Colors.textTertiary,
    marginBottom: 8,
    marginLeft: 4,
  },
});
