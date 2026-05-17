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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../../../lib/api';
import {
  AudioFlowFooterMenu,
  AudioFlowScreen,
  audioFlowFooterMenuHeight,
} from '../../../../components/audioflow';
import { FadeZoomContent } from '../../../../components/FadeZoomContent';
import type { SceneResponse } from '@book-scanner/shared';

const STACK_GAP_ABOVE_FOOTER = 10;
const OCR_POLL_INTERVAL_MS = 1500;
const OCR_POLL_MAX_ATTEMPTS = 60;

export default function NewProjectReviewScreen() {
  const insets = useSafeAreaInsets();
  const footerLift = audioFlowFooterMenuHeight(insets.bottom) + STACK_GAP_ABOVE_FOOTER;
  const scrollBottomPad = 110 + footerLift;

  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const [scenes, setScenes] = useState<SceneResponse[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState('Ładowanie…');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!projectId) return;

    let isActive = true;

    (async () => {
      try {
        let sceneList: SceneResponse[] = [];

        for (let attempt = 0; attempt < OCR_POLL_MAX_ATTEMPTS; attempt++) {
          if (!isActive) return;
          sceneList = await api.getScenes(projectId);

          const total = sceneList.length;
          const done = sceneList.filter(
            (s) => s.status !== 'ocr_processing' && s.status !== 'queued',
          ).length;
          if (isActive && total > 0) {
            setLoadingProgress(`${done} / ${total} stron przetworzono`);
          }

          const allDone = total > 0 && done === total;
          if (allDone) break;

          if (attempt < OCR_POLL_MAX_ATTEMPTS - 1) {
            await new Promise((r) => setTimeout(r, OCR_POLL_INTERVAL_MS));
          }
        }

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
        <FadeZoomContent>
          <View style={styles.centered}>
            <View style={styles.loadingCard}>
              <ActivityIndicator color="#06d6a0" size="large" />
              <Text style={styles.loadingTitle}>Rozpoznawanie tekstu</Text>
              <Text style={styles.loadingProgress}>{loadingProgress}</Text>
            </View>
          </View>
        </FadeZoomContent>

        <AudioFlowFooterMenu
          active="library"
          bottomInset={insets.bottom}
          onCreatePress={() => router.push('/(app)/projects/new')}
          onLibraryPress={() => router.replace('/(app)')}
          playerDisabled
        />
      </AudioFlowScreen>
    );
  }

  return (
    <AudioFlowScreen>
      <FadeZoomContent>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: scrollBottomPad }]}>
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

        <View style={[styles.bottomBar, { bottom: footerLift }]}>
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
      </FadeZoomContent>

      <AudioFlowFooterMenu
        active="library"
        bottomInset={insets.bottom}
        onCreatePress={() => router.push('/(app)/projects/new')}
        onLibraryPress={() => router.replace('/(app)')}
        playerDisabled
      />
    </AudioFlowScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingCard: {
    backgroundColor: '#18213d',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#29355c',
    padding: 32,
    alignItems: 'center',
    minWidth: 260,
    gap: 16,
  },
  loadingTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
  },
  loadingProgress: {
    color: '#aebbd3',
    fontSize: 14,
    textAlign: 'center',
  },
  content: { padding: 20 },
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
