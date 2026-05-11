import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { api } from '../../../../lib/api';
import { AudioFlowScreen } from '../../../../components/audioflow';
import type { SupportedLanguage } from '@book-scanner/shared';

export default function EditProjectScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [title, setTitle] = useState('');
  const [language, setLanguage] = useState<SupportedLanguage>('pl');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const project = await api.getProject(id);
        setTitle(project.title);
        setLanguage(project.language as SupportedLanguage);
      } catch {
        Alert.alert('Błąd', 'Nie udało się pobrać projektu');
        router.back();
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Błąd', 'Podaj tytuł projektu');
      return;
    }
    setSaving(true);
    try {
      await api.updateProject(id, { title: title.trim(), language });
      router.back();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Nie udało się zapisać zmian';
      Alert.alert('Błąd', msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AudioFlowScreen>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#e94560" />
        </View>
      </AudioFlowScreen>
    );
  }

  return (
    <AudioFlowScreen>
      <View style={styles.container}>
        <Text style={styles.heading}>Edytuj projekt</Text>

        <Text style={styles.label}>Tytuł</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholderTextColor="#666"
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

        <Pressable style={styles.button} onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Zapisz zmiany</Text>
          )}
        </Pressable>
      </View>
    </AudioFlowScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: 'transparent' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
