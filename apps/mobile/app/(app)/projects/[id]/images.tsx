import { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  type GestureResponderHandlers,
} from 'react-native';
import { useLocalSearchParams, useFocusEffect, useNavigation, router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DraggableImageList } from '../../../../components/DraggableImageList';
import { Feather } from '@expo/vector-icons';
import { api } from '../../../../lib/api';
import { uploadFileFromImagePickerAsset } from '../../../../lib/image-upload';
import { useToast } from '../../../../components/Toast';
import { PageImageCard } from '../../../../components/PageImageCard';
import { OcrRegionEditor, type EditorRegion } from '../../../../components/OcrRegionEditor';
import { OcrCorrectionModal } from '../../../../components/OcrCorrectionModal';
import {
  AudioEditingMenu,
  type AudioEditingMenuChanges,
} from '../../../../components/AudioEditingMenu';
import {
  AudioFlowFooterMenu,
  audioFlowTokens,
  GlassPanel,
} from '../../../../components/audioflow';
import { AudioFlowScreenWithHeader } from '../../../../components/audioflow-global-navigation';
import { FadeZoomContent } from '../../../../components/FadeZoomContent';
import type {
  PageImageResponse,
  ProjectResponse,
  SceneResponse,
  AudioTrackResponse,
  InterstitialPresetResponse,
  TextRegionResponse,
  TextRegionInput,
  VoiceResponse,
} from '@book-scanner/shared';

const t = audioFlowTokens;

interface FileProgress {
  name: string;
  status: 'pending' | 'uploading' | 'done' | 'error';
}

type SubmitPhase = 'idle' | 'uploading' | 'ocr' | 'tts' | 'done';

