import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAudioPlayer } from '../../../../lib/use-audio-player';
import { useNetwork } from '../../../../lib/use-network';
import {
  AudioFlowPlayerPanel,
  AudioFlowScreen,
  GlassPanel,
  RoundIconButton,
  TopAppBar,
  audioFlowStyles,
  audioFlowTokens,
} from '../../../../components/audioflow';
import {
  AudioFlowGlobalMenuButton,
  AudioFlowTopChrome,
} from '../../../../components/audioflow-global-navigation';
import { FadeZoomContent } from '../../../../components/FadeZoomContent';
import { SceneTranscriptBox } from '../../../../components/SceneTranscriptBox';

const t = audioFlowTokens;

const formatTime = (ms: number) => {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
};

export default function PlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
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
    seekBy,
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

  const headerChrome = (
    <AudioFlowTopChrome>
      <TopAppBar
        left={<RoundIconButton label="Wróć" icon="‹" onPress={() => router.back()} />}
        right={
          <View style={styles.topBarRight}>
            <AudioFlowGlobalMenuButton />
          </View>
        }
        title="Odtwarzacz"
      />
    </AudioFlowTopChrome>
  );

  if (loading) {
    return (
      <AudioFlowScreen>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.shell}>
          {headerChrome}
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={t.color.accent.pearl} />
          </View>
        </View>
      </AudioFlowScreen>
    );
  }

  if (playlist.length === 0) {
    return (
      <AudioFlowScreen>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.shell}>
          {headerChrome}
          <View style={styles.centered}>
            <Text style={styles.emptyText}>Brak audio. Wygeneruj audio ze scen.</Text>
          </View>
        </View>
      </AudioFlowScreen>
    );
  }

  const isScene = currentItem?.type === 'scene';
  const sceneLabel = isScene ? `Scena ${(currentItem?.sceneOrderIndex ?? 0) + 1}` : 'Wstawka';
  const transcriptText = isScene ? (currentItem?.sceneText ?? null) : null;
  const transcriptKey = currentItem?.id ?? 'none';

  return (
    <AudioFlowScreen>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.shell}>
        {headerChrome}
        <FadeZoomContent>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.content, { paddingBottom: t.spacing.stackMd }]}
          >
            {(isOfflineMode || !isOnline) && (
              <GlassPanel style={styles.offlineBanner}>
                <Text style={styles.offlineBannerText}>
                  {isOfflineMode ? '📴 Odtwarzanie z cache (offline)' : '📴 Brak połączenia'}
                </Text>
              </GlassPanel>
            )}

            <GlassPanel style={styles.headerPanel}>
              <Text style={audioFlowStyles.eyebrow}>{sceneLabel}</Text>
              <View style={styles.sceneProgressSection}>
                <View style={styles.globalProgressBar}>
                  <View style={[styles.globalProgressFill, { width: `${trackProgress * 100}%` }]} />
                </View>
                <Text style={styles.globalLabel}>
                  {formatTime(positionMs)} / {formatTime(durationMs)}
                </Text>
              </View>
              <SceneTranscriptBox
                text={transcriptText}
                positionMs={positionMs}
                durationMs={durationMs}
                isPlaying={isPlaying}
                resetKey={transcriptKey}
                style={styles.transcript}
              />
            </GlassPanel>

            <View style={styles.scenesSection}>
              <Text style={audioFlowStyles.eyebrow}>Sceny</Text>
              <View style={styles.scenesList}>
                {sceneItems.map((item) => {
                  const isActive =
                    currentItem?.referenceId === item.referenceId && currentItem?.type === 'scene';
                  return (
                    <Pressable
                      key={item.id}
                      accessibilityRole="button"
                      onPress={() => jumpToScene(item.sceneOrderIndex ?? 0)}
                      style={({ pressed }) => [
                        styles.trackItem,
                        isActive && styles.trackItemActive,
                        pressed && styles.pressed,
                      ]}
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
                })}
              </View>
            </View>

            {(downloading || isCached || !isOnline) && (
              <GlassPanel style={styles.offlinePanel}>
                <Text style={audioFlowStyles.eyebrow}>Offline</Text>
                {downloading ? (
                  <View style={styles.downloadProgress}>
                    <ActivityIndicator size="small" color={t.color.accent.softGreen} />
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
                ) : (
                  <Text style={styles.cachedText}>Audio dostępne tylko online.</Text>
                )}
              </GlassPanel>
            )}

            {isOnline && !isCached && !downloading && (
              <Pressable
                accessibilityRole="button"
                onPress={handleDownloadOffline}
                style={({ pressed }) => [styles.downloadBtn, pressed && styles.pressed]}
              >
                <Feather name="download-cloud" size={16} color={t.color.accent.pearl} />
                <Text style={styles.downloadBtnText}>Pobierz offline</Text>
              </Pressable>
            )}
          </ScrollView>
        </FadeZoomContent>
        <View style={[styles.playerBar, { paddingBottom: insets.bottom }]}>
          <AudioFlowPlayerPanel
            progress={globalProgress}
            currentTime={formatTime(progressBefore + positionMs)}
            totalTime={formatTime(totalDuration)}
            isPlaying={isPlaying}
            onPlayPress={handlePlayPause}
            onPreviousPress={() => goToSceneIndex(-1)}
            onNextPress={() => goToSceneIndex(1)}
            onSkipBack={() => seekBy(-10000)}
            onSkipForward={() => seekBy(10000)}
          />
        </View>
      </View>
    </AudioFlowScreen>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  scroll: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: t.spacing.marginMobile,
    paddingTop: t.spacing.stackMd,
    gap: t.spacing.stackMd,
  },
  topBarRight: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
  },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: {
    ...audioFlowStyles.body,
    color: t.color.text.onSurfaceMuted,
    fontSize: 16,
  },

  offlineBanner: {
    paddingVertical: 10,
    paddingHorizontal: t.spacing.stackMd,
    alignItems: 'center',
    backgroundColor: t.color.surface.glassMuted,
  },
  offlineBannerText: {
    ...audioFlowStyles.body,
    color: t.color.accent.pearl,
    fontWeight: '600',
  },

  headerPanel: {
    gap: t.spacing.stackSm,
    padding: t.spacing.stackMd,
    backgroundColor: t.color.surface.glassMuted,
  },
  transcript: {
    marginTop: t.spacing.stackSm,
  },
  sceneProgressSection: {
    gap: t.spacing.stackSm,
  },

  globalProgressBar: {
    height: 4,
    backgroundColor: t.color.surface.glassEdge,
    borderRadius: 2,
    overflow: 'hidden',
  },
  globalProgressFill: {
    height: '100%',
    backgroundColor: t.color.accent.softGreen,
    borderRadius: 2,
  },
  globalLabel: {
    ...audioFlowStyles.body,
    color: t.color.text.onSurfaceMuted,
    fontSize: 12,
    textAlign: 'center',
  },

  offlinePanel: {
    gap: t.spacing.stackSm,
    padding: t.spacing.stackMd,
    backgroundColor: t.color.surface.glassMuted,
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: t.color.accent.pearlTint,
    borderColor: t.color.accent.pearlBorder,
    borderWidth: 1,
    borderRadius: t.radius.full,
    paddingVertical: 12,
  },
  downloadBtnText: {
    color: t.color.accent.pearl,
    fontSize: 15,
    fontWeight: '700',
  },
  downloadProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
  },
  downloadText: {
    color: t.color.accent.softGreen,
    fontSize: 13,
  },
  cachedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cachedText: {
    color: t.color.accent.softGreen,
    fontSize: 13,
  },
  deleteCacheText: {
    color: t.color.accent.danger,
    fontSize: 13,
  },

  scenesSection: {
    gap: t.spacing.stackSm,
  },
  scenesList: {
    gap: t.spacing.stackSm,
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: t.radius.md,
    backgroundColor: t.color.surface.glassLight,
    borderWidth: 1,
    borderColor: t.color.surface.glassEdge,
  },
  trackItemActive: {
    backgroundColor: t.color.accent.pearlTint,
    borderColor: t.color.accent.pearlBorder,
  },
  trackNum: {
    color: t.color.text.onSurfaceMuted,
    fontWeight: '700',
    width: 28,
    fontSize: 14,
  },
  trackNumActive: { color: t.color.accent.pearl },
  trackText: { flex: 1, color: t.color.text.onSurfaceSubtle, fontSize: 13 },
  trackTextActive: { color: t.color.text.onDark },
  trackDuration: { color: t.color.text.onSurfaceMuted, fontSize: 12 },

  playerBar: {
    paddingHorizontal: t.spacing.marginMobile,
    paddingTop: t.spacing.stackSm,
  },

  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.97 }],
  },
});
