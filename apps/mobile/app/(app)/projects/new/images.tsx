import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../../../../lib/api';
import { uploadFileFromImagePickerAsset } from '../../../../lib/image-upload';
import { PageImagePreview } from '../../../../components/PageImagePreview';
import type { AudioTrackResponse, PageImageResponse, SceneResponse } from '@book-scanner/shared';

type WizardMode = 'auto' | 'advanced';
const AUDIO_READY_POLL_INTERVAL_MS = 1500;
const AUDIO_READY_MAX_ATTEMPTS = 40;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForGeneratedAudio(projectId: string, expectedTrackCount: number): Promise<AudioTrackResponse[]> {
  const requiredTrackCount = Math.max(1, expectedTrackCount);

  for (let attempt = 0; attempt < AUDIO_READY_MAX_ATTEMPTS; attempt++) {
    const tracks = await api.getAudioTracks(projectId);
    if (tracks.length >= requiredTrackCount) {
      return tracks;
    }

    if (attempt < AUDIO_READY_MAX_ATTEMPTS - 1) {
      await wait(AUDIO_READY_POLL_INTERVAL_MS);
    }
  }

  throw new Error('Audio nadal się generuje. Wróć do projektu za chwilę.');
}

function countExpectedAudioTracks(scenes: SceneResponse[]): number {
  return scenes.filter((scene) => (
    scene.status === 'audio_generating' ||
    scene.status === 'audio_done' ||
    scene.status === 'ready_for_audio'
  )).length;
}

