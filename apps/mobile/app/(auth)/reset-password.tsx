import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Link } from 'expo-router';
import { api } from '../../lib/api';
import { AudioFlowScreen } from '../../components/audioflow';

export default function ResetPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    if (!email) {
      Alert.alert('Błąd', 'Podaj adres email');
      return;
    }
    setLoading(true);
    try {
      await api.resetPassword(email);
      setSent(true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Wystąpił błąd';
      Alert.alert('Błąd', msg);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AudioFlowScreen>
        <View style={styles.container}>
          <Text style={styles.title}>Sprawdź email</Text>
          <Text style={styles.subtitle}>
            Jeśli konto z tym adresem istnieje, wysłaliśmy link do zresetowania hasła.
          </Text>
          <Link href="/(auth)/login" style={styles.link}>
            Wróć do logowania
          </Link>
        </View>
      </AudioFlowScreen>
    );
  }

  return (
    <AudioFlowScreen>
      <View style={styles.container}>
        <Text style={styles.title}>Resetuj hasło</Text>
        <Text style={styles.subtitle}>Podaj email powiązany z kontem</Text>

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

        <Pressable style={styles.button} onPress={handleReset} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Wyślij link resetujący</Text>
          )}
        </Pressable>

        <Link href="/(auth)/login" style={styles.link}>
          Wróć do logowania
        </Link>
      </View>
    </AudioFlowScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#e0e0e0',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 32,
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
