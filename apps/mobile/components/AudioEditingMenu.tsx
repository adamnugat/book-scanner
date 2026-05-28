import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { PickerCard, SectionAccordion } from './audioflow';
import { audioFlowTokens } from './audioflow-tokens';
import type { InterstitialPresetResponse, VoiceResponse } from '@book-scanner/shared';

const t = audioFlowTokens;

type ExpandedSection = 'voice' | 'preset' | null;

export interface AudioEditingMenuChanges {
  voiceId?: string;
  interstitialPreset?: string | null;
}

export interface AudioEditingMenuProps {
  visible: boolean;
  voices: VoiceResponse[];
  presets: InterstitialPresetResponse[];
  initialVoiceId: string | null;
  initialInterstitialPreset: string | null;
  saving?: boolean;
  onCancel: () => void;
  onSave: (changes: AudioEditingMenuChanges) => void;
}

export function AudioEditingMenu({
  visible,
  voices,
  presets,
  initialVoiceId,
  initialInterstitialPreset,
  saving = false,
  onCancel,
  onSave,
}: AudioEditingMenuProps) {
  const insets = useSafeAreaInsets();
  const [selectedVoice, setSelectedVoice] = useState<string | null>(initialVoiceId);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(initialInterstitialPreset);
  const [expandedSection, setExpandedSection] = useState<ExpandedSection>(null);

  useEffect(() => {
    if (visible) {
      setSelectedVoice(initialVoiceId);
      setSelectedPreset(initialInterstitialPreset);
      setExpandedSection(null);
    }
  }, [visible, initialVoiceId, initialInterstitialPreset]);

  const voiceChanged = selectedVoice !== initialVoiceId;
  const presetChanged = selectedPreset !== initialInterstitialPreset;
  const dirty = voiceChanged || presetChanged;

  const handleSave = () => {
    const changes: AudioEditingMenuChanges = {};
    if (voiceChanged && selectedVoice) changes.voiceId = selectedVoice;
    if (presetChanged) changes.interstitialPreset = selectedPreset;
    onSave(changes);
  };

  const toggleSection = (section: Exclude<ExpandedSection, null>) => {
    setExpandedSection((current) => (current === section ? null : section));
  };

  const voiceSummary =
    voices.find((v) => v.elevenlabsVoiceId === selectedVoice)?.name ?? 'Nie wybrano';
  const presetSummary =
    selectedPreset === null
      ? 'Brak wstawki'
      : (presets.find((p) => p.id === selectedPreset)?.name ?? 'Nie wybrano');

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onCancel}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.sheet, { paddingTop: 14 + insets.top }]}>
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={1}>
              Edycja audio
            </Text>
            <Pressable
              accessibilityLabel="Zamknij edycję audio"
              accessibilityRole="button"
              onPress={onCancel}
              style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
            >
              <Feather name="x" size={20} color={t.color.text.onDark} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            testID="audio-editing-menu-scroll"
          >
            <SectionAccordion
              title="Lektor"
              description="Wybierz głos, który przeczyta wszystkie strony."
              selectedSummary={voiceSummary}
              isExpanded={expandedSection === 'voice'}
              onEditPress={() => toggleSection('voice')}
              style={styles.accordion}
            >
              {voices.length === 0 ? (
                <Text style={styles.emptyText}>Brak głosów dla języka projektu.</Text>
              ) : (
                voices.map((voice) => {
                  const isSelected = selectedVoice === voice.elevenlabsVoiceId;
                  return (
                    <PickerCard
                      key={voice.id}
                      title={voice.name}
                      meta={voice.language.toUpperCase()}
                      selected={isSelected}
                      onPress={() => setSelectedVoice(voice.elevenlabsVoiceId)}
                      disabled={saving}
                      style={styles.card}
                      testID={`audio-menu-voice-${voice.elevenlabsVoiceId}`}
                    />
                  );
                })
              )}
            </SectionAccordion>

            <SectionAccordion
              title="Wstawka muzyczna"
              description="Ten dźwięk oddzieli pliki audio dla kolejnych stron."
              selectedSummary={presetSummary}
              isExpanded={expandedSection === 'preset'}
              onEditPress={() => toggleSection('preset')}
              style={styles.accordion}
            >
              <PickerCard
                title="Brak wstawki"
                selected={selectedPreset === null}
                onPress={() => setSelectedPreset(null)}
                disabled={saving}
                style={styles.card}
                testID="audio-menu-preset-none"
              />
              {presets.map((preset) => {
                const isSelected = selectedPreset === preset.id;
                return (
                  <PickerCard
                    key={preset.id}
                    title={preset.name}
                    meta={`${Math.round(preset.durationMs / 1000)} s`}
                    selected={isSelected}
                    onPress={() => setSelectedPreset(preset.id)}
                    disabled={saving}
                    style={styles.card}
                    testID={`audio-menu-preset-${preset.id}`}
                  />
                );
              })}
            </SectionAccordion>
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: 14 + insets.bottom }]}>
            <Pressable
              accessibilityLabel="Anuluj edycję audio"
              accessibilityRole="button"
              disabled={saving}
              onPress={onCancel}
              style={({ pressed }) => [
                styles.cancelBtn,
                pressed && !saving && styles.pressed,
                saving && styles.disabled,
              ]}
              testID="audio-menu-cancel"
            >
              <Text style={styles.cancelBtnText}>Anuluj</Text>
            </Pressable>
            <Pressable
              accessibilityLabel="Zapisz ustawienia audio"
              accessibilityRole="button"
              accessibilityState={{ disabled: saving || !dirty }}
              disabled={saving || !dirty}
              onPress={handleSave}
              style={({ pressed }) => [
                styles.saveBtn,
                (saving || !dirty) && styles.disabled,
                pressed && !(saving || !dirty) && styles.pressed,
              ]}
              testID="audio-menu-save"
            >
              {saving ? (
                <ActivityIndicator color={t.color.text.onPearl} />
              ) : (
                <Text style={styles.saveBtnText}>Zapisz</Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    flex: 1,
    backgroundColor: t.color.background.deep1,
    borderTopLeftRadius: t.radius.card,
    borderTopRightRadius: t.radius.card,
    paddingHorizontal: t.spacing.gutterMobile,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    flex: 1,
    color: t.color.text.onDark,
    fontSize: 16,
    fontFamily: 'Quicksand_600SemiBold',
    marginRight: 8,
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  content: {
    paddingBottom: 24,
  },
  accordion: { marginBottom: t.spacing.stackMd },
  card: { marginBottom: t.spacing.stackSm },
  emptyText: {
    color: t.color.text.onSurfaceMuted,
    fontSize: 14,
    fontFamily: 'VarelaRound_400Regular',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: t.color.surface.glassEdge,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: t.radius.md,
    backgroundColor: t.color.surface.glass,
    borderWidth: 1,
    borderColor: t.color.surface.glassEdge,
  },
  cancelBtnText: {
    color: t.color.text.onDark,
    fontSize: 15,
    fontFamily: 'Quicksand_600SemiBold',
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: t.radius.md,
    backgroundColor: t.color.accent.pearl,
  },
  saveBtnText: {
    color: t.color.text.onPearl,
    fontSize: 15,
    fontFamily: 'Quicksand_600SemiBold',
  },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.7 },
});
