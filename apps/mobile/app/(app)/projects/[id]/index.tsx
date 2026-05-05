import { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { api } from '../../../../lib/api';
import type { ProjectResponse } from '@book-scanner/shared';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Szkic',
  ocr_processing: 'OCR w toku',
  ready_for_tts: 'Gotowe do TTS',
  completed: 'Gotowe',
};

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [project, setProject] = useState<ProjectResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          setLoading(true);
          const data = await api.getProject(id);
          setProject(data);
        } catch {
          Alert.alert('Błąd', 'Nie udało się pobrać projektu');
          router.back();
        } finally {
          setLoading(false);
        }
      })();
    }, [id]),
  );

  const handleDelete = () => {
    Alert.alert('Usuń projekt', `Czy na pewno chcesz usunąć "${project?.title}"?`, [
      { text: 'Anuluj', style: 'cancel' },
      {
        text: 'Usuń',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteProject(id);
            router.replace('/(app)');
          } catch {
            Alert.alert('Błąd', 'Nie udało się usunąć projektu');
          }
        },
      },
    ]);
  };

  if (loading || !project) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#e94560" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{project.title}</Text>

      <View
        style={[
          styles.nextStepCard,
          project.status === 'ready_for_tts' && styles.nextStepCardReady,
        ]}
      >
        <Text style={styles.nextStepKicker}>Etap audiobooka</Text>
        <Text style={styles.nextStepTitle}>
          {project.status === 'ready_for_tts'
            ? 'Następny krok: Text to Speech'
            : 'Przygotuj tekst przed nagraniem'}
        </Text>
        <Text style={styles.nextStepBody}>
          {project.status === 'ready_for_tts'
            ? 'OCR jest gotowy. Wybierz głos lektora, a potem uruchom generowanie audio dla zatwierdzonych scen.'
            : 'Najpierw zakończ OCR i zatwierdź tekst scen.'}
        </Text>
        {project.status === 'ready_for_tts' && (
          <Pressable
            style={styles.nextStepBtn}
            onPress={() => router.push(`/(app)/projects/${id}/voice`)}
          >
            <Text style={styles.nextStepBtnText}>Wybierz głos i generuj audio</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Status</Text>
        <Text style={styles.fieldValue}>{STATUS_LABELS[project.status] || project.status}</Text>
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Język</Text>
        <Text style={styles.fieldValue}>{project.language === 'pl' ? 'Polski' : 'English'}</Text>
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Głos lektora</Text>
        <Text style={styles.fieldValue}>{project.voiceId || 'Nie wybrano'}</Text>
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Wstawka</Text>
        <Text style={styles.fieldValue}>{project.interstitialPreset || 'Domyślna'}</Text>
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Utworzono</Text>
        <Text style={styles.fieldValue}>{new Date(project.createdAt).toLocaleString('pl-PL')}</Text>
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Ostatnia zmiana</Text>
        <Text style={styles.fieldValue}>{new Date(project.updatedAt).toLocaleString('pl-PL')}</Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={styles.primaryBtn}
          onPress={() => router.push(`/(app)/projects/${id}/images`)}
        >
          <Text style={styles.primaryBtnText}>Zdjęcia stron</Text>
        </Pressable>

        <Pressable
          style={styles.primaryBtn}
          onPress={() => router.push(`/(app)/projects/${id}/voice`)}
        >
          <Text style={styles.primaryBtnText}>Głos i audio</Text>
        </Pressable>

        <Pressable
          style={[styles.primaryBtn, { backgroundColor: '#06d6a0' }]}
          onPress={() => router.push(`/(app)/projects/${id}/player`)}
        >
          <Text style={[styles.primaryBtnText, { color: '#1a1a2e' }]}>Odtwarzacz</Text>
        </Pressable>

        <Pressable
          style={styles.editBtn}
          onPress={() => router.push(`/(app)/projects/${id}/sharing`)}
        >
          <Text style={styles.editBtnText}>Udostępnij / QR</Text>
        </Pressable>

        <Pressable style={styles.editBtn} onPress={() => router.push(`/(app)/projects/${id}/edit`)}>
          <Text style={styles.editBtnText}>Edytuj projekt</Text>
        </Pressable>

        <Pressable style={styles.deleteBtn} onPress={handleDelete}>
          <Text style={styles.deleteBtnText}>Usuń projekt</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  content: { padding: 24 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a1a2e' },
  title: { fontSize: 26, fontWeight: 'bold', color: '#e0e0e0', marginBottom: 24 },
  nextStepCard: {
    backgroundColor: '#16213e',
    borderRadius: 18,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  nextStepCardReady: {
    borderColor: '#06d6a0',
    backgroundColor: '#073b3a',
  },
  nextStepKicker: {
    color: '#f0a500',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  nextStepTitle: { color: '#fff', fontSize: 19, fontWeight: '700', marginBottom: 8 },
  nextStepBody: { color: '#c9d6df', fontSize: 14, lineHeight: 20 },
  nextStepBtn: {
    backgroundColor: '#06d6a0',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  nextStepBtnText: { color: '#102027', fontSize: 15, fontWeight: '700' },
  field: { marginBottom: 16 },
  fieldLabel: { fontSize: 13, color: '#666', marginBottom: 4 },
  fieldValue: { fontSize: 16, color: '#e0e0e0' },
  actions: { marginTop: 32, gap: 12 },
  primaryBtn: {
    backgroundColor: '#e94560',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  editBtn: {
    backgroundColor: '#0f3460',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  editBtnText: { color: '#e0e0e0', fontSize: 16, fontWeight: '600' },
  deleteBtn: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e94560',
  },
  deleteBtnText: { color: '#e94560', fontSize: 16, fontWeight: '600' },
});
