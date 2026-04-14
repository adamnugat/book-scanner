import { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { api } from '../../../../lib/api';
import type { VoiceResponse, ProjectResponse } from '@book-scanner/shared';

export default function VoiceSelectScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [voices, setVoices] = useState<VoiceResponse[]>([]);
  const [project, setProject] = useState<ProjectResponse | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [playingPreview, setPlayingPreview] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [proj, voiceList] = await Promise.all([
          api.getProject(id),
          api.getVoices(),
        ]);
        setProject(proj);
        setSelected(proj.voiceId);

        const filtered = voiceList.filter(
          (v) => v.language === proj.language || v.language === 'multi',
        );
        setVoices(filtered.length > 0 ? filtered : voiceList);
      } catch {
        Alert.alert('Błąd', 'Nie udało się pobrać danych');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleSelect = async (voiceId: string) => {
    setSelected(voiceId);
    setSaving(true);
    try {
      await api.updateProject(id, { voiceId });
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
      Alert.alert('Generacja audio', 'Generacja audio została uruchomiona. Sprawdź postęp w scenach.');
      router.push(`/(app)/projects/${id}/scenes`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Nie udało się uruchomić generacji';
      Alert.alert('Błąd', msg);
    } finally {
      setGenerating(false);
    }
  };

  const renderVoice = ({ item }: { item: VoiceResponse }) => {
    const isSelected = selected === item.elevenlabsVoiceId;
    const isPlaying = playingPreview === item.id;
    return (
      <Pressable
        style={[styles.voiceCard, isSelected && styles.voiceCardSelected]}
        onPress={() => handleSelect(item.elevenlabsVoiceId)}
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
        <Text style={styles.title}>Wybierz głos lektora</Text>
        <Text style={styles.subtitle}>
          Język projektu: {project?.language === 'pl' ? 'Polski' : 'English'}
        </Text>
      </View>

      <FlatList
        data={voices}
        keyExtractor={(item) => item.id}
        renderItem={renderVoice}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Brak dostępnych głosów</Text>
        }
      />

      <View style={styles.bottomBar}>
        <Pressable
          style={[styles.generateBtn, !selected && styles.generateBtnDisabled]}
          onPress={handleGenerateAudio}
          disabled={!selected || generating}
        >
          {generating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.generateBtnText}>
              {selected ? 'Generuj audio' : 'Najpierw wybierz głos'}
            </Text>
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
  list: { padding: 16, paddingBottom: 100 },
  voiceCard: {
    backgroundColor: '#16213e', borderRadius: 10, padding: 16, marginBottom: 8,
    borderWidth: 2, borderColor: '#0f3460', flexDirection: 'row', alignItems: 'center',
  },
  voiceCardSelected: { borderColor: '#e94560', backgroundColor: '#e9456015' },
  voiceInfo: { flex: 1 },
  voiceName: { color: '#e0e0e0', fontSize: 16, fontWeight: '600' },
  voiceNameSelected: { color: '#e94560' },
  voiceLang: { color: '#888', fontSize: 12, marginTop: 2 },
  voiceActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  previewBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#0f3460',
    alignItems: 'center', justifyContent: 'center',
  },
  previewBtnText: { fontSize: 16 },
  checkmark: { color: '#e94560', fontSize: 20, fontWeight: 'bold' },
  emptyText: { color: '#888', fontSize: 16, textAlign: 'center', marginTop: 40 },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16,
    backgroundColor: '#1a1a2e', borderTopWidth: 1, borderTopColor: '#0f3460',
  },
  generateBtn: { backgroundColor: '#e94560', borderRadius: 8, padding: 16, alignItems: 'center' },
  generateBtnDisabled: { opacity: 0.5 },
  generateBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
