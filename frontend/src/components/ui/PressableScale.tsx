import React, { useRef } from 'react';
import { Animated, Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';

interface Props extends Omit<PressableProps, 'style'> {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Scale applied while pressed (default 0.97) */
  scaleTo?: number;
  /** Animate a subtle lift on press */
  lift?: boolean;
}

/**
 * Pressable wrapper with a modern spring press feedback.
 * Used for cards, tiles and buttons across the app.
 */
export default function PressableScale({
  children,
  style,
  scaleTo = 0.97,
  lift = false,
  onPressIn,
  onPressOut,
  ...props
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  const animate = (toScale: number, toY: number, duration = 140) => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: toScale,
        useNativeDriver: true,
        damping: 18,
        stiffness: 260,
      }),
      Animated.timing(translateY, {
        toValue: toY,
        duration,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <Pressable
      {...props}
      onPressIn={(e) => {
        animate(scaleTo, lift ? -2 : 0);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        animate(1, 0, 180);
        onPressOut?.(e);
      }}
    >
      <Animated.View style={[style, { transform: [{ scale }, { translateY }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
