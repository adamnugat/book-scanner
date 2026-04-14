import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Link, router } from 'expo-router';
import { useAuth } from '../../lib/auth-context';

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
    <View style={styles.container}>
      <Text style={styles.title}>Zaloguj się</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#666"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />

      <TextInput
        style={styles.input}
        placeholder="Hasło"
        placeholderTextColor="#666"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Pressable style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Zaloguj</Text>
        )}
      </Pressable>

      <Link href="/(auth)/register" style={styles.link}>
        Nie masz konta? Zarejestruj się
      </Link>

      <Link href="/(auth)/reset-password" style={styles.linkSecondary}>
        Zapomniałeś hasła?
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#1a1a2e',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#e0e0e0',
    marginBottom: 32,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#16213e',
    color: '#e0e0e0',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  button: {
    backgroundColor: '#e94560',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  link: {
    color: '#e94560',
    textAlign: 'center',
    marginTop: 24,
    fontSize: 14,
  },
  linkSecondary: {
    color: '#888',
    textAlign: 'center',
    marginTop: 12,
    fontSize: 14,
  },
});
