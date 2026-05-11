import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../../../../lib/api';
import { uploadFileFromImagePickerAsset } from '../../../../lib/image-upload';
import { PageImagePreview } from '../../../../components/PageImagePreview';
import {
  AudioFlowScreen,
  GlassPanel,
  PearlButton,
  PickerCard,
  TopAppBar,
  audioFlowStyles,
  audioFlowTokens,
} from '../../../../components/audioflow';
import type { AudioTrackResponse, PageImageResponse, SceneResponse } from '@book-scanner/shared';

type WizardMode = 'auto' | 'advanced';
const AUDIO_READY_POLL_INTERVAL_MS = 1500;
const AUDIO_READY_MAX_ATTEMPTS = 40;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForGeneratedAudio(
  projectId: string,
  expectedTrackCount: number,
): Promise<AudioTrackResponse[]> {
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
  return scenes.filter(
    (scene) =>
      scene.status === 'audio_generating' ||
      scene.status === 'audio_done' ||
      scene.status === 'ready_for_audio',
  ).length;
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

    const pendingName = item.asset.fileName || `Strona ${item.index + 1}`;

    return (
      <View style={styles.photoCard}>
        <Text style={styles.photoIndex}>{images.length + item.index + 1}</Text>
        <PageImagePreview imageUrl={item.asset.uri} style={styles.photoThumb} />
        <View style={styles.photoInfo}>
          <Text style={styles.photoName} numberOfLines={1}>
            {pendingName}
          </Text>
          <Text style={styles.inlineMuted}>Edytuj obszary po wysłaniu</Text>
          <View style={styles.photoActions}>
            <Pressable
              accessibilityLabel={`Przenieś ${pendingName} wyżej`}
              accessibilityRole="button"
              accessibilityState={{ disabled: item.index === 0 }}
              style={[styles.smallButton, item.index === 0 && styles.smallButtonDisabled]}
              onPress={() => movePendingAsset(item.index, -1)}
              disabled={item.index === 0}
            >
              <Text style={styles.smallButtonText}>↑</Text>
            </Pressable>
            <Pressable
              accessibilityLabel={`Przenieś ${pendingName} niżej`}
              accessibilityRole="button"
              accessibilityState={{ disabled: item.index === pendingAssets.length - 1 }}
              style={[
                styles.smallButton,
                item.index === pendingAssets.length - 1 && styles.smallButtonDisabled,
              ]}
              onPress={() => movePendingAsset(item.index, 1)}
              disabled={item.index === pendingAssets.length - 1}
            >
              <Text style={styles.smallButtonText}>↓</Text>
            </Pressable>
            <Pressable
              accessibilityLabel={`Usuń ${pendingName}`}
              accessibilityRole="button"
              onPress={() => removePendingAsset(item.index)}
            >
              <Text style={styles.deleteText}>Usuń</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <AudioFlowScreen style={styles.centered}>
        <ActivityIndicator color={audioFlowTokens.color.accent.pearl} size="large" />
      </AudioFlowScreen>
    );
  }

  return (
    <AudioFlowScreen>
      <TopAppBar
        title="Zdjęcia stron"
        left={
          <Pressable
            style={styles.iconButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Wróć"
          >
            <Text style={styles.iconButtonText}>‹</Text>
          </Pressable>
        }
        right={<View style={styles.iconButtonPlaceholder} />}
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.stepLabel}>Krok 2 z 3</Text>
          <Text style={styles.title}>Dodaj zdjęcia stron książki</Text>
          <Text style={styles.subtitle}>
            Wybierz strony z galerii albo zeskanuj je aparatem. Kolejność zdjęć odpowiada kolejności
            rozdziałów.
          </Text>
        </View>

        <View style={styles.sourceSection}>
          <Text style={styles.sourceLabel}>Źródło zdjęć</Text>
          <View style={styles.addRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Galeria"
              style={styles.addButton}
              onPress={pickFromGallery}
            >
              <View style={styles.sourceIcon}>
                <Text style={styles.sourceIconText}>▧</Text>
              </View>
              <Text style={styles.addButtonText}>Galeria</Text>
              <Text style={styles.addButtonSubtext}>Wybierz z urządzenia</Text>
            </Pressable>
            {Platform.OS !== 'web' && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Aparat"
                style={styles.addButton}
                onPress={takePhoto}
              >
                <View style={styles.sourceIcon}>
                  <Text style={styles.sourceIconText}>◉</Text>
                </View>
                <Text style={styles.addButtonText}>Aparat</Text>
                <Text style={styles.addButtonSubtext}>Zrób zdjęcie strony</Text>
              </Pressable>
            )}
          </View>
        </View>

        {imageCount === 0 ? (
          <GlassPanel style={styles.emptyHint}>
            <Text style={styles.emptyHintIcon}>i</Text>
            <Text style={styles.emptyHintText}>
              Dodaj co najmniej 1 zdjęcie, aby przejść dalej.
            </Text>
          </GlassPanel>
        ) : null}

        <View style={styles.modeGrid}>
          <View style={styles.modeHeader}>
            <Text style={styles.sourceLabel}>Tryb kreatora</Text>
            <Text style={styles.modeMeta}>Dotyczy całego projektu</Text>
          </View>
          <PickerCard
            selected={mode === 'auto'}
            title="Kreator automatyczny"
            body={`${countLabel}. AudioFlow przygotuje OCR i narrację bez dodatkowych kroków.`}
            meta="Domyślne"
            onPress={() => setMode('auto')}
          />

          {mode === 'auto' && (
            <View style={styles.autoSummary}>
              <Text style={styles.autoTitle}>{countLabel}</Text>
              <Text style={styles.autoBody}>
                Wykryjemy strony, odczytamy tekst i wygenerujemy osobny plik audio dla każdej z
                nich.
              </Text>
            </View>
          )}

          <PickerCard
            selected={mode === 'advanced'}
            title="Kreator zaawansowany"
            body="Ręcznie sprawdzisz kolejność, usuniesz strony i przygotujesz edycję obszarów."
            onPress={() => setMode('advanced')}
          />
        </View>

        {mode === 'advanced' && (
          <View style={styles.photoList}>
            {orderedPreviewItems.length === 0 ? (
              <Text style={styles.emptyText}>Dodaj zdjęcia, aby zobaczyć listę stron.</Text>
            ) : (
              orderedPreviewItems.map((item) => (
                <View key={item.key}>{renderAdvancedItem({ item })}</View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      <GlassPanel style={styles.bottomBar}>
        <PearlButton
          label={processing ? 'Przetwarzanie...' : 'Dalej'}
          testID="wizard-continue"
          onPress={handleContinue}
          disabled={!canContinue}
        />
      </GlassPanel>
    </AudioFlowScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 116 },
  centered: { alignItems: 'center', justifyContent: 'center' },
  iconButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderColor: audioFlowTokens.color.surface.glassEdge,
    borderRadius: audioFlowTokens.radius.full,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  iconButtonPlaceholder: { width: 40 },
  iconButtonText: { color: audioFlowTokens.color.text.onDark, fontSize: 30, lineHeight: 32 },
  header: { paddingBottom: 24, paddingTop: 8 },
  stepLabel: {
    ...audioFlowStyles.eyebrow,
    marginBottom: 8,
  },
  title: audioFlowStyles.headlineLg,
  subtitle: { ...audioFlowStyles.body, marginTop: 8 },
  sourceSection: { gap: 8, marginBottom: 16 },
  sourceLabel: {
    ...audioFlowTokens.typography.labelMd,
    color: audioFlowTokens.color.text.onDark,
    paddingLeft: 4,
  },
  addRow: { flexDirection: 'row', gap: 10 },
  addButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: audioFlowTokens.color.surface.field,
    borderColor: audioFlowTokens.color.accent.pearlBorder,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
    justifyContent: 'center',
    minHeight: 126,
    paddingHorizontal: 14,
    paddingVertical: 20,
  },
  sourceIcon: {
    alignItems: 'center',
    backgroundColor: audioFlowTokens.color.accent.pearlTint,
    borderColor: audioFlowTokens.color.surface.glassEdge,
    borderRadius: 14,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  sourceIconText: { color: audioFlowTokens.color.accent.pearl, fontSize: 22, fontWeight: '700' },
  addButtonText: { color: audioFlowTokens.color.text.onDark, fontSize: 15, fontWeight: '800' },
  addButtonSubtext: {
    color: audioFlowTokens.color.text.onSurfaceSubtle,
    fontSize: 12,
    textAlign: 'center',
  },
  emptyHint: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
    padding: 16,
  },
  emptyHintIcon: {
    color: audioFlowTokens.color.accent.pearl,
    fontSize: 18,
    fontWeight: '900',
  },
  emptyHintText: { color: audioFlowTokens.color.text.onSurfaceSubtle, flex: 1, fontSize: 13 },
  modeGrid: { gap: 10, marginBottom: 16 },
  modeHeader: {
    alignItems: 'baseline',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modeMeta: { color: audioFlowTokens.color.text.onSurfaceSubtle, fontSize: 12 },
  autoSummary: {
    paddingHorizontal: 4,
    paddingVertical: 12,
  },
  autoTitle: { ...audioFlowStyles.headlineMd, marginBottom: 8 },
  autoBody: { ...audioFlowStyles.body },
  photoList: { paddingTop: 6 },
  emptyText: {
    color: audioFlowTokens.color.text.onSurfaceSubtle,
    fontSize: 15,
    lineHeight: 21,
    marginTop: 22,
    textAlign: 'center',
  },
  photoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: audioFlowTokens.color.surface.glass,
    borderRadius: audioFlowTokens.radius.card,
    borderWidth: 1,
    borderColor: audioFlowTokens.color.surface.glassEdge,
    padding: 12,
    marginBottom: 10,
  },
  photoIndex: {
    color: audioFlowTokens.color.accent.pearl,
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
    width: 28,
  },
  photoThumb: { width: 58, height: 78, borderRadius: 10, marginHorizontal: 10 },
  photoInfo: { flex: 1 },
  photoName: {
    color: audioFlowTokens.color.text.onDark,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 5,
  },
  inlineAction: { color: audioFlowTokens.color.accent.pearl, fontSize: 13, fontWeight: '800' },
  inlineMuted: { color: audioFlowTokens.color.text.onSurfaceSubtle, fontSize: 13, marginBottom: 8 },
  photoActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  smallButton: {
    backgroundColor: audioFlowTokens.color.surface.glassLight,
    borderColor: audioFlowTokens.color.surface.glassEdge,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  smallButtonDisabled: { opacity: 0.35 },
  smallButtonText: { color: audioFlowTokens.color.text.onDark, fontSize: 14, fontWeight: '900' },
  deleteText: {
    color: audioFlowTokens.color.accent.danger,
    fontSize: 13,
    fontWeight: '800',
    paddingHorizontal: 6,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderTopLeftRadius: audioFlowTokens.radius.panel,
    borderTopRightRadius: audioFlowTokens.radius.panel,
  },
});
