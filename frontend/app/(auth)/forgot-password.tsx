import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '../../src/services/api';
import AppTextField from '../../src/components/ui/AppTextField';
import PrimaryButton from '../../src/components/ui/PrimaryButton';
import { Colors } from '../../src/constants/colors';
import { Typography, Spacing, BorderRadius } from '../../src/constants/spacing';

type Step = 'email' | 'reset' | 'done';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendCode = async () => {
    setError('');
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError('Veuillez saisir une adresse email valide');
      return;
    }
    setLoading(true);
    try {
      const res = await authService.forgotPassword(email.trim().toLowerCase());
      // In non-production the API returns devCode so the flow can be tested
      // without an SMTP server.
      if (res.data?.devCode) setDevCode(res.data.devCode);
      setStep('reset');
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setError('');
    if (!code.trim() || code.trim().length !== 6) {
      setError('Saisissez le code à 6 chiffres reçu par email');
      return;
    }
    if (newPassword.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
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
    } catch (err: any) {
      setError(err.message || 'Code invalide ou expiré');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <TouchableOpacity testID="forgot-back-btn" onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Retour">
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.iconWrap}>
            <Ionicons name={step === 'done' ? 'checkmark-circle-outline' : 'lock-open-outline'} size={48} color={Colors.primary} />
          </View>

          <Text style={styles.title}>
            {step === 'done' ? 'Mot de passe modifié 🎉' : 'Mot de passe oublié ?'}
          </Text>
          <Text style={styles.subtitle}>
            {step === 'email' && 'Saisissez votre email et nous vous enverrons un code de vérification à 6 chiffres.'}
            {step === 'reset' && `Entrez le code envoyé à ${email.trim() || 'votre adresse'} et choisissez un nouveau mot de passe.`}
            {step === 'done' && 'Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.'}
          </Text>

          {step === 'email' && (
            <>
              <AppTextField
                testID="forgot-email-input"
                label="Email"
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
                label="Envoyer le code"
                onPress={handleSendCode}
                loading={loading}
                style={{ marginTop: Spacing.md }}
              />
            </>
          )}

          {step === 'reset' && (
            <>
              {devCode && (
                <View style={styles.devBox}>
                  <Ionicons name="flask-outline" size={16} color={Colors.info} />
                  <Text style={styles.devText}>Mode démo — code : <Text style={{ fontFamily: 'Poppins_700Bold' }}>{devCode}</Text></Text>
                </View>
              )}
              <AppTextField
                testID="forgot-code-input"
                label="Code de vérification"
                value={code}
                onChangeText={setCode}
                placeholder="123456"
                keyboardType="number-pad"
                icon="keypad-outline"
              />
              <AppTextField
                testID="forgot-new-password-input"
                label="Nouveau mot de passe"
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="8 caractères minimum"
                secureTextEntry
                secureToggle
                autoCapitalize="none"
                icon="lock-closed-outline"
              />
              <AppTextField
                testID="forgot-confirm-password-input"
                label="Confirmer le mot de passe"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Répétez le mot de passe"
                secureTextEntry
                secureToggle
                autoCapitalize="none"
                icon="lock-closed-outline"
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <PrimaryButton
                testID="forgot-reset-btn"
                label="Réinitialiser le mot de passe"
                onPress={handleReset}
                loading={loading}
                style={{ marginTop: Spacing.md }}
              />
              <TouchableOpacity onPress={() => { setStep('email'); setError(''); }} style={styles.resend}>
                <Text style={styles.resendText}>Renvoyer un code</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 'done' && (
            <PrimaryButton
              testID="forgot-done-btn"
              label="Se connecter"
              onPress={() => router.replace('/(auth)/login')}
              style={{ marginTop: Spacing.md }}
            />
          )}

          {step !== 'done' && (
            <TouchableOpacity testID="forgot-back-login-btn" onPress={() => router.replace('/(auth)/login')} style={styles.backLogin}>
              <Text style={styles.backLoginText}>← Retour à la connexion</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flexGrow: 1, padding: Spacing.xl },
  backBtn: { marginBottom: Spacing.xl },
  iconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primaryPale, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg, alignSelf: 'flex-start' },
  title: { ...Typography.h2, color: Colors.textPrimary, marginBottom: 8 },
  subtitle: { ...Typography.body, color: Colors.textSecondary, marginBottom: Spacing.xl, lineHeight: 24 },
  error: { ...Typography.bodySmall, color: Colors.error, marginTop: Spacing.sm },
  devBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.infoBg, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.info + '30',
    padding: Spacing.md, marginBottom: Spacing.md,
  },
  devText: { flex: 1, fontSize: 13, color: Colors.info, fontFamily: 'Poppins_500Medium' },
  resend: { marginTop: Spacing.md, alignSelf: 'center' },
  resendText: { ...Typography.bodySmall, color: Colors.primary, fontFamily: 'Poppins_500Medium', textDecorationLine: 'underline' },
  backLogin: { marginTop: Spacing.lg },
  backLoginText: { ...Typography.body, color: Colors.primary, fontFamily: 'Poppins_500Medium' },
});
