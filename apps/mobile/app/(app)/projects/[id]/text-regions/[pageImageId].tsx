import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { api } from '../../../../../lib/api';
import { AudioFlowScreen, audioFlowTokens } from '../../../../../components/audioflow';
import {
  OcrRegionEditor,
  type EditorRegion,
} from '../../../../../components/OcrRegionEditor';
import type {
  PageImageResponse,
  TextRegionInput,
  TextRegionResponse,
} from '@book-scanner/shared';

const t = audioFlowTokens;

function goBackToImages(projectId: string) {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(`/(app)/projects/${projectId}/images`);
  }
}

export default function ProjectPageRegionEditorScreen() {
  const { id, pageImageId } = useLocalSearchParams<{ id: string; pageImageId: string }>();
  const [image, setImage] = useState<PageImageResponse | null>(null);
  const [allRegions, setAllRegions] = useState<TextRegionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [images, regions] = await Promise.all([api.getImages(id), api.getTextRegions(id)]);
        if (cancelled) return;
        const target = images.find((img) => img.id === pageImageId);
        if (!target) {
          Alert.alert('Błąd', 'Nie znaleziono zdjęcia.');
          goBackToImages(id);
          return;
        }
        setImage(target);
        setAllRegions(regions);
      } catch {
        if (!cancelled) {
          Alert.alert('Błąd', 'Nie udało się pobrać danych.');
          goBackToImages(id);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, pageImageId]);

  const initialRegions = useCallback((): EditorRegion[] => {
    return allRegions
      .filter((r) => r.pageImageId === pageImageId)
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((r, index) => ({
        key: r.id,
        orderIndex: index,
        x: r.x,
        y: r.y,
        width: r.width,
        height: r.height,
      }));
  }, [allRegions, pageImageId]);

  const handleCancel = () => goBackToImages(id);

  const handleSave = async (editorRegions: EditorRegion[]) => {
    setSaving(true);
    try {
      const otherPages: TextRegionInput[] = allRegions
        .filter((r) => r.pageImageId !== pageImageId)
        .map(({ pageImageId: pid, x, y, width, height, orderIndex }) => ({
          pageImageId: pid,
          x,
          y,
          width,
          height,
          orderIndex,
        }));
      const thisPage: TextRegionInput[] = editorRegions.map((r, index) => ({
        pageImageId,
        x: r.x,
        y: r.y,
        width: r.width,
        height: r.height,
        orderIndex: index,
      }));
      await api.saveTextRegions(id, [...otherPages, ...thisPage]);
      goBackToImages(id);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Nie udało się zapisać regionów.';
      Alert.alert('Błąd', message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !image) {
    return (
      <AudioFlowScreen>
        <View style={styles.centered}>
          <ActivityIndicator color={t.color.accent.pearl} size="large" />
        </View>
      </AudioFlowScreen>
    );
  }

  return (
    <OcrRegionEditor
      key={image.id}
      target={{
        kind: 'uploaded',
        id: image.id,
        imageUrl: image.imageUrl,
        thumbnailUrl: image.thumbnailUrl,
      }}
      initialRegions={initialRegions()}
      pageLabel={`Strona ${image.orderIndex + 1}`}
      onCancel={handleCancel}
      onSave={handleSave}
      saving={saving}
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
