import { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
  ScrollView,
  Dimensions,
  Image,
  Platform,
  ActionSheetIOS,
} from 'react-native';
import { Stack, useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../../../lib/api';
import { useAudioPlayer } from '../../../../lib/use-audio-player';
import {
  AudioFlowPlayerPanel,
  AudioFlowScreen,
  GlassPanel,
  RoundIconButton,
  StatusPill,
  TopAppBar,
  audioFlowStyles,
  audioFlowTokens,
} from '../../../../components/audioflow';
import { SectionTile } from '../../../../components/SectionTile';
import {
  AudioFlowBottomNavigation,
  AudioFlowGlobalMenuButton,
  AudioFlowTopChrome,
} from '../../../../components/audioflow-global-navigation';
import type { AudioTrackResponse, ProjectResponse, VoiceResponse } from '@book-scanner/shared';
import { FadeZoomContent } from '../../../../components/FadeZoomContent';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Szkic',
  ocr_processing: 'OCR w toku',
  ready_for_tts: 'Gotowe do TTS',
  completed: 'Gotowe',
};

const HERO_HEIGHT = Math.max(Dimensions.get('window').height * 0.44, 360);
const t = audioFlowTokens;
const PROJECT_TOOL_COUNT = 3;

const formatDuration = (durationMs: number) => {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (value: number) => String(value).padStart(2, '0');

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }

  return `${pad(minutes)}:${pad(seconds)}`;
};

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [project, setProject] = useState<ProjectResponse | null>(null);
  const [audioTracks, setAudioTracks] = useState<AudioTrackResponse[]>([]);
  const [voices, setVoices] = useState<VoiceResponse[]>([]);

  const audioPlayer = useAudioPlayer(id);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      (async () => {
        try {
          const [projectData, audioTracks, voicesData] = await Promise.all([
            api.getProject(id),
            api.getAudioTracks(id),
            api.getVoices(),
          ]);

          if (!isActive) return;

          setProject(projectData);
          setAudioTracks(audioTracks);
          setVoices(voicesData);
        } catch {
          Alert.alert('Błąd', 'Nie udało się pobrać projektu');
          router.back();
        }
      })();

      return () => {
        isActive = false;
      };
    }, [id]),
  );

  const handleDelete = () => {
    Alert.alert('Usuń projekt', `Czy na pewno chcesz usunąć "${project?.title}"?`, [
      { text: 'Anuluj', style: 'cancel' },
      {
        text: 'Usuń',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteProject(id);
            router.replace('/(app)');
          } catch {
            Alert.alert('Błąd', 'Nie udało się usunąć projektu');
          }
        },
      },
    ]);
  };

  const handleEdit = () => {
    router.push(`/(app)/projects/${id}/edit`);
  };

  const handleProjectOptions = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Anuluj', 'Edytuj projekt', 'Usuń projekt'],
          cancelButtonIndex: 0,
          destructiveButtonIndex: 2,
          title: project?.title,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) handleEdit();
          if (buttonIndex === 2) handleDelete();
        },
      );
      return;
    }

    Alert.alert('Opcje projektu', 'Wybierz akcję', [
      { text: 'Edytuj projekt', onPress: handleEdit },
      { text: 'Usuń projekt', style: 'destructive', onPress: handleDelete },
      { text: 'Anuluj', style: 'cancel' },
    ]);
  };

  const handleOpenPlayer = () => {
    router.push(`/(app)/projects/${id}/player`);
  };

  if (!project) {
    return (
      <AudioFlowScreen>
        <Stack.Screen
          options={{
            headerTitle: '',
            headerTransparent: true,
            headerShown: false,
            headerTintColor: '#fff',
          }}
        />
        <View style={styles.shell}>
          <AudioFlowTopChrome>
            <TopAppBar
              left={<RoundIconButton label="Wróć" icon="‹" onPress={() => router.back()} />}
              right={
                <View style={styles.topBarRight}>
                  <AudioFlowGlobalMenuButton />
                </View>
              }
              title="Projekt"
            />
          </AudioFlowTopChrome>
          <View style={styles.loadingState} />
        </View>
      </AudioFlowScreen>
    );
  }

  const hasAudio = audioTracks.length > 0;
  const statusLabel = STATUS_LABELS[project.status] || project.status;
  const totalDurationMs = audioTracks.reduce((sum, track) => sum + track.durationMs, 0);
  const totalDuration = formatDuration(totalDurationMs);
  const audioMeta =
    audioTracks.length === 1 ? '1 ścieżka audio' : `${audioTracks.length} ścieżek audio`;
  const languageMeta = project.language.toUpperCase();
  const voiceName = project.voiceId ? voices.find((v) => v.elevenlabsVoiceId === project.voiceId)?.name : null;
  const voiceMeta = voiceName ? `Lektor: ${voiceName}` : 'Lektor do wyboru';
  const interstitialMeta = project.interstitialPreset
    ? `Wstawka: ${project.interstitialPreset}`
    : 'Bez wstawki';

  return (
    <AudioFlowScreen>
      <Stack.Screen
        options={{
          headerTitle: '',
          headerTransparent: true,
          headerShown: false,
          headerTintColor: '#fff',
        }}
      />

      <View style={styles.shell}>
        <AudioFlowTopChrome>
          <TopAppBar
            left={<RoundIconButton label="Wróć" icon="‹" onPress={() => router.back()} />}
            right={
              <View style={styles.topBarRight}>
                <AudioFlowGlobalMenuButton />
              </View>
            }
            title="Projekt"
          />
        </AudioFlowTopChrome>

        <FadeZoomContent>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
        >
          {hasAudio ? (
            <View style={[styles.hero, { minHeight: HERO_HEIGHT }]} testID="audioflow-project-hero">
              {project.coverUrl ? (
                <Image source={{ uri: project.coverUrl }} style={styles.coverImage} />
              ) : (
                <View style={styles.coverArt}>
                  <View style={styles.coverBandPrimary} />
                  <View style={styles.coverBandSecondary} />
                  <View style={styles.coverOrbitLarge} />
                  <View style={styles.coverOrbitSmall} />
                </View>
              )}

              <View pointerEvents="none" style={styles.coverOverlay} />

              <View style={styles.heroContent}>
                <View style={styles.heroMetaRow}>
                  <StatusPill
                    label={statusLabel}
                    tone={project.status === 'completed' ? 'done' : 'neutral'}
                  />
                  <Text style={styles.heroMetaText}>
                    {languageMeta} • {audioMeta}
                  </Text>
                </View>

                <View>
                  <Text style={audioFlowStyles.eyebrow}>Audiobook</Text>
                  <Text style={[audioFlowStyles.headlineLg, styles.heroTitle]}>
                    {project.title}
                  </Text>
                  <Text style={styles.heroSubtitle}>
                    {voiceMeta} • {interstitialMeta}
                  </Text>
                </View>

                <AudioFlowPlayerPanel
                  progress={
                    audioPlayer.durationMs > 0
                      ? audioPlayer.positionMs / audioPlayer.durationMs
                      : 0
                  }
                  currentTime={formatDuration(audioPlayer.positionMs)}
                  totalTime={
                    audioPlayer.durationMs > 0
                      ? formatDuration(audioPlayer.durationMs)
                      : totalDuration
                  }
                  isPlaying={audioPlayer.isPlaying}
                  onPlayPress={() => audioPlayer.handlePlayPause()}
                  onPreviousPress={() => audioPlayer.goToSceneIndex(-1)}
                  onNextPress={() => audioPlayer.goToSceneIndex(1)}
                  onSkipBack={() => audioPlayer.seekBy(-10000)}
                  onSkipForward={() => audioPlayer.seekBy(10000)}
                />
                <Pressable
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.advancedPlayerButton, pressed && styles.pressed]}
                  onPress={handleOpenPlayer}
                >
                  <Text style={styles.advancedPlayerButtonText}>Zaawansowany odtwarzacz</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.creationHeader}>
              <GlassPanel style={styles.nextStepPanel}>
                <View style={styles.heroMetaRow}>
                  <StatusPill
                    label={statusLabel}
                    tone={project.status === 'completed' ? 'done' : 'neutral'}
                  />
                  <Text style={styles.heroMetaText}>{languageMeta}</Text>
                </View>
                <Text style={audioFlowStyles.eyebrow}>Etap audiobooka</Text>
                <Text style={[audioFlowStyles.headlineMd, styles.nextStepTitle]}>
                  {project.status === 'ready_for_tts'
                    ? 'Następny krok: Text to Speech'
                    : 'Przygotuj tekst przed nagraniem'}
                </Text>
                <Text style={audioFlowStyles.body}>
                  {project.status === 'ready_for_tts'
                    ? 'OCR jest gotowy. Wybierz głos lektora, a potem uruchom generowanie audio dla zatwierdzonych scen.'
                    : 'Najpierw zakończ OCR i zatwierdź tekst scen.'}
                </Text>
                {project.status === 'ready_for_tts' && (
                  <Pressable
                    accessibilityRole="button"
                    style={({ pressed }) => [styles.nextStepButton, pressed && styles.pressed]}
                    onPress={() => router.push(`/(app)/projects/${id}/voice`)}
                  >
                    <Text style={styles.nextStepButtonText}>Wybierz głos i generuj audio</Text>
                  </Pressable>
                )}
              </GlassPanel>
            </View>
          )}

          <View style={styles.toolsSection}>
            <View style={styles.toolsHeading}>
              <View style={styles.toolsHeadingTexts}>
                <Text style={audioFlowStyles.headlineMd}>Narzędzia projektu</Text>
                <Text style={styles.toolsCount}>{`${PROJECT_TOOL_COUNT} dostępne`}</Text>
              </View>
              <RoundIconButton icon="⋮" label="Opcje projektu" onPress={handleProjectOptions} />
            </View>
            <View style={styles.toolsList}>
              <SectionTile
                accessibilityLabel="Otwórz zdjęcia stron"
                title="Zdjęcia stron"
                summary={statusLabel}
                trailingIcon="chevron-right"
                onPress={() => router.push(`/(app)/projects/${id}/images`)}
              />

              <SectionTile
                accessibilityLabel="Otwórz głos i audio"
                title="Głos i audio"
                summary={voiceName ?? 'Nie wybrano'}
                trailingIcon="chevron-right"
                onPress={() => router.push(`/(app)/projects/${id}/voice`)}
              />

              <SectionTile
                accessibilityLabel="Otwórz udostępnianie"
                title="Udostępnij"
                summary="Link i kod QR"
                trailingIcon="chevron-right"
                onPress={() => router.push(`/(app)/projects/${id}/sharing`)}
              />
            </View>
          </View>
        </ScrollView>
        </FadeZoomContent>
      </View>

      <AudioFlowBottomNavigation
        active="player"
        bottomInset={insets.bottom}
        onCreatePress={() => router.push('/(app)/projects/new')}
        onLibraryPress={() => router.replace('/(app)')}
        onPlayerPress={handleOpenPlayer}
        playerDisabled={!hasAudio}
      />
    </AudioFlowScreen>
  );
}

