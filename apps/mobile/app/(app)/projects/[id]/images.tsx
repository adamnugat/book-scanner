import { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useFocusEffect, router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../../../lib/api';
import { uploadFileFromImagePickerAsset } from '../../../../lib/image-upload';
import { useToast } from '../../../../components/Toast';
import { PageImagePreview } from '../../../../components/PageImagePreview';
import {
  AudioFlowScreen,
  AudioFlowFooterMenu,
  audioFlowTokens,
  GlassPanel,
  PearlButton,
  GhostButton,
} from '../../../../components/audioflow';
import { FadeZoomContent } from '../../../../components/FadeZoomContent';
import type { PageImageResponse } from '@book-scanner/shared';

const t = audioFlowTokens;

interface FileProgress {
  name: string;
  status: 'pending' | 'uploading' | 'done' | 'error';
}

export default function ProjectImagesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const [images, setImages] = useState<PageImageResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [fileProgress, setFileProgress] = useState<FileProgress[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [pendingAssets, setPendingAssets] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const dropRef = useRef<View>(null);
  const progressResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (progressResetTimer.current) clearTimeout(progressResetTimer.current);
    };
  }, []);

  const loadImages = useCallback(async () => {
    try {
      const data = await api.getImages(id);
      setImages(data);
    } catch {
      Alert.alert('Błąd', 'Nie udało się pobrać zdjęć');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadImages();
    }, [loadImages]),
  );

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.9,
    });
    if (!result.canceled) {
      setPendingAssets(result.assets);
      setHasChanges(true);
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Brak uprawnień', 'Potrzebujemy dostępu do aparatu');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.9 });
    if (!result.canceled) {
      setPendingAssets(result.assets);
      setHasChanges(true);
    }
  };

  const uploadAssets = async (assets: ImagePicker.ImagePickerAsset[]) => {
    setFileProgress(
      assets.map((asset, index) => ({
        name: asset.fileName || `page-${Date.now()}-${index}.jpg`,
        status: 'pending',
      })),
    );
    setUploading(true);

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
    setUploading(false);

    const errCount = allNewImages.length < assets.length ? assets.length - allNewImages.length : 0;
    if (errCount > 0) {
      showToast(`Przesłano ${allNewImages.length}/${assets.length} plików`, 'error');
    } else {
      showToast(`Przesłano ${allNewImages.length} plików`);
    }

    if (progressResetTimer.current) clearTimeout(progressResetTimer.current);
    progressResetTimer.current = setTimeout(() => setFileProgress([]), 2000);
  };

  const removePendingAsset = (index: number) => {
    setPendingAssets((prev) => prev.filter((_, i) => i !== index));
  };

  const confirmPendingUpload = async () => {
    if (pendingAssets.length === 0) return;
    await uploadAssets(pendingAssets);
  };

  const handleSaveChanges = async () => {
    if (pendingAssets.length > 0) {
      await uploadAssets(pendingAssets);
    }
    setHasChanges(false);
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
    setPendingAssets(assets);
    setHasChanges(true);
  };

  const handleDelete = (image: PageImageResponse) => {
    Alert.alert('Usuń zdjęcie', `Usunąć stronę ${image.orderIndex + 1}?`, [
      { text: 'Anuluj', style: 'cancel' },
      {
        text: 'Usuń',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteImage(id, image.id);
            setImages((prev) => prev.filter((i) => i.id !== image.id));
            setHasChanges(true);
          } catch {
            Alert.alert('Błąd', 'Nie udało się usunąć zdjęcia');
          }
        },
      },
    ]);
  };

  const moveImage = async (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= images.length) return;
    const newOrder = [...images];
    [newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]];
    setImages(newOrder);
    try {
      await api.reorderImages(
        id,
        newOrder.map((i) => i.id),
      );
      setHasChanges(true);
    } catch {
      setImages(images);
    }
  };

  const renderImage = ({ item, index }: { item: PageImageResponse; index: number }) => (
    <GlassPanel style={styles.card}>
      <View style={styles.cardRow}>
        <Text style={styles.pageNum}>{index + 1}</Text>
        <PageImagePreview
          thumbnailUrl={item.thumbnailUrl}
          imageUrl={item.imageUrl}
          style={styles.thumb}
          resizeMode="contain"
        />
        <View style={styles.cardInfo}>
          <Text style={styles.filename} numberOfLines={1}>
            {item.originalFilename || 'Strona'}
          </Text>
          <Text style={styles.meta}>
            {item.fileSize ? `${(item.fileSize / 1024).toFixed(0)} KB` : ''}
          </Text>
        </View>
      </View>
      <View style={styles.cardActions}>
        <Pressable
          style={[styles.moveBtn, index === 0 && styles.moveBtnDisabled]}
          onPress={() => moveImage(index, -1)}
          disabled={index === 0}
        >
          <Text style={styles.moveBtnText}>↑</Text>
        </Pressable>
        <Pressable
          style={[styles.moveBtn, index === images.length - 1 && styles.moveBtnDisabled]}
          onPress={() => moveImage(index, 1)}
          disabled={index === images.length - 1}
        >
          <Text style={styles.moveBtnText}>↓</Text>
        </Pressable>
        <Pressable style={styles.deleteBtn} onPress={() => handleDelete(item)}>
          <Text style={styles.deleteBtnText}>Usuń</Text>
        </Pressable>
      </View>
    </GlassPanel>
  );

  if (loading) {
    return (
      <AudioFlowScreen>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={t.color.accent.pearl} />
        </View>
      </AudioFlowScreen>
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

  return (
    <AudioFlowScreen>
      <FadeZoomContent>
        <View style={styles.container} ref={dropRef} {...dropZoneProps}>
          {isDragOver && (
            <View style={styles.dropOverlay}>
              <Text style={styles.dropOverlayText}>Upuść pliki tutaj</Text>
            </View>
          )}

          {pendingAssets.length > 0 && (
            <GlassPanel style={styles.pendingPanel}>
              <Text style={styles.pendingTitle}>Podgląd zdjęć ({pendingAssets.length})</Text>
              {pendingAssets.map((asset, index) => (
                <View key={`${asset.uri}-${index}`} style={styles.pendingItem}>
                  <PageImagePreview
                    imageUrl={asset.uri}
                    style={styles.pendingThumb}
                    resizeMode="contain"
                  />
                  <View style={styles.pendingInfo}>
                    <Text style={styles.pendingName} numberOfLines={1}>
                      {asset.fileName || `Strona ${index + 1}`}
                    </Text>
                    <Pressable
                      style={styles.pendingRemoveBtn}
                      onPress={() => removePendingAsset(index)}
                    >
                      <Text style={styles.pendingRemoveText}>Usuń z podglądu</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
              <View style={styles.pendingActions}>
                <GhostButton
                  label="Anuluj"
                  onPress={() => setPendingAssets([])}
                  style={styles.pendingActionBtn}
                />
                <PearlButton
                  label="Wyślij zdjęcia"
                  onPress={confirmPendingUpload}
                  style={styles.pendingActionBtn}
                />
              </View>
            </GlassPanel>
          )}

          {images.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {Platform.OS === 'web'
                  ? 'Przeciągnij pliki lub kliknij „Galeria"'
                  : 'Dodaj zdjęcia stron książki'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={images}
              keyExtractor={(item) => item.id}
              renderItem={renderImage}
              contentContainerStyle={styles.list}
            />
          )}

          {uploading && (
            <View style={styles.uploadOverlay}>
              {fileProgress.length > 0 ? (
                <GlassPanel style={styles.progressList}>
                  <Text style={styles.uploadTitle}>Przesyłanie plików</Text>
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
                  <Text style={styles.uploadText}>Przesyłanie...</Text>
                </>
              )}
            </View>
          )}

        </View>
      </FadeZoomContent>
      <AudioFlowFooterMenu
        bottomInset={insets.bottom}
        leftIcon="image"
        leftLabel="Galeria"
        onLibraryPress={pickFromGallery}
        createIcon="check"
        createLabel="Zapisz zmiany"
        createDisabled={!hasChanges}
        onCreatePress={handleSaveChanges}
        rightIcon="camera"
        rightLabel="Aparat"
        rightDisabled={Platform.OS === 'web'}
        onPlayerPress={takePhoto}
      />
    </AudioFlowScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: t.spacing.gutterMobile, paddingBottom: 100 },
  card: {
    borderRadius: t.radius.card,
    padding: 12,
    marginBottom: t.spacing.stackSm,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  pageNum: {
    color: t.color.text.onSurfaceMuted,
    fontSize: 16,
    fontWeight: 'bold',
    width: 28,
    textAlign: 'center',
  },
  thumb: {
    width: 60,
    height: 80,
    borderRadius: t.radius.md,
    backgroundColor: t.color.surface.glassMuted,
    marginHorizontal: 10,
  },
  cardInfo: { flex: 1 },
  filename: { color: t.color.text.onDark, fontSize: 14, fontFamily: 'VarelaRound_400Regular' },
  meta: {
    color: t.color.text.onSurfaceMuted,
    fontSize: 12,
    fontFamily: 'VarelaRound_400Regular',
    marginTop: 2,
  },
  cardActions: {
    flexDirection: 'row',
    gap: t.spacing.stackSm,
    marginTop: t.spacing.stackSm,
    justifyContent: 'flex-end',
  },
  moveBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: t.radius.md,
    backgroundColor: t.color.surface.glassLight,
    borderWidth: 1,
    borderColor: t.color.surface.glassEdge,
  },
  moveBtnDisabled: { opacity: 0.3 },
  moveBtnText: { color: t.color.text.onDark, fontSize: 16 },
  deleteBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: t.radius.md },
  deleteBtnText: { color: t.color.accent.danger, fontSize: 14, fontFamily: 'VarelaRound_400Regular' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: t.color.text.onSurfaceMuted, fontSize: 16, fontFamily: 'VarelaRound_400Regular' },
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
  pendingPanel: {
    marginHorizontal: t.spacing.gutterMobile,
    marginTop: t.spacing.stackSm,
    padding: 12,
    borderRadius: t.radius.card,
  },
  pendingTitle: {
    color: t.color.text.onDark,
    fontSize: 16,
    fontFamily: 'Quicksand_600SemiBold',
    marginBottom: 10,
  },
  pendingItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  pendingThumb: { width: 72, height: 96, borderRadius: t.radius.md, marginRight: 12 },
  pendingInfo: { flex: 1 },
  pendingName: {
    color: t.color.text.onDark,
    fontSize: 14,
    fontFamily: 'VarelaRound_400Regular',
    marginBottom: 6,
  },
  pendingRemoveBtn: { alignSelf: 'flex-start', paddingVertical: 4 },
  pendingRemoveText: {
    color: t.color.accent.danger,
    fontSize: 13,
    fontFamily: 'VarelaRound_400Regular',
  },
  pendingActions: {
    flexDirection: 'row',
    gap: t.spacing.stackSm,
    justifyContent: 'flex-end',
    marginTop: t.spacing.stackSm,
  },
  pendingActionBtn: { flex: 1 },
});
