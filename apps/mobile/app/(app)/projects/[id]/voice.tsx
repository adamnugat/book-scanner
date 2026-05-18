import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Audio } from 'expo-av';
import { api } from '../../../../lib/api';
import { offlineCache } from '../../../../lib/offline-cache';
import {
  AudioFlowScreen,
  audioFlowTokens,
  GlassPanel,
  PearlButton,
  PickerCard,
  RoundIconButton,
  SectionHeading,
} from '../../../../components/audioflow';
import { FadeZoomContent } from '../../../../components/FadeZoomContent';
import type {
  AudioTrackResponse,
  ProjectResponse,
  SceneResponse,
  VoiceResponse,
} from '@book-scanner/shared';

const t = audioFlowTokens;

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

  const getTrackSceneNumber = (track: AudioTrackResponse) => {
    const scene = scenes.find((s) => s.id === track.sceneId);
    return scene ? scene.orderIndex + 1 : '?';
  };

  const stopTrackPlayback = useCallback(async () => {
    if (trackSoundRef.current) {
      try {
        await trackSoundRef.current.unloadAsync();
      } catch {
        // sound may already be unloaded
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
      <AudioFlowScreen>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={t.color.accent.pearl} />
        </View>
      </AudioFlowScreen>
    );
  }

  return (
    <AudioFlowScreen>
      <FadeZoomContent>
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.content}>
            {project && (
              <Text style={styles.langHint}>
                Język projektu: {project.language === 'pl' ? 'Polski' : 'English'}
              </Text>
            )}

            <SectionHeading title="Głos lektora" style={styles.sectionHeading} />
            {voiceError ? (
              <Text style={styles.errorText}>{voiceError}</Text>
            ) : voices.length === 0 ? (
              <Text style={styles.emptyText}>Brak dostępnych głosów dla języka lub planu.</Text>
            ) : (
              voices.map((item) => {
                const isSelected = selected === item.elevenlabsVoiceId;
                const isPlaying = playingPreview === item.id;
                return (
                  <PickerCard
                    key={item.id}
                    title={item.name}
                    meta={item.language.toUpperCase()}
                    selected={isSelected}
                    onPress={() => handleSelect(item.elevenlabsVoiceId)}
                    disabled={saving}
                    style={styles.voiceCard}
                    trailing={
                      item.previewUrl ? (
                        <RoundIconButton
                          label={isPlaying ? 'Zatrzymaj próbkę' : 'Odtwórz próbkę'}
                          icon={isPlaying ? '⏸' : '▶'}
                          onPress={() => handlePreview(item)}
                        />
                      ) : null
                    }
                  />
                );
              })
            )}

            <GlassPanel style={styles.statusCard}>
              <SectionHeading title="Text to Speech" style={styles.statusHeading} />
              <Text style={styles.statusLine}>Gotowe sceny do audio: {readySceneCount}</Text>
              {generatingSceneCount > 0 && (
                <Text style={styles.statusLine}>Audio w toku: {generatingSceneCount}</Text>
              )}
              {erroredSceneCount > 0 && (
                <Text style={styles.errorText}>Sceny z błędem audio: {erroredSceneCount}</Text>
              )}
              {readySceneCount === 0 && generatingSceneCount === 0 && (
                <Text style={styles.hintText}>
                  Zatwierdź tekst scen po OCR, aby uruchomić TTS.
                </Text>
              )}
            </GlassPanel>

            <SectionHeading title="Wygenerowane audio" style={styles.sectionHeading} />
            {audioTracks.length === 0 ? (
              <Text style={styles.emptyText}>Nie ma jeszcze wygenerowanych ścieżek audio.</Text>
            ) : (
              audioTracks.map((track) => {
                const isPlaying = playingTrackId === track.id;
                return (
                  <GlassPanel key={track.id} style={styles.audioCard}>
                    <View style={styles.audioInfo}>
                      <Text style={styles.audioTitle}>Scena {getTrackSceneNumber(track)}</Text>
                      <Text style={styles.audioMeta}>
                        {formatDuration(track.durationMs)} · {formatFileSize(track.fileSize)}
                      </Text>
                    </View>
                    <RoundIconButton
                      label={
                        isPlaying
                          ? `Wstrzymaj scenę ${getTrackSceneNumber(track)}`
                          : `Odtwórz scenę ${getTrackSceneNumber(track)}`
                      }
                      icon={isPlaying ? '⏸' : '▶'}
                      onPress={() => handlePlayTrack(track)}
                      style={styles.audioPlayBtn}
                    />
                  </GlassPanel>
                );
              })
            )}
          </ScrollView>

          <View style={styles.bottomBar}>
            <PearlButton
              label={generating ? '…' : getGenerateLabel()}
              onPress={handleGenerateAudio}
              disabled={!canGenerate}
              style={styles.generateBtn}
            />
          </View>
        </View>
      </FadeZoomContent>
    </AudioFlowScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: t.spacing.gutterMobile, paddingBottom: 120 },
  langHint: {
    color: t.color.text.onSurfaceMuted,
    fontSize: 13,
    fontFamily: 'VarelaRound_400Regular',
    marginBottom: t.spacing.stackMd,
  },
  sectionHeading: { marginBottom: t.spacing.stackSm },
  voiceCard: { marginBottom: t.spacing.stackSm },
  emptyText: {
    color: t.color.text.onSurfaceMuted,
    fontSize: 15,
    fontFamily: 'VarelaRound_400Regular',
    lineHeight: 21,
  },
  errorText: {
    color: t.color.accent.danger,
    fontSize: 15,
    fontFamily: 'VarelaRound_400Regular',
    lineHeight: 21,
  },
  hintText: {
    color: t.color.text.onSurfaceSubtle,
    fontSize: 14,
    fontFamily: 'VarelaRound_400Regular',
    lineHeight: 20,
    marginTop: t.spacing.stackSm,
  },
  statusCard: {
    borderRadius: t.radius.card,
    padding: t.spacing.gutterMobile,
    marginBottom: t.spacing.stackMd,
  },
  statusHeading: { marginBottom: t.spacing.stackSm },
  statusLine: {
    color: t.color.text.onDark,
    fontSize: 15,
    fontFamily: 'VarelaRound_400Regular',
    marginBottom: 4,
  },
  audioCard: {
    borderRadius: t.radius.card,
    padding: 14,
    marginBottom: t.spacing.stackSm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  audioInfo: { flex: 1 },
  audioTitle: {
    color: t.color.text.onDark,
    fontSize: 15,
    fontFamily: 'Quicksand_600SemiBold',
    marginBottom: 4,
  },
  audioMeta: {
    color: t.color.text.onSurfaceMuted,
    fontSize: 13,
    fontFamily: 'VarelaRound_400Regular',
  },
  audioPlayBtn: { marginLeft: 12 },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: t.spacing.gutterMobile,
    backgroundColor: t.color.surface.glassMuted,
    borderTopWidth: 1,
    borderTopColor: t.color.surface.glassEdge,
  },
  generateBtn: { alignSelf: 'stretch' },
});

function formatDuration(durationMs: number): string {
  return `${Math.round(durationMs / 1000)} s`;
}

function formatFileSize(fileSize: number): string {
  return `${Math.max(1, Math.round(fileSize / 1024))} KB`;
}
