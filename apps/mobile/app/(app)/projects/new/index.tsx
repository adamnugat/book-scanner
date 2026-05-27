import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import { api } from '../../../../lib/api';
import {
  AudioFlowFooterMenu,
  AudioFlowScreen,
  GlassPanel,
  PickerCard,
  SectionAccordion,
  audioFlowStyles,
  audioFlowTokens,
} from '../../../../components/audioflow';
import { FadeZoomContent } from '../../../../components/FadeZoomContent';
import type { SupportedLanguage, VoiceResponse } from '@book-scanner/shared';
import { LOCAL_JINGLES, type LocalJingle } from '../../../../lib/local-jingles';

const LANGUAGES: { id: SupportedLanguage; label: string }[] = [
  { id: 'pl', label: 'Polski' },
  { id: 'en', label: 'English' },
];

type ExpandedSection = 'language' | 'voice' | 'jingle' | null;

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
  const [expandedSection, setExpandedSection] = useState<ExpandedSection>(null);
  const [playingJingleName, setPlayingJingleName] = useState<string | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

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

  useEffect(() => {
    return () => {
      void soundRef.current?.unloadAsync();
    };
  }, []);

  const canSubmit = useMemo(
    () => title.trim().length > 0 && Boolean(selectedVoiceId) && !submitting,
    [selectedVoiceId, submitting, title],
  );

  const handleEditPress = (section: ExpandedSection) => {
    setExpandedSection((current) => (current === section ? null : section));
  };

  const handleJinglePress = async (jingle: LocalJingle) => {
    setSelectedPresetName(jingle.name);

    if (soundRef.current) {
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }

    if (playingJingleName === jingle.name) {
      setPlayingJingleName(null);
      return;
    }

    try {
      setPlayingJingleName(jingle.name);
      const { sound } = await Audio.Sound.createAsync(
        jingle.asset,
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded && status.didJustFinish) {
            setPlayingJingleName(null);
            soundRef.current = null;
            void sound.unloadAsync();
          }
        },
      );
      soundRef.current = sound;
    } catch {
      setPlayingJingleName(null);
    }
  };

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
      router.replace(`/(app)/projects/${project.id}/images`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Nie udało się stworzyć projektu';
      Alert.alert('Błąd', message);
    } finally {
      setSubmitting(false);
    }
  };

  const languageSummary = LANGUAGES.find((l) => l.id === language)?.label ?? language;
  const voiceSummary = loadingOptions
    ? 'Ładowanie...'
    : (voices.find((v) => v.elevenlabsVoiceId === selectedVoiceId)?.name ?? '');
  const jingleSummary =
    LOCAL_JINGLES.find((j) => j.name === selectedPresetName)?.label ?? selectedPresetName;

  return (
    <AudioFlowScreen>
      <FadeZoomContent>
        <ScrollView
          style={styles.container}
          contentContainerStyle={[styles.content, { paddingBottom: 24 + footerPadding }]}
        >
          <View style={styles.hero}>
            <Text style={styles.stepLabel}>Krok 1 z 2</Text>
            <Text style={styles.heading}>Zacznijmy od podstaw</Text>
            <Text style={styles.subheading}>
              Nadaj audiobookowi tytuł, wybierz język narracji i brzmienie, które poprowadzi
              słuchacza przez kolejne strony.
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
          </GlassPanel>

          <SectionAccordion
            title="Język"
            description="Wybierz język narracji audiobooka."
            selectedSummary={languageSummary}
            isExpanded={expandedSection === 'language'}
            onEditPress={() => handleEditPress('language')}
          >
            {LANGUAGES.map((lang) => {
              const selected = language === lang.id;
              return (
                <PickerCard
                  key={lang.id}
                  selected={selected}
                  title={lang.label}
                  onPress={() => {
                    setLanguage(lang.id);
                    setExpandedSection(null);
                  }}
                  style={styles.optionCard}
                />
              );
            })}
          </SectionAccordion>

          {loadingOptions ? (
            <GlassPanel style={styles.loadingCard}>
              <ActivityIndicator color={audioFlowTokens.color.accent.pearl} />
              <Text style={styles.loadingText}>Ładowanie głosów...</Text>
            </GlassPanel>
          ) : (
            <>
              <SectionAccordion
                title="Lektor"
                description="Wybierz głos, który przeczyta wszystkie strony."
                selectedSummary={voiceSummary}
                isExpanded={expandedSection === 'voice'}
                onEditPress={() => handleEditPress('voice')}
              >
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
              </SectionAccordion>

              <SectionAccordion
                title="Wstawka muzyczna"
                description="Ten dźwięk oddzieli pliki audio dla kolejnych stron."
                selectedSummary={jingleSummary}
                isExpanded={expandedSection === 'jingle'}
                onEditPress={() => handleEditPress('jingle')}
              >
                {LOCAL_JINGLES.map((jingle) => {
                  const selected = selectedPresetName === jingle.name;
                  const playing = playingJingleName === jingle.name;
                  return (
                    <PickerCard
                      key={jingle.name}
                      selected={selected}
                      title={`${jingle.icon}  ${jingle.label}`}
                      onPress={() => void handleJinglePress(jingle)}
                      trailing={playing ? <Text style={styles.playIcon}>▶</Text> : undefined}
                      style={styles.optionCard}
                    />
                  );
                })}
              </SectionAccordion>
            </>
          )}
        </ScrollView>
      </FadeZoomContent>

      <AudioFlowFooterMenu
        active="library"
        bottomInset={insets.bottom}
        createIcon="chevron-right"
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
  },
  loadingCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    marginBottom: 20,
  },
  loadingText: { color: audioFlowTokens.color.text.onSurfaceSubtle, marginTop: 10 },
  emptyText: { color: audioFlowTokens.color.accent.danger, fontSize: 14, lineHeight: 20 },
  optionCard: { marginBottom: 10 },
  playIcon: {
    color: audioFlowTokens.color.accent.pearl,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 4,
    marginTop: 2,
  },
});
