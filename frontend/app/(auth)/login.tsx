import React, { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import Screen from '../../src/components/ui/Screen';
import AppTextField from '../../src/components/ui/AppTextField';
import PrimaryButton from '../../src/components/ui/PrimaryButton';
import PressableScale from '../../src/components/ui/PressableScale';
import { authService } from '../../src/services/api';
import { useAuthStore } from '../../src/store/authStore';
import { User } from '../../src/models/types';
import { Colors } from '../../src/constants/colors';
import { Elevation, Font, Radius, Spacing, Type } from '../../src/constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const next: typeof errors = {};
    if (!email.trim()) next.email = 'Email requis';
    else if (!/\S+@\S+\.\S+/.test(email)) next.email = 'Email invalide';
    if (!password) next.password = 'Mot de passe requis';
    else if (password.length < 6) next.password = '6 caractères minimum';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await authService.login(email.trim().toLowerCase(), password);
      await setAuth(res.data.token, res.data.user as User);
      router.replace('/(main)/(home)/home');
    } catch (err) {
      Alert.alert(
        'Connexion impossible',
        err instanceof Error ? err.message : 'Email ou mot de passe incorrect'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll background="blush">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.logoWrap}>
            <Image
              source={require('../../assets/images/brand/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.brand}>Livrella</Text>
          <Text style={styles.title}>Bon retour 🌸</Text>
          <Text style={styles.subtitle}>
            Connectez-vous pour retrouver votre routine et votre prochaine livraison.
          </Text>
        </View>

        {/* Form card */}
        <View style={styles.card}>
          <AppTextField
            testID="login-email-input"
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="votre@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="emailAddress"
            autoComplete="email"
            icon="mail-outline"
            error={errors.email}
          />
          <AppTextField
            testID="login-password-input"
            label="Mot de passe"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            icon="lock-closed-outline"
            secureTextEntry
            secureToggle
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="password"
            autoComplete="password"
            error={errors.password}
          />

          <PressableScale
            testID="login-forgot-password-btn"
            onPress={() => router.push('/(auth)/forgot-password')}
            style={styles.forgot}
            scaleTo={0.96}
          >
            <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
          </PressableScale>

          <PrimaryButton
            testID="login-submit-btn"
            label="Se connecter"
            icon="arrow-forward"
            iconPosition="right"
            loading={loading}
            onPress={() => void submit()}
          />

          <View style={styles.demoHint}>
            <Text style={styles.demoText}>
              💡 Compte démo : sarah@example.com · password123
            </Text>
          </View>
        </View>

        <View style={styles.registerRow}>
          <Text style={styles.registerText}>Pas encore de compte ?</Text>
          <PressableScale
            testID="login-register-link"
            onPress={() => router.push('/(auth)/register')}
            style={styles.registerPill}
            scaleTo={0.96}
          >
            <Text style={styles.registerLink}>Créer mon compte</Text>
          </PressableScale>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', paddingTop: Spacing.xl, paddingBottom: Spacing.xl },
  logoWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    ...Elevation.sm,
  },
  logo: { width: 60, height: 60 },
  brand: { fontFamily: Font.semibold, fontSize: 14, color: Colors.primaryDark, letterSpacing: 0.4 },
  title: { ...Type.h1, color: Colors.textPrimary, marginTop: Spacing.sm },
  subtitle: {
    ...Type.small,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 300,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xxl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.lg,
    ...Elevation.md,
  },
  forgot: { alignSelf: 'flex-end', marginTop: -6, marginBottom: Spacing.md },
  forgotText: { fontFamily: Font.medium, fontSize: 13, color: Colors.primaryDeep },
  demoHint: {
    marginTop: Spacing.md,
    backgroundColor: Colors.infoBg,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
  },
  demoText: { ...Type.small, fontSize: 11.5, color: '#4C7099', textAlign: 'center' },
  registerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  registerText: { ...Type.body, color: Colors.textSecondary },
  registerPill: {
    backgroundColor: Colors.primaryPale,
    borderRadius: Radius.full,
    paddingHorizontal: 14,
    height: 36,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.primaryMuted,
  },
  registerLink: { fontFamily: Font.semibold, fontSize: 13, color: Colors.primaryDark },
});
