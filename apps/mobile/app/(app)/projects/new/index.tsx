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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../../../lib/api';
import {
  AudioFlowFooterMenu,
  AudioFlowScreen,
  GlassPanel,
  PickerCard,
  SectionHeading,
  audioFlowStyles,
  audioFlowTokens,
} from '../../../../components/audioflow';
import { FadeZoomContent } from '../../../../components/FadeZoomContent';
import type { SupportedLanguage, VoiceResponse } from '@book-scanner/shared';
import { LOCAL_JINGLES } from '../../../../lib/local-jingles';

const LANGUAGES: { id: SupportedLanguage; label: string }[] = [
  { id: 'pl', label: 'Polski' },
  { id: 'en', label: 'English' },
];

export default function NewProjectScreen() {
  const insets = useSafeAreaInsets();
  const footerPadding = 104 + Math.max(insets.bottom, 8);

  const [title, setTitle] = useState('');
  const [language, setLanguage] = useState<SupportedLanguage>('pl');
  const [voices, setVoices] = useState<VoiceResponse[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(null);
  const [selectedPresetName, setSelectedPresetName] = useState<string>(LOCAL_JINGLES[0].name);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let isActive = true;

    (async () => {
      setLoadingOptions(true);
      try {
        const voiceList = await api.getVoices(language);

        if (!isActive) return;

        setVoices(voiceList);
        setSelectedVoiceId((current) =>
          current && voiceList.some((voice) => voice.elevenlabsVoiceId === current)
            ? current
            : (voiceList[0]?.elevenlabsVoiceId ?? null),
        );
      } catch {
        if (isActive) {
          Alert.alert('Błąd', 'Nie udało się pobrać głosów lektora');
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
    () => title.trim().length > 0 && Boolean(selectedVoiceId) && !submitting,
    [selectedVoiceId, submitting, title],
  );

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Brak tytułu', 'Podaj tytuł audiobooka');
      return;
    }

    if (!selectedVoiceId) {
      Alert.alert('Uzupełnij konfigurację', 'Wybierz głos lektora');
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
    <AudioFlowScreen>
      <FadeZoomContent>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: 24 + footerPadding }]}
      >
        <View style={styles.hero}>
          <Text style={styles.stepLabel}>Krok 1 z 3</Text>
          <Text style={styles.heading}>Zacznijmy od podstaw</Text>
          <Text style={styles.subheading}>
            Nadaj audiobookowi tytuł, wybierz język narracji i brzmienie, które poprowadzi słuchacza
            przez kolejne strony.
          </Text>
        </View>

        <GlassPanel style={styles.card}>
          <Text style={styles.label}>Tytuł</Text>
          <TextInput
            style={styles.input}
            placeholder="np. Pan Tadeusz"
            placeholderTextColor={audioFlowTokens.color.text.onSurfaceMuted}
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
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                >
                  <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>
                    {lang.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </GlassPanel>

        {loadingOptions ? (
          <GlassPanel style={styles.loadingCard}>
            <ActivityIndicator color={audioFlowTokens.color.accent.pearl} />
            <Text style={styles.loadingText}>Ładowanie głosów...</Text>
          </GlassPanel>
        ) : (
          <>
            <View style={styles.section}>
              <SectionHeading
                title="Lektor"
                hint="Wybierz głos, który przeczyta wszystkie strony."
                style={styles.sectionHeading}
              />
              {voices.length === 0 ? (
                <Text style={styles.emptyText}>Brak dostępnych głosów dla wybranego języka.</Text>
              ) : (
                voices.map((voice) => {
                  const selected = selectedVoiceId === voice.elevenlabsVoiceId;
                  return (
                    <PickerCard
                      key={voice.id}
                      selected={selected}
                      title={voice.name}
                      meta={voice.language.toUpperCase()}
                      onPress={() => setSelectedVoiceId(voice.elevenlabsVoiceId)}
                      style={styles.optionCard}
                    />
                  );
                })
              )}
            </View>

            <View style={styles.section}>
              <SectionHeading
                title="Wstawka muzyczna"
                hint="Ten dźwięk oddzieli pliki audio dla kolejnych stron."
                style={styles.sectionHeading}
              />
              {LOCAL_JINGLES.map((jingle) => {
                const selected = selectedPresetName === jingle.name;
                return (
                  <PickerCard
                    key={jingle.name}
                    selected={selected}
                    title={`${jingle.icon}  ${jingle.label}`}
                    onPress={() => setSelectedPresetName(jingle.name)}
                    style={styles.optionCard}
                  />
                );
              })}
            </View>
          </>
        )}

      </ScrollView>
      </FadeZoomContent>

      <AudioFlowFooterMenu
        active="library"
        bottomInset={insets.bottom}
        createIcon="›"
        createLabel={submitting ? 'Tworzenie...' : 'Dalej'}
        createDisabled={!canSubmit}
        onCreatePress={() => void handleCreate()}
        onLibraryPress={() => router.replace('/(app)')}
        playerDisabled
      />
    </AudioFlowScreen>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20 },
  hero: {
    marginBottom: 24,
    marginTop: 10,
  },
  stepLabel: {
    ...audioFlowStyles.eyebrow,
    marginBottom: 10,
  },
  heading: audioFlowStyles.headlineLg,
  subheading: { ...audioFlowStyles.body, marginTop: 12 },
  card: {
    padding: 18,
    marginBottom: 24,
  },
  label: {
    ...audioFlowStyles.eyebrow,
    color: audioFlowTokens.color.text.onDark,
    marginBottom: 8,
  },
  input: {
    ...audioFlowStyles.field,
    marginBottom: 18,
  },
  optionRow: { flexDirection: 'row', gap: 10 },
  choicePill: {
    flex: 1,
    borderRadius: audioFlowTokens.radius.card,
    borderWidth: 1,
    borderColor: audioFlowTokens.color.surface.glassEdge,
    paddingVertical: 13,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  choicePillSelected: {
    borderColor: audioFlowTokens.color.accent.pearlBorder,
    backgroundColor: audioFlowTokens.color.accent.pearlTint,
  },
  choiceText: {
    color: audioFlowTokens.color.text.onSurfaceSubtle,
    fontSize: 15,
    fontWeight: '700',
  },
  choiceTextSelected: { color: audioFlowTokens.color.text.onDark },
  loadingCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    marginBottom: 20,
  },
  loadingText: { color: audioFlowTokens.color.text.onSurfaceSubtle, marginTop: 10 },
  section: { marginBottom: 22 },
  sectionHeading: { marginBottom: 12 },
  emptyText: { color: audioFlowTokens.color.accent.danger, fontSize: 14, lineHeight: 20 },
  optionCard: { marginBottom: 10 },
});
