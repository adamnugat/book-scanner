import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { Audio } from 'expo-av';
import { Asset } from 'expo-asset';
import { api } from './api';
import { offlineCache } from './offline-cache';
import { useNetwork } from './use-network';
import { buildPlaylistWithJingles, getLocalJingle } from './local-jingles';
import type { PlaylistItemResponse } from '@book-scanner/shared';

export interface UseAudioPlayerResult {
  playlist: PlaylistItemResponse[];
  loading: boolean;
  currentIndex: number;
  isPlaying: boolean;
  positionMs: number;
  durationMs: number;
  isOfflineMode: boolean;
  isCached: boolean;
  cacheSize: number;
  downloading: boolean;
  downloadProgress: { done: number; total: number };
  handlePlayPause: () => Promise<void>;
  goToSceneIndex: (direction: -1 | 1) => void;
  seekBy: (deltaMs: number) => Promise<void>;
  loadAndPlay: (index: number) => Promise<void>;
  jumpToScene: (sceneOrderIndex: number) => void;
  handleDownloadOffline: () => Promise<void>;
  handleDeleteCache: () => void;
}

export function useAudioPlayer(projectId: string, enabled = true): UseAudioPlayerResult {
  const { isOnline } = useNetwork();
  const [playlist, setPlaylist] = useState<PlaylistItemResponse[]>([]);
  const [loading, setLoading] = useState(enabled);
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
  const playlistRef = useRef<PlaylistItemResponse[]>([]);
  const loadAndPlayRef = useRef<(index: number) => Promise<void>>(async () => {});

  useEffect(() => {
    playlistRef.current = playlist;
  }, [playlist]);

  const playNext = useCallback((fromIndex: number) => {
    const next = fromIndex + 1;
    if (next < playlistRef.current.length) {
      loadAndPlayRef.current(next);
    } else {
      setIsPlaying(false);
    }
  }, []);

  const loadAndPlay = useCallback(
    async (index: number) => {
      const pl = playlistRef.current;
      if (index < 0 || index >= pl.length) return;

      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      setCurrentIndex(index);
      setPositionMs(0);
      setIsPlaying(true);

      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: pl[index].audioUrl },
          { shouldPlay: true },
          (status) => {
            if (status.isLoaded) {
              setPositionMs(status.positionMillis);
              setDurationMs(status.durationMillis || playlistRef.current[index].durationMs);
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
    [playNext],
  );

  useEffect(() => {
    loadAndPlayRef.current = loadAndPlay;
  }, [loadAndPlay]);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

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

        const cached = await offlineCache.getCachedPlaylist(projectId);

        if (!isOnline && cached) {
          const offlineItems: PlaylistItemResponse[] = cached.items.map((c, i) => ({
            id: c.id,
            projectId,
            type: 'scene' as const,
            referenceId: c.id,
            orderIndex: i,
            audioUrl: c.localUri,
            durationMs: c.durationMs,
          }));
          if (!cancelled) {
            setPlaylist(offlineItems);
            setIsOfflineMode(true);
            setIsCached(true);
            setCacheSize(cached.totalSize);
          }
        } else if (!isOnline) {
          Alert.alert('Offline', 'Brak połączenia i brak pobranego cache. Pobierz audio online.');
        } else {
          const [items, project] = await Promise.all([
            api.getPlaylist(projectId),
            api.getProject(projectId),
          ]);

          const jinglePreset = project.interstitialPreset;
          if (jinglePreset?.startsWith('local:')) {
            const jingle = getLocalJingle(jinglePreset);
            if (jingle) {
              const jingleAsset = Asset.fromModule(jingle.asset);
              await jingleAsset.downloadAsync();
              const jingleUri = jingleAsset.localUri ?? jingleAsset.uri;
              if (!cancelled) setPlaylist(buildPlaylistWithJingles(items, jingleUri));
            } else {
              if (!cancelled) setPlaylist(items);
            }
          } else {
            if (!cancelled) setPlaylist(items);
          }

          if (!cancelled) {
            setIsCached(cached !== null);
            if (cached) setCacheSize(cached.totalSize);
          }
        }
      } catch (err) {
        console.error('Player init failed', err);
        const status = (err as { status?: number }).status;
        if (status === 429) return;
        const msg = err instanceof Error ? err.message : 'Nieznany błąd';
        Alert.alert('Nie udało się załadować playlisty', msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      soundRef.current?.unloadAsync();
    };
  }, [projectId, isOnline, enabled]);

  const handlePlayPause = async () => {
    if (!soundRef.current) {
      if (playlistRef.current.length > 0) {
        await loadAndPlay(currentIndex);
      }
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
    const pl = playlistRef.current;
    const sceneIndices = pl
      .map((item, i) => (item.type === 'scene' ? i : -1))
      .filter((i) => i >= 0);

    const currentScenePos = sceneIndices.findIndex((i) => i >= currentIndex);
    const targetPos = currentScenePos + direction;

    if (targetPos >= 0 && targetPos < sceneIndices.length) {
      loadAndPlay(sceneIndices[targetPos]);
    }
  };

  const jumpToScene = (sceneOrderIndex: number) => {
    const targetIndex = playlistRef.current.findIndex(
      (item) => item.type === 'scene' && item.sceneOrderIndex === sceneOrderIndex,
    );
    if (targetIndex >= 0) {
      loadAndPlay(targetIndex);
    }
  };

  const seekBy = async (deltaMs: number) => {
    if (!soundRef.current) return;
    const newPos = Math.max(0, Math.min(positionMs + deltaMs, durationMs));
    await soundRef.current.setPositionAsync(newPos);
    setPositionMs(newPos);
  };

  const handleDownloadOffline = async () => {
    if (playlist.length === 0) return;
    setDownloading(true);
    try {
      await offlineCache.downloadProject(projectId, playlist, (done, total) => {
        setDownloadProgress({ done, total });
      });
      setIsCached(true);
      const size = await offlineCache.getCacheSize(projectId);
      setCacheSize(size);
      Alert.alert('Pobrano', 'Audio jest teraz dostępne offline.');
    } catch {
      Alert.alert('Błąd', 'Nie udało się pobrać audio.');
    } finally {
      setDownloading(false);
    }
  };

  const handleDeleteCache = () => {
    Alert.alert('Usuń cache', 'Usunąć pobrane audio z tego audiobooka?', [
      { text: 'Anuluj', style: 'cancel' },
      {
        text: 'Usuń',
        style: 'destructive',
        onPress: async () => {
          await offlineCache.deleteProjectCache(projectId);
          setIsCached(false);
        },
      },
    ]);
  };

  return {
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
    loadAndPlay,
    jumpToScene,
    handleDownloadOffline,
    handleDeleteCache,
  };
}
