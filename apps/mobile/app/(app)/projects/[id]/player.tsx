import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Audio } from 'expo-av';
import { api } from '../../../../lib/api';
import { offlineCache } from '../../../../lib/offline-cache';
import { useNetwork } from '../../../../lib/use-network';
import { AudioFlowScreen } from '../../../../components/audioflow';
import type { PlaylistItemResponse } from '@book-scanner/shared';

export default function PlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isOnline } = useNetwork();
  const [playlist, setPlaylist] = useState<PlaylistItemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({ done: 0, total: 0 });
  const [isCached, setIsCached] = useState(false);
  const [cacheSize, setCacheSize] = useState(0);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    (async () => {
      try {
        try {
          await Audio.setAudioModeAsync({
            playsInSilentModeIOS: true,
            staysActiveInBackground: true,
          });
        } catch (audioModeErr) {
          console.warn('Audio.setAudioModeAsync failed', audioModeErr);
        }

        const cached = await offlineCache.getCachedPlaylist(id);

        if (!isOnline && cached) {
          const offlineItems: PlaylistItemResponse[] = cached.items.map((c, i) => ({
            id: c.id,
            projectId: id,
            type: 'scene' as const,
            referenceId: c.id,
            orderIndex: i,
            audioUrl: c.localUri,
            durationMs: c.durationMs,
          }));
          setPlaylist(offlineItems);
          setIsOfflineMode(true);
          setIsCached(true);
          setCacheSize(cached.totalSize);
        } else if (!isOnline) {
          Alert.alert('Offline', 'Brak połączenia i brak pobranego cache. Pobierz audio online.');
        } else {
          const items = await api.getPlaylist(id);
          setPlaylist(items);
          setIsCached(cached !== null);
          if (cached) setCacheSize(cached.totalSize);
        }
      } catch (err) {
        console.error('Player init failed', err);
        const msg = err instanceof Error ? err.message : 'Nieznany błąd';
        Alert.alert('Nie udało się załadować playlisty', msg);
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      soundRef.current?.unloadAsync();
    };
  }, [id, isOnline]);

  const loadAndPlay = useCallback(
    async (index: number) => {
      if (index < 0 || index >= playlist.length) return;

      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      setCurrentIndex(index);
      setPositionMs(0);
      setIsPlaying(true);

      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: playlist[index].audioUrl },
          { shouldPlay: true },
          (status) => {
            if (status.isLoaded) {
              setPositionMs(status.positionMillis);
              setDurationMs(status.durationMillis || playlist[index].durationMs);
              if (status.didJustFinish) {
                playNext(index);
              }
            }
          },
        );
        soundRef.current = sound;
      } catch {
        setIsPlaying(false);
      }
    },
    [playlist],
  );

  const playNext = useCallback(
    (fromIndex: number) => {
      const next = fromIndex + 1;
      if (next < playlist.length) {
        loadAndPlay(next);
      } else {
        setIsPlaying(false);
      }
    },
    [playlist, loadAndPlay],
  );

  const handlePlayPause = async () => {
    if (!soundRef.current) {
      if (playlist.length > 0) loadAndPlay(currentIndex);
      return;
    }

    const status = await soundRef.current.getStatusAsync();
    if (status.isLoaded && status.isPlaying) {
      await soundRef.current.pauseAsync();
      setIsPlaying(false);
    } else if (status.isLoaded) {
      await soundRef.current.playAsync();
      setIsPlaying(true);
    }
  };

  const goToSceneIndex = (direction: -1 | 1) => {
    const sceneIndices = playlist
      .map((item, i) => (item.type === 'scene' ? i : -1))
      .filter((i) => i >= 0);

    const currentScenePos = sceneIndices.findIndex((i) => i >= currentIndex);
    const targetPos = currentScenePos + direction;

    if (targetPos >= 0 && targetPos < sceneIndices.length) {
      loadAndPlay(sceneIndices[targetPos]);
    }
  };

  const jumpToScene = (sceneOrderIndex: number) => {
    const targetIndex = playlist.findIndex(
      (item) => item.type === 'scene' && item.sceneOrderIndex === sceneOrderIndex,
    );
    if (targetIndex >= 0) {
      loadAndPlay(targetIndex);
    }
  };

  const handleDownloadOffline = async () => {
    if (playlist.length === 0) return;
    setDownloading(true);
    try {
      await offlineCache.downloadProject(id, playlist, (done, total) => {
        setDownloadProgress({ done, total });
      });
      setIsCached(true);
      const size = await offlineCache.getCacheSize(id);
      setCacheSize(size);
      Alert.alert('Pobrano', 'Audio jest teraz dostępne offline.');
    } catch {
      Alert.alert('Błąd', 'Nie udało się pobrać audio.');
    } finally {
      setDownloading(false);
    }
  };

  const handleDeleteCache = () => {
    Alert.alert('Usuń cache', 'Usunąć pobrane audio z tego projektu?', [
      { text: 'Anuluj', style: 'cancel' },
      {
        text: 'Usuń',
        style: 'destructive',
        onPress: async () => {
          await offlineCache.deleteProjectCache(id);
          setIsCached(false);
        },
      },
    ]);
  };

  const currentItem = playlist[currentIndex];
  const sceneItems = playlist.filter((p) => p.type === 'scene');
  const totalDuration = playlist.reduce((sum, p) => sum + p.durationMs, 0);

  const progressBefore = playlist.slice(0, currentIndex).reduce((s, p) => s + p.durationMs, 0);
  const globalProgress = totalDuration > 0 ? (progressBefore + positionMs) / totalDuration : 0;

  const trackProgress = durationMs > 0 ? positionMs / durationMs : 0;

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return `${m}:${String(s % 60).padStart(2, '0')}`;
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

  if (playlist.length === 0) {
    return (
      <AudioFlowScreen>
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Brak audio. Wygeneruj audio ze scen.</Text>
        </View>
      </AudioFlowScreen>
    );
  }

  return (
    <AudioFlowScreen>
      <View style={styles.container}>
      {(isOfflineMode || !isOnline) && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineBannerText}>
            {isOfflineMode ? '📴 Odtwarzanie z cache (offline)' : '📴 Brak połączenia'}
          </Text>
        </View>
      )}

      {currentItem && (
        <View style={styles.nowPlaying}>
          <Text style={styles.nowPlayingLabel}>
            {currentItem.type === 'scene'
              ? `Scena ${(currentItem.sceneOrderIndex ?? 0) + 1}`
              : 'Wstawka'}
          </Text>
          {currentItem.sceneText && (
            <Text style={styles.sceneText} numberOfLines={3}>
              {currentItem.sceneText}
            </Text>
          )}
        </View>
      )}

      <View style={styles.progressSection}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${trackProgress * 100}%` }]} />
        </View>
        <View style={styles.timeRow}>
          <Text style={styles.timeText}>{formatTime(positionMs)}</Text>
          <Text style={styles.timeText}>{formatTime(durationMs)}</Text>
        </View>

        <View style={styles.globalProgressBar}>
          <View style={[styles.globalProgressFill, { width: `${globalProgress * 100}%` }]} />
        </View>
        <Text style={styles.globalLabel}>
          Cały audiobook: {formatTime(progressBefore + positionMs)} / {formatTime(totalDuration)}
        </Text>
      </View>

      <View style={styles.controls}>
        <Pressable style={styles.controlBtn} onPress={() => goToSceneIndex(-1)}>
          <Text style={styles.controlText}>⏮</Text>
        </Pressable>
        <Pressable style={styles.playBtn} onPress={handlePlayPause}>
          <Text style={styles.playBtnText}>{isPlaying ? '⏸' : '▶'}</Text>
        </Pressable>
        <Pressable style={styles.controlBtn} onPress={() => goToSceneIndex(1)}>
          <Text style={styles.controlText}>⏭</Text>
        </Pressable>
      </View>

      <View style={styles.offlineSection}>
        {downloading ? (
          <View style={styles.downloadProgress}>
            <ActivityIndicator size="small" color="#06d6a0" />
            <Text style={styles.downloadText}>
              Pobieranie: {downloadProgress.done}/{downloadProgress.total}
            </Text>
          </View>
        ) : isCached ? (
          <View style={styles.cachedRow}>
            <Text style={styles.cachedText}>
              ✓ Offline {cacheSize > 0 ? `(${(cacheSize / 1024 / 1024).toFixed(1)} MB)` : ''}
            </Text>
            <Pressable onPress={handleDeleteCache}>
              <Text style={styles.deleteCacheText}>Usuń cache</Text>
            </Pressable>
          </View>
        ) : isOnline ? (
          <Pressable style={styles.downloadBtn} onPress={handleDownloadOffline}>
            <Text style={styles.downloadBtnText}>Pobierz offline</Text>
          </Pressable>
        ) : null}
      </View>

      <Text style={styles.trackListTitle}>Sceny</Text>
      <FlatList
        data={sceneItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isActive =
            currentItem?.referenceId === item.referenceId && currentItem?.type === 'scene';
          return (
            <Pressable
              style={[styles.trackItem, isActive && styles.trackItemActive]}
              onPress={() => jumpToScene(item.sceneOrderIndex ?? 0)}
            >
              <Text style={[styles.trackNum, isActive && styles.trackNumActive]}>
                {(item.sceneOrderIndex ?? 0) + 1}
              </Text>
              <Text
                style={[styles.trackText, isActive && styles.trackTextActive]}
                numberOfLines={1}
              >
                {item.sceneText || '(brak tekstu)'}
              </Text>
              <Text style={styles.trackDuration}>{formatTime(item.durationMs)}</Text>
            </Pressable>
          );
        }}
        contentContainerStyle={styles.trackList}
      />
      </View>
    </AudioFlowScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#888', fontSize: 16 },

  nowPlaying: { padding: 20, paddingBottom: 8 },
  nowPlayingLabel: { color: '#e94560', fontSize: 14, fontWeight: '600' },
  sceneText: { color: '#e0e0e0', fontSize: 15, lineHeight: 22, marginTop: 8 },

  progressSection: { paddingHorizontal: 20, paddingBottom: 8 },
  progressBar: { height: 6, backgroundColor: '#0f3460', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#e94560', borderRadius: 3 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  timeText: { color: '#888', fontSize: 12 },
  globalProgressBar: {
    height: 3,
    backgroundColor: '#0f3460',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 12,
  },
  globalProgressFill: { height: '100%', backgroundColor: '#06d6a0', borderRadius: 2 },
  globalLabel: { color: '#666', fontSize: 11, textAlign: 'center', marginTop: 4 },

  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    paddingVertical: 16,
  },
  controlBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#16213e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlText: { fontSize: 20 },
  playBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#e94560',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtnText: { fontSize: 26, color: '#fff' },

  trackListTitle: {
    color: '#888',
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  trackList: { padding: 16, paddingTop: 8 },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 4,
    backgroundColor: '#16213e',
  },
  trackItemActive: { backgroundColor: '#0f3460', borderWidth: 1, borderColor: '#e94560' },
  trackNum: { color: '#888', fontWeight: 'bold', width: 28, fontSize: 14 },
  trackNumActive: { color: '#e94560' },
  trackText: { flex: 1, color: '#aaa', fontSize: 13 },
  trackTextActive: { color: '#e0e0e0' },
  trackDuration: { color: '#666', fontSize: 12 },

  offlineBanner: {
    backgroundColor: '#f0a50033',
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  offlineBannerText: { color: '#f0a500', fontSize: 13, fontWeight: '600' },
  offlineSection: { paddingHorizontal: 20, paddingVertical: 8 },
  downloadBtn: { backgroundColor: '#0f3460', borderRadius: 8, padding: 12, alignItems: 'center' },
  downloadBtnText: { color: '#06d6a0', fontSize: 14, fontWeight: '600' },
  downloadProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
  },
  downloadText: { color: '#06d6a0', fontSize: 13 },
  cachedRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cachedText: { color: '#06d6a0', fontSize: 13 },
  deleteCacheText: { color: '#e94560', fontSize: 13 },
});
