import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { api } from '../../../../../lib/api';
import { useToast } from '../../../../../components/Toast';
import { PageImagePreview } from '../../../../../components/PageImagePreview';
import { AudioFlowScreenWithHeader } from '../../../../../components/audioflow-global-navigation';
import { FadeZoomContent } from '../../../../../components/FadeZoomContent';
import type { SceneResponse } from '@book-scanner/shared';

const STATUS_LABELS: Record<string, string> = {
  ocr_done: 'OCR gotowy',
  needs_review: 'Do przeglądu',
  ready_for_audio: 'Gotowe do TTS',
};

export default function SceneEditorScreen() {
  const { id, sceneId } = useLocalSearchParams<{ id: string; sceneId: string }>();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const { showToast } = useToast();

  const [scene, setScene] = useState<
    | (SceneResponse & {
        pageImage: {
          storagePath: string;
          thumbnailPath: string | null;
          imageUrl: string;
          thumbnailUrl: string | null;
          originalFilename: string | null;
        };
      })
    | null
  >(null);
  const [allScenes, setAllScenes] = useState<SceneResponse[]>([]);
  const [editedText, setEditedText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const loadScene = useCallback(async () => {
    try {
      setLoading(true);
      const [sceneData, scenes] = await Promise.all([api.getScene(id, sceneId), api.getScenes(id)]);
      setScene(sceneData);
      setAllScenes(scenes);
      setEditedText(sceneData.editedText || sceneData.ocrText || '');
      setDirty(false);
    } catch {
      Alert.alert('Błąd', 'Nie udało się pobrać sceny');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id, sceneId]);

  useEffect(() => {
    loadScene();
  }, [loadScene]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      if (e.altKey && e.key === 'ArrowLeft' && prevScene) {
        e.preventDefault();
        saveAndNavigate(prevScene.id);
      }
      if (e.altKey && e.key === 'ArrowRight' && nextScene) {
        e.preventDefault();
        saveAndNavigate(nextScene.id);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  const handleSave = async () => {
    if (!scene) return;
    setSaving(true);
    try {
      const updated = await api.updateScene(id, sceneId, {
        editedText: editedText || null,
        status: 'ready_for_audio',
      });
      setScene((prev) => (prev ? { ...prev, ...updated } : prev));
      setDirty(false);
      showToast('Scena zapisana');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Nie udało się zapisać';
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const saveAndNavigate = async (targetSceneId: string) => {
    if (dirty && scene) {
      try {
        await api.updateScene(id, sceneId, { editedText: editedText || null });
      } catch {
        /* best effort */
      }
    }
    router.replace(`/(app)/projects/${id}/scenes/${targetSceneId}`);
  };

  const currentIndex = allScenes.findIndex((s) => s.id === sceneId);
  const prevScene = currentIndex > 0 ? allScenes[currentIndex - 1] : null;
  const nextScene = currentIndex < allScenes.length - 1 ? allScenes[currentIndex + 1] : null;

  const displayText = editedText || '';
  const wordCount = displayText.trim() ? displayText.trim().split(/\s+/).length : 0;
  const charCount = displayText.length;

  if (loading || !scene) {
    return (
      <AudioFlowScreenWithHeader title="Edycja sceny">
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#e94560" />
        </View>
      </AudioFlowScreenWithHeader>
    );
  }

  const imagePreview = (
    <View style={[styles.imagePanel, isDesktop && styles.imagePanelDesktop]}>
      <PageImagePreview
        thumbnailUrl={scene.pageImage.thumbnailUrl}
        imageUrl={scene.pageImage.imageUrl}
        style={styles.previewImage}
        resizeMode="contain"
      />
      <Text style={styles.imageName}>
        {scene.pageImage.originalFilename || `Strona ${scene.orderIndex + 1}`}
      </Text>
    </View>
  );

  const editor = (
    <View style={[styles.editorPanel, isDesktop && styles.editorPanelDesktop]}>
      <View style={styles.editorHeader}>
        <Text style={styles.sceneTitle}>
          Scena {scene.orderIndex + 1} z {allScenes.length}
        </Text>
        <Text
          style={[
            styles.statusBadge,
            { color: scene.status === 'ready_for_audio' ? '#06d6a0' : '#f0a500' },
          ]}
        >
          {STATUS_LABELS[scene.status] || scene.status}
        </Text>
      </View>

      <TextInput
        style={styles.textArea}
        multiline
        value={editedText}
        onChangeText={(text) => {
          setEditedText(text);
          setDirty(true);
        }}
        placeholder="Tekst sceny..."
        placeholderTextColor="#666"
        textAlignVertical="top"
      />

      <View style={styles.counter}>
        <Text style={styles.counterText}>
          {wordCount} słów · {charCount} znaków
        </Text>
        {dirty && <Text style={styles.unsaved}>● niezapisane</Text>}
      </View>

      <Pressable style={styles.saveBtn} onPress={handleSave} disabled={saving}>
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveBtnText}>Zapisz i zatwierdź</Text>
        )}
      </Pressable>
    </View>
  );

  return (
    <AudioFlowScreenWithHeader title="Edycja sceny">
      <FadeZoomContent>
      <View style={styles.container}>
      {isDesktop ? (
        <View style={styles.desktopLayout}>
          <ScrollView style={styles.sidePanel}>
            {allScenes.map((s) => (
              <Pressable
                key={s.id}
                style={[styles.sideItem, s.id === sceneId && styles.sideItemActive]}
                onPress={() => saveAndNavigate(s.id)}
              >
                <Text style={styles.sideItemNum}>{s.orderIndex + 1}</Text>
                <Text
                  style={[styles.sideItemText, s.id === sceneId && styles.sideItemTextActive]}
                  numberOfLines={1}
                >
                  {s.editedText || s.ocrText || '(brak tekstu)'}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          <View style={styles.desktopMain}>
            {imagePreview}
            {editor}
          </View>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.mobileContent}>
          {imagePreview}
          {editor}
        </ScrollView>
      )}

      <View style={styles.navBar}>
        <Pressable
          style={[styles.navBtn, !prevScene && styles.navBtnDisabled]}
          onPress={() => prevScene && saveAndNavigate(prevScene.id)}
          disabled={!prevScene}
        >
          <Text style={[styles.navBtnText, !prevScene && styles.navBtnTextDisabled]}>
            ← Poprzednia
          </Text>
        </Pressable>
        <Pressable
          style={[styles.navBtn, !nextScene && styles.navBtnDisabled]}
          onPress={() => nextScene && saveAndNavigate(nextScene.id)}
          disabled={!nextScene}
        >
          <Text style={[styles.navBtnText, !nextScene && styles.navBtnTextDisabled]}>
            Następna →
          </Text>
        </Pressable>
      </View>
      </View>
      </FadeZoomContent>
    </AudioFlowScreenWithHeader>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  mobileContent: { padding: 16, paddingBottom: 80 },

  desktopLayout: { flex: 1, flexDirection: 'row' },
  sidePanel: {
    width: 260,
    borderRightWidth: 1,
    borderRightColor: '#0f3460',
    backgroundColor: '#16213e',
  },
  sideItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#0f3460',
  },
  sideItemActive: { backgroundColor: '#0f3460' },
  sideItemNum: { color: '#888', fontWeight: 'bold', width: 24, fontSize: 13 },
  sideItemText: { flex: 1, color: '#aaa', fontSize: 12 },
  sideItemTextActive: { color: '#e0e0e0' },
  desktopMain: { flex: 1, flexDirection: 'row', padding: 16, gap: 16 },

  imagePanel: { alignItems: 'center', marginBottom: 16 },
  imagePanelDesktop: { width: 300, marginBottom: 0 },
  previewImage: { width: '100%', height: 300, borderRadius: 8, backgroundColor: '#0f3460' },
  imageName: { color: '#888', fontSize: 12, marginTop: 6 },

  editorPanel: { flex: 1 },
  editorPanelDesktop: { flex: 1 },
  editorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sceneTitle: { color: '#e0e0e0', fontSize: 18, fontWeight: 'bold' },
  statusBadge: { fontSize: 13, fontWeight: '600' },

  textArea: {
    backgroundColor: '#16213e',
    color: '#e0e0e0',
    borderRadius: 8,
    padding: 16,
    fontSize: 15,
    lineHeight: 24,
    minHeight: 200,
    borderWidth: 1,
    borderColor: '#0f3460',
  },

  counter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  counterText: { color: '#666', fontSize: 12 },
  unsaved: { color: '#f0a500', fontSize: 12 },

  saveBtn: {
    backgroundColor: '#e94560',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },

  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#0f3460',
    backgroundColor: '#1a1a2e',
  },
  navBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0f3460',
    alignItems: 'center',
  },
  navBtnDisabled: { opacity: 0.3 },
  navBtnText: { color: '#e0e0e0', fontSize: 14 },
  navBtnTextDisabled: { color: '#666' },
});
