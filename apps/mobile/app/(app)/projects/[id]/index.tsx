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
import {
  AudioFlowFooterMenu,
  AudioFlowPlayerPanel,
  AudioFlowScreen,
  GhostButton,
  GlassPanel,
  ProjectToolTile,
  RoundIconButton,
  StatusPill,
  TopAppBar,
  audioFlowStyles,
  audioFlowTokens,
} from '../../../../components/audioflow';
import {
  AudioFlowGlobalMenuButton,
  AudioFlowTopChrome,
} from '../../../../components/audioflow-global-navigation';
import type { AudioTrackResponse, ProjectResponse } from '@book-scanner/shared';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Szkic',
  ocr_processing: 'OCR w toku',
  ready_for_tts: 'Gotowe do TTS',
  completed: 'Gotowe',
};

const HERO_HEIGHT = Math.max(Dimensions.get('window').height * 0.52, 442);
const t = audioFlowTokens;

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

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      (async () => {
        try {
          const [projectData, audioTracks] = await Promise.all([
            api.getProject(id),
            api.getAudioTracks(id),
          ]);

          if (!isActive) return;

          setProject(projectData);
          setAudioTracks(audioTracks);
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
              right={<AudioFlowGlobalMenuButton />}
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
  const voiceMeta = project.voiceId ? `Lektor: ${project.voiceId}` : 'Lektor do wyboru';
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
            right={<AudioFlowGlobalMenuButton />}
            title="Projekt"
          />
        </AudioFlowTopChrome>

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
                  currentTime="00:00"
                  totalTime={totalDuration}
                  progress={0}
                  onNextPress={handleOpenPlayer}
                  onPlayPress={handleOpenPlayer}
                  onPreviousPress={handleOpenPlayer}
                />
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
                <Text style={styles.toolsCount}>3 dostępne</Text>
              </View>
              <GhostButton
                label="Opcje projektu"
                onPress={handleProjectOptions}
                style={styles.toolsMoreButton}
              />
            </View>
            <View style={styles.toolsGrid}>
              <ProjectToolTile
                accessibilityLabel="Otwórz zdjęcia stron"
                body="Skanuj, kadruj i porządkuj strony książki."
                icon="▧"
                meta="OCR"
                onPress={() => router.push(`/(app)/projects/${id}/images`)}
                title="Zdjęcia stron"
              />

              <ProjectToolTile
                accessibilityLabel="Otwórz głos i audio"
                body={
                  project.voiceId
                    ? `Lektor: ${project.voiceId}`
                    : 'Wybierz lektora, ton i tempo nagrania.'
                }
                icon="≋"
                meta="AI"
                onPress={() => router.push(`/(app)/projects/${id}/voice`)}
                title="Głos i audio"
              />

              <ProjectToolTile
                accessibilityLabel="Otwórz udostępnianie"
                body="Link i kod QR dla odbiorców."
                icon="↗"
                meta="Link"
                onPress={() => router.push(`/(app)/projects/${id}/sharing`)}
                title="Udostępnij"
              />
            </View>
          </View>
        </ScrollView>
      </View>

      <AudioFlowFooterMenu
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
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: t.spacing.stackSm,
    justifyContent: 'space-between',
  },
  toolsHeadingTexts: {
    flex: 1,
    gap: 4,
  },
  toolsMoreButton: {
    minHeight: 40,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  toolsCount: {
    color: t.color.text.onSurfaceSubtle,
    fontSize: 12,
    fontWeight: '600',
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: t.spacing.stackMd,
  },
});
