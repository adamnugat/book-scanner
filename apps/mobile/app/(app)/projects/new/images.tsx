import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../../../../lib/api';
import { uploadFileFromImagePickerAsset } from '../../../../lib/image-upload';
import { PageImagePreview } from '../../../../components/PageImagePreview';
import {
  AudioFlowFooterMenu,
  AudioFlowScreen,
  GlassPanel,
  PickerCard,
  audioFlowFooterMenuHeight,
  audioFlowStyles,
  audioFlowTokens,
} from '../../../../components/audioflow';
import {
  createNormalizedRegion,
  denormalizeRegion,
  type Point,
  type Rect,
  type Size,
} from '../../../../lib/text-region-geometry';
import type {
  AudioTrackResponse,
  PageImageResponse,
  SceneResponse,
  TextRegionInput,
} from '@book-scanner/shared';
import { FadeZoomContent } from '../../../../components/FadeZoomContent';

const t = audioFlowTokens;

const PROCESSING_STEPS: { id: 'uploading' | 'ocr' | 'audio'; label: string }[] = [
  { id: 'uploading', label: 'Wgrywanie zdjęć' },
  { id: 'ocr', label: 'Rozpoznawanie tekstu' },
  { id: 'audio', label: 'Generowanie audio' },
];

type WizardMode = 'auto' | 'advanced';

interface RegionDraft {
  key: string;
  orderIndex: number;
  pageImageId: string;
  pendingUri?: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

type EditingItem =
  | { kind: 'uploaded'; image: PageImageResponse }
  | { kind: 'pending'; asset: ImagePicker.ImagePickerAsset; pendingKey: string };

const EMPTY_LAYOUT: Size = { width: 0, height: 0 };

const AUDIO_READY_POLL_INTERVAL_MS = 1500;
const AUDIO_READY_MAX_ATTEMPTS = 40;
const OCR_READY_POLL_INTERVAL_MS = 1500;
const OCR_READY_MAX_ATTEMPTS = 60;

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

async function waitForOcrCompletion(projectId: string): Promise<void> {
  for (let attempt = 0; attempt < OCR_READY_MAX_ATTEMPTS; attempt++) {
    const scenes = await api.getScenes(projectId);
    const pending = scenes.filter(
      (scene) => scene.status === 'ocr_processing' || scene.status === 'queued',
    );
    if (pending.length === 0) return;

    if (attempt < OCR_READY_MAX_ATTEMPTS - 1) {
      await wait(OCR_READY_POLL_INTERVAL_MS);
    }
  }

  throw new Error('OCR trwa zbyt długo. Wróć do projektu za chwilę i spróbuj ponownie.');
}

function countExpectedAudioTracks(scenes: SceneResponse[]): number {
  return scenes.filter(
    (scene) =>
      scene.status === 'audio_generating' ||
      scene.status === 'audio_done' ||
      scene.status === 'ready_for_audio',
  ).length;
}

const timelineStyles = StyleSheet.create({
  container: { gap: 0, minWidth: 240 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 4 },
  iconWrap: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 18, fontWeight: '700', lineHeight: 28, textAlign: 'center' },
  label: { ...audioFlowStyles.body, flex: 1 },
  connector: {
    width: 1,
    height: 12,
    marginLeft: 13,
    backgroundColor: t.color.surface.glassEdge,
  },
});

function ProcessingTimeline({ currentStep }: { currentStep: 'uploading' | 'ocr' | 'audio' }) {
  const stepOrder = ['uploading', 'ocr', 'audio'] as const;
  const currentIndex = stepOrder.indexOf(currentStep);

  return (
    <View style={timelineStyles.container}>
      {PROCESSING_STEPS.map((step, index) => {
        const isDone = index < currentIndex;
        const isActive = index === currentIndex;
        const isPending = index > currentIndex;
        const stateLabel = isDone
          ? `${step.label} — ukończone`
          : isActive
            ? `${step.label} — w toku`
            : `${step.label} — oczekuje`;

        return (
          <View key={step.id}>
            <View
              style={timelineStyles.row}
              accessible
              accessibilityLabel={stateLabel}
            >
              <View style={timelineStyles.iconWrap}>
                {isDone && (
                  <Text style={[timelineStyles.icon, { color: t.color.accent.pearl }]}>✓</Text>
                )}
                {isActive && (
                  <ActivityIndicator size="small" color={t.color.accent.pearlBright} />
                )}
                {isPending && (
                  <Text style={[timelineStyles.icon, { color: t.color.text.onSurfaceMuted }]}>○</Text>
                )}
              </View>
              <Text
                style={[
                  timelineStyles.label,
                  isPending ? { color: t.color.text.onSurfaceMuted } : { color: t.color.text.onDark },
                ]}
              >
                {step.label}
              </Text>
            </View>
            {index < PROCESSING_STEPS.length - 1 && (
              <View style={timelineStyles.connector} />
            )}
          </View>
        );
      })}
    </View>
  );
}

