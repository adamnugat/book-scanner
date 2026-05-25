import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AudioFlowFooterMenu,
  AudioFlowScreen,
  GlassPanel,
  RoundIconButton,
  TopAppBar,
  audioFlowFooterMenuHeight,
  audioFlowStyles,
} from './audioflow';
import { AudioFlowGlobalMenuButton, AudioFlowTopChrome } from './audioflow-global-navigation';
import { audioFlowTokens } from './audioflow-tokens';
import { FadeZoomContent } from './FadeZoomContent';
import { PageImagePreview } from './PageImagePreview';
import {
  createNormalizedRegion,
  denormalizeRegion,
  type Point,
  type Rect,
  type Size,
} from '../lib/text-region-geometry';

const t = audioFlowTokens;

export interface EditorRegion {
  key: string;
  orderIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export type OcrEditorTarget =
  | {
      kind: 'uploaded';
      id: string;
      imageUrl: string;
      thumbnailUrl?: string | null;
    }
  | {
      kind: 'pending';
      uri: string;
    };

export interface OcrRegionEditorProps {
  target: OcrEditorTarget;
  initialRegions: EditorRegion[];
  pageLabel: string;
  onCancel: () => void;
  onSave: (regions: EditorRegion[]) => void;
  saving?: boolean;
}

const EMPTY_LAYOUT: Size = { width: 0, height: 0 };

function pointFromEvent(event: GestureResponderEvent): Point {
  return { x: event.nativeEvent.locationX, y: event.nativeEvent.locationY };
}

function regionKey(prefix: string, index: number): string {
  return `${prefix}-${Date.now()}-${index}`;
}

export function OcrRegionEditor({
  target,
  initialRegions,
  pageLabel,
  onCancel,
  onSave,
  saving = false,
}: OcrRegionEditorProps) {
  const insets = useSafeAreaInsets();
  const [regions, setRegions] = useState<EditorRegion[]>(() => initialRegions);
  const [previewLayout, setPreviewLayout] = useState<Size>(EMPTY_LAYOUT);
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [dragRect, setDragRect] = useState<Rect | null>(null);

  const targetKey = target.kind === 'uploaded' ? target.id : target.uri;

  const onPreviewLayout = (event: LayoutChangeEvent) => {
    setPreviewLayout({
      width: event.nativeEvent.layout.width,
      height: event.nativeEvent.layout.height,
    });
  };

  const beginDrag = (event: GestureResponderEvent) => {
    setDragStart(pointFromEvent(event));
    setDragRect(null);
  };

  const updateDrag = (event: GestureResponderEvent) => {
    if (!dragStart || previewLayout.width <= 0 || previewLayout.height <= 0) return;
    const normalized = createNormalizedRegion(dragStart, pointFromEvent(event), previewLayout, 1);
    setDragRect(normalized ? denormalizeRegion(normalized, previewLayout) : null);
  };

  const finishDrag = (event: GestureResponderEvent) => {
    if (!dragStart) return;
    const normalized = createNormalizedRegion(dragStart, pointFromEvent(event), previewLayout);
    setDragStart(null);
    setDragRect(null);
    if (!normalized) return;
    setRegions((prev) => [
      ...prev,
      {
        key: regionKey(targetKey, prev.length),
        orderIndex: prev.length,
        ...normalized,
      },
    ]);
  };

  const cancelDrag = () => {
    setDragStart(null);
    setDragRect(null);
  };

  const removeRegion = (key: string) => {
    setRegions((prev) =>
      prev.filter((r) => r.key !== key).map((r, index) => ({ ...r, orderIndex: index })),
    );
  };

  const handleSave = () => {
    if (saving) return;
    onSave(regions.map((r, index) => ({ ...r, orderIndex: index })));
  };

  const footerLift = audioFlowFooterMenuHeight(insets.bottom);

  return (
    <AudioFlowScreen>
      <AudioFlowTopChrome>
        <TopAppBar
          title="Regiony OCR"
          left={
            <RoundIconButton
              featherIcon="chevron-left"
              label="Wstecz"
              onPress={onCancel}
            />
          }
          right={<AudioFlowGlobalMenuButton />}
        />
      </AudioFlowTopChrome>

      <FadeZoomContent>
        <View style={[styles.body, { paddingBottom: footerLift + 16 }]}>
          <View style={styles.headerBlock}>
            <Text style={audioFlowStyles.eyebrow}>{pageLabel}</Text>
            <Text style={[audioFlowStyles.body, styles.hint]}>
              Przeciągnij palcem po zdjęciu, aby dodać prostokątny region.
            </Text>
          </View>

          <GlassPanel style={styles.previewPanel}>
            <View
              style={styles.previewSurface}
              onLayout={onPreviewLayout}
              onStartShouldSetResponder={() => true}
              onMoveShouldSetResponder={() => true}
              onResponderGrant={beginDrag}
              onResponderMove={updateDrag}
              onResponderRelease={finishDrag}
              onResponderTerminate={cancelDrag}
            >
              <PageImagePreview
                imageUrl={target.kind === 'uploaded' ? target.imageUrl : target.uri}
                thumbnailUrl={target.kind === 'uploaded' ? target.thumbnailUrl : null}
                style={styles.previewImage}
                resizeMode="contain"
              />
              {previewLayout.width > 0 &&
                regions.map((region, index) => {
                  const rect = denormalizeRegion(region, previewLayout);
                  return (
                    <View
                      key={region.key}
                      style={[
                        styles.regionOverlay,
                        {
                          left: rect.x,
                          top: rect.y,
                          width: rect.width,
                          height: rect.height,
                        },
                      ]}
                    >
                      <View style={styles.regionBadge}>
                        <Text style={styles.regionBadgeText}>{index + 1}</Text>
                      </View>
                    </View>
                  );
                })}
              {dragRect && (
                <View
                  style={[
                    styles.dragOverlay,
                    {
                      left: dragRect.x,
                      top: dragRect.y,
                      width: dragRect.width,
                      height: dragRect.height,
                    },
                  ]}
                />
              )}
            </View>
          </GlassPanel>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>
              {regions.length === 0
                ? 'Brak regionów — OCR odczyta całą stronę.'
                : `Regiony: ${regions.length}`}
            </Text>
          </View>

          {regions.length > 0 ? (
            <ScrollView
              style={styles.list}
              contentContainerStyle={styles.listContent}
              testID="ocr-region-editor-list"
            >
              {regions.map((region, index) => (
                <View key={region.key} style={styles.listRow}>
                  <Text style={styles.listLabel}>Region {index + 1}</Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Usuń region ${index + 1}`}
                    onPress={() => removeRegion(region.key)}
                    style={({ pressed }) => [styles.removeBtn, pressed && styles.pressed]}
                  >
                    <Feather name="trash-2" size={18} color={t.color.accent.danger} />
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          ) : null}
        </View>
      </FadeZoomContent>

      <AudioFlowFooterMenu
        active="library"
        bottomInset={insets.bottom}
        leftIcon="x"
        leftLabel="Anuluj"
        onLibraryPress={onCancel}
        createIcon="check"
        createLabel={saving ? 'Zapisywanie…' : 'Zapisz'}
        createDisabled={saving}
        createTestID="ocr-region-editor-save"
        onCreatePress={handleSave}
        hideRight
      />
    </AudioFlowScreen>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    paddingHorizontal: t.spacing.marginMobile,
    paddingTop: t.spacing.stackSm,
  },
  headerBlock: {
    gap: 6,
    marginBottom: t.spacing.stackMd,
  },
  hint: {
    marginTop: 2,
  },
  previewPanel: {
    backgroundColor: t.color.surface.glass,
    overflow: 'hidden',
  },
  previewSurface: {
    height: 380,
    width: '100%',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  regionOverlay: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: t.color.accent.softGreen,
    backgroundColor: 'rgba(139, 168, 142, 0.18)',
  },
  regionBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    backgroundColor: t.color.accent.softGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  regionBadgeText: {
    color: t.color.text.onPearl,
    fontSize: 12,
    fontWeight: '800',
  },
  dragOverlay: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: t.color.accent.danger,
    backgroundColor: 'rgba(255, 143, 163, 0.16)',
  },
  summaryRow: {
    marginTop: t.spacing.stackMd,
  },
  summaryText: {
    ...t.typography.labelMd,
    color: t.color.text.onSurfaceSubtle,
  },
  list: {
    marginTop: t.spacing.stackSm,
    flex: 1,
  },
  listContent: {
    paddingBottom: t.spacing.stackMd,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: t.color.surface.glassEdge,
  },
  listLabel: {
    ...t.typography.bodyMd,
    color: t.color.text.onDark,
  },
  removeBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: t.radius.md,
    backgroundColor: 'rgba(255, 143, 163, 0.10)',
  },
  pressed: {
    opacity: 0.7,
  },
});
