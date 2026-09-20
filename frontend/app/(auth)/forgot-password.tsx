import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../src/components/ui/Screen';
import AppTextField from '../../src/components/ui/AppTextField';
import PrimaryButton from '../../src/components/ui/PrimaryButton';
import IconButton from '../../src/components/ui/IconButton';
import { GradientCard } from '../../src/components/ui/GradientCard';
import { authService } from '../../src/services/api';
import { Colors } from '../../src/constants/colors';
import { Elevation, Font, Radius, Spacing, Type } from '../../src/constants/theme';

type Step = 'email' | 'reset' | 'done';

const STEPS: { key: Step; label: string }[] = [
  { key: 'email', label: 'Email' },
  { key: 'reset', label: 'Code' },
  { key: 'done', label: 'Terminé' },
];

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sendCode = async () => {
    setError('');
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError('Saisissez une adresse email valide');
      return;
    }
    setLoading(true);
    try {
      const res = await authService.forgotPassword(email.trim().toLowerCase());
      if (res.data?.devCode) setDevCode(res.data.devCode);
      setStep('reset');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    setError('');
    if (code.trim().length !== 6) {
      setError('Le code doit contenir 6 chiffres');
      return;
    }
    if (newPassword.length < 8) {
      setError('8 caractères minimum pour le nouveau mot de passe');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    setLoading(true);
    try {
      await authService.resetPassword(email.trim().toLowerCase(), code.trim(), newPassword);
      setStep('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Code invalide ou expiré');
    } finally {
      setLoading(false);
    }
  };

  const activeIndex = STEPS.findIndex((item) => item.key === step);

  return (
    <Screen scroll background="blush">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <IconButton
            testID="forgot-back-btn"
            name="arrow-back"
            onPress={() => router.back()}
            accessibilityLabel="Retour"
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>
              {step === 'done' ? 'Mot de passe modifié' : 'Mot de passe oublié'}
            </Text>
            <Text style={styles.subtitle}>
              {step === 'email'
                ? 'Recevez un code de vérification'
                : step === 'reset'
                  ? 'Saisissez le code et votre nouveau mot de passe'
                  : 'Vous pouvez vous connecter'}
            </Text>
          </View>
        </View>

        {/* Progress */}
        <View style={styles.progress}>
          {STEPS.map((item, index) => (
            <View key={item.key} style={styles.progressItem}>
              <View
                style={[
                  styles.progressDot,
                  index <= activeIndex && styles.progressDotActive,
                ]}
              >
                {index < activeIndex ? (
                  <Ionicons name="checkmark" size={12} color={Colors.textInverse} />
                ) : (
                  <Text style={[styles.progressNumber, index === activeIndex && styles.progressNumberActive]}>
                    {index + 1}
                  </Text>
                )}
              </View>
              <Text style={[styles.progressLabel, index === activeIndex && styles.progressLabelActive]}>
                {item.label}
              </Text>
              {index < STEPS.length - 1 ? (
                <View style={[styles.progressLine, index < activeIndex && styles.progressLineActive]} />
              ) : null}
            </View>
          ))}
        </View>

        {step === 'done' ? (
          <>
            <GradientCard colors="sage" contentStyle={styles.successCard}>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark" size={26} color={Colors.textInverse} />
              </View>
              <Text style={styles.successTitle}>C’est fait ✨</Text>
              <Text style={styles.successText}>
                Votre mot de passe a bien été mis à jour. Connectez-vous avec vos nouveaux
                identifiants.
              </Text>
            </GradientCard>

            <PrimaryButton
              label="Se connecter"
              icon="arrow-forward"
              iconPosition="right"
              onPress={() => router.replace('/(auth)/login')}
              style={{ marginTop: Spacing.lg }}
            />
          </>
        ) : (
          <View style={styles.card}>
            {step === 'email' ? (
              <>
                <AppTextField
                  testID="forgot-email-input"
                  label="Email du compte"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="votre@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  icon="mail-outline"
                />
                {error ? <Text style={styles.error}>{error}</Text> : null}
                <PrimaryButton
                  testID="forgot-send-btn"
                  label={loading ? 'Envoi…' : 'Recevoir mon code'}
                  icon="paper-plane-outline"
                  loading={loading}
                  onPress={() => void sendCode()}
                />
              </>
            ) : (
              <>
                <AppTextField
                  label="Code à 6 chiffres"
                  value={code}
                  onChangeText={setCode}
                  placeholder="123456"
                  keyboardType="number-pad"
                  maxLength={6}
                  icon="keypad-outline"
                />
                {devCode ? (
                  <View style={styles.devHint}>
                    <Ionicons name="information-circle-outline" size={14} color="#4C7099" />
                    <Text style={styles.devHintText}>
                      Mode démo : votre code est {devCode}
                    </Text>
                  </View>
                ) : null}
                <AppTextField
                  testID="forgot-new-password-input"
                  label="Nouveau mot de passe"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="8 caractères minimum"
                  secureTextEntry
                  secureToggle
                  icon="lock-closed-outline"
                />
                <AppTextField
                  label="Confirmer le mot de passe"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="••••••••"
                  secureTextEntry
                  secureToggle
                  icon="lock-closed-outline"
                />
                {error ? <Text style={styles.error}>{error}</Text> : null}
                <PrimaryButton
                  testID="forgot-reset-btn"
                  label={loading ? 'Validation…' : 'Valider le nouveau mot de passe'}
                  icon="checkmark"
                  loading={loading}
                  onPress={() => void resetPassword()}
                />
                <PrimaryButton
                  label="Renvoyer le code"
                  variant="ghost"
                  size="sm"
                  onPress={() => void sendCode()}
                  style={{ marginTop: Spacing.sm }}
                />
              </>
            )}
          </View>
        )}
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: Spacing.lg },
  title: { ...Type.h1, color: Colors.textPrimary },
  subtitle: { ...Type.small, color: Colors.textSecondary, marginTop: 2 },
  progress: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg },
  progressItem: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  progressDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDotActive: { backgroundColor: Colors.primary, borderColor: Colors.primaryDark },
  progressNumber: { fontFamily: Font.semibold, fontSize: 12, color: Colors.textTertiary },
  progressNumberActive: { color: Colors.textInverse },
  progressLabel: { fontFamily: Font.medium, fontSize: 12, color: Colors.textTertiary },
  progressLabelActive: { color: Colors.textPrimary, fontFamily: Font.semibold },
  progressLine: { flex: 1, height: 2, backgroundColor: Colors.borderLight, marginHorizontal: 8 },
  progressLineActive: { backgroundColor: Colors.primaryLight },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xxl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.lg,
    ...Elevation.md,
  },
  error: {
    ...Type.small,
    color: Colors.error,
    backgroundColor: Colors.errorBg,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  devHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.infoBg,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  devHintText: { ...Type.small, color: '#4C7099', flex: 1 },
  successCard: { alignItems: 'center', gap: 10, paddingVertical: Spacing.xl },
  successIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: { ...Type.h2, color: Colors.textInverse },
  successText: {
    ...Type.small,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    paddingHorizontal: Spacing.md,
  },
});