const styles = StyleSheet.create({
  topBarRight: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
  },
  shell: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
  loadingState: {
    flex: 1,
  },
  hero: {
    borderBottomLeftRadius: t.radius.panel,
    borderBottomRightRadius: t.radius.panel,
    overflow: 'hidden',
    width: '100%',
  },
  coverImage: {
    ...StyleSheet.absoluteFillObject,
    height: '100%',
    width: '100%',
  },
  coverArt: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: t.color.background.deep1,
    overflow: 'hidden',
  },
  coverBandPrimary: {
    position: 'absolute',
    bottom: 118,
    height: 128,
    left: -48,
    right: -32,
    transform: [{ rotate: '-12deg' }],
    backgroundColor: 'rgba(240, 234, 214, 0.16)',
  },
  coverBandSecondary: {
    position: 'absolute',
    bottom: 72,
    height: 108,
    left: -64,
    right: -48,
    transform: [{ rotate: '-9deg' }],
    backgroundColor: 'rgba(255, 177, 200, 0.18)',
  },
  coverOrbitLarge: {
    borderColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: 120,
    borderWidth: 1,
    height: 240,
    position: 'absolute',
    right: -30,
    top: 70,
    width: 240,
  },
  coverOrbitSmall: {
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 76,
    borderWidth: 1,
    height: 152,
    position: 'absolute',
    right: 14,
    top: 114,
    width: 152,
  },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20, 10, 10, 0.36)',
  },
  heroContent: {
    position: 'absolute',
    bottom: t.spacing.stackLg,
    gap: t.spacing.stackMd,
    left: t.spacing.marginMobile,
    right: t.spacing.marginMobile,
  },
  heroMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: t.spacing.stackSm,
    justifyContent: 'space-between',
  },
  heroMetaText: {
    color: t.color.text.onSurfaceSubtle,
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
  },
  heroTitle: {
    marginTop: 4,
  },
  heroSubtitle: {
    ...t.typography.bodyMd,
    color: t.color.text.onSurfaceSubtle,
    marginTop: 4,
  },
  creationHeader: {
    gap: t.spacing.stackMd,
    paddingHorizontal: t.spacing.marginMobile,
  },
  nextStepPanel: {
    gap: t.spacing.stackMd,
    padding: t.spacing.stackLg,
  },
  nextStepTitle: {
    marginTop: -4,
  },
  nextStepButton: {
    alignItems: 'center',
    backgroundColor: t.color.accent.pearl,
    borderRadius: t.radius.full,
    marginTop: 4,
    minHeight: 52,
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  nextStepButtonText: {
    color: t.color.text.onPearl,
    fontSize: 15,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.97 }],
  },
  toolsSection: {
    gap: t.spacing.stackMd,
    paddingHorizontal: t.spacing.marginMobile,
    paddingTop: t.spacing.stackLg,
  },
  toolsHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: t.spacing.stackSm,
    justifyContent: 'space-between',
  },
  toolsHeadingTexts: {
    flex: 1,
    gap: 4,
  },
  toolsCount: {
    color: t.color.text.onSurfaceSubtle,
    fontSize: 12,
    fontWeight: '600',
  },
  toolsList: {
    flexDirection: 'column',
  },
  advancedPlayerButton: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginTop: 8,
  },
  advancedPlayerButtonText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontWeight: '500',
  },
});
