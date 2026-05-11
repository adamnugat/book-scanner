import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { api } from '../../../../lib/api';
import { AudioFlowScreen } from '../../../../components/audioflow';
import type { SceneResponse } from '@book-scanner/shared';

export default function NewProjectReviewScreen() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const [scenes, setScenes] = useState<SceneResponse[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!projectId) return;

    let isActive = true;

    (async () => {
      try {
        const sceneList = await api.getScenes(projectId);
        if (!isActive) return;

        const orderedScenes = [...sceneList].sort((a, b) => a.orderIndex - b.orderIndex);
        setScenes(orderedScenes);
        setDrafts(
          Object.fromEntries(
            orderedScenes.map((scene) => [scene.id, scene.editedText || scene.ocrText || '']),
          ),
        );
      } catch {
        if (isActive) {
          Alert.alert('Błąd', 'Nie udało się pobrać transkrypcji');
        }
      } finally {
        if (isActive) setLoading(false);
      }
    })();

    return () => {
      isActive = false;
    };
  }, [projectId]);

  const updateDraft = (sceneId: string, text: string) => {
    setDrafts((prev) => ({ ...prev, [sceneId]: text }));
  };

  const handleSubmit = async () => {
    if (!projectId) return;

    setSubmitting(true);
    try {
      for (const scene of scenes) {
        await api.updateScene(projectId, scene.id, {
          editedText: drafts[scene.id] ?? '',
          status: 'ready_for_audio',
        });
      }

      await api.generateAudio(projectId);
      router.replace(`/(app)/projects/${projectId}/player`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Nie udało się wygenerować audio';
      Alert.alert('Błąd', message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AudioFlowScreen>
        <View style={styles.centered}>
          <ActivityIndicator color="#06d6a0" size="large" />
        </View>
      </AudioFlowScreen>
    );
  }

  return (
    <AudioFlowScreen>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.hero}>
            <Text style={styles.stepLabel}>Krok 3 z 3</Text>
            <Text style={styles.title}>Sprawdź tekst przed audio</Text>
            <Text style={styles.subtitle}>
              Popraw transkrypcję każdej strony. Po zatwierdzeniu powstaną osobne pliki audio.
            </Text>
          </View>

          {scenes.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Brak scen do sprawdzenia.</Text>
            </View>
          ) : (
            scenes.map((scene) => (
              <View key={scene.id} style={styles.sceneCard}>
                <Text style={styles.sceneTitle}>Strona {scene.orderIndex + 1}</Text>
                <TextInput
                  style={styles.textArea}
                  multiline
                  textAlignVertical="top"
                  value={drafts[scene.id] ?? ''}
                  onChangeText={(text) => updateDraft(scene.id, text)}
                />
              </View>
            ))
          )}
        </ScrollView>

        <View style={styles.bottomBar}>
          <Pressable
            style={[
              styles.submitButton,
              (submitting || scenes.length === 0) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={submitting || scenes.length === 0}
          >
            {submitting ? (
              <ActivityIndicator color="#101320" />
            ) : (
              <Text style={styles.submitButtonText}>Zatwierdź i generuj audio</Text>
            )}
          </Pressable>
        </View>
      </View>
    </AudioFlowScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, paddingBottom: 110 },
  hero: {
    backgroundColor: '#18213d',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#29355c',
    padding: 22,
    marginBottom: 18,
  },
  stepLabel: {
    color: '#06d6a0',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  title: { color: '#fff', fontSize: 28, fontWeight: '900', lineHeight: 32 },
  subtitle: { color: '#aebbd3', fontSize: 15, lineHeight: 21, marginTop: 8 },
  sceneCard: {
    backgroundColor: '#151b2f',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#29355c',
    padding: 16,
    marginBottom: 14,
  },
  sceneTitle: { color: '#fff', fontSize: 18, fontWeight: '900', marginBottom: 10 },
  textArea: {
    minHeight: 150,
    backgroundColor: '#0f1629',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#29355c',
    color: '#f6f8fb',
    fontSize: 16,
    lineHeight: 22,
    padding: 14,
  },
  emptyCard: {
    borderRadius: 20,
    padding: 18,
    backgroundColor: '#151b2f',
    borderWidth: 1,
    borderColor: '#29355c',
  },
  emptyText: { color: '#aebbd3', fontSize: 15, lineHeight: 21 },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#101320',
    borderTopWidth: 1,
    borderTopColor: '#29355c',
  },
  submitButton: {
    backgroundColor: '#06d6a0',
    borderRadius: 18,
    paddingVertical: 17,
    alignItems: 'center',
  },
  submitButtonDisabled: { opacity: 0.45 },
  submitButtonText: { color: '#101320', fontSize: 16, fontWeight: '900' },
});
