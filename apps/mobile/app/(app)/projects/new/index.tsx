import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { api } from '../../../../lib/api';
import type {
  InterstitialPresetResponse,
  SupportedLanguage,
  VoiceResponse,
} from '@book-scanner/shared';

const LANGUAGES: { id: SupportedLanguage; label: string }[] = [
  { id: 'pl', label: 'Polski' },
  { id: 'en', label: 'English' },
];

export default function NewProjectScreen() {
  const [title, setTitle] = useState('');
  const [language, setLanguage] = useState<SupportedLanguage>('pl');
  const [voices, setVoices] = useState<VoiceResponse[]>([]);
  const [presets, setPresets] = useState<InterstitialPresetResponse[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(null);
  const [selectedPresetName, setSelectedPresetName] = useState<string | null>(null);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let isActive = true;

    (async () => {
      setLoadingOptions(true);
      try {
        const [voiceList, presetList] = await Promise.all([
          api.getVoices(language),
          api.getInterstitialPresets(),
        ]);

        if (!isActive) return;

        setVoices(voiceList);
        setPresets(presetList);
        setSelectedVoiceId((current) =>
          current && voiceList.some((voice) => voice.elevenlabsVoiceId === current)
            ? current
            : voiceList[0]?.elevenlabsVoiceId ?? null,
        );
        setSelectedPresetName((current) =>
          current && presetList.some((preset) => preset.name === current)
            ? current
            : presetList[0]?.name ?? null,
        );
      } catch {
        if (isActive) {
          Alert.alert('Błąd', 'Nie udało się pobrać głosów lub wstawek audio');
        }
      } finally {
        if (isActive) setLoadingOptions(false);
      }
    })();

    return () => {
      isActive = false;
    };
  }, [language]);

  const canSubmit = useMemo(
    () => title.trim().length > 0 && Boolean(selectedVoiceId) && Boolean(selectedPresetName) && !submitting,
    [selectedPresetName, selectedVoiceId, submitting, title],
  );

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Brak tytułu', 'Podaj tytuł audiobooka');
      return;
    }

    if (!selectedVoiceId || !selectedPresetName) {
      Alert.alert('Uzupełnij konfigurację', 'Wybierz głos lektora i wstawkę między stronami');
      return;
    }

    setSubmitting(true);
    try {
      const project = await api.createProject({
        title: title.trim(),
        language,
        voiceId: selectedVoiceId,
        interstitialPreset: selectedPresetName,
      });
      router.replace(`/(app)/projects/new/images?projectId=${project.id}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Nie udało się stworzyć projektu';
      Alert.alert('Błąd', message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.stepLabel}>Krok 1 z 3</Text>
        <Text style={styles.heading}>Ustaw brzmienie audiobooka</Text>
        <Text style={styles.subheading}>
          Najpierw wybierz podstawy. Zdjęcia dodasz w następnym kroku.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Tytuł</Text>
        <TextInput
          style={styles.input}
          placeholder="np. Pan Tadeusz"
          placeholderTextColor="#7f8aa3"
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>Język</Text>
        <View style={styles.optionRow}>
          {LANGUAGES.map((lang) => {
            const selected = language === lang.id;
            return (
              <Pressable
                key={lang.id}
                style={[styles.choicePill, selected && styles.choicePillSelected]}
                onPress={() => setLanguage(lang.id)}
              >
                <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>
                  {lang.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {loadingOptions ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator color="#06d6a0" />
          <Text style={styles.loadingText}>Ładowanie głosów i wstawek...</Text>
        </View>
      ) : (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Głos lektora</Text>
            <Text style={styles.sectionHint}>Wybierz głos, który przeczyta wszystkie strony.</Text>
            {voices.length === 0 ? (
              <Text style={styles.emptyText}>Brak dostępnych głosów dla wybranego języka.</Text>
            ) : (
              voices.map((voice) => {
                const selected = selectedVoiceId === voice.elevenlabsVoiceId;
                return (
                  <Pressable
                    key={voice.id}
                    style={[styles.optionCard, selected && styles.optionCardSelected]}
                    onPress={() => setSelectedVoiceId(voice.elevenlabsVoiceId)}
                  >
                    <View>
                      <Text style={[styles.optionTitle, selected && styles.optionTitleSelected]}>
                        {voice.name}
                      </Text>
                      <Text style={styles.optionMeta}>{voice.language.toUpperCase()}</Text>
                    </View>
                    {selected && <Text style={styles.checkmark}>✓</Text>}
                  </Pressable>
                );
              })
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Wstawka między stronami</Text>
            <Text style={styles.sectionHint}>
              Ten krótki dźwięk oddzieli pliki audio dla kolejnych stron.
            </Text>
            {presets.length === 0 ? (
              <Text style={styles.emptyText}>Brak dostępnych wstawek audio.</Text>
            ) : (
              presets.map((preset) => {
                const selected = selectedPresetName === preset.name;
                return (
                  <Pressable
                    key={preset.id}
                    style={[styles.optionCard, selected && styles.optionCardSelected]}
                    onPress={() => setSelectedPresetName(preset.name)}
                  >
                    <View>
                      <Text style={[styles.optionTitle, selected && styles.optionTitleSelected]}>
                        {preset.name}
                      </Text>
                      <Text style={styles.optionMeta}>{formatDuration(preset.durationMs)}</Text>
                    </View>
                    {selected && <Text style={styles.checkmark}>✓</Text>}
                  </Pressable>
                );
              })
            )}
          </View>
        </>
      )}

      <Pressable
        style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
        onPress={handleCreate}
        disabled={!canSubmit}
      >
        {submitting ? (
          <ActivityIndicator color="#101320" />
        ) : (
          <Text style={styles.submitButtonText}>Dalej: dodaj zdjęcia</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

function formatDuration(durationMs: number): string {
  const seconds = Math.round(durationMs / 1000);
  return seconds === 1 ? '1 sekunda' : `${seconds} sek.`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#101320' },
  content: { padding: 20, paddingBottom: 36 },
  hero: {
    borderRadius: 28,
    padding: 24,
    marginBottom: 18,
    overflow: 'hidden',
    backgroundColor: '#18213d',
    borderWidth: 1,
    borderColor: '#29355c',
  },
  stepLabel: {
    color: '#06d6a0',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  heading: { color: '#fff', fontSize: 30, fontWeight: '900', lineHeight: 34 },
  subheading: { color: '#c9d6df', fontSize: 15, lineHeight: 21, marginTop: 12 },
  card: {
    backgroundColor: '#151b2f',
    borderRadius: 22,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#29355c',
  },
  label: { color: '#f0a500', fontSize: 12, fontWeight: '800', marginBottom: 8, textTransform: 'uppercase' },
  input: {
    backgroundColor: '#0f1629',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#29355c',
    color: '#fff',
    fontSize: 17,
    paddingHorizontal: 16,
    paddingVertical: 15,
    marginBottom: 18,
  },
  optionRow: { flexDirection: 'row', gap: 10 },
  choicePill: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#29355c',
    paddingVertical: 13,
    alignItems: 'center',
    backgroundColor: '#0f1629',
  },
  choicePillSelected: { borderColor: '#06d6a0', backgroundColor: '#073b3a' },
  choiceText: { color: '#aebbd3', fontSize: 15, fontWeight: '700' },
  choiceTextSelected: { color: '#06d6a0' },
  loadingCard: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    backgroundColor: '#151b2f',
  },
  loadingText: { color: '#c9d6df', marginTop: 10 },
  section: { marginBottom: 22 },
  sectionTitle: { color: '#fff', fontSize: 20, fontWeight: '900', marginBottom: 6 },
  sectionHint: { color: '#8f9bb3', fontSize: 14, lineHeight: 20, marginBottom: 12 },
  emptyText: { color: '#ff8fa3', fontSize: 14, lineHeight: 20 },
  optionCard: {
    backgroundColor: '#151b2f',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#29355c',
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionCardSelected: { borderColor: '#06d6a0', backgroundColor: '#073b3a' },
  optionTitle: { color: '#f6f8fb', fontSize: 17, fontWeight: '800' },
  optionTitleSelected: { color: '#06d6a0' },
  optionMeta: { color: '#8f9bb3', fontSize: 13, marginTop: 4 },
  checkmark: { color: '#06d6a0', fontSize: 22, fontWeight: '900' },
  submitButton: {
    backgroundColor: '#06d6a0',
    borderRadius: 18,
    paddingVertical: 17,
    alignItems: 'center',
    marginTop: 4,
  },
  submitButtonDisabled: { opacity: 0.45 },
  submitButtonText: { color: '#101320', fontSize: 16, fontWeight: '900' },
});
