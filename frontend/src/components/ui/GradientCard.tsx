import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import PressableScale from './PressableScale';
import { Colors } from '../../constants/colors';
import { Elevation, Font, Gradients, Radius, Spacing, Type } from '../../constants/theme';

type GradientName = keyof typeof Gradients;

interface GradientCardProps {
  children: React.ReactNode;
  colors?: GradientName | readonly string[];
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  radius?: number;
  onPress?: () => void;
  testID?: string;
}

/** Rounded gradient surface used for heroes and highlight blocks. */
export function GradientCard({
  children,
  colors = 'brand',
  style,
  contentStyle,
  radius = Radius.xxl,
  onPress,
  testID,
}: GradientCardProps) {
  const palette = (typeof colors === 'string' ? Gradients[colors] : colors) as unknown as [
    string,
    string,
    ...string[],
  ];

  const body = (
    <LinearGradient
      colors={palette}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.gradient, { borderRadius: radius }, style as ViewStyle]}
    >
      <View style={contentStyle}>{children}</View>
    </LinearGradient>
  );

  if (onPress) {
    return (
      <PressableScale testID={testID} onPress={onPress} style={styles.wrapper}>
        {body}
      </PressableScale>
    );
  }
  return <View testID={testID}>{body}</View>;
}

interface HeroAction {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}

interface HeroProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  actions?: HeroAction[];
  children?: React.ReactNode;
  colors?: GradientName;
  style?: StyleProp<ViewStyle>;
}

/** Large editorial hero card (home, subscription summary). */
export function HeroCard({
  eyebrow,
  title,
  subtitle,
  icon,
  actions,
  children,
  colors = 'brand',
  style,
}: HeroProps) {
  return (
    <GradientCard colors={colors} style={[styles.hero, style]} contentStyle={styles.heroInner}>
      <View style={styles.heroGlow} pointerEvents="none" />

      <View style={styles.heroHeader}>
        <View style={styles.heroText}>
          {eyebrow ? (
            <View style={styles.eyebrowRow}>
              {icon ? <Ionicons name={icon} size={13} color="rgba(255,255,255,0.9)" /> : null}
              <Text style={styles.eyebrow}>{eyebrow.toUpperCase()}</Text>
            </View>
          ) : null}
          <Text style={styles.heroTitle}>{title}</Text>
          {subtitle ? <Text style={styles.heroSubtitle}>{subtitle}</Text> : null}
        </View>
      </View>

      {children}

      {actions?.length ? (
        <View style={styles.actions}>
          {actions.map((action) => (
            <PressableScale
              key={action.label}
              onPress={action.onPress}
              style={styles.action}
              scaleTo={0.95}
            >
              <Ionicons name={action.icon} size={15} color={Colors.textPrimary} />
              <Text style={styles.actionLabel}>{action.label}</Text>
            </PressableScale>
          ))}
        </View>
      ) : null}
    </GradientCard>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignSelf: 'stretch' },
  gradient: {
    overflow: 'hidden',
    ...Elevation.brand,
  },
  hero: { padding: 0 },
  heroInner: { padding: Spacing.lg },
  heroGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.14)',
    top: -110,
    right: -60,
  },
  heroHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  heroText: { flex: 1 },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  eyebrow: {
    ...Type.caption,
    color: 'rgba(255,255,255,0.88)',
    fontFamily: Font.semibold,
  },
  heroTitle: {
    ...Type.h1,
    color: Colors.textInverse,
  },
  heroSubtitle: {
    ...Type.small,
    color: 'rgba(255,255,255,0.86)',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: Spacing.md,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 38,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  actionLabel: {
    fontFamily: Font.semibold,
    fontSize: 12.5,
    color: Colors.textPrimary,
  },
});

export default GradientCard;