export default function NewProjectImagesScreen() {
  const insets = useSafeAreaInsets();
  const footerLift = audioFlowFooterMenuHeight(insets.bottom);
  const scrollBottomPad = 24 + footerLift;

  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const [mode, setMode] = useState<WizardMode>('auto');
  const [pendingAssets, setPendingAssets] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [images, setImages] = useState<PageImageResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<'uploading' | 'ocr' | 'audio' | null>(null);
  const [regions, setRegions] = useState<RegionDraft[]>([]);
  const [editingItem, setEditingItem] = useState<EditingItem | null>(null);
  const [editorRegions, setEditorRegions] = useState<RegionDraft[]>([]);
  const [previewLayout, setPreviewLayout] = useState<Size>(EMPTY_LAYOUT);
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [dragRect, setDragRect] = useState<Rect | null>(null);

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

  const moveUploadedImage = async (index: number, direction: -1 | 1) => {
    if (!projectId) return;
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= images.length) return;

    const next = [...images];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    setImages(next);
    try {
      await api.reorderImages(
        projectId,
        next.map((img) => img.id),
      );
    } catch {
      setImages(images);
      Alert.alert('Błąd', 'Nie udało się zmienić kolejności');
    }
  };

  const deleteUploadedImage = async (imageId: string) => {
    if (!projectId) return;
    setImages((prev) => prev.filter((img) => img.id !== imageId));
    setRegions((prev) => prev.filter((r) => r.pageImageId !== imageId));
    try {
      await api.deleteImage(projectId, imageId);
    } catch {
      Alert.alert('Błąd', 'Nie udało się usunąć zdjęcia');
      loadImages();
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
    if (!projectId || pendingAssets.length === 0) {
      return { allImages: images, newlyUploaded: [], originalPending: [] };
    }

    const originalPending = [...pendingAssets];
    const files = [];
    for (let index = 0; index < originalPending.length; index++) {
      files.push(await uploadFileFromImagePickerAsset(originalPending[index], index));
    }

    const newlyUploaded = await api.uploadImages(projectId, files);
    const allImages = [...images, ...newlyUploaded];
    setImages(allImages);
    setPendingAssets([]);
    return { allImages, newlyUploaded, originalPending };
  };

  const remapAndBuildPayload = (
    currentRegions: RegionDraft[],
    originalPending: ImagePicker.ImagePickerAsset[],
    newlyUploaded: PageImageResponse[],
  ): TextRegionInput[] => {
    const remapped = currentRegions.map((r) => {
      if (!r.pendingUri) return r;
      const idx = originalPending.findIndex((a) => a.uri === r.pendingUri);
      if (idx === -1 || idx >= newlyUploaded.length) return null;
      return { ...r, pageImageId: newlyUploaded[idx].id, pendingUri: undefined };
    });

    return remapped
      .filter((r): r is RegionDraft => r !== null && r.pageImageId !== '')
      .map(({ pageImageId, x, y, width, height }, index) => ({
        pageImageId,
        x,
        y,
        width,
        height,
        orderIndex: index,
      }));
  };

  const runAutomaticFlow = async () => {
    if (!projectId) return;
    setProcessing(true);
    setProcessingStep('uploading');
    try {
      const { newlyUploaded, originalPending } = await uploadPendingAssets();
      const payload = remapAndBuildPayload(regions, originalPending, newlyUploaded);
      if (payload.length > 0) {
        await api.saveTextRegions(projectId, payload);
      }
      setProcessingStep('ocr');
      await api.processOcrBatch(projectId, { markReadyForAudio: true });
      await waitForOcrCompletion(projectId);
      setProcessingStep('audio');
      const scenes = await api.generateAudio(projectId);
      await waitForGeneratedAudio(projectId, countExpectedAudioTracks(scenes));
      router.replace(`/(app)/projects/${projectId}/player`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Nie udało się utworzyć audiobooka';
      Alert.alert('Błąd', message);
    } finally {
      setProcessing(false);
      setProcessingStep(null);
    }
  };

  const runAdvancedFlow = async () => {
    if (!projectId) return;
    setProcessing(true);
    setProcessingStep('uploading');
    try {
      const { newlyUploaded, originalPending } = await uploadPendingAssets();
      const payload = remapAndBuildPayload(regions, originalPending, newlyUploaded);
      if (payload.length > 0) {
        await api.saveTextRegions(projectId, payload);
      }
      setProcessingStep('ocr');
      await api.processOcrBatch(projectId, { force: true });
      router.push(`/(app)/projects/new/review?projectId=${projectId}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Nie udało się przygotować OCR';
      Alert.alert('Błąd', message);
    } finally {
      setProcessing(false);
      setProcessingStep(null);
    }
  };

  const openRegionEditor = (item: EditingItem) => {
    setEditingItem(item);
    const matchKey = item.kind === 'uploaded' ? item.image.id : item.pendingKey;
    setEditorRegions(
      regions
        .filter((r) =>
          item.kind === 'uploaded' ? r.pageImageId === matchKey : r.pendingUri === matchKey,
        )
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map((r, index) => ({ ...r, orderIndex: index })),
    );
    setPreviewLayout(EMPTY_LAYOUT);
    setDragStart(null);
    setDragRect(null);
  };

  const closeRegionEditor = () => {
    setEditingItem(null);
    setEditorRegions([]);
    setDragStart(null);
    setDragRect(null);
  };

  const saveRegionEditor = () => {
    if (!editingItem) return;
    setRegions((prev) => {
      const filtered =
        editingItem.kind === 'uploaded'
          ? prev.filter((r) => r.pageImageId !== editingItem.image.id)
          : prev.filter((r) => r.pendingUri !== editingItem.pendingKey);
      return [...filtered, ...editorRegions.map((r, index) => ({ ...r, orderIndex: index }))];
    });
    closeRegionEditor();
  };

  const removeEditorRegion = (key: string) => {
    setEditorRegions((prev) =>
      prev.filter((r) => r.key !== key).map((r, index) => ({ ...r, orderIndex: index })),
    );
  };

  const onPreviewLayout = (event: LayoutChangeEvent) => {
    setPreviewLayout({
      width: event.nativeEvent.layout.width,
      height: event.nativeEvent.layout.height,
    });
  };

  const beginDrag = (event: GestureResponderEvent) => {
    setDragStart({ x: event.nativeEvent.locationX, y: event.nativeEvent.locationY });
    setDragRect(null);
  };

  const updateDrag = (event: GestureResponderEvent) => {
    if (!dragStart || previewLayout.width <= 0 || previewLayout.height <= 0) return;
    const point = { x: event.nativeEvent.locationX, y: event.nativeEvent.locationY };
    const normalized = createNormalizedRegion(dragStart, point, previewLayout, 1);
    setDragRect(normalized ? denormalizeRegion(normalized, previewLayout) : null);
  };

  const finishDrag = (event: GestureResponderEvent) => {
    if (!editingItem || !dragStart) return;
    const point = { x: event.nativeEvent.locationX, y: event.nativeEvent.locationY };
    const normalized = createNormalizedRegion(dragStart, point, previewLayout);
    setDragStart(null);
    setDragRect(null);
    if (!normalized) return;

    const isUploaded = editingItem.kind === 'uploaded';
    const baseKey = isUploaded ? editingItem.image.id : editingItem.pendingKey;

    setEditorRegions((prev) => [
      ...prev,
      {
        key: `${baseKey}-${Date.now()}-${prev.length}`,
        pageImageId: isUploaded ? editingItem.image.id : '',
        pendingUri: isUploaded ? undefined : editingItem.pendingKey,
        ...normalized,
        orderIndex: prev.length,
      },
    ]);
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

  const renderRegionOverlay = (region: RegionDraft, index: number) => {
    const rect = denormalizeRegion(region, previewLayout);
    return (
      <View
        key={region.key}
        style={[
          styles.regionOverlay,
          { left: rect.x, top: rect.y, width: rect.width, height: rect.height },
        ]}
      >
        <Text style={styles.regionNumber}>{index + 1}</Text>
      </View>
    );
  };

  const renderAdvancedItem = ({ item }: { item: (typeof orderedPreviewItems)[number] }) => {
    if (item.kind === 'uploaded') {
      const imageRegions = regions.filter((r) => r.pageImageId === item.image.id);
      const editingInfo: EditingItem = { kind: 'uploaded', image: item.image };
      const uploadedIndex = images.findIndex((img) => img.id === item.image.id);
      const imgName = item.image.originalFilename || `Strona ${item.image.orderIndex + 1}`;
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
              {imgName}
            </Text>
            <View style={styles.photoActions}>
              <Pressable
                accessibilityLabel={`Wybierz obszary OCR dla ${imgName}`}
                accessibilityRole="button"
                style={styles.smallButton}
                onPress={() => openRegionEditor(editingInfo)}
              >
                <Text style={styles.smallButtonText}>⊡</Text>
                {imageRegions.length > 0 && (
                  <Text style={styles.regionBadge}>{imageRegions.length}</Text>
                )}
              </Pressable>
              <Pressable
                accessibilityLabel={`Przenieś ${imgName} wyżej`}
                accessibilityRole="button"
                accessibilityState={{ disabled: uploadedIndex === 0 }}
                style={[styles.smallButton, uploadedIndex === 0 && styles.smallButtonDisabled]}
                onPress={() => moveUploadedImage(uploadedIndex, -1)}
                disabled={uploadedIndex === 0}
              >
                <Text style={styles.smallButtonText}>↑</Text>
              </Pressable>
              <Pressable
                accessibilityLabel={`Przenieś ${imgName} niżej`}
                accessibilityRole="button"
                accessibilityState={{ disabled: uploadedIndex === images.length - 1 }}
                style={[
                  styles.smallButton,
                  uploadedIndex === images.length - 1 && styles.smallButtonDisabled,
                ]}
                onPress={() => moveUploadedImage(uploadedIndex, 1)}
                disabled={uploadedIndex === images.length - 1}
              >
                <Text style={styles.smallButtonText}>↓</Text>
              </Pressable>
              <Pressable
                accessibilityLabel={`Usuń ${imgName}`}
                accessibilityRole="button"
                style={styles.deleteButton}
                onPress={() => deleteUploadedImage(item.image.id)}
              >
                <Text style={styles.deleteText}>✕</Text>
              </Pressable>
            </View>
          </View>
        </View>
      );
    }

    const pendingName = item.asset.fileName || `Strona ${item.index + 1}`;
    const pendingRegions = regions.filter((r) => r.pendingUri === item.asset.uri);
    const editingInfo: EditingItem = {
      kind: 'pending',
      asset: item.asset,
      pendingKey: item.asset.uri,
    };

    return (
      <View style={styles.photoCard}>
        <Text style={styles.photoIndex}>{images.length + item.index + 1}</Text>
        <PageImagePreview imageUrl={item.asset.uri} style={styles.photoThumb} />
        <View style={styles.photoInfo}>
          <Text style={styles.photoName} numberOfLines={1}>
            {pendingName}
          </Text>
          <View style={styles.photoActions}>
            <Pressable
              accessibilityLabel={`Wybierz obszary OCR dla ${pendingName}`}
              accessibilityRole="button"
              style={styles.smallButton}
              onPress={() => openRegionEditor(editingInfo)}
            >
              <Text style={styles.smallButtonText}>⊡</Text>
              {pendingRegions.length > 0 && (
                <Text style={styles.regionBadge}>{pendingRegions.length}</Text>
              )}
            </Pressable>
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
              style={styles.deleteButton}
              onPress={() => removePendingAsset(item.index)}
            >
              <Text style={styles.deleteText}>✕</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <AudioFlowScreen style={styles.centered}>
        <FadeZoomContent>
          <ActivityIndicator color={audioFlowTokens.color.accent.pearl} size="large" />
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
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: scrollBottomPad }]}
      >
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
      </FadeZoomContent>

      <AudioFlowFooterMenu
        active="library"
        bottomInset={insets.bottom}
        createIcon="chevron-right"
        createLabel={processing ? 'Przetwarzanie...' : 'Dalej'}
        createDisabled={!canContinue}
        createTestID="wizard-continue"
        onCreatePress={handleContinue}
        onLibraryPress={() => router.replace('/(app)')}
        playerDisabled
      />

      {processing && processingStep && (
        <View style={styles.processingOverlay}>
          <GlassPanel style={styles.processingCard}>
            <ProcessingTimeline currentStep={processingStep} />
          </GlassPanel>
        </View>
      )}

      <Modal
        visible={Boolean(editingItem)}
        animationType="slide"
        onRequestClose={closeRegionEditor}
      >
        {editingItem && (
          <View style={styles.editorContainer}>
            <Text style={styles.editorTitle}>
              {editingItem.kind === 'uploaded'
                ? `Strona ${editingItem.image.orderIndex + 1} — regiony OCR`
                : `${editingItem.asset.fileName ?? 'Zdjęcie'} — regiony OCR`}
            </Text>
            <Text style={styles.editorHint}>
              Przeciągnij palcem po zdjęciu, aby dodać prostokątny region.
            </Text>

            <View
              style={styles.editorPreview}
              onLayout={onPreviewLayout}
              onStartShouldSetResponder={() => true}
              onMoveShouldSetResponder={() => true}
              onResponderGrant={beginDrag}
              onResponderMove={updateDrag}
              onResponderRelease={finishDrag}
              onResponderTerminate={() => {
                setDragStart(null);
                setDragRect(null);
              }}
            >
              <PageImagePreview
                thumbnailUrl={
                  editingItem.kind === 'uploaded' ? editingItem.image.thumbnailUrl : null
                }
                imageUrl={
                  editingItem.kind === 'uploaded'
                    ? editingItem.image.imageUrl
                    : editingItem.asset.uri
                }
                style={styles.editorImage}
                resizeMode="contain"
              />
              {previewLayout.width > 0 && editorRegions.map(renderRegionOverlay)}
              {dragRect && (
                <View
                  style={[
                    styles.dragOverlay,
                    {
                      left: dragRect.x,
                      top: dragRect.y,
                      width: dragRect.width,
                      height: dragRect.height,
                    },
                  ]}
                />
              )}
            </View>

            <Text style={styles.editorCount}>
              {editorRegions.length === 0
                ? 'Brak regionów — OCR odczyta całą stronę.'
                : `Regiony: ${editorRegions.length}`}
            </Text>

            {editorRegions.map((region, index) => (
              <View key={region.key} style={styles.editorRegionRow}>
                <Text style={styles.editorRegionName}>Region {index + 1}</Text>
                <Pressable
                  style={styles.deleteRegionBtn}
                  onPress={() => removeEditorRegion(region.key)}
                >
                  <Text style={styles.deleteRegionText}>Usuń</Text>
                </Pressable>
              </View>
            ))}

            <View style={styles.editorActions}>
              <Pressable style={styles.cancelEditorBtn} onPress={closeRegionEditor}>
                <Text style={styles.cancelEditorText}>Anuluj</Text>
              </Pressable>
              <Pressable style={styles.saveEditorBtn} onPress={saveRegionEditor}>
                <Text style={styles.saveEditorText}>Zapisz</Text>
              </Pressable>
            </View>
          </View>
        )}
      </Modal>
    </AudioFlowScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20 },
  centered: { alignItems: 'center', justifyContent: 'center' },
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
  deleteButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  deleteText: {
    color: audioFlowTokens.color.accent.danger,
    fontSize: 15,
    fontWeight: '900',
  },
  regionBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: audioFlowTokens.color.accent.pearl,
    borderRadius: 8,
    minWidth: 16,
    paddingHorizontal: 3,
    fontSize: 10,
    fontWeight: '900',
    color: '#101320',
    textAlign: 'center',
    overflow: 'hidden',
  },
  editorContainer: {
    flex: 1,
    backgroundColor: '#101320',
    padding: 16,
    paddingTop: 48,
  },
  editorTitle: { color: '#fff', fontSize: 20, fontWeight: '900', marginBottom: 4 },
  editorHint: { color: '#94a3b8', fontSize: 13, marginBottom: 14 },
  editorPreview: {
    height: 380,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#0f3460',
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 12,
  },
  editorImage: { width: '100%', height: '100%' },
  regionOverlay: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#06d6a0',
    backgroundColor: 'rgba(6, 214, 160, 0.16)',
  },
  regionNumber: {
    minWidth: 24,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#06d6a0',
    color: '#1a1a2e',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  dragOverlay: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#e94560',
    backgroundColor: 'rgba(233, 69, 96, 0.14)',
  },
  editorCount: { color: '#94a3b8', fontSize: 14, marginBottom: 8 },
  editorRegionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#1e2d4a',
  },
  editorRegionName: { color: '#e0e0e0', fontSize: 14 },
  deleteRegionBtn: { paddingVertical: 4, paddingHorizontal: 8 },
  deleteRegionText: { color: '#e94560', fontSize: 13, fontWeight: '600' },
  editorActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 'auto',
    paddingTop: 16,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(19, 19, 22, 0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  processingCard: {
    padding: 32,
    alignItems: 'flex-start',
    minWidth: 260,
  },
  cancelEditorBtn: {
    flex: 1,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  cancelEditorText: { color: '#cbd5e1', fontSize: 15, fontWeight: '600' },
  saveEditorBtn: {
    flex: 2,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    backgroundColor: '#06d6a0',
  },
  saveEditorText: { color: '#1a1a2e', fontSize: 15, fontWeight: '800' },
});
