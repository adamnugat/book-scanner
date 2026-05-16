import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Image, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ProjectResponse } from '@book-scanner/shared';

import {
  AudioFlowScreen,
  audioFlowFontFamilies,
  GlassPanel,
  PearlButton,
  ProjectCard,
  RoundIconButton,
  audioFlowStyles,
  audioFlowTokens,
} from '../../components/audioflow';
import { AudioFlowBottomNavigation } from '../../components/audioflow-global-navigation';
import { useToast } from '../../components/Toast';
import { api } from '../../lib/api';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Szkic',
  ocr_processing: 'OCR w toku',
  ready_for_tts: 'Gotowe do TTS',
  completed: 'Gotowe',
};

/** Domyślny pasek postępu przy braku zapisanego stanu odtwarzacza (tylko UI). */
function dashboardPlaybackProgress(project: ProjectResponse): number {
  if (project.status === 'completed') return 0.35;
  if (project.status === 'ready_for_tts') return 0.2;
  return 0.08;
}

export default function ProjectsScreen() {
  const { showToast } = useToast();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isTablet = width >= 768;
  const footerPadding = 104 + Math.max(insets.bottom, 8);

  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProjects = useCallback(async () => {
    try {
      const data = await api.getProjects();
      setProjects(data);
    } catch {
      Alert.alert('Błąd', 'Nie udało się pobrać projektów');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProjects();
    }, [loadProjects]),
  );

  const sortedProjects = useMemo(
    () =>
      [...projects].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      ),
    [projects],
  );

  const lastPlayed = sortedProjects.length > 0 ? sortedProjects[0] : null;
  const lastPlayedProgress = lastPlayed ? dashboardPlaybackProgress(lastPlayed) : 0;

  const createProject = () => router.push('/(app)/projects/new');

  const openLastPlayedPlayer = () => {
    if (!lastPlayed) return;
    router.push(`/(app)/projects/${lastPlayed.id}/player`);
  };

  const renderProject = ({ item }: { item: ProjectResponse }) => (
    <ProjectCard
      coverUrl={item.coverUrl}
      meta={`${item.language.toUpperCase()} · ${new Date(item.updatedAt).toLocaleDateString('pl-PL')}`}
      onPress={() => router.push(`/(app)/projects/${item.id}`)}
      statusLabel={STATUS_LABELS[item.status] || item.status}
      statusTone={item.status === 'completed' ? 'done' : 'neutral'}
      style={isTablet && styles.cardTablet}
      title={item.title}
    />
  );

  const listHeader = (
    <>
      <View style={styles.welcome}>
        <Text style={styles.eyebrow}>Biblioteka audiobooków</Text>
        <Text style={styles.welcomeHeadline}>Witaj ponownie</Text>
        <Text style={styles.welcomeCopy}>
          {projects.length === 0
            ? 'Dodaj zdjęcia książki i zamień je w pierwszy audiobook.'
            : `Masz ${projects.length} ${projects.length === 1 ? 'projekt' : 'projekty'} w swojej bibliotece.`}
        </Text>
      </View>

      {lastPlayed ? (
        <>
          <GlassPanel style={styles.lastPlayedPanel} testID="dashboard-last-played">
            <View style={styles.lastPlayedProgressTrack}>
              <View style={[styles.lastPlayedProgressFill, { width: `${lastPlayedProgress * 100}%` }]} />
            </View>
            <View style={styles.lastPlayedRow}>
              <View style={styles.lastPlayedThumb}>
                {lastPlayed.coverUrl ? (
                  <Image
                    resizeMode="cover"
                    source={{ uri: lastPlayed.coverUrl }}
                    style={styles.lastPlayedThumbImage}
                  />
                ) : null}
              </View>
              <View style={styles.lastPlayedTextCol}>
                <Text style={styles.lastPlayedEyebrow}>Ostatnio odtwarzane</Text>
                <Text numberOfLines={2} style={styles.lastPlayedTitle}>
                  {lastPlayed.title}
                </Text>
              </View>
              <RoundIconButton
                icon="▶"
                label="Odtwórz ostatni audiobook"
                onPress={openLastPlayedPlayer}
              />
            </View>
          </GlassPanel>

          <View style={styles.projectsSection}>
            <Text
              accessibilityRole="header"
              nativeID="dashboard-projects-heading"
              style={styles.projectsSectionTitle}
            >
              Twoje Projekty
            </Text>
          </View>
        </>
      ) : null}
    </>
  );

  return (
    <AudioFlowScreen>
      <View style={styles.content}>
        {loading ? (
          <GlassPanel
            style={[styles.statePanel, { marginBottom: footerPadding }]}
            testID="dashboard-state-panel"
          >
            <Text style={styles.emptyTitle}>Ładowanie biblioteki...</Text>
            <Text style={styles.emptyHint}>Przygotowujemy Twoje projekty AudioFlow.</Text>
          </GlassPanel>
        ) : projects.length === 0 ? (
          <>
            {listHeader}
            <GlassPanel
              style={[styles.statePanel, { marginBottom: footerPadding }]}
              testID="dashboard-state-panel"
            >
              <Text style={styles.emptyTitle}>Nie masz jeszcze żadnych projektów</Text>
              <Text style={styles.emptyHint}>Stwórz swój pierwszy audiobook!</Text>
              <PearlButton
                accessibilityLabel="Utwórz pierwszy audiobook"
                label="Utwórz pierwszy audiobook"
                onPress={createProject}
                style={styles.emptyCta}
              />
            </GlassPanel>
          </>
        ) : (
          <FlatList
            ListHeaderComponent={listHeader}
            contentContainerStyle={[styles.list, { paddingBottom: footerPadding }]}
            data={sortedProjects}
            key={isTablet ? 'tablet' : 'phone'}
            keyExtractor={(item) => item.id}
            numColumns={isTablet ? 2 : 1}
            renderItem={renderProject}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      <AudioFlowBottomNavigation
        active="library"
        bottomInset={insets.bottom}
        onCreatePress={createProject}
        onLibraryPress={() => router.replace('/(app)')}
        playerDisabled
      />
    </AudioFlowScreen>
  );
}

const t = audioFlowTokens;

const styles = StyleSheet.create({
  content: {
    flex: 1,
    gap: t.spacing.stackMd,
    paddingHorizontal: t.spacing.marginMobile,
  },
  list: {
    paddingTop: t.spacing.gutterMobile,
  },
  welcome: {
    alignSelf: 'stretch',
    marginTop: t.spacing.stackMd,
    width: '100%',
  },
  eyebrow: {
    ...audioFlowStyles.eyebrow,
    marginBottom: t.spacing.stackSm,
    textAlign: 'center',
    width: '100%',
  },
  welcomeHeadline: {
    ...audioFlowStyles.headlineLg,
    textAlign: 'center',
    width: '100%',
  },
  welcomeCopy: {
    ...audioFlowStyles.body,
    marginTop: t.spacing.stackSm,
    textAlign: 'center',
    width: '100%',
  },
  projectsSection: {
    gap: t.spacing.stackMd,
    marginTop: t.spacing.sectionGap,
  },
  projectsSectionTitle: {
    ...audioFlowStyles.headlineMd,
    marginBottom: t.spacing.stackLg,
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowRadius: 10,
    width: '100%',
  },
  lastPlayedPanel: {
    marginTop: t.spacing.sectionGap,
    overflow: 'hidden',
    paddingBottom: 12,
    paddingHorizontal: 12,
    paddingTop: 12,
    position: 'relative',
  },
  lastPlayedRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  lastPlayedThumb: {
    backgroundColor: t.color.accent.pearlTint,
    borderRadius: t.radius.md,
    height: 48,
    overflow: 'hidden',
    width: 48,
  },
  lastPlayedThumbImage: {
    height: '100%',
    width: '100%',
  },
  lastPlayedTextCol: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  lastPlayedEyebrow: {
    ...t.typography.labelSm,
    color: t.color.text.onSurfaceSubtle,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  lastPlayedTitle: {
    ...t.typography.labelMd,
    color: t.color.text.onDark,
  },
  lastPlayedProgressTrack: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    bottom: 0,
    height: 2,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  lastPlayedProgressFill: {
    backgroundColor: t.color.accent.pearl,
    height: '100%',
    shadowColor: t.color.accent.pearl,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  cardTablet: {
    flex: 1,
    marginHorizontal: 6,
  },
  statePanel: {
    alignItems: 'center',
    gap: t.spacing.stackSm,
    marginTop: t.spacing.stackMd,
    padding: t.spacing.stackLg,
  },
  emptyTitle: {
    color: t.color.text.onDark,
    fontFamily: audioFlowFontFamilies.quicksandSemiBold,
    fontSize: 18,
    lineHeight: 24,
    textAlign: 'center',
  },
  emptyHint: {
    ...audioFlowStyles.body,
    textAlign: 'center',
  },
  emptyCta: {
    marginTop: t.spacing.stackMd,
  },
});