const OCR_DONE_STATUSES = [
  'ocr_done',
  'needs_review',
  'ready_for_audio',
  'audio_generating',
  'audio_done',
];
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function ProjectImagesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const [images, setImages] = useState<PageImageResponse[]>([]);
  const [allRegions, setAllRegions] = useState<TextRegionResponse[]>([]);
  const [scenes, setScenes] = useState<SceneResponse[]>([]);
  const [audioTracks, setAudioTracks] = useState<AudioTrackResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitPhase, setSubmitPhase] = useState<SubmitPhase>('idle');
  const [fileProgress, setFileProgress] = useState<FileProgress[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [pendingAssets, setPendingAssets] = useState<ImagePicker.ImagePickerAsset[]>([]);

  // General settings (default off, reset on focus)
  const [areaSelectionEnabled, setAreaSelectionEnabled] = useState(false);
  const [ocrCorrectionEnabled, setOcrCorrectionEnabled] = useState(false);
  const [correctionPending, setCorrectionPending] = useState(false);
  // Pages were reordered since the last submit — playback/playlist order needs rebuilding.
  const [orderDirty, setOrderDirty] = useState(false);

  // Modal hosts
  const [regionTargetId, setRegionTargetId] = useState<string | null>(null);
  const [correctionImageId, setCorrectionImageId] = useState<string | null>(null);
  const [regionSaving, setRegionSaving] = useState(false);
  const [correctionSaving, setCorrectionSaving] = useState(false);

  // Audio editing menu (voice + interstitial)
  const [project, setProject] = useState<ProjectResponse | null>(null);
  const [voices, setVoices] = useState<VoiceResponse[]>([]);
  const [presets, setPresets] = useState<InterstitialPresetResponse[]>([]);
  const [audioMenuOpen, setAudioMenuOpen] = useState(false);
  const [audioMenuSaving, setAudioMenuSaving] = useState(false);
  const [interstitialDirty, setInterstitialDirty] = useState(false);

  const dropRef = useRef<View>(null);
  const progressResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (progressResetTimer.current) clearTimeout(progressResetTimer.current);
    };
  }, []);

  // Dynamic title: "Dodaj zdjęcia" when empty, "Edytuj zdjęcia" once images exist.
  const hasAny = images.length > 0 || pendingAssets.length > 0;
  useEffect(() => {
    navigation.setOptions({ title: hasAny ? 'Edytuj zdjęcia' : 'Dodaj zdjęcia' });
  }, [navigation, hasAny]);

  const regionCounts: Record<string, number> = {};
  for (const region of allRegions) {
    regionCounts[region.pageImageId] = (regionCounts[region.pageImageId] ?? 0) + 1;
  }
  const sceneByImage: Record<string, SceneResponse> = {};
  for (const scene of scenes) sceneByImage[scene.pageImageId] = scene;
  const audioBySceneId = new Set(audioTracks.map((track) => track.sceneId));

  const imageHasAudio = (imageId: string) => {
    const scene = sceneByImage[imageId];
    return !!scene && (scene.status === 'audio_done' || audioBySceneId.has(scene.id));
  };
  // Submit is meaningful whenever something still needs OCR/TTS — derived from persisted
  // data so it survives leaving and re-entering the screen (not a transient flag).
  const hasProcessableWork =
    pendingAssets.length > 0 || images.some((img) => !imageHasAudio(img.id));

  const loadImages = useCallback(async () => {
    try {
      const [projectData, data, regionData, sceneData, trackData, presetData] = await Promise.all([
        api.getProject(id),
        api.getImages(id),
        api.getTextRegions(id).catch(() => [] as TextRegionResponse[]),
        api.getScenes(id).catch(() => [] as SceneResponse[]),
        api.getAudioTracks(id).catch(() => [] as AudioTrackResponse[]),
        api.getInterstitialPresets().catch(() => [] as InterstitialPresetResponse[]),
      ]);
      setProject(projectData);
      setImages(data);
      setAllRegions(regionData);
      setScenes(sceneData);
      setAudioTracks(trackData);
      setPresets(presetData);
      const voiceData = await api
        .getVoices(projectData.language)
        .catch(() => [] as VoiceResponse[]);
      setVoices(voiceData);
    } catch {
      Alert.alert('Błąd', 'Nie udało się pobrać zdjęć');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      setSubmitPhase('idle');
      setCorrectionPending(false);
      setOrderDirty(false);
      setInterstitialDirty(false);
      loadImages();
    }, [loadImages]),
  );

  const refreshScenes = useCallback(async () => {
    const [sceneData, trackData] = await Promise.all([
      api.getScenes(id).catch(() => [] as SceneResponse[]),
      api.getAudioTracks(id).catch(() => [] as AudioTrackResponse[]),
    ]);
    setScenes(sceneData);
    setAudioTracks(trackData);
    return sceneData;
  }, [id]);

  // Upload immediately so photos land in the editable list (no intermediate preview step).
  const addPhotos = async (assets: ImagePicker.ImagePickerAsset[]) => {
    if (submitPhase !== 'idle' || assets.length === 0) return;
    await uploadAssets(assets);
    setSubmitPhase('idle');
  };

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.9,
    });
    if (!result.canceled) await addPhotos(result.assets);
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Brak uprawnień', 'Potrzebujemy dostępu do aparatu');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.9 });
    if (!result.canceled) await addPhotos(result.assets);
  };

  const uploadAssets = async (assets: ImagePicker.ImagePickerAsset[]) => {
    setFileProgress(
      assets.map((asset, index) => ({
        name: asset.fileName || `page-${Date.now()}-${index}.jpg`,
        status: 'pending',
      })),
    );
    setSubmitPhase('uploading');

    const allNewImages: PageImageResponse[] = [];
    const failedAssets: ImagePicker.ImagePickerAsset[] = [];
    for (let i = 0; i < assets.length; i++) {
      setFileProgress((prev) => prev.map((p, j) => (j === i ? { ...p, status: 'uploading' } : p)));
      try {
        const file = await uploadFileFromImagePickerAsset(assets[i], i);
        const result = await api.uploadImages(id, [file]);
        allNewImages.push(...result);
        setFileProgress((prev) => prev.map((p, j) => (j === i ? { ...p, status: 'done' } : p)));
      } catch {
        failedAssets.push(assets[i]);
        setFileProgress((prev) => prev.map((p, j) => (j === i ? { ...p, status: 'error' } : p)));
      }
    }

    setImages((prev) => [...prev, ...allNewImages]);
    setPendingAssets(failedAssets);

    const errCount = allNewImages.length < assets.length ? assets.length - allNewImages.length : 0;
    if (errCount > 0) {
      showToast(`Przesłano ${allNewImages.length}/${assets.length} plików`, 'error');
    } else {
      showToast(`Przesłano ${allNewImages.length} plików`);
    }

    if (progressResetTimer.current) clearTimeout(progressResetTimer.current);
    progressResetTimer.current = setTimeout(() => setFileProgress([]), 2000);

    return { uploaded: allNewImages, failed: failedAssets };
  };

  // --- Submit orchestration: OCR -> (optional correction stop) -> TTS -> playlist -> details
  const waitForPhase = async (
    isComplete: (s: SceneResponse[]) => boolean,
    timeoutMsg: string,
  ): Promise<SceneResponse[]> => {
    for (let attempt = 0; attempt < 40; attempt++) {
      const current = await refreshScenes();
      if (current.length > 0 && isComplete(current)) return current;
      await delay(1500);
    }
    throw new Error(timeoutMsg);
  };

  const handleSubmit = async () => {
    if (submitPhase !== 'idle') return;
    try {
      // Interstitial-only path: just rebuild playlist (no OCR/TTS work pending).
      if (interstitialDirty && !hasProcessableWork && !orderDirty) {
        await api.buildPlaylist(id);
        setInterstitialDirty(false);
        showToast('Wstawka zaktualizowana');
        return;
      }

      if (pendingAssets.length > 0) {
        const { failed } = await uploadAssets(pendingAssets);
        if (failed.length > 0) throw new Error(`Nie udało się wysłać ${failed.length} plików`);
      }

      // OCR: idempotent — only un-processed scenes run. markReadyForAudio unless correction stops us.
      setSubmitPhase('ocr');
      await api.processOcrBatch(id, { markReadyForAudio: !ocrCorrectionEnabled });
      let current = await waitForPhase(
        (s) => s.every((sc) => !['queued', 'ocr_processing'].includes(sc.status)),
        'Przekroczono czas rozpoznawania tekstu (OCR)',
      );

      // Stop after OCR for manual correction only when there is freshly recognised text to correct.
      const needsCorrection = current.some((sc) => sc.status === 'ocr_done');
      if (ocrCorrectionEnabled && !correctionPending && needsCorrection) {
        setSubmitPhase('idle');
        setCorrectionPending(true);
        showToast('Tekst rozpoznany — popraw OCR przy zdjęciach, a następnie wyślij ponownie');
        return;
      }

      // Queue any OCR-done scenes for audio (covers uncorrected scenes on resume).
      await Promise.all(
        current
          .filter((sc) => sc.status === 'ocr_done' || sc.status === 'needs_review')
          .map((sc) => api.updateScene(id, sc.id, { status: 'ready_for_audio' })),
      );
      current = await refreshScenes();

      // TTS only when something actually needs synthesis (skip on reorder-only submits).
      if (current.some((sc) => sc.status === 'ready_for_audio')) {
        setSubmitPhase('tts');
        await api.generateAudio(id);
        await waitForPhase(
          (s) => s.every((sc) => sc.status !== 'audio_generating'),
          'Przekroczono czas generowania audio (TTS)',
        );
      }

      // Always rebuild the playlist so playback order matches the current page order.
      await api.buildPlaylist(id).catch(() => undefined);

      setSubmitPhase('done');
      setCorrectionPending(false);
      setOrderDirty(false);
      setInterstitialDirty(false);
      showToast('Wszystkie zdjęcia zostały przetworzone');
      await delay(600);
      setSubmitPhase('idle');
      router.replace({ pathname: '/(app)/projects/[id]', params: { id } });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Nie udało się dokończyć przetwarzania';
      setSubmitPhase('idle');
      Alert.alert('Błąd', message);
    }
  };

  const handleWebDrop = (e: { preventDefault: () => void; dataTransfer?: { files: FileList } }) => {
    e.preventDefault();
    setIsDragOver(false);
    const dt = e.dataTransfer;
    if (!dt?.files?.length) return;
    const assets: ImagePicker.ImagePickerAsset[] = Array.from(dt.files).map((f) => ({
      uri: URL.createObjectURL(f),
      fileName: f.name,
      mimeType: f.type,
      width: 0,
      height: 0,
      type: 'image' as const,
      assetId: null,
      base64: null,
      duration: null,
      exif: null,
      fileSize: f.size,
    }));
    void addPhotos(assets);
  };

  const handleDelete = (imageId: string) => {
    const image = images.find((i) => i.id === imageId);
    if (!image) return;
    Alert.alert('Usuń zdjęcie', `Usunąć stronę ${image.orderIndex + 1}?`, [
      { text: 'Anuluj', style: 'cancel' },
      {
        text: 'Usuń',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteImage(id, image.id);
            setImages((prev) => prev.filter((i) => i.id !== image.id));
          } catch {
            Alert.alert('Błąd', 'Nie udało się usunąć zdjęcia');
          }
        },
      },
    ]);
  };

  const persistOrder = async (ordered: PageImageResponse[]) => {
    const previous = images;
    setImages(ordered);
    try {
      await api.reorderImages(
        id,
        ordered.map((i) => i.id),
      );
      // Order persisted on the backend; playlist still needs rebuilding via submit.
      setOrderDirty(true);
      await refreshScenes();
    } catch {
      setImages(previous);
    }
  };

  // --- Region editor modal
  const openRegionEditor = (imageId: string) => setRegionTargetId(imageId);
  const closeRegionEditor = () => setRegionTargetId(null);

  const regionTargetImage = images.find((i) => i.id === regionTargetId) ?? null;
  const regionInitial: EditorRegion[] = allRegions
    .filter((r) => r.pageImageId === regionTargetId)
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((r, index) => ({
      key: r.id,
      orderIndex: index,
      x: r.x,
      y: r.y,
      width: r.width,
      height: r.height,
    }));

  const handleSaveRegions = async (editorRegions: EditorRegion[]) => {
    if (!regionTargetId) return;
    setRegionSaving(true);
    try {
      const otherPages: TextRegionInput[] = allRegions
        .filter((r) => r.pageImageId !== regionTargetId)
        .map(({ pageImageId, x, y, width, height, orderIndex }) => ({
          pageImageId,
          x,
          y,
          width,
          height,
          orderIndex,
        }));
      const thisPage: TextRegionInput[] = editorRegions.map((r, index) => ({
        pageImageId: regionTargetId,
        x: r.x,
        y: r.y,
        width: r.width,
        height: r.height,
        orderIndex: index,
      }));
      await api.saveTextRegions(id, [...otherPages, ...thisPage]);
      // Changing OCR regions invalidates any existing OCR/TTS for this page — reset its scene
      // (drops audio, clears text, re-queues) so it gets reprocessed on the next submit.
      const scene = sceneByImage[regionTargetId];
      if (scene) await api.resetScene(id, scene.id).catch(() => undefined);
      const refreshed = await api.getTextRegions(id).catch(() => [] as TextRegionResponse[]);
      setAllRegions(refreshed);
      await refreshScenes();
      closeRegionEditor();
    } catch (e: unknown) {
      Alert.alert('Błąd', e instanceof Error ? e.message : 'Nie udało się zapisać regionów.');
    } finally {
      setRegionSaving(false);
    }
  };

  // --- OCR correction modal
  const openCorrection = (imageId: string) => setCorrectionImageId(imageId);
  const closeCorrection = () => setCorrectionImageId(null);

  const correctionImage = images.find((i) => i.id === correctionImageId) ?? null;
  const correctionScene = correctionImageId ? sceneByImage[correctionImageId] : undefined;
  const correctionText = correctionScene?.editedText ?? correctionScene?.ocrText ?? '';

  // --- Audio editing menu
  const openAudioMenu = () => setAudioMenuOpen(true);
  const closeAudioMenu = () => {
    if (audioMenuSaving) return;
    setAudioMenuOpen(false);
  };

  const handleSaveAudioMenu = async (changes: AudioEditingMenuChanges) => {
    const hasVoiceChange = changes.voiceId !== undefined;
    const hasPresetChange = changes.interstitialPreset !== undefined;
    if (!hasVoiceChange && !hasPresetChange) {
      setAudioMenuOpen(false);
      return;
    }
    setAudioMenuSaving(true);
    try {
      const updated = await api.updateProject(id, changes);
      setProject(updated);
      if (hasVoiceChange) {
        // Server dropped audio + reset scenes — refresh local lists.
        await loadImages();
      }
      if (hasPresetChange) {
        setInterstitialDirty(true);
      }
      setAudioMenuOpen(false);
      showToast('Zapisano ustawienia audio');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Nie udało się zapisać ustawień audio';
      Alert.alert('Błąd', message);
    } finally {
      setAudioMenuSaving(false);
    }
  };

  const handleSaveCorrection = async (text: string) => {
    if (!correctionScene) return;
    setCorrectionSaving(true);
    try {
      await api.updateScene(id, correctionScene.id, {
        editedText: text || null,
        status: 'ready_for_audio',
      });
      await refreshScenes();
      showToast('Korekta zapisana');
      closeCorrection();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Nie udało się zapisać korekty', 'error');
    } finally {
      setCorrectionSaving(false);
    }
  };

  const renderCard = (
    item: PageImageResponse,
    index: number,
    dragHandleProps?: GestureResponderHandlers,
    dragActive?: boolean,
  ) => {
    const displayName = item.originalFilename || `Strona ${index + 1}`;
    const scene = sceneByImage[item.id];
    const ocrDone = !!scene && OCR_DONE_STATUSES.includes(scene.status);
    const hasAudio = !!scene && (scene.status === 'audio_done' || audioBySceneId.has(scene.id));
    return (
      <PageImageCard
        imageId={item.id}
        imageUrl={item.imageUrl}
        thumbnailUrl={item.thumbnailUrl}
        displayName={displayName}
        pageNumber={index + 1}
        regionCount={regionCounts[item.id] ?? 0}
        areaSelectionEnabled={areaSelectionEnabled}
        ocrCorrectionEnabled={ocrCorrectionEnabled}
        ocrDone={ocrDone}
        hasAudio={hasAudio}
        onSelectRegions={openRegionEditor}
        onCorrectOcr={openCorrection}
        onDelete={handleDelete}
        dragHandleProps={dragHandleProps}
        dragActive={dragActive}
        testID={`page-card-${item.id}`}
      />
    );
  };

  if (loading) {
    return (
      <AudioFlowScreenWithHeader title="Zdjęcia">
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={t.color.accent.pearl} />
        </View>
      </AudioFlowScreenWithHeader>
    );
  }

  const dropZoneProps =
    Platform.OS === 'web'
      ? {
          onDragOver: (e: { preventDefault: () => void }) => {
            e.preventDefault();
            setIsDragOver(true);
          },
          onDragLeave: () => setIsDragOver(false),
          onDrop: handleWebDrop,
        }
      : {};

  const settingsBar = images.length > 0 && (
    <View style={styles.settingsBar}>
      <Text style={styles.counter}>Zdjęć {images.length}</Text>
      <View style={styles.toggles}>
        <Pressable
          accessibilityRole="switch"
          accessibilityState={{ checked: areaSelectionEnabled }}
          accessibilityLabel="Wybór obszarów"
          onPress={() => setAreaSelectionEnabled((v) => !v)}
          style={[styles.toggle, areaSelectionEnabled && styles.toggleOn]}
        >
          <Feather name="crop" size={14} color={t.color.text.onDark} />
          <Text style={styles.toggleText}>Obszary</Text>
        </Pressable>
        <Pressable
          accessibilityRole="switch"
          accessibilityState={{ checked: ocrCorrectionEnabled }}
          accessibilityLabel="Korekta OCR"
          onPress={() => setOcrCorrectionEnabled((v) => !v)}
          style={[styles.toggle, ocrCorrectionEnabled && styles.toggleOn]}
        >
          <Feather name="edit-3" size={14} color={t.color.text.onDark} />
          <Text style={styles.toggleText}>Korekta OCR</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Edycja audio"
          onPress={openAudioMenu}
          style={styles.toggle}
          testID="audio-menu-open"
        >
          <Feather name="mic" size={14} color={t.color.text.onDark} />
          <Text style={styles.toggleText}>Audio</Text>
          {interstitialDirty ? <View style={styles.toggleDot} /> : null}
        </Pressable>
      </View>
    </View>
  );

  return (
    <AudioFlowScreenWithHeader title="Zdjęcia">
      <FadeZoomContent>
        <View style={styles.container} ref={dropRef} {...dropZoneProps}>
          {isDragOver && (
            <View style={styles.dropOverlay}>
              <Text style={styles.dropOverlayText}>Upuść pliki tutaj</Text>
            </View>
          )}

          {settingsBar}

          {images.length === 0 && pendingAssets.length === 0 ? (
            <View style={styles.emptyContainer}>
              <GlassPanel style={styles.emptyCard}>
                <View style={styles.emptyIconCircle}>
                  <Feather name="book-open" size={34} color={t.color.accent.pearl} />
                </View>
                <Text style={styles.emptyTitle}>Zacznij od zdjęć stron</Text>
                <Text style={styles.emptyBody}>
                  {Platform.OS === 'web'
                    ? 'Przeciągnij pliki tutaj lub użyj przycisku „Galeria" na dole ekranu.'
                    : 'Dodaj zdjęcia stron książki — pojawią się tu jako lista, którą ułożysz w kolejności.'}
                </Text>
                <View style={styles.emptyHints}>
                  <View style={styles.emptyHint}>
                    <Feather name="image" size={16} color={t.color.text.onDark} />
                    <Text style={styles.emptyHintText}>Galeria — wybierz z telefonu</Text>
                  </View>
                  {Platform.OS !== 'web' && (
                    <View style={styles.emptyHint}>
                      <Feather name="camera" size={16} color={t.color.text.onDark} />
                      <Text style={styles.emptyHintText}>Aparat — zrób zdjęcie strony</Text>
                    </View>
                  )}
                </View>
              </GlassPanel>
            </View>
          ) : images.length === 0 ? (
            <View style={styles.emptyContainer} />
          ) : Platform.OS === 'web' ? (
            <FlatList
              data={images}
              keyExtractor={(item) => item.id}
              renderItem={({ item, index }) => renderCard(item, index)}
              contentContainerStyle={styles.list}
            />
          ) : (
            <DraggableImageList
              data={images}
              keyExtractor={(item) => item.id}
              onReorder={(from, to) => {
                const next = images.slice();
                const [moved] = next.splice(from, 1);
                next.splice(to, 0, moved);
                persistOrder(next);
              }}
              renderRow={(item, index, dragHandleProps, dragActive) =>
                renderCard(item, index, dragHandleProps, dragActive)
              }
              contentContainerStyle={styles.list}
            />
          )}

          {submitPhase !== 'idle' && (
            <View style={styles.uploadOverlay}>
              {submitPhase === 'uploading' && fileProgress.length > 0 ? (
                <GlassPanel style={styles.progressList}>
                  <Text style={styles.uploadTitle}>Wysyłanie zdjęć…</Text>
                  {fileProgress.map((fp, i) => (
                    <View key={i} style={styles.progressItem}>
                      <Text style={styles.progressName} numberOfLines={1}>
                        {fp.name}
                      </Text>
                      <Text
                        style={[
                          styles.progressStatus,
                          {
                            color:
                              fp.status === 'done'
                                ? t.color.accent.softGreen
                                : fp.status === 'error'
                                  ? t.color.accent.danger
                                  : fp.status === 'uploading'
                                    ? t.color.accent.pearl
                                    : t.color.text.onSurfaceMuted,
                          },
                        ]}
                      >
                        {fp.status === 'done'
                          ? '✓'
                          : fp.status === 'error'
                            ? '✗'
                            : fp.status === 'uploading'
                              ? '↑'
                              : '•'}
                      </Text>
                    </View>
                  ))}
                </GlassPanel>
              ) : (
                <>
                  <ActivityIndicator size="large" color={t.color.accent.pearl} />
                  <Text style={styles.uploadText}>
                    {submitPhase === 'ocr'
                      ? 'Rozpoznawanie tekstu (OCR)…'
                      : submitPhase === 'tts'
                        ? 'Generowanie audio (TTS)…'
                        : submitPhase === 'done'
                          ? 'Wszystkie zdjęcia zostały przetworzone'
                          : 'Wysyłanie zdjęć…'}
                  </Text>
                </>
              )}
            </View>
          )}
        </View>
      </FadeZoomContent>

      {/* OCR region selection modal */}
      <Modal visible={!!regionTargetImage} animationType="slide" onRequestClose={closeRegionEditor}>
        {regionTargetImage ? (
          <OcrRegionEditor
            key={regionTargetImage.id}
            target={{
              kind: 'uploaded',
              id: regionTargetImage.id,
              imageUrl: regionTargetImage.imageUrl,
              thumbnailUrl: regionTargetImage.thumbnailUrl,
            }}
            initialRegions={regionInitial}
            pageLabel={`Strona ${regionTargetImage.orderIndex + 1}`}
            onCancel={closeRegionEditor}
            onSave={handleSaveRegions}
            saving={regionSaving}
          />
        ) : null}
      </Modal>

      {/* OCR text correction modal */}
      <OcrCorrectionModal
        visible={!!correctionImage}
        pageLabel={
          correctionImage
            ? correctionImage.originalFilename || `Strona ${correctionImage.orderIndex + 1}`
            : ''
        }
        imageUrl={correctionImage?.imageUrl}
        thumbnailUrl={correctionImage?.thumbnailUrl}
        initialText={correctionText}
        saving={correctionSaving}
        onClose={closeCorrection}
        onSave={handleSaveCorrection}
      />

      <AudioEditingMenu
        visible={audioMenuOpen}
        voices={voices}
        presets={presets}
        initialVoiceId={project?.voiceId ?? null}
        initialInterstitialPreset={project?.interstitialPreset ?? null}
        saving={audioMenuSaving}
        onCancel={closeAudioMenu}
        onSave={handleSaveAudioMenu}
      />

      <AudioFlowFooterMenu
        bottomInset={insets.bottom}
        leftIcon="image"
        leftLabel="Galeria"
        onLibraryPress={pickFromGallery}
        createIcon="check"
        createLabel="Wyślij i przetwórz"
        createDisabled={
          submitPhase !== 'idle' || (!hasProcessableWork && !orderDirty && !interstitialDirty)
        }
        onCreatePress={handleSubmit}
        rightIcon="camera"
        rightLabel="Aparat"
        rightDisabled={Platform.OS === 'web'}
        onPlayerPress={takePhoto}
      />
    </AudioFlowScreenWithHeader>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: t.spacing.gutterMobile, paddingBottom: 100 },
  settingsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: t.spacing.gutterMobile,
    paddingVertical: t.spacing.stackSm,
    gap: t.spacing.stackSm,
  },
  counter: {
    color: t.color.text.onDark,
    fontSize: 15,
    fontFamily: 'Quicksand_600SemiBold',
  },
  toggles: { flexDirection: 'row', gap: t.spacing.stackSm },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: t.color.surface.glassEdge,
    backgroundColor: t.color.surface.glassLight,
  },
  toggleOn: {
    borderColor: t.color.accent.pearl,
    backgroundColor: t.color.surface.glassHover,
  },
  toggleText: {
    color: t.color.text.onDark,
    fontSize: 12,
    fontFamily: 'VarelaRound_400Regular',
  },
  toggleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: t.color.accent.pearl,
    marginLeft: 2,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: t.spacing.gutterMobile,
  },
  emptyCard: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    padding: 24,
    borderRadius: t.radius.card,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: t.color.surface.glassLight,
    borderWidth: 1,
    borderColor: t.color.surface.glassEdge,
    marginBottom: 16,
  },
  emptyTitle: {
    color: t.color.text.onDark,
    fontSize: 18,
    fontFamily: 'Quicksand_700Bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyBody: {
    color: t.color.text.onSurfaceMuted,
    fontSize: 14,
    fontFamily: 'VarelaRound_400Regular',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 18,
  },
  emptyHints: { gap: 10, alignSelf: 'stretch' },
  emptyHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: t.color.surface.glassEdge,
    backgroundColor: t.color.surface.glassLight,
  },
  emptyHintText: {
    color: t.color.text.onDark,
    fontSize: 13,
    fontFamily: 'VarelaRound_400Regular',
  },
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadText: {
    color: t.color.text.onDark,
    marginTop: 12,
    fontSize: 16,
    fontFamily: 'VarelaRound_400Regular',
  },
  uploadTitle: {
    color: t.color.text.onDark,
    fontSize: 16,
    fontFamily: 'Quicksand_600SemiBold',
    marginBottom: 12,
  },
  progressList: {
    borderRadius: t.radius.card,
    padding: t.spacing.gutterMobile,
    width: '80%',
    maxWidth: 400,
  },
  progressItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  progressName: {
    color: t.color.text.onDark,
    fontSize: 13,
    fontFamily: 'VarelaRound_400Regular',
    flex: 1,
    marginRight: 8,
  },
  progressStatus: { fontSize: 16, fontWeight: 'bold' },
  dropOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: t.color.accent.pearlTint,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    borderWidth: 3,
    borderColor: t.color.accent.pearlBorder,
    borderStyle: 'dashed',
    borderRadius: t.radius.card,
    margin: 8,
  },
  dropOverlayText: {
    color: t.color.accent.pearl,
    fontSize: 20,
    fontFamily: 'Quicksand_700Bold',
  },
});
