import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Audio } from 'expo-av';
import { api } from '../../../../lib/api';
import { offlineCache } from '../../../../lib/offline-cache';
import type {
  AudioTrackResponse,
  ProjectResponse,
  SceneResponse,
  VoiceResponse,
} from '@book-scanner/shared';

const AUDIO_POLL_INTERVAL_MS = 3000;

export default function VoiceSelectScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [voices, setVoices] = useState<VoiceResponse[]>([]);
  const [project, setProject] = useState<ProjectResponse | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [scenes, setScenes] = useState<SceneResponse[]>([]);
  const [audioTracks, setAudioTracks] = useState<AudioTrackResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [playingPreview, setPlayingPreview] = useState<string | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const trackSoundRef = useRef<Audio.Sound | null>(null);

  const refreshAudioState = useCallback(async () => {
    const [sceneList, trackList] = await Promise.all([api.getScenes(id), api.getAudioTracks(id)]);
    setScenes(sceneList);
    setAudioTracks(trackList);
    return sceneList.filter((scene) => scene.status === 'audio_generating').length;
  }, [id]);

  useEffect(() => {
    (async () => {
      try {
        setVoiceError(null);
        const proj = await api.getProject(id);
        setProject(proj);
        setSelected(proj.voiceId);
        const [voiceList, sceneList, trackList] = await Promise.all([
          api.getVoices(proj.language),
          api.getScenes(id),
          api.getAudioTracks(id),
        ]);
        setVoices(voiceList);
        setScenes(sceneList);
        setAudioTracks(trackList);
      } catch {
        setVoiceError('Nie udało się pobrać głosów. Sprawdź konfigurację ElevenLabs.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleSelect = async (voiceId: string) => {
    setSelected(voiceId);
    setSaving(true);
    try {
      const updated = await api.updateProject(id, { voiceId });
      setProject(updated);
    } catch {
      Alert.alert('Błąd', 'Nie udało się zapisać głosu');
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = (voice: VoiceResponse) => {
    if (!voice.previewUrl) {
      Alert.alert('Brak próbki', 'Ta próbka głosu nie jest dostępna');
      return;
    }
    setPlayingPreview(playingPreview === voice.id ? null : voice.id);
  };

  const handleGenerateAudio = async () => {
    if (!selected) {
      Alert.alert('Wybierz głos', 'Wybierz głos lektora przed generowaniem audio');
      return;
    }
    setGenerating(true);
    try {
      await api.generateAudio(id);
      await refreshAudioState();
      Alert.alert('Generacja audio', 'Generacja audio została uruchomiona.');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Nie udało się uruchomić generacji';
      Alert.alert('Błąd', msg);
    } finally {
      setGenerating(false);
    }
  };

  const readySceneCount = scenes.filter((scene) => scene.status === 'ready_for_audio').length;
  const generatingSceneCount = scenes.filter((scene) => scene.status === 'audio_generating').length;
  const erroredSceneCount = scenes.filter((scene) => scene.status === 'audio_error').length;
  const canGenerate = Boolean(selected) && readySceneCount > 0 && !generating;

  useFocusEffect(
    useCallback(() => {
      if (generatingSceneCount === 0) {
        return;
      }

      let cancelled = false;
      let interval: ReturnType<typeof setInterval> | null = null;

      const stop = () => {
        if (interval) {
          clearInterval(interval);
          interval = null;
        }
      };

      const tick = async () => {
        if (cancelled) return;
        try {
          const stillGenerating = await refreshAudioState();
          if (cancelled) return;
          if (stillGenerating === 0) {
            stop();
          }
        } catch (err) {
          console.warn('Audio polling failed', err);
          stop();
        }
      };

      interval = setInterval(tick, AUDIO_POLL_INTERVAL_MS);

      return () => {
        cancelled = true;
        stop();
      };
    }, [generatingSceneCount, refreshAudioState]),
  );

  const prevGeneratingCountRef = useRef(0);
  const completionAlertShownRef = useRef(false);
  useEffect(() => {
    if (loading) return;
    const previous = prevGeneratingCountRef.current;
    if (previous > 0 && generatingSceneCount === 0 && !completionAlertShownRef.current) {
      completionAlertShownRef.current = true;
      if (erroredSceneCount > 0) {
        Alert.alert(
          'Generacja audio',
          `Generacja audio zakończona, ale ${erroredSceneCount} scena/sceny zwróciły błąd. Możesz uruchomić generację ponownie dla scen z błędem.`,
        );
      } else {
        Alert.alert('Generacja audio', 'Generacja audio zakończona pomyślnie.');
      }
    }
    if (generatingSceneCount > 0) {
      completionAlertShownRef.current = false;
    }
    prevGeneratingCountRef.current = generatingSceneCount;
  }, [loading, generatingSceneCount, erroredSceneCount]);

  const getGenerateLabel = () => {
    if (!selected) return 'Najpierw wybierz głos';
    if (readySceneCount === 0) return 'Zatwierdź tekst scen przed TTS';
    return 'Generuj audio';
  };

  const renderVoice = (item: VoiceResponse) => {
    const isSelected = selected === item.elevenlabsVoiceId;
    const isPlaying = playingPreview === item.id;
    return (
      <Pressable
        style={[
          styles.voiceCard,
          isSelected && styles.voiceCardSelected,
          saving && styles.disabled,
        ]}
        onPress={() => handleSelect(item.elevenlabsVoiceId)}
        disabled={saving}
      >
        <View style={styles.voiceInfo}>
          <Text style={[styles.voiceName, isSelected && styles.voiceNameSelected]}>
            {item.name}
          </Text>
          <Text style={styles.voiceLang}>{item.language.toUpperCase()}</Text>
        </View>
        <View style={styles.voiceActions}>
          {item.previewUrl && (
            <Pressable style={styles.previewBtn} onPress={() => handlePreview(item)}>
              <Text style={styles.previewBtnText}>{isPlaying ? '⏸' : '▶'}</Text>
            </Pressable>
          )}
          {isSelected && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </Pressable>
    );
  };

  const getTrackSceneNumber = (track: AudioTrackResponse) => {
    const scene = scenes.find((s) => s.id === track.sceneId);
    return scene ? scene.orderIndex + 1 : '?';
  };

  const stopTrackPlayback = useCallback(async () => {
    if (trackSoundRef.current) {
      try {
        await trackSoundRef.current.unloadAsync();
      } catch {
        // sound may already be unloaded; nothing to do
      }
      trackSoundRef.current = null;
    }
    setPlayingTrackId(null);
  }, []);

  useFocusEffect(
    useCallback(() => {
      return () => {
        void stopTrackPlayback();
      };
    }, [stopTrackPlayback]),
  );

  useEffect(() => {
    return () => {
      void stopTrackPlayback();
    };
  }, [stopTrackPlayback]);

  const handlePlayTrack = useCallback(
    async (track: AudioTrackResponse) => {
      if (playingTrackId === track.id && trackSoundRef.current) {
        try {
          await trackSoundRef.current.pauseAsync();
        } catch {
          await stopTrackPlayback();
          return;
        }
        setPlayingTrackId(null);
        return;
      }

      await stopTrackPlayback();

      let uri = track.audioUrl;
      try {
        const cached = await offlineCache.getCachedAudioForTrack(id, track.id);
        if (cached?.localUri) {
          uri = cached.localUri;
        }
      } catch (err) {
        console.warn('Audio cache lookup failed', err);
      }

      try {
        const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true }, (status) => {
          if (status.isLoaded && status.didJustFinish) {
            void stopTrackPlayback();
          }
        });
        trackSoundRef.current = sound;
        setPlayingTrackId(track.id);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Nie udało się odtworzyć audio';
        Alert.alert('Błąd odtwarzania', msg);
        await stopTrackPlayback();
      }
    },
    [id, playingTrackId, stopTrackPlayback],
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#e94560" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Głos i audio</Text>
        <Text style={styles.subtitle}>
          Język projektu: {project?.language === 'pl' ? 'Polski' : 'English'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Głos lektora</Text>
          {voiceError ? (
            <Text style={styles.errorText}>{voiceError}</Text>
          ) : voices.length === 0 ? (
            <Text style={styles.emptyText}>Brak dostępnych głosów dla języka lub planu.</Text>
          ) : (
            voices.map((voice) => <View key={voice.id}>{renderVoice(voice)}</View>)
          )}
        </View>

        <View style={styles.statusCard}>
          <Text style={styles.sectionTitle}>Text to Speech</Text>
          <Text style={styles.statusLine}>Gotowe sceny do audio: {readySceneCount}</Text>
          {generatingSceneCount > 0 && (
            <Text style={styles.statusLine}>Audio w toku: {generatingSceneCount}</Text>
          )}
          {erroredSceneCount > 0 && (
            <Text style={styles.errorText}>Sceny z błędem audio: {erroredSceneCount}</Text>
          )}
          {readySceneCount === 0 && generatingSceneCount === 0 && (
            <Text style={styles.hintText}>Zatwierdź tekst scen po OCR, aby uruchomić TTS.</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Wygenerowane audio</Text>
          {audioTracks.length === 0 ? (
            <Text style={styles.emptyText}>Nie ma jeszcze wygenerowanych ścieżek audio.</Text>
          ) : (
            audioTracks.map((track) => {
              const isPlaying = playingTrackId === track.id;
              return (
                <View key={track.id} style={styles.audioCard}>
                  <View style={styles.audioInfo}>
                    <Text style={styles.audioTitle}>Scena {getTrackSceneNumber(track)}</Text>
                    <Text style={styles.audioMeta}>
                      {formatDuration(track.durationMs)} · {formatFileSize(track.fileSize)}
                    </Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={
                      isPlaying
                        ? `Wstrzymaj scenę ${getTrackSceneNumber(track)}`
                        : `Odtwórz scenę ${getTrackSceneNumber(track)}`
                    }
                    style={styles.audioPlayBtn}
                    onPress={() => handlePlayTrack(track)}
                  >
                    <Text style={styles.audioPlayBtnText}>{isPlaying ? '⏸' : '▶'}</Text>
                  </Pressable>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <Pressable
          style={[styles.generateBtn, !canGenerate && styles.generateBtnDisabled]}
          onPress={handleGenerateAudio}
          disabled={!canGenerate}
        >
          {generating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.generateBtnText}>{getGenerateLabel()}</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a1a2e' },
  header: { padding: 20, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#e0e0e0' },
  subtitle: { fontSize: 13, color: '#888', marginTop: 4 },
  content: { padding: 16, paddingBottom: 120 },
  section: { marginBottom: 20 },
  sectionTitle: { color: '#fff', fontSize: 17, fontWeight: '700', marginBottom: 10 },
  voiceCard: {
    backgroundColor: '#16213e',
    borderRadius: 10,
    padding: 16,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#0f3460',
    flexDirection: 'row',
    alignItems: 'center',
  },
  voiceCardSelected: { borderColor: '#e94560', backgroundColor: '#e9456015' },
  disabled: { opacity: 0.6 },
  voiceInfo: { flex: 1 },
  voiceName: { color: '#e0e0e0', fontSize: 16, fontWeight: '600' },
  voiceNameSelected: { color: '#e94560' },
  voiceLang: { color: '#888', fontSize: 12, marginTop: 2 },
  voiceActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  previewBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0f3460',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewBtnText: { fontSize: 16 },
  checkmark: { color: '#e94560', fontSize: 20, fontWeight: 'bold' },
  emptyText: { color: '#888', fontSize: 15, lineHeight: 21 },
  errorText: { color: '#ff8fa3', fontSize: 15, lineHeight: 21 },
  hintText: { color: '#c9d6df', fontSize: 14, lineHeight: 20, marginTop: 6 },
  statusCard: {
    backgroundColor: '#073b3a',
    borderColor: '#06d6a0',
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  statusLine: { color: '#e0e0e0', fontSize: 15, marginBottom: 4 },
  audioCard: {
    backgroundColor: '#16213e',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#0f3460',
    flexDirection: 'row',
    alignItems: 'center',
  },
  audioInfo: { flex: 1 },
  audioTitle: { color: '#e0e0e0', fontSize: 15, fontWeight: '700', marginBottom: 4 },
  audioMeta: { color: '#888', fontSize: 13 },
  audioPlayBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0f3460',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  audioPlayBtnText: { color: '#06d6a0', fontSize: 18, fontWeight: '700' },
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
  generateBtn: { backgroundColor: '#e94560', borderRadius: 8, padding: 16, alignItems: 'center' },
  generateBtnDisabled: { opacity: 0.5 },
  generateBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

function formatDuration(durationMs: number): string {
  return `${Math.round(durationMs / 1000)} s`;
}

function formatFileSize(fileSize: number): string {
  return `${Math.max(1, Math.round(fileSize / 1024))} KB`;
}
