import { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { api } from '../../../../lib/api';
import { AudioFlowScreen } from '../../../../components/audioflow';
import type { SceneResponse } from '@book-scanner/shared';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  queued: { label: 'W kolejce', color: '#888' },
  ocr_processing: { label: 'OCR...', color: '#f0a500' },
  ocr_done: { label: 'OCR gotowy', color: '#06d6a0' },
  ocr_error: { label: 'Błąd OCR', color: '#e94560' },
  needs_review: { label: 'Do przeglądu', color: '#00b4d8' },
  ready_for_audio: { label: 'Gotowe do TTS', color: '#06d6a0' },
};

export default function ScenesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [scenes, setScenes] = useState<SceneResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadScenes = useCallback(async () => {
    try {
      const data = await api.getScenes(id);
      setScenes(data);
      return data;
    } catch {
      Alert.alert('Błąd', 'Nie udało się pobrać scen');
      return [];
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        await loadScenes();
        setLoading(false);
      })();
    }, [loadScenes]),
  );

  const hasPending = scenes.some((s) => s.status === 'queued' || s.status === 'ocr_processing');

  useEffect(() => {
    if (hasPending) {
      pollingRef.current = setInterval(async () => {
        const data = await loadScenes();
        const stillPending = data.some(
          (s: SceneResponse) => s.status === 'queued' || s.status === 'ocr_processing',
        );
        if (!stillPending && pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      }, 3000);
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [hasPending, loadScenes]);

  const handleProcessOcr = async () => {
    setProcessing(true);
    try {
      const data = await api.processOcr(id);
      setScenes(data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Nie udało się uruchomić OCR';
      Alert.alert('Błąd', msg);
    } finally {
      setProcessing(false);
    }
  };

  const renderScene = ({ item }: { item: SceneResponse }) => {
    const cfg = STATUS_CONFIG[item.status] || { label: item.status, color: '#888' };
    return (
      <Pressable
        style={styles.card}
        onPress={() => {
          if (
            item.status === 'ocr_done' ||
            item.status === 'needs_review' ||
            item.status === 'ready_for_audio'
          ) {
            router.push(`/(app)/projects/${id}/scenes/${item.id}`);
          }
        }}
        disabled={item.status === 'queued' || item.status === 'ocr_processing'}
      >
        <View style={styles.cardRow}>
          <Text style={styles.pageNum}>{item.orderIndex + 1}</Text>
          <View style={styles.cardContent}>
            <Text style={styles.ocrPreview} numberOfLines={2}>
              {item.ocrText ||
                (item.status === 'ocr_processing' ? 'Przetwarzanie...' : 'Oczekuje...')}
            </Text>
          </View>
          <View style={[styles.statusDot, { backgroundColor: cfg.color }]}>
            {item.status === 'ocr_processing' ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.statusLabel}>{cfg.label}</Text>
            )}
          </View>
        </View>
      </Pressable>
    );
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

  return (
    <AudioFlowScreen>
      <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Sceny ({scenes.length})</Text>
        {hasPending && (
          <View style={styles.processingBadge}>
            <ActivityIndicator size="small" color="#f0a500" />
            <Text style={styles.processingText}>OCR w toku...</Text>
          </View>
        )}
      </View>

      {scenes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            Brak scen. Uruchom OCR, aby rozpoznać tekst ze zdjęć.
          </Text>
          <Pressable style={styles.ocrBtn} onPress={handleProcessOcr} disabled={processing}>
            {processing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.ocrBtnText}>Uruchom OCR</Text>
            )}
          </Pressable>
        </View>
      ) : (
        <>
          <FlatList
            data={scenes}
            keyExtractor={(item) => item.id}
            renderItem={renderScene}
            contentContainerStyle={styles.list}
          />
          {!hasPending && (
            <View style={styles.bottomBar}>
              <Pressable style={styles.ocrBtn} onPress={handleProcessOcr} disabled={processing}>
                <Text style={styles.ocrBtnText}>
                  {processing ? 'Przetwarzanie...' : 'Ponów OCR (nowe strony)'}
                </Text>
              </Pressable>
            </View>
          )}
        </>
      )}
      </View>
    </AudioFlowScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    padding: 20,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 22, fontWeight: 'bold', color: '#e0e0e0' },
  processingBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  processingText: { color: '#f0a500', fontSize: 13 },
  list: { padding: 16, paddingBottom: 100 },
  card: {
    backgroundColor: '#16213e',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  pageNum: { color: '#888', fontSize: 16, fontWeight: 'bold', width: 28, textAlign: 'center' },
  cardContent: { flex: 1, marginHorizontal: 10 },
  ocrPreview: { color: '#e0e0e0', fontSize: 13, lineHeight: 18 },
  statusDot: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    minWidth: 70,
    alignItems: 'center',
  },
  statusLabel: { color: '#fff', fontSize: 11, fontWeight: '600' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyText: { color: '#888', fontSize: 16, textAlign: 'center', marginBottom: 24 },
  ocrBtn: {
    backgroundColor: '#e94560',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    minWidth: 200,
  },
  ocrBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#1a1a2e',
    borderTopWidth: 1,
    borderTopColor: '#0f3460',
  },
});
