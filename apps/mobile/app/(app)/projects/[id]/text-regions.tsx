import { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { api } from '../../../../lib/api';
import { PageImagePreview } from '../../../../components/PageImagePreview';
import type { PageImageResponse, TextRegionInput } from '@book-scanner/shared';

interface RegionDraft extends TextRegionInput {
  key: string;
}

export default function TextRegionsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [images, setImages] = useState<PageImageResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [regions, setRegions] = useState<RegionDraft[]>([]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          setLoading(true);
          const data = await api.getImages(id);
          setImages(data);
        } catch {
          Alert.alert('Błąd', 'Nie udało się pobrać zdjęć');
        } finally {
          setLoading(false);
        }
      })();
    }, [id]),
  );

  const addRegion = (imageId: string) => {
    setRegions((prev) => [
      ...prev,
      {
        key: `${imageId}-${Date.now()}`,
        pageImageId: imageId,
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      },
    ]);
  };

  const updateRegion = (key: string, field: keyof TextRegionInput, value: number) => {
    setRegions((prev) => prev.map((r) => (r.key === key ? { ...r, [field]: value } : r)));
  };

  const removeRegion = (key: string) => {
    setRegions((prev) => prev.filter((r) => r.key !== key));
  };

  const handleSave = async () => {
    if (regions.length === 0) {
      router.push(`/(app)/projects/${id}/scenes`);
      return;
    }

    setSaving(true);
    try {
      await api.saveTextRegions(
        id,
        regions.map(({ pageImageId, x, y, width, height }) => ({
          pageImageId,
          x,
          y,
          width,
          height,
        })),
      );
      Alert.alert('Zapisano', 'Regiony tekstu zostały zapisane.');
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
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#e94560" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Zaznacz regiony tekstu</Text>
      <Text style={styles.subtitle}>Opcjonalne — pomiń jeśli OCR ma skanować całe strony</Text>

      <FlatList
        data={images}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => {
          const imgRegions = regions.filter((r) => r.pageImageId === item.id);
          return (
            <View style={styles.imageCard}>
              <View style={styles.imageHeader}>
                <PageImagePreview
                  thumbnailUrl={item.thumbnailUrl}
                  imageUrl={item.imageUrl}
                  style={styles.thumb}
                  resizeMode="contain"
                />
                <Text style={styles.imageName}>Strona {index + 1}</Text>
                <Pressable style={styles.addRegionBtn} onPress={() => addRegion(item.id)}>
                  <Text style={styles.addRegionText}>+ Region</Text>
                </Pressable>
              </View>
              {imgRegions.map((r) => (
                <View key={r.key} style={styles.regionRow}>
                  {(['x', 'y', 'width', 'height'] as const).map((field) => (
                    <View key={field} style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>{field}</Text>
                      <TextInput
                        style={styles.fieldInput}
                        keyboardType="numeric"
                        value={String(r[field])}
                        onChangeText={(v) => updateRegion(r.key, field, Number(v) || 0)}
                      />
                    </View>
                  ))}
                  <Pressable onPress={() => removeRegion(r.key)} style={styles.removeBtn}>
                    <Text style={styles.removeBtnText}>✕</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          );
        }}
      />

      <View style={styles.bottomBar}>
        <Pressable
          style={styles.skipBtn}
          onPress={() => router.push(`/(app)/projects/${id}/scenes`)}
        >
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a1a2e' },
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
  imageName: { flex: 1, color: '#e0e0e0', fontSize: 15, marginLeft: 10 },
  addRegionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#0f3460',
  },
  addRegionText: { color: '#e0e0e0', fontSize: 12 },
  regionRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  fieldGroup: { flex: 1 },
  fieldLabel: { color: '#666', fontSize: 10, marginBottom: 2 },
  fieldInput: {
    backgroundColor: '#1a1a2e',
    color: '#e0e0e0',
    borderRadius: 4,
    padding: 6,
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#0f3460',
    textAlign: 'center',
  },
  removeBtn: { paddingHorizontal: 8, paddingVertical: 6 },
  removeBtnText: { color: '#e94560', fontSize: 16 },
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
