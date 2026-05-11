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
import { api } from '../../../../lib/api';
import { uploadFileFromImagePickerAsset } from '../../../../lib/image-upload';
import { useToast } from '../../../../components/Toast';
import { PageImagePreview } from '../../../../components/PageImagePreview';
import type { PageImageResponse } from '@book-scanner/shared';

interface FileProgress {
  name: string;
  status: 'pending' | 'uploading' | 'done' | 'error';
}

export default function ProjectImagesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { showToast } = useToast();
  const [images, setImages] = useState<PageImageResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [fileProgress, setFileProgress] = useState<FileProgress[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [pendingAssets, setPendingAssets] = useState<ImagePicker.ImagePickerAsset[]>([]);
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
    } catch {
      setImages(images);
    }
  };

  const renderImage = ({ item, index }: { item: PageImageResponse; index: number }) => (
    <View style={styles.card}>
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
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#e94560" />
      </View>
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
    <View style={styles.container} ref={dropRef} {...dropZoneProps}>
      <View style={styles.header}>
        <Text style={styles.title}>Zdjęcia stron ({images.length})</Text>
      </View>

      {isDragOver && (
        <View style={styles.dropOverlay}>
          <Text style={styles.dropOverlayText}>Upuść pliki tutaj</Text>
        </View>
      )}

      {pendingAssets.length > 0 && (
        <View style={styles.pendingPanel}>
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
            <Pressable style={styles.pendingCancelBtn} onPress={() => setPendingAssets([])}>
              <Text style={styles.pendingCancelText}>Anuluj</Text>
            </Pressable>
            <Pressable style={styles.pendingUploadBtn} onPress={confirmPendingUpload}>
              <Text style={styles.pendingUploadText}>Wyślij zdjęcia</Text>
            </Pressable>
          </View>
        </View>
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
            <View style={styles.progressList}>
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
                            ? '#06d6a0'
                            : fp.status === 'error'
                              ? '#e94560'
                              : fp.status === 'uploading'
                                ? '#f0a500'
                                : '#888',
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
            </View>
          ) : (
            <>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.uploadText}>Przesyłanie...</Text>
            </>
          )}
        </View>
      )}

      <View style={styles.bottomBar}>
        <Pressable style={styles.addBtn} onPress={pickFromGallery}>
          <Text style={styles.addBtnText}>Galeria</Text>
        </Pressable>
        {Platform.OS !== 'web' && (
          <Pressable style={styles.addBtn} onPress={takePhoto}>
            <Text style={styles.addBtnText}>Aparat</Text>
          </Pressable>
        )}
        {images.length > 0 && (
          <Pressable
            style={styles.nextBtn}
            onPress={() => router.push(`/(app)/projects/${id}/text-regions`)}
          >
            <Text style={styles.nextBtnText}>Dalej →</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { padding: 20, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#e0e0e0' },
  list: { padding: 16, paddingBottom: 100 },
  card: {
    backgroundColor: '#16213e',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  pageNum: { color: '#888', fontSize: 16, fontWeight: 'bold', width: 28, textAlign: 'center' },
  thumb: {
    width: 60,
    height: 80,
    borderRadius: 6,
    backgroundColor: '#0f3460',
    marginHorizontal: 10,
  },
  cardInfo: { flex: 1 },
  filename: { color: '#e0e0e0', fontSize: 14 },
  meta: { color: '#666', fontSize: 12, marginTop: 2 },
  cardActions: { flexDirection: 'row', gap: 8, marginTop: 8, justifyContent: 'flex-end' },
  moveBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#0f3460',
  },
  moveBtnDisabled: { opacity: 0.3 },
  moveBtnText: { color: '#e0e0e0', fontSize: 16 },
  deleteBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 6 },
  deleteBtnText: { color: '#e94560', fontSize: 14 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#888', fontSize: 16 },
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadText: { color: '#fff', marginTop: 12, fontSize: 16 },
  uploadTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  progressList: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    width: '80%',
    maxWidth: 400,
  },
  progressItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  progressName: { color: '#e0e0e0', fontSize: 13, flex: 1, marginRight: 8 },
  progressStatus: { fontSize: 16, fontWeight: 'bold' },
  dropOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(233,69,96,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    borderWidth: 3,
    borderColor: '#e94560',
    borderStyle: 'dashed',
    borderRadius: 12,
    margin: 8,
  },
  dropOverlayText: { color: '#e94560', fontSize: 20, fontWeight: 'bold' },
  pendingPanel: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#16213e',
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  pendingTitle: { color: '#e0e0e0', fontSize: 16, fontWeight: '700', marginBottom: 10 },
  pendingItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  pendingThumb: { width: 72, height: 96, borderRadius: 8, marginRight: 12 },
  pendingInfo: { flex: 1 },
  pendingName: { color: '#e0e0e0', fontSize: 14, marginBottom: 6 },
  pendingRemoveBtn: { alignSelf: 'flex-start', paddingVertical: 4 },
  pendingRemoveText: { color: '#e94560', fontSize: 13, fontWeight: '600' },
  pendingActions: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end', marginTop: 2 },
  pendingCancelBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 },
  pendingCancelText: { color: '#cbd5e1', fontSize: 14, fontWeight: '600' },
  pendingUploadBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#06d6a0',
  },
  pendingUploadText: { color: '#1a1a2e', fontSize: 14, fontWeight: '700' },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#1a1a2e',
    borderTopWidth: 1,
    borderTopColor: '#0f3460',
  },
  addBtn: {
    flex: 1,
    backgroundColor: '#e94560',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  addBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  nextBtn: {
    flex: 1,
    backgroundColor: '#06d6a0',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  nextBtnText: { color: '#1a1a2e', fontSize: 15, fontWeight: '700' },
});
