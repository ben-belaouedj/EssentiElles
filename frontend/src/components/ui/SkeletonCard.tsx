import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';
import { Colors } from '../../constants/colors';
import { Radius, Spacing } from '../../constants/theme';

interface SkeletonBoxProps {
  width?: number | `${number}%`;
  height: number;
  radius?: number;
  style?: ViewStyle;
}

/** Pulsing placeholder block. */
export function SkeletonBox({ width, height, radius = Radius.md, style }: SkeletonBoxProps) {
  const pulse = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 850, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.45, duration: 850, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);

  return (
    <Animated.View
      style={[
        {
          width: width ?? '100%',
          height,
          backgroundColor: Colors.surfaceAlt,
          borderRadius: radius,
          opacity: pulse,
        },
        style,
      ]}
    />
  );
}

export function SkeletonLine({ width = '100%', height = 12, style }: Omit<SkeletonBoxProps, 'width'> & { width?: number | `${number}%` }) {
  return <SkeletonBox width={width} height={height} radius={6} style={style} />;
}

/** Product card placeholder (grid + rail compatible). */
export function SkeletonProductCard({ compact = false }: { compact?: boolean }) {
  return (
    <View style={[styles.card, compact && { width: 168 }]}>
      <SkeletonBox height={compact ? 130 : 150} radius={Radius.lg} />
      <View style={styles.cardBody}>
        <SkeletonLine width="45%" height={10} />
        <SkeletonLine width="88%" height={14} style={{ marginTop: 8 }} />
        <SkeletonLine width="60%" height={12} style={{ marginTop: 8 }} />
        <SkeletonLine width="100%" height={38} radius={19} style={{ marginTop: 14 }} />
      </View>
    </View>
  );
}

export function SkeletonListItem() {
  return (
    <View style={styles.listItem}>
      <SkeletonBox width={56} height={56} radius={Radius.md} />
      <View style={styles.listText}>
        <SkeletonLine width="55%" height={13} />
        <SkeletonLine width="85%" height={11} style={{ marginTop: 8 }} />
        <SkeletonLine width="35%" height={11} style={{ marginTop: 6 }} />
      </View>
    </View>
  );
}

export function SkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <View style={styles.grid}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.gridItem}>
          <SkeletonProductCard />
        </View>
      ))}
    </View>
  );
}

export function SkeletonRows({ count = 3 }: { count?: number }) {
  return (
    <View style={{ gap: 12 }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonListItem key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  cardBody: { paddingTop: 12, paddingHorizontal: 4, paddingBottom: 4 },
  listItem: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  listText: { flex: 1, marginLeft: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridItem: { width: '47.5%' },
});
