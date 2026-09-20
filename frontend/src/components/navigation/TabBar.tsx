import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import PressableScale from '../ui/PressableScale';
import { Colors } from '../../constants/colors';
import { Elevation, Font, Radius } from '../../constants/theme';

const TAB_META: Record<string, { icon: keyof typeof Ionicons.glyphMap; outline: keyof typeof Ionicons.glyphMap }> = {
  '(home)/home': { icon: 'home', outline: 'home-outline' },
  '(subs)/subscriptions': { icon: 'repeat', outline: 'repeat-outline' },
  '(catalog)/catalog': { icon: 'grid', outline: 'grid-outline' },
  guides: { icon: 'book', outline: 'book-outline' },
  '(profile)/profile': { icon: 'person', outline: 'person-outline' },
};

/** Floating pill tab bar — blurred, rounded, animated active state. */
export default function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { bottom: Math.max(insets.bottom, 10) + 4 }]} pointerEvents="box-none">
      <View style={styles.bar}>
        <BlurView intensity={Platform.OS === 'web' ? 0 : 40} tint="light" style={StyleSheet.absoluteFill} />
        <View style={styles.barTint} pointerEvents="none" />

        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          if ((options as { href?: unknown }).href === null) return null;

          const focused = state.index === index;
          const meta = TAB_META[route.name] ?? { icon: 'ellipse', outline: 'ellipse-outline' };
          const label =
            typeof options.title === 'string' ? options.title : route.name;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name as never);
            }
          };

          return (
            <PressableScale
              key={route.key}
              testID={`tab-${route.name.replace(/[^a-z]/gi, '-')}`}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={label}
              onPress={onPress}
              scaleTo={0.94}
              style={[styles.tab, focused && styles.tabActive]}
            >
              <Ionicons
                name={focused ? meta.icon : meta.outline}
                size={focused ? 19 : 21}
                color={focused ? Colors.primaryDark : Colors.textTertiary}
              />
              {focused ? (
                <Text style={styles.tabLabel} numberOfLines={1}>
                  {label}
                </Text>
              ) : null}
            </PressableScale>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    borderRadius: Radius.xxl,
    overflow: 'hidden',
    maxWidth: 520,
    width: '100%',
    justifyContent: 'space-between',
    ...Elevation.lg,
  },
  barTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: Radius.xxl,
    borderWidth: 1,
    borderColor: 'rgba(232,225,219,0.9)',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 46,
    paddingHorizontal: 12,
    borderRadius: Radius.full,
    flexGrow: 0,
    flexShrink: 1,
    minWidth: 44,
  },
  tabActive: {
    backgroundColor: Colors.primaryPale,
    borderWidth: 1,
    borderColor: Colors.primaryMuted,
    paddingHorizontal: 14,
    flexShrink: 0,
  },
  tabLabel: {
    fontFamily: Font.semibold,
    fontSize: 12.5,
    color: Colors.primaryDark,
  },
});
