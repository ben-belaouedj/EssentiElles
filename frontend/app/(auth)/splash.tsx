import React, { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../src/constants/colors';
import { Font, Gradients, Spacing, Type } from '../../src/constants/theme';

export default function SplashScreen() {
  const router = useRouter();
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(18)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, tension: 60, friction: 9, useNativeDriver: true }),
      Animated.timing(rise, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(async () => {
      const seen = await AsyncStorage.getItem('livrella_onboarding_seen');
      router.replace(seen ? '/(auth)/login' : '/(auth)/onboarding');
    }, 2200);

    return () => clearTimeout(timer);
  }, [fade, rise, scale, router]);

  return (
    <LinearGradient
      colors={Gradients.blush as unknown as [string, string, ...string[]]}
      style={styles.container}
    >
      <View style={styles.blobTop} />
      <View style={styles.blobBottom} />

      <Animated.View
        style={[styles.content, { opacity: fade, transform: [{ scale }, { translateY: rise }] }]}
      >
        <View style={styles.logoWrap}>
          <Image
            source={require('../../assets/images/brand/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.appName}>Livrella</Text>
        <Text style={styles.tagline}>Vos essentiels, livrés automatiquement</Text>
      </Animated.View>

      <Animated.View style={[styles.footer, { opacity: fade }]}>
        <View style={styles.pill}>
          <Text style={styles.pillText}>🌸 Simple · Fiable · Sans engagement</Text>
        </View>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  blobTop: {
    position: 'absolute',
    top: -140,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(181,131,141,0.18)',
  },
  blobBottom: {
    position: 'absolute',
    bottom: -160,
    left: -110,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(168,184,163,0.16)',
  },
  content: { alignItems: 'center', paddingHorizontal: Spacing.xl },
  logoWrap: {
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    shadowColor: '#B5838D',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 6,
  },
  logo: { width: 92, height: 92 },
  appName: {
    fontFamily: Font.bold,
    fontSize: 38,
    color: Colors.primaryDeep,
    letterSpacing: -1,
  },
  tagline: {
    ...Type.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  footer: { position: 'absolute', bottom: 54 },
  pill: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  pillText: { ...Type.small, color: Colors.textSecondary },
});
