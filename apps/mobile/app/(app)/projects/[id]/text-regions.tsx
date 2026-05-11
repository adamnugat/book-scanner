import { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  type GestureResponderEvent,
  type LayoutChangeEvent,
} from 'react-native';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { api } from '../../../../lib/api';
import { PageImagePreview } from '../../../../components/PageImagePreview';
import { AudioFlowScreen } from '../../../../components/audioflow';
import {
  createNormalizedRegion,
  denormalizeRegion,
  type Point,
  type Rect,
  type Size,
} from '../../../../lib/text-region-geometry';
import type { PageImageResponse, TextRegionInput, TextRegionResponse } from '@book-scanner/shared';

interface RegionDraft extends TextRegionInput {
  key: string;
  orderIndex: number;
}

const EMPTY_LAYOUT: Size = { width: 0, height: 0 };

function toDraft(region: TextRegionResponse): RegionDraft {
  return {
    key: region.id,
    pageImageId: region.pageImageId,
    x: region.x,
    y: region.y,
    width: region.width,
    height: region.height,
    orderIndex: region.orderIndex,
  };
}

function pointFromEvent(event: GestureResponderEvent): Point {
  return {
    x: event.nativeEvent.locationX,
    y: event.nativeEvent.locationY,
  };
}

export default function TextRegionsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [images, setImages] = useState<PageImageResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [regions, setRegions] = useState<RegionDraft[]>([]);
  const [editingImage, setEditingImage] = useState<PageImageResponse | null>(null);
  const [editorRegions, setEditorRegions] = useState<RegionDraft[]>([]);
  const [previewLayout, setPreviewLayout] = useState<Size>(EMPTY_LAYOUT);
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [dragRect, setDragRect] = useState<Rect | null>(null);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const [imageData, regionData] = await Promise.all([
            api.getImages(id),
            api.getTextRegions(id),
          ]);
          setImages(imageData);
          setRegions(regionData.map(toDraft));
        } catch {
          Alert.alert('Błąd', 'Nie udało się pobrać zdjęć lub regionów OCR');
        } finally {
          setLoading(false);
        }
      })();
    }, [id]),
  );

  const openEditor = (image: PageImageResponse) => {
    setEditingImage(image);
    setEditorRegions(
      regions
        .filter((region) => region.pageImageId === image.id)
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map((region, index) => ({ ...region, orderIndex: index })),
    );
    setPreviewLayout(EMPTY_LAYOUT);
    setDragStart(null);
    setDragRect(null);
  };

  const closeEditor = () => {
    setEditingImage(null);
    setEditorRegions([]);
    setDragStart(null);
    setDragRect(null);
  };

  const saveEditor = () => {
    if (!editingImage) return;
    setRegions((prev) => [
      ...prev.filter((region) => region.pageImageId !== editingImage.id),
      ...editorRegions.map((region, index) => ({ ...region, orderIndex: index })),
    ]);
    closeEditor();
  };

  const removeEditorRegion = (key: string) => {
    setEditorRegions((prev) =>
      prev
        .filter((region) => region.key !== key)
        .map((region, index) => ({ ...region, orderIndex: index })),
    );
  };

  const onPreviewLayout = (event: LayoutChangeEvent) => {
    setPreviewLayout({
      width: event.nativeEvent.layout.width,
      height: event.nativeEvent.layout.height,
    });
  };

  const beginDrag = (event: GestureResponderEvent) => {
    const point = pointFromEvent(event);
    setDragStart(point);
    setDragRect(null);
  };

  const updateDrag = (event: GestureResponderEvent) => {
    if (!dragStart || previewLayout.width <= 0 || previewLayout.height <= 0) return;
    const normalized = createNormalizedRegion(dragStart, pointFromEvent(event), previewLayout, 1);
    setDragRect(normalized ? denormalizeRegion(normalized, previewLayout) : null);
  };

  const finishDrag = (event: GestureResponderEvent) => {
    if (!editingImage || !dragStart) return;
    const normalized = createNormalizedRegion(dragStart, pointFromEvent(event), previewLayout);
    setDragStart(null);
    setDragRect(null);
    if (!normalized) return;

    setEditorRegions((prev) => [
      ...prev,
      {
        key: `${editingImage.id}-${Date.now()}-${prev.length}`,
        pageImageId: editingImage.id,
        ...normalized,
        orderIndex: prev.length,
      },
    ]);
  };

  const handleSave = async () => {
    const payload = images.flatMap((image) =>
      regions
        .filter((region) => region.pageImageId === image.id)
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map(({ pageImageId, x, y, width, height }, index) => ({
          pageImageId,
          x,
          y,
          width,
          height,
          orderIndex: index,
        })),
    );

    setSaving(true);
    try {
      await api.saveTextRegions(id, payload);
      router.push(`/(app)/projects/${id}/scenes`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Nie udało się zapisać';
      Alert.alert('Błąd', msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AudioFlowScreen>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#e94560" />
        </View>
      </AudioFlowScreen>
    );
  }

  const renderRegionOverlay = (region: RegionDraft, index: number) => {
    const rect = denormalizeRegion(region, previewLayout);
    return (
      <View
        key={region.key}
        style={[
          styles.regionOverlay,
          {
            left: rect.x,
            top: rect.y,
            width: rect.width,
            height: rect.height,
          },
        ]}
      >
        <Text style={styles.regionNumber}>{index + 1}</Text>
      </View>
    );
  };

  return (
    <AudioFlowScreen>
      <View style={styles.container}>
      <Text style={styles.title}>Zaznacz regiony tekstu</Text>
      <Text style={styles.subtitle}>Opcjonalne - pomiń jeśli OCR ma skanować całe strony</Text>

      <FlatList
        data={images}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => {
          const imgRegions = regions.filter((region) => region.pageImageId === item.id);
          return (
            <View style={styles.imageCard}>
              <View style={styles.imageHeader}>
                <PageImagePreview
                  thumbnailUrl={item.thumbnailUrl}
                  imageUrl={item.imageUrl}
                  style={styles.thumb}
                  resizeMode="contain"
                />
                <View style={styles.imageInfo}>
                  <Text style={styles.imageName}>Strona {index + 1}</Text>
                  <Text style={styles.regionCount}>Regiony: {imgRegions.length}</Text>
                </View>
                <Pressable style={styles.editRegionBtn} onPress={() => openEditor(item)}>
                  <Text style={styles.editRegionText}>Edytuj regiony</Text>
                </Pressable>
              </View>
            </View>
          );
        }}
      />

      <Modal visible={Boolean(editingImage)} animationType="slide" onRequestClose={closeEditor}>
        {editingImage && (
          <View style={styles.editorContainer}>
            <Text style={styles.editorTitle}>
              Strona {editingImage.orderIndex + 1} - regiony OCR
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
                thumbnailUrl={editingImage.thumbnailUrl}
                imageUrl={editingImage.imageUrl}
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

            <Text style={styles.editorCount}>Regiony: {editorRegions.length}</Text>
            {editorRegions.length === 0 ? (
              <Text style={styles.emptyRegions}>Brak regionów - OCR odczyta całą stronę.</Text>
            ) : (
              <FlatList
                data={editorRegions}
                keyExtractor={(item) => item.key}
                style={styles.editorRegionList}
                renderItem={({ item, index }) => (
                  <View style={styles.editorRegionRow}>
                    <Text style={styles.editorRegionName}>Region {index + 1}</Text>
                    <Pressable
                      style={styles.deleteRegionBtn}
                      onPress={() => removeEditorRegion(item.key)}
                    >
                      <Text style={styles.deleteRegionText}>Usuń region {index + 1}</Text>
                    </Pressable>
                  </View>
                )}
              />
            )}

            <View style={styles.editorActions}>
              <Pressable style={styles.cancelEditorBtn} onPress={closeEditor}>
                <Text style={styles.cancelEditorText}>Anuluj</Text>
              </Pressable>
              <Pressable style={styles.saveEditorBtn} onPress={saveEditor}>
                <Text style={styles.saveEditorText}>Zapisz stronę</Text>
              </Pressable>
            </View>
          </View>
        )}
      </Modal>

      <View style={styles.bottomBar}>
        <Pressable style={styles.skipBtn} onPress={handleSave} disabled={saving}>
          <Text style={styles.skipBtnText}>Pomiń</Text>
        </Pressable>
        <Pressable style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>
              {regions.length > 0 ? 'Zapisz i dalej' : 'Dalej →'}
            </Text>
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
  title: { fontSize: 22, fontWeight: 'bold', color: '#e0e0e0', padding: 20, paddingBottom: 4 },
  subtitle: { fontSize: 13, color: '#888', paddingHorizontal: 20, paddingBottom: 12 },
  list: { padding: 16, paddingBottom: 100 },
  imageCard: {
    backgroundColor: '#16213e',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  imageHeader: { flexDirection: 'row', alignItems: 'center' },
  thumb: { width: 44, height: 58, borderRadius: 4, backgroundColor: '#0f3460' },
  imageInfo: { flex: 1, marginLeft: 10 },
  imageName: { color: '#e0e0e0', fontSize: 15, fontWeight: '600' },
  regionCount: { color: '#888', fontSize: 12, marginTop: 2 },
  editRegionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#0f3460',
  },
  editRegionText: { color: '#e0e0e0', fontSize: 12, fontWeight: '600' },
  editorContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    padding: 16,
    paddingTop: 36,
  },
  editorTitle: { color: '#e0e0e0', fontSize: 22, fontWeight: '700' },
  editorHint: { color: '#94a3b8', fontSize: 13, marginTop: 6, marginBottom: 14 },
  editorPreview: {
    height: 420,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#0f3460',
    borderWidth: 1,
    borderColor: '#334155',
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
  editorCount: { color: '#e0e0e0', fontSize: 16, fontWeight: '700', marginTop: 14 },
  emptyRegions: { color: '#94a3b8', fontSize: 13, marginTop: 8 },
  editorRegionList: { marginTop: 8, maxHeight: 160 },
  editorRegionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#0f3460',
  },
  editorRegionName: { color: '#e0e0e0', fontSize: 14 },
  deleteRegionBtn: { paddingVertical: 6, paddingHorizontal: 8 },
  deleteRegionText: { color: '#e94560', fontSize: 13, fontWeight: '600' },
  editorActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 'auto',
    paddingTop: 16,
  },
  cancelEditorBtn: {
    flex: 1,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  cancelEditorText: { color: '#cbd5e1', fontSize: 15, fontWeight: '600' },
  saveEditorBtn: {
    flex: 2,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    backgroundColor: '#06d6a0',
  },
  saveEditorText: { color: '#1a1a2e', fontSize: 15, fontWeight: '800' },
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
  skipBtn: {
    flex: 1,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  skipBtnText: { color: '#888', fontSize: 15 },
  saveBtn: {
    flex: 2,
    backgroundColor: '#e94560',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
