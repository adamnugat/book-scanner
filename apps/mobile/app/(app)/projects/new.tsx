import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { api } from '../../../lib/api';
import type { SupportedLanguage } from '@book-scanner/shared';

export default function NewProjectScreen() {
  const [title, setTitle] = useState('');
  const [language, setLanguage] = useState<SupportedLanguage>('pl');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Błąd', 'Podaj tytuł projektu');
      return;
    }
    setLoading(true);
    try {
      const project = await api.createProject({ title: title.trim(), language });
      router.replace(`/(app)/projects/${project.id}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Nie udało się stworzyć projektu';
      Alert.alert('Błąd', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Nowy projekt</Text>

      <Text style={styles.label}>Tytuł</Text>
      <TextInput
        style={styles.input}
        placeholder="np. Pan Tadeusz"
        placeholderTextColor="#666"
        value={title}
        onChangeText={setTitle}
      />

      <Text style={styles.label}>Język</Text>
      <View style={styles.langRow}>
        {(['pl', 'en'] as const).map((lang) => (
          <Pressable
            key={lang}
            style={[styles.langBtn, language === lang && styles.langBtnActive]}
            onPress={() => setLanguage(lang)}
          >
            <Text style={[styles.langText, language === lang && styles.langTextActive]}>
              {lang === 'pl' ? 'Polski' : 'English'}
            </Text>
          </Pressable>
        ))}
      </View>

      <Pressable style={styles.button} onPress={handleCreate} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Stwórz projekt</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#1a1a2e' },
  heading: { fontSize: 24, fontWeight: 'bold', color: '#e0e0e0', marginBottom: 32 },
  label: { fontSize: 14, color: '#888', marginBottom: 8, marginTop: 16 },
  input: {
    backgroundColor: '#16213e',
    color: '#e0e0e0',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  langRow: { flexDirection: 'row', gap: 12 },
  langBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0f3460',
    alignItems: 'center',
  },
  langBtnActive: { borderColor: '#e94560', backgroundColor: '#e9456022' },
  langText: { color: '#888', fontSize: 15 },
  langTextActive: { color: '#e94560', fontWeight: '600' },
  button: {
    backgroundColor: '#e94560',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
