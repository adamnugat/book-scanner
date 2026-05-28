import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

import { ZoomableImage } from './ZoomableImage';
import { audioFlowTokens } from './audioflow-tokens';

const t = audioFlowTokens;

export interface OcrCorrectionModalProps {
  visible: boolean;
  pageLabel: string;
  imageUrl?: string | null;
  thumbnailUrl?: string | null;
  /** OCR/edited text to correct. */
  initialText: string;
  loading?: boolean;
  saving?: boolean;
  onClose: () => void;
  onSave: (text: string) => void;
}

export function OcrCorrectionModal({
  visible,
  pageLabel,
  imageUrl,
  thumbnailUrl,
  initialText,
  loading = false,
  saving = false,
  onClose,
  onSave,
}: OcrCorrectionModalProps) {
  const [text, setText] = useState(initialText);
  const zoomResetKey = useRef(0);

  // Reset the editable buffer and zoom state whenever a new correction target is opened.
  useEffect(() => {
    if (visible) {
      setText(initialText);
      zoomResetKey.current += 1;
    }
  }, [visible, initialText]);

  const imageUri = imageUrl ?? thumbnailUrl ?? null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={1}>
              Korekta OCR · {pageLabel}
            </Text>
            <Pressable
              accessibilityLabel="Zamknij korektę OCR"
              accessibilityRole="button"
              onPress={onClose}
              style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
            >
              <Feather name="x" size={20} color={t.color.text.onDark} />
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator color={t.color.accent.pearl} size="large" />
            </View>
          ) : (
            <>
              <ZoomableImage
                key={zoomResetKey.current}
                uri={imageUri}
                style={styles.thumb}
                resizeMode="contain"
              />
              <ScrollView
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
              >
                <TextInput
                  accessibilityLabel="Tekst OCR"
                  style={styles.textArea}
                  multiline
                  value={text}
                  onChangeText={setText}
                  placeholder="Tekst rozpoznany przez OCR…"
                  placeholderTextColor={t.color.text.onSurfaceMuted}
                  textAlignVertical="top"
                  testID="ocr-correction-input"
                />
              </ScrollView>
            </>
          )}

          <Pressable
            accessibilityLabel="Zapisz korektę OCR"
            accessibilityRole="button"
            accessibilityState={{ disabled: saving || loading }}
            disabled={saving || loading}
            onPress={() => onSave(text)}
            style={({ pressed }) => [
              styles.saveBtn,
              (saving || loading) && styles.saveBtnDisabled,
              pressed && !(saving || loading) && styles.pressed,
            ]}
            testID="ocr-correction-save"
          >
            {saving ? (
              <ActivityIndicator color={t.color.text.onPearl} />
            ) : (
              <Text style={styles.saveBtnText}>Zapisz</Text>
            )}
          </Pressable>
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
    maxHeight: '92%',
    backgroundColor: t.color.background.deep1,
    borderTopLeftRadius: t.radius.card,
    borderTopRightRadius: t.radius.card,
    paddingHorizontal: t.spacing.gutterMobile,
    paddingTop: 14,
    paddingBottom: 18,
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
  centered: { paddingVertical: 60, alignItems: 'center', justifyContent: 'center' },
  content: { paddingBottom: 14 },
  thumb: {
    width: '100%',
    height: 220,
    borderRadius: t.radius.md,
    marginBottom: 12,
    backgroundColor: t.color.surface.glass,
  },
  textArea: {
    backgroundColor: t.color.surface.glass,
    color: t.color.text.onDark,
    borderRadius: t.radius.md,
    borderWidth: 1,
    borderColor: t.color.surface.glassEdge,
    padding: 14,
    fontSize: 15,
    lineHeight: 23,
    minHeight: 180,
  },
  saveBtn: {
    marginTop: 14,
    backgroundColor: t.color.accent.pearl,
    borderRadius: t.radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: {
    color: t.color.text.onPearl,
    fontSize: 15,
    fontFamily: 'Quicksand_600SemiBold',
  },
  pressed: { opacity: 0.7 },
});
