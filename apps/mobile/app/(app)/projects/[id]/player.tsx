import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useAudioPlayer } from '../../../../lib/use-audio-player';
import { useNetwork } from '../../../../lib/use-network';
import { AudioFlowScreen } from '../../../../components/audioflow';
import { FadeZoomContent } from '../../../../components/FadeZoomContent';

const formatTime = (ms: number) => {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
};

export default function PlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isOnline } = useNetwork();

  const {
    playlist,
    loading,
    currentIndex,
    isPlaying,
    positionMs,
    durationMs,
    isOfflineMode,
    isCached,
    cacheSize,
    downloading,
    downloadProgress,
    handlePlayPause,
    goToSceneIndex,
    jumpToScene,
    handleDownloadOffline,
    handleDeleteCache,
  } = useAudioPlayer(id);

  const currentItem = playlist[currentIndex];
  const sceneItems = playlist.filter((p) => p.type === 'scene');
  const totalDuration = playlist.reduce((sum, p) => sum + p.durationMs, 0);
  const progressBefore = playlist.slice(0, currentIndex).reduce((s, p) => s + p.durationMs, 0);
  const globalProgress = totalDuration > 0 ? (progressBefore + positionMs) / totalDuration : 0;
  const trackProgress = durationMs > 0 ? positionMs / durationMs : 0;

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
      <FadeZoomContent>
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
      </FadeZoomContent>
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
