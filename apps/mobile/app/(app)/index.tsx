import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ProjectResponse, ProjectStatus } from '@book-scanner/shared';

import {
  AudioFlowFooterMenu,
  AudioFlowScreen,
  FilterChip,
  GhostButton,
  GlassPanel,
  PearlButton,
  ProjectCard,
  audioFlowStyles,
  audioFlowTokens,
} from '../../components/audioflow';
import { useToast } from '../../components/Toast';
import { api } from '../../lib/api';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Szkic',
  ocr_processing: 'OCR w toku',
  ready_for_tts: 'Gotowe do TTS',
  completed: 'Gotowe',
};

const FILTER_OPTIONS: { label: string; value: ProjectStatus | 'all' }[] = [
  { label: 'Wszystkie', value: 'all' },
  { label: 'Szkice', value: 'draft' },
  { label: 'OCR', value: 'ocr_processing' },
  { label: 'Do TTS', value: 'ready_for_tts' },
  { label: 'Gotowe', value: 'completed' },
];

type SortKey = 'date' | 'title' | 'status';

const SORT_OPTIONS: { label: string; value: SortKey }[] = [
  { label: 'Data', value: 'date' },
  { label: 'Tytuł', value: 'title' },
  { label: 'Status', value: 'status' },
];

export default function ProjectsScreen() {
  const { showToast } = useToast();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isTablet = width >= 768;
  const footerPadding = 104 + Math.max(insets.bottom, 8);

  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ProjectStatus | 'all'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('date');

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

  const filtered = useMemo(() => {
    let list = filter === 'all' ? projects : projects.filter((p) => p.status === filter);
    list = [...list].sort((a, b) => {
      if (sortKey === 'title') return a.title.localeCompare(b.title);
      if (sortKey === 'status') return a.status.localeCompare(b.status);
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
    return list;
  }, [projects, filter, sortKey]);

  const handleDelete = (project: ProjectResponse) => {
    Alert.alert('Usuń projekt', `Czy na pewno chcesz usunąć "${project.title}"?`, [
      { text: 'Anuluj', style: 'cancel' },
      {
        text: 'Usuń',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteProject(project.id);
            setProjects((prev) => prev.filter((p) => p.id !== project.id));
            showToast('Projekt usunięty');
          } catch {
            showToast('Nie udało się usunąć projektu', 'error');
          }
        },
      },
    ]);
  };

  const createProject = () => router.push('/(app)/projects/new');

  const renderProject = ({ item }: { item: ProjectResponse }) => (
    <ProjectCard
      actions={
        <>
          <GhostButton
            label="Edytuj"
            onPress={() => router.push(`/(app)/projects/${item.id}/edit`)}
            style={styles.cardAction}
          />
          <GhostButton
            label="Usuń"
            onPress={() => handleDelete(item)}
            style={styles.cardActionDanger}
            textStyle={styles.cardActionDangerText}
          />
        </>
      }
      meta={`${item.language.toUpperCase()} · ${new Date(item.updatedAt).toLocaleDateString('pl-PL')}`}
      onPress={() => router.push(`/(app)/projects/${item.id}`)}
      statusLabel={STATUS_LABELS[item.status] || item.status}
      statusTone={item.status === 'completed' ? 'done' : 'neutral'}
      style={isTablet && styles.cardTablet}
      title={item.title}
    />
  );

  return (
    <AudioFlowScreen>
      <View style={styles.content}>
        <View style={styles.welcome}>
          <Text style={styles.eyebrow}>Biblioteka audiobooków</Text>
          <Text style={audioFlowStyles.headlineLg}>Witaj ponownie</Text>
          <Text style={styles.welcomeCopy}>
            {projects.length === 0
              ? 'Dodaj zdjęcia książki i zamień je w pierwszy audiobook.'
              : `Masz ${projects.length} ${projects.length === 1 ? 'projekt' : 'projekty'} w swojej bibliotece.`}
          </Text>
        </View>

        <GlassPanel style={styles.toolbar}>
          <View style={styles.toolbarHeader}>
            <Text style={audioFlowStyles.headlineMd}>Twoje Projekty</Text>
            <GhostButton label="Cennik" onPress={() => router.push('/(app)/pricing')} />
          </View>
          <View style={styles.chipRow}>
            {FILTER_OPTIONS.map((opt) => (
              <FilterChip
                key={opt.value}
                label={opt.label}
                onPress={() => setFilter(opt.value)}
                selected={filter === opt.value}
              />
            ))}
          </View>
          <View style={styles.chipRow}>
            {SORT_OPTIONS.map((opt) => (
              <FilterChip
                key={opt.value}
                label={opt.label}
                onPress={() => setSortKey(opt.value)}
                selected={sortKey === opt.value}
              />
            ))}
          </View>
        </GlassPanel>

        {loading ? (
          <GlassPanel
            style={[styles.statePanel, { marginBottom: footerPadding }]}
            testID="dashboard-state-panel"
          >
            <Text style={styles.emptyTitle}>Ładowanie biblioteki...</Text>
            <Text style={styles.emptyHint}>Przygotowujemy Twoje projekty AudioFlow.</Text>
          </GlassPanel>
        ) : filtered.length === 0 && projects.length > 0 ? (
          <GlassPanel
            style={[styles.statePanel, { marginBottom: footerPadding }]}
            testID="dashboard-state-panel"
          >
            <Text style={styles.emptyTitle}>Brak projektów z tym filtrem</Text>
            <Text style={styles.emptyHint}>Zmień filtr, aby wrócić do pełnej biblioteki.</Text>
            <PearlButton
              label="Pokaż wszystkie"
              onPress={() => setFilter('all')}
              style={styles.emptyCta}
            />
          </GlassPanel>
        ) : projects.length === 0 ? (
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
        ) : (
          <FlatList
            contentContainerStyle={[styles.list, { paddingBottom: footerPadding }]}
            data={filtered}
            key={isTablet ? 'tablet' : 'phone'}
            keyExtractor={(item) => item.id}
            numColumns={isTablet ? 2 : 1}
            renderItem={renderProject}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      <AudioFlowFooterMenu
        active="library"
        bottomInset={insets.bottom}
        onCreatePress={createProject}
        onLibraryPress={() => setFilter('all')}
        playerDisabled
      />
    </AudioFlowScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    gap: audioFlowTokens.spacing.stackMd,
    paddingHorizontal: audioFlowTokens.spacing.marginMobile,
  },
  list: {
    paddingTop: 4,
  },
  welcome: {
    alignItems: 'center',
    marginTop: 8,
  },
  eyebrow: {
    ...audioFlowStyles.eyebrow,
    marginBottom: audioFlowTokens.spacing.stackSm,
    textAlign: 'center',
  },
  welcomeCopy: {
    ...audioFlowStyles.body,
    marginTop: audioFlowTokens.spacing.stackSm,
    textAlign: 'center',
  },
  toolbar: {
    gap: audioFlowTokens.spacing.stackMd,
    padding: audioFlowTokens.spacing.stackMd,
  },
  toolbarHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cardTablet: {
    flex: 1,
    marginHorizontal: 6,
  },
  cardAction: {
    minHeight: 38,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  cardActionDanger: {
    minHeight: 38,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  cardActionDangerText: {
    color: audioFlowTokens.color.accent.danger,
  },
  statePanel: {
    alignItems: 'center',
    gap: audioFlowTokens.spacing.stackSm,
    marginTop: audioFlowTokens.spacing.stackMd,
    padding: audioFlowTokens.spacing.stackLg,
  },
  emptyTitle: {
    color: audioFlowTokens.color.text.onDark,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyHint: {
    ...audioFlowStyles.body,
    textAlign: 'center',
  },
  emptyCta: {
    marginTop: audioFlowTokens.spacing.stackMd,
  },
});
