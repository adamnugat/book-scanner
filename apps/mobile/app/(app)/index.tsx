import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  StyleSheet,
  Alert,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../lib/auth-context';
import { useToast } from '../../components/Toast';
import { ProjectListSkeleton } from '../../components/Skeleton';
import { api } from '../../lib/api';
import type { ProjectResponse, ProjectStatus } from '@book-scanner/shared';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Szkic',
  ocr_processing: 'OCR w toku',
  ready_for_tts: 'Gotowe do TTS',
  completed: 'Gotowe',
};

const STATUS_COLORS: Record<string, string> = {
  draft: '#888',
  ocr_processing: '#f0a500',
  ready_for_tts: '#00b4d8',
  completed: '#06d6a0',
};

const FILTER_OPTIONS: { label: string; value: ProjectStatus | 'all' }[] = [
  { label: 'Wszystkie', value: 'all' },
  { label: 'Szkice', value: 'draft' },
  { label: 'OCR', value: 'ocr_processing' },
  { label: 'Do TTS', value: 'ready_for_tts' },
  { label: 'Gotowe', value: 'completed' },
];

type SortKey = 'date' | 'title' | 'status';

export default function ProjectsScreen() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isTablet = width >= 768;
  const headerTopPadding = 20 + Math.max(insets.top, Platform.OS === 'web' ? 16 : 12);

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

  useFocusEffect(useCallback(() => { loadProjects(); }, [loadProjects]));

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

  const renderProject = ({ item }: { item: ProjectResponse }) => (
    <Pressable
      style={[styles.card, isTablet && styles.cardTablet]}
      onPress={() => router.push(`/(app)/projects/${item.id}`)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] + '22' }]}>
          <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}>
            {STATUS_LABELS[item.status] || item.status}
          </Text>
        </View>
      </View>
      <Text style={styles.cardMeta}>
        {item.language.toUpperCase()} · {new Date(item.updatedAt).toLocaleDateString('pl-PL')}
      </Text>
      <View style={styles.cardActions}>
        <Pressable style={styles.actionBtn} onPress={() => router.push(`/(app)/projects/${item.id}/edit`)}>
          <Text style={styles.actionText}>Edytuj</Text>
        </Pressable>
        <Pressable style={styles.actionBtnDanger} onPress={() => handleDelete(item)}>
          <Text style={styles.actionTextDanger}>Usuń</Text>
        </Pressable>
      </View>
    </Pressable>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: headerTopPadding }]}>
          <View>
            <Text style={styles.title}>Moje projekty</Text>
            <Text style={styles.subtitle}>{user?.email}</Text>
          </View>
        </View>
        <ProjectListSkeleton count={4} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: headerTopPadding }]}>
        <View>
          <Text style={styles.title}>Moje projekty</Text>
          <Text style={styles.subtitle}>{user?.email}</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable style={styles.pricingBtn} onPress={() => router.push('/(app)/pricing')}>
            <Text style={styles.pricingBtnText}>Cennik</Text>
          </Pressable>
          <Pressable style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.logoutText}>Wyloguj</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.toolbar}>
        <View style={styles.filterRow}>
          {FILTER_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              style={[styles.filterChip, filter === opt.value && styles.filterChipActive]}
              onPress={() => setFilter(opt.value)}
            >
              <Text style={[styles.filterChipText, filter === opt.value && styles.filterChipTextActive]}>
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.sortRow}>
          {([['date', 'Data'], ['title', 'Tytuł'], ['status', 'Status']] as const).map(([key, label]) => (
            <Pressable
              key={key}
              style={[styles.sortBtn, sortKey === key && styles.sortBtnActive]}
              onPress={() => setSortKey(key)}
            >
              <Text style={[styles.sortBtnText, sortKey === key && styles.sortBtnTextActive]}>
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {filtered.length === 0 && projects.length > 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Brak projektów z tym filtrem</Text>
          <Pressable style={styles.createButton} onPress={() => setFilter('all')}>
            <Text style={styles.createButtonText}>Pokaż wszystkie</Text>
          </Pressable>
        </View>
      ) : projects.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Nie masz jeszcze żadnych projektów</Text>
          <Text style={styles.emptyHint}>Stwórz swój pierwszy audiobook!</Text>
          <Pressable style={styles.createButton} onPress={() => router.push('/(app)/projects/new')}>
            <Text style={styles.createButtonText}>+ Nowy projekt</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            renderItem={renderProject}
            contentContainerStyle={styles.list}
            numColumns={isTablet ? 2 : 1}
            key={isTablet ? 'tablet' : 'phone'}
          />
          <Pressable style={styles.fab} onPress={() => router.push('/(app)/projects/new')}>
            <Text style={styles.fabText}>+</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, paddingBottom: 12,
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#e0e0e0' },
  subtitle: { fontSize: 13, color: '#666', marginTop: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pricingBtn: { padding: 8, backgroundColor: '#0f3460', borderRadius: 6, paddingHorizontal: 12 },
  pricingBtnText: { color: '#f0a500', fontSize: 13, fontWeight: '600' },
  logoutBtn: { padding: 8 },
  logoutText: { color: '#e94560', fontSize: 14 },

  toolbar: { paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#16213e', borderWidth: 1, borderColor: '#0f3460' },
  filterChipActive: { backgroundColor: '#e9456022', borderColor: '#e94560' },
  filterChipText: { color: '#888', fontSize: 12 },
  filterChipTextActive: { color: '#e94560', fontWeight: '600' },
  sortRow: { flexDirection: 'row', gap: 6 },
  sortBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
  sortBtnActive: { backgroundColor: '#0f3460' },
  sortBtnText: { color: '#666', fontSize: 12 },
  sortBtnTextActive: { color: '#e0e0e0', fontWeight: '600' },

  list: { padding: 16, paddingTop: 4 },
  card: {
    backgroundColor: '#16213e', borderRadius: 12, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: '#0f3460',
  },
  cardTablet: { flex: 1, marginHorizontal: 6 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 18, fontWeight: '600', color: '#e0e0e0', flex: 1, marginRight: 8 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '600' },
  cardMeta: { fontSize: 13, color: '#666', marginTop: 8 },
  cardActions: { flexDirection: 'row', gap: 12, marginTop: 12 },
  actionBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, backgroundColor: '#0f3460' },
  actionText: { color: '#e0e0e0', fontSize: 13 },
  actionBtnDanger: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
  actionTextDanger: { color: '#e94560', fontSize: 13 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyTitle: { fontSize: 18, color: '#e0e0e0', textAlign: 'center' },
  emptyHint: { fontSize: 14, color: '#888', marginTop: 8, textAlign: 'center' },
  createButton: { marginTop: 24, backgroundColor: '#e94560', borderRadius: 8, paddingVertical: 14, paddingHorizontal: 32 },
  createButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  fab: {
    position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#e94560', alignItems: 'center', justifyContent: 'center', elevation: 4,
  },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 30 },
});