export default function NewProjectImagesScreen() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const [mode, setMode] = useState<WizardMode>('auto');
  const [pendingAssets, setPendingAssets] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [images, setImages] = useState<PageImageResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const imageCount = pendingAssets.length + images.length;
  const countLabel = imageCount === 1 ? 'Dodano 1 zdjęcie' : `Dodano ${imageCount} zdjęć`;
  const canContinue = imageCount > 0 && !processing;

  const loadImages = useCallback(async () => {
    if (!projectId) return;
    try {
      const existingImages = await api.getImages(projectId);
      setImages(existingImages);
    } catch {
      Alert.alert('Błąd', 'Nie udało się pobrać zdjęć projektu');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadImages();
  }, [loadImages]);

  const orderedPreviewItems = useMemo(
    () => [
      ...images.map((image) => ({ kind: 'uploaded' as const, key: image.id, image })),
      ...pendingAssets.map((asset, index) => ({
        kind: 'pending' as const,
        key: `${asset.uri}-${index}`,
        asset,
        index,
      })),
    ],
    [images, pendingAssets],
  );

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.95,
    });

    if (!result.canceled) {
      setPendingAssets((prev) => [...prev, ...result.assets]);
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Brak uprawnień', 'Potrzebujemy dostępu do aparatu');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({ quality: 0.95 });
    if (!result.canceled) {
      setPendingAssets((prev) => [...prev, ...result.assets]);
    }
  };

  const movePendingAsset = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= pendingAssets.length) return;

    setPendingAssets((prev) => {
      const next = [...prev];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  };

  const removePendingAsset = (index: number) => {
    setPendingAssets((prev) => prev.filter((_, assetIndex) => assetIndex !== index));
  };

  const uploadPendingAssets = async () => {
    if (!projectId || pendingAssets.length === 0) return images;

    const files = [];
    for (let index = 0; index < pendingAssets.length; index++) {
      files.push(await uploadFileFromImagePickerAsset(pendingAssets[index], index));
    }

    const uploaded = await api.uploadImages(projectId, files);
    const nextImages = [...images, ...uploaded];
    setImages(nextImages);
    setPendingAssets([]);
    return nextImages;
  };

  const runAutomaticFlow = async () => {
    if (!projectId) return;
    setProcessing(true);
    try {
      await uploadPendingAssets();
      await api.processOcrBatch(projectId, { markReadyForAudio: true });
      const scenes = await api.generateAudio(projectId);
      await waitForGeneratedAudio(projectId, countExpectedAudioTracks(scenes));
      router.replace(`/(app)/projects/${projectId}/player`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Nie udało się utworzyć audiobooka';
      Alert.alert('Błąd', message);
    } finally {
      setProcessing(false);
    }
  };

  const runAdvancedFlow = async () => {
    if (!projectId) return;
    setProcessing(true);
    try {
      await uploadPendingAssets();
      await api.processOcrBatch(projectId);
      router.push(`/(app)/projects/new/review?projectId=${projectId}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Nie udało się przygotować OCR';
      Alert.alert('Błąd', message);
    } finally {
      setProcessing(false);
    }
  };

  const handleContinue = () => {
    if (!canContinue) {
      Alert.alert('Dodaj zdjęcia', 'Dodaj co najmniej jedno zdjęcie strony');
      return;
    }

    if (mode === 'auto') {
      void runAutomaticFlow();
      return;
    }

    void runAdvancedFlow();
  };

  const renderAdvancedItem = ({ item }: { item: (typeof orderedPreviewItems)[number] }) => {
    if (item.kind === 'uploaded') {
      return (
        <View style={styles.photoCard}>
          <Text style={styles.photoIndex}>{item.image.orderIndex + 1}</Text>
          <PageImagePreview
            imageUrl={item.image.imageUrl}
            thumbnailUrl={item.image.thumbnailUrl}
            style={styles.photoThumb}
          />
          <View style={styles.photoInfo}>
            <Text style={styles.photoName} numberOfLines={1}>
              {item.image.originalFilename || `Strona ${item.image.orderIndex + 1}`}
            </Text>
            <Pressable onPress={() => router.push(`/(app)/projects/${projectId}/text-regions`)}>
              <Text style={styles.inlineAction}>Edytuj obszary</Text>
            </Pressable>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.photoCard}>
        <Text style={styles.photoIndex}>{images.length + item.index + 1}</Text>
        <PageImagePreview imageUrl={item.asset.uri} style={styles.photoThumb} />
        <View style={styles.photoInfo}>
          <Text style={styles.photoName} numberOfLines={1}>
            {item.asset.fileName || `Strona ${item.index + 1}`}
          </Text>
          <Text style={styles.inlineMuted}>Edytuj obszary po wysłaniu</Text>
          <View style={styles.photoActions}>
            <Pressable
              style={[styles.smallButton, item.index === 0 && styles.smallButtonDisabled]}
              onPress={() => movePendingAsset(item.index, -1)}
              disabled={item.index === 0}
            >
              <Text style={styles.smallButtonText}>↑</Text>
            </Pressable>
            <Pressable
              style={[
                styles.smallButton,
                item.index === pendingAssets.length - 1 && styles.smallButtonDisabled,
              ]}
              onPress={() => movePendingAsset(item.index, 1)}
              disabled={item.index === pendingAssets.length - 1}
            >
              <Text style={styles.smallButtonText}>↓</Text>
            </Pressable>
            <Pressable onPress={() => removePendingAsset(item.index)}>
              <Text style={styles.deleteText}>Usuń</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#06d6a0" size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.stepLabel}>Krok 2 z 3</Text>
        <Text style={styles.title}>Dodaj strony książki</Text>
        <Text style={styles.subtitle}>Wybierz zdjęcia z galerii albo zrób je aparatem.</Text>
      </View>

      <View style={styles.addRow}>
        <Pressable style={styles.addButton} onPress={pickFromGallery}>
          <Text style={styles.addButtonText}>Galeria</Text>
        </Pressable>
        {Platform.OS !== 'web' && (
          <Pressable style={styles.addButton} onPress={takePhoto}>
            <Text style={styles.addButtonText}>Aparat</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.modeGrid}>
        <Pressable
          style={[styles.modeCard, mode === 'auto' && styles.modeCardSelected]}
          onPress={() => setMode('auto')}
        >
          <Text style={[styles.modeTitle, mode === 'auto' && styles.modeTitleSelected]}>
            Konfiguracja automatyczna
          </Text>
          <Text style={styles.modeBody}>{countLabel}. OCR i audio wykonają się bez dodatkowych kroków.</Text>
        </Pressable>

        <Pressable
          style={[styles.modeCard, mode === 'advanced' && styles.modeCardSelected]}
          onPress={() => setMode('advanced')}
        >
          <Text style={[styles.modeTitle, mode === 'advanced' && styles.modeTitleSelected]}>
            Konfiguracja zaawansowana
          </Text>
          <Text style={styles.modeBody}>Sprawdź kolejność, usuń strony i przygotuj edycję obszarów.</Text>
        </Pressable>
      </View>

      {mode === 'advanced' && (
        <FlatList
          data={orderedPreviewItems}
          keyExtractor={(item) => item.key}
          renderItem={renderAdvancedItem}
          contentContainerStyle={styles.photoList}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Dodaj zdjęcia, aby zobaczyć listę stron.</Text>
          }
        />
      )}

      {mode === 'auto' && (
        <View style={styles.autoSummary}>
          <Text style={styles.autoTitle}>{countLabel}</Text>
          <Text style={styles.autoBody}>
            Po zatwierdzeniu aplikacja wykona OCR i wygeneruje osobny plik audio dla każdej strony.
          </Text>
        </View>
      )}

      <View style={styles.bottomBar}>
        <Pressable
          testID="wizard-continue"
          style={[styles.continueButton, !canContinue && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={!canContinue}
        >
          {processing ? (
            <ActivityIndicator color="#101320" />
          ) : (
            <Text style={styles.continueButtonText}>
              {!canContinue
                ? 'Najpierw dodaj zdjęcia'
                : mode === 'auto'
                  ? 'Utwórz audiobooka'
                  : 'Dalej do OCR'}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#101320' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#101320' },
  header: { padding: 20, paddingBottom: 10 },
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
  addRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginBottom: 14 },
  addButton: {
    flex: 1,
    backgroundColor: '#18213d',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#29355c',
    paddingVertical: 15,
    alignItems: 'center',
  },
  addButtonText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  modeGrid: { paddingHorizontal: 20, gap: 10 },
  modeCard: {
    backgroundColor: '#151b2f',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#29355c',
    padding: 16,
  },
  modeCardSelected: { backgroundColor: '#073b3a', borderColor: '#06d6a0' },
  modeTitle: { color: '#fff', fontSize: 17, fontWeight: '900', marginBottom: 6 },
  modeTitleSelected: { color: '#06d6a0' },
  modeBody: { color: '#aebbd3', fontSize: 14, lineHeight: 20 },
  autoSummary: {
    margin: 20,
    padding: 18,
    borderRadius: 22,
    backgroundColor: '#151b2f',
    borderWidth: 1,
    borderColor: '#29355c',
  },
  autoTitle: { color: '#fff', fontSize: 22, fontWeight: '900', marginBottom: 8 },
  autoBody: { color: '#c9d6df', fontSize: 15, lineHeight: 22 },
  photoList: { padding: 20, paddingBottom: 110 },
  emptyText: { color: '#8f9bb3', fontSize: 15, lineHeight: 21, textAlign: 'center', marginTop: 22 },
  photoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#151b2f',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#29355c',
    padding: 12,
    marginBottom: 10,
  },
  photoIndex: { color: '#06d6a0', fontSize: 16, fontWeight: '900', width: 28, textAlign: 'center' },
  photoThumb: { width: 58, height: 78, borderRadius: 10, marginHorizontal: 10 },
  photoInfo: { flex: 1 },
  photoName: { color: '#fff', fontSize: 15, fontWeight: '800', marginBottom: 5 },
  inlineAction: { color: '#06d6a0', fontSize: 13, fontWeight: '800' },
  inlineMuted: { color: '#8f9bb3', fontSize: 13, marginBottom: 8 },
  photoActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  smallButton: {
    backgroundColor: '#29355c',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  smallButtonDisabled: { opacity: 0.35 },
  smallButtonText: { color: '#fff', fontSize: 14, fontWeight: '900' },
  deleteText: { color: '#ff8fa3', fontSize: 13, fontWeight: '800', paddingHorizontal: 6 },
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
  continueButton: {
    backgroundColor: '#06d6a0',
    borderRadius: 18,
    paddingVertical: 17,
    alignItems: 'center',
  },
  continueButtonDisabled: { opacity: 0.45 },
  continueButtonText: { color: '#101320', fontSize: 16, fontWeight: '900' },
});
