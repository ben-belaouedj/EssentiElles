import React from 'react';
import {
  ScrollView,
  ScrollViewProps,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { Gradients, Layout, Spacing } from '../../constants/theme';

type Background = 'default' | 'blush' | 'mint' | 'warm' | 'transparent';

interface Props {
  children: React.ReactNode;
  /** Wrap content in a ScrollView */
  scroll?: boolean;
  /** Apply horizontal screen padding (default true) */
  padded?: boolean;
  /** Decorative background wash */
  background?: Background;
  /** Extra bottom padding to clear the floating tab bar */
  tabBarSpace?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  refreshControl?: ScrollViewProps['refreshControl'];
  scrollProps?: Partial<ScrollViewProps>;
  testID?: string;
}

/**
 * Screen shell — safe area + optional wash gradient + scroll + padding.
 */
export default function Screen({
  children,
  scroll = false,
  padded = true,
  background = 'default',
  tabBarSpace = false,
  contentContainerStyle,
  style,
  refreshControl,
  scrollProps,
  testID,
}: Props) {
  const bottomPadding = (tabBarSpace ? Layout.tabBarHeight + 36 : 32) + Spacing.sm;
  const inner = [padded && styles.padded, style];

  const content = (
    <View style={[styles.flex, inner]}>{children}</View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']} testID={testID}>
      <Atmosphere variant={background} />
      {scroll ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[{ paddingBottom: bottomPadding }, contentContainerStyle]}
          refreshControl={refreshControl}
          {...scrollProps}
        >
          {content}
        </ScrollView>
      ) : (
        <View style={[styles.flex, { paddingBottom: tabBarSpace ? Layout.tabBarHeight : 0 }]}>
          {content}
        </View>
      )}
    </SafeAreaView>
  );
}

/** Soft gradient atmosphere blobs behind the content. */
export function Atmosphere({ variant = 'default' }: { variant?: Background }) {
  if (variant === 'transparent') return null;

  const palette =
    variant === 'blush'
      ? Gradients.blush
      : variant === 'mint'
        ? Gradients.mint
        : Gradients.warm;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={palette as unknown as [string, string, ...string[]]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.blob, styles.blobRose]} />
      <View style={[styles.blob, styles.blobSage]} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: { flex: 1 },
  padded: { paddingHorizontal: Layout.screenPadding },
  blob: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    opacity: 0.5,
  },
  blobRose: {
    top: -120,
    right: -90,
    backgroundColor: 'rgba(181,131,141,0.16)',
  },
  blobSage: {
    top: 40,
    left: -140,
    backgroundColor: 'rgba(168,184,163,0.14)',
  },
});
