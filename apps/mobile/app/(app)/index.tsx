import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ProjectResponse } from '@book-scanner/shared';

import {
  audioFlowFontFamilies,
  GlassPanel,
  PearlButton,
  ProjectCard,
  audioFlowStyles,
  audioFlowTokens,
} from '../../components/audioflow';
import { AudioFlowBottomNavigation, AudioFlowScreenWithHeader, DashboardBrand } from '../../components/audioflow-global-navigation';
import { FadeZoomContent } from '../../components/FadeZoomContent';
import { useToast } from '../../components/Toast';
import { api } from '../../lib/api';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Szkic',
  ocr_processing: 'OCR w toku',
  ready_for_tts: 'Gotowe do TTS',
  completed: 'Gotowe',
};


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
      Alert.alert('Błąd', 'Nie udało się pobrać audiobooków');
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

  const createProject = () => router.push('/(app)/projects/new');

  const handleDeleteProject = useCallback(
    (item: ProjectResponse) => {
      Alert.alert(
        'Usuń audiobook',
        `Czy na pewno chcesz usunąć „${item.title}"? Tej operacji nie można cofnąć.`,
        [
          { text: 'Anuluj', style: 'cancel' },
          {
            text: 'Usuń',
            style: 'destructive',
            onPress: async () => {
              try {
                await api.deleteProject(item.id);
                setProjects((prev) => prev.filter((p) => p.id !== item.id));
                showToast('Audiobook usunięty');
              } catch {
                Alert.alert('Błąd', 'Nie udało się usunąć audiobooka');
              }
            },
          },
        ],
      );
    },
    [showToast],
  );

  const renderProject = ({ item, index }: { item: ProjectResponse; index: number }) => (
    <ProjectCard
      cardHeight={index === 0 ? CARD_HEIGHT_FIRST : index === 1 ? CARD_HEIGHT_SECOND : CARD_HEIGHT_REST}
      coverUrl={item.coverUrl}
      meta={`${item.language.toUpperCase()} · ${new Date(item.updatedAt).toLocaleDateString('pl-PL')}`}
      onLongPress={() => handleDeleteProject(item)}
      onPress={() => router.push(`/(app)/projects/${item.id}`)}
      projectId={item.id}
      statusLabel={STATUS_LABELS[item.status] || item.status}
      statusTone={item.status === 'completed' ? 'done' : 'neutral'}
      style={[
        isTablet && styles.cardTablet,
        index === 0 && styles.featuredCard,
        index === 1 && styles.secondCard,
      ]}
      title={item.title}
    />
  );

  const listHeader = (
    <View style={styles.welcome}>
      <Text style={styles.eyebrow}>Biblioteka audiobooków</Text>
      <Text style={styles.welcomeHeadline}>Witaj ponownie</Text>
      {projects.length === 0 ? (
        <Text style={styles.welcomeCopy}>
          Dodaj zdjęcia książki i zamień je w pierwszy audiobook.
        </Text>
      ) : (
        <View style={styles.welcomeCopyRow}>
          <Text style={styles.welcomeCopyInline}>Masz </Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{projects.length}</Text>
          </View>
          <Text style={styles.welcomeCopyInline}>
            {' '}{projects.length === 1 ? 'audiobook' : 'audiobooki'} w swojej bibliotece.
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <AudioFlowScreenWithHeader center={<DashboardBrand />} showBack={false}>
      <FadeZoomContent>
      <View style={styles.content}>
        {loading ? (
          <GlassPanel
            style={[styles.statePanel, { marginBottom: footerPadding }]}
            testID="dashboard-state-panel"
          >
            <Text style={styles.emptyTitle}>Ładowanie biblioteki...</Text>
            <Text style={styles.emptyHint}>Przygotowujemy Twoje audiobooki AudioFlow.</Text>
          </GlassPanel>
        ) : projects.length === 0 ? (
          <>
            {listHeader}
            <GlassPanel
              style={[styles.statePanel, { marginBottom: footerPadding }]}
              testID="dashboard-state-panel"
            >
              <Text style={styles.emptyTitle}>Nie masz jeszcze żadnych audiobooków</Text>
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
      </FadeZoomContent>

      <AudioFlowBottomNavigation
        active="library"
        bottomInset={insets.bottom}
        onCreatePress={createProject}
        variant="create-only"
      />
    </AudioFlowScreenWithHeader>
  );
}

const CARD_HEIGHT_FIRST = 130;
const CARD_HEIGHT_SECOND = 90;
const CARD_HEIGHT_REST = 55;

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
    marginBottom: t.spacing.sectionGap,
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
  welcomeCopyRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: t.spacing.stackSm,
    width: '100%',
  },
  welcomeCopy: {
    ...audioFlowStyles.body,
    marginTop: t.spacing.stackSm,
    textAlign: 'center',
    width: '100%',
  },
  welcomeCopyInline: {
    ...audioFlowStyles.body,
  },
  countBadge: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    justifyContent: 'center',
    minWidth: 24,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  countBadgeText: {
    color: '#1A1A2E',
    fontFamily: audioFlowFontFamilies.quicksandSemiBold,
    fontSize: 13,
    lineHeight: 18,
  },
  featuredCard: {
    shadowColor: t.color.accent.pearl,
    shadowOpacity: 0.24,
    shadowRadius: 28,
  },
  secondCard: {
    shadowColor: t.color.accent.pearl,
    shadowOpacity: 0.10,
    shadowRadius: 18,
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
