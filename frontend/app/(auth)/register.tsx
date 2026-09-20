import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../src/components/ui/Screen';
import AppTextField from '../../src/components/ui/AppTextField';
import PrimaryButton from '../../src/components/ui/PrimaryButton';
import IconButton from '../../src/components/ui/IconButton';
import PressableScale from '../../src/components/ui/PressableScale';
import { authService } from '../../src/services/api';
import { useAuthStore } from '../../src/store/authStore';
import { User } from '../../src/models/types';
import { Colors } from '../../src/constants/colors';
import { Elevation, Font, Radius, Spacing, Type } from '../../src/constants/theme';

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

const EMPTY: FormState = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
};

export default function RegisterScreen() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [loading, setLoading] = useState(false);

  const update = (key: keyof FormState, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const validate = () => {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.firstName.trim()) next.firstName = 'Prénom requis';
    if (!form.lastName.trim()) next.lastName = 'Nom requis';
    if (!form.email.trim()) next.email = 'Email requis';
    else if (!/\S+@\S+\.\S+/.test(form.email)) next.email = 'Email invalide';
    if (!form.password) next.password = 'Mot de passe requis';
    else if (form.password.length < 8) next.password = '8 caractères minimum';
    if (form.password !== form.confirmPassword)
      next.confirmPassword = 'Les mots de passe ne correspondent pas';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await authService.register({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim() || undefined,
      });
      await setAuth(res.data.token, res.data.user as User);
      router.replace('/(main)/(home)/home');
    } catch (err) {
      Alert.alert('Inscription impossible', err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll background="blush">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <IconButton
            testID="register-back-btn"
            name="arrow-back"
            onPress={() => router.back()}
            accessibilityLabel="Retour"
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Créer mon compte</Text>
            <Text style={styles.subtitle}>Votre routine commence ici 🌸</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.half}>
              <AppTextField
                label="Prénom"
                value={form.firstName}
                onChangeText={(value) => update('firstName', value)}
                placeholder="Sarah"
                icon="person-outline"
                error={errors.firstName}
              />
            </View>
            <View style={styles.half}>
              <AppTextField
                label="Nom"
                value={form.lastName}
                onChangeText={(value) => update('lastName', value)}
                placeholder="Martin"
                error={errors.lastName}
              />
            </View>
          </View>

          <AppTextField
            testID="register-email-input"
            label="Email"
            value={form.email}
            onChangeText={(value) => update('email', value)}
            placeholder="votre@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            icon="mail-outline"
            error={errors.email}
          />

          <AppTextField
            label="Téléphone (optionnel)"
            value={form.phone}
            onChangeText={(value) => update('phone', value)}
            placeholder="+33 6 00 00 00 00"
            keyboardType="phone-pad"
            icon="call-outline"
          />

          <AppTextField
            testID="register-password-input"
            label="Mot de passe"
            value={form.password}
            onChangeText={(value) => update('password', value)}
            placeholder="8 caractères minimum"
            secureTextEntry
            secureToggle
            autoCapitalize="none"
            icon="lock-closed-outline"
            error={errors.password}
          />

          <AppTextField
            label="Confirmer le mot de passe"
            value={form.confirmPassword}
            onChangeText={(value) => update('confirmPassword', value)}
            placeholder="••••••••"
            secureTextEntry
            secureToggle
            autoCapitalize="none"
            icon="lock-closed-outline"
            error={errors.confirmPassword}
          />

          <PrimaryButton
            testID="register-submit-btn"
            label="Créer mon compte"
            icon="sparkles"
            loading={loading}
            onPress={() => void submit()}
          />

          <View style={styles.benefits}>
            {[
              { icon: 'cube-outline' as const, label: 'Livraison offerte' },
              { icon: 'pause-outline' as const, label: 'Pause quand je veux' },
              { icon: 'pricetag-outline' as const, label: 'Prix abonné garanti' },
            ].map((benefit) => (
              <View key={benefit.label} style={styles.benefit}>
                <Ionicons name={benefit.icon} size={14} color={Colors.primaryDark} />
                <Text style={styles.benefitText}>{benefit.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <PressableScale
          onPress={() => router.replace('/(auth)/login')}
          style={styles.loginRow}
          scaleTo={0.97}
        >
          <Text style={styles.loginText}>Déjà un compte ? </Text>
          <Text style={styles.loginLink}>Se connecter</Text>
        </PressableScale>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: Spacing.lg },
  title: { ...Type.h1, color: Colors.textPrimary },
  subtitle: { ...Type.small, color: Colors.textSecondary, marginTop: 2 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xxl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.lg,
    ...Elevation.md,
  },
  row: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },
  benefits: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: Spacing.md,
    justifyContent: 'center',
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.primaryPale,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  benefitText: { fontFamily: Font.medium, fontSize: 11, color: Colors.primaryDark },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  loginText: { ...Type.body, color: Colors.textSecondary },
  loginLink: { fontFamily: Font.semibold, fontSize: 14.5, color: Colors.primaryDark },
});
