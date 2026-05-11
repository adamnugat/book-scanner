import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { useAuth } from '../../lib/auth-context';
import {
  AudioFlowScreen,
  AudioFlowTextField,
  AudioFlowLogo,
  FormLink,
  GlassPanel,
  PearlButton,
  audioFlowStyles,
  audioFlowTokens,
} from '../../components/audioflow';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Błąd', 'Podaj email i hasło');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      router.replace('/(app)');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Logowanie nie powiodło się';
      Alert.alert('Błąd logowania', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AudioFlowScreen style={styles.screen} variant="login">
      <View style={styles.content}>
        <View style={styles.brand}>
          <AudioFlowLogo size="lg" />
          <Text style={audioFlowStyles.headlineLg}>AudioFlow</Text>
          <Text style={styles.brandSubtitle}>Wejdź do swojego studia audiobooków</Text>
        </View>

        <GlassPanel style={styles.panel}>
          <AudioFlowTextField
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            label="Email"
            onChangeText={setEmail}
            placeholder="you@example.com"
            value={email}
          />

          <View style={styles.passwordLabelRow}>
            <Text style={styles.passwordLabel}>Hasło</Text>
            <Link href="/(auth)/reset-password" style={styles.resetLink}>
              Zapomniałeś hasła?
            </Link>
          </View>
          <AudioFlowTextField
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            style={styles.passwordField}
            value={password}
          />

          <PearlButton
            disabled={loading}
            label={loading ? 'Logowanie...' : 'Zaloguj'}
            onPress={handleLogin}
            style={styles.loginButton}
          />
          {loading ? <ActivityIndicator color={audioFlowTokens.color.text.onPearl} /> : null}
        </GlassPanel>

        <Link href="/(auth)/register" style={styles.registerLink}>
          <FormLink>Nie masz konta? Zarejestruj się</FormLink>
        </Link>
      </View>
    </AudioFlowScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: audioFlowTokens.spacing.marginMobile,
    paddingVertical: audioFlowTokens.spacing.stackLg,
  },
  brand: {
    alignItems: 'center',
    marginBottom: audioFlowTokens.spacing.sectionGap,
  },
  brandSubtitle: {
    ...audioFlowStyles.body,
    marginTop: audioFlowTokens.spacing.stackSm,
    textAlign: 'center',
  },
  panel: {
    gap: audioFlowTokens.spacing.stackMd,
    padding: audioFlowTokens.spacing.stackLg,
  },
  passwordLabelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: -audioFlowTokens.spacing.stackSm,
  },
  passwordLabel: {
    color: audioFlowTokens.color.text.onSurfaceSubtle,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  resetLink: {
    color: audioFlowTokens.color.accent.pearl,
    fontSize: 12,
    fontWeight: '600',
  },
  passwordField: {
    marginTop: -audioFlowTokens.spacing.stackSm,
  },
  loginButton: {
    marginTop: audioFlowTokens.spacing.stackMd,
  },
  registerLink: {
    marginTop: audioFlowTokens.spacing.sectionGap,
    textAlign: 'center',
  },
});
