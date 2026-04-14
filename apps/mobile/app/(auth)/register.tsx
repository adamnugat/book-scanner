import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Link, router } from 'expo-router';
import { useAuth } from '../../lib/auth-context';

export default function RegisterScreen() {
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password) {
      Alert.alert('Błąd', 'Podaj email i hasło');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Błąd', 'Hasła nie są identyczne');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Błąd', 'Hasło musi mieć co najmniej 8 znaków');
      return;
    }
    setLoading(true);
    try {
      await register(email, password);
      router.replace('/(app)');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Rejestracja nie powiodła się';
      Alert.alert('Błąd rejestracji', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Utwórz konto</Text>

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
        placeholder="Hasło (min. 8 znaków)"
        placeholderTextColor="#666"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TextInput
        style={styles.input}
        placeholder="Potwierdź hasło"
        placeholderTextColor="#666"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />

      <Pressable style={styles.button} onPress={handleRegister} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Zarejestruj</Text>
        )}
      </Pressable>

      <Link href="/(auth)/login" style={styles.link}>
        Masz już konto? Zaloguj się
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
});
