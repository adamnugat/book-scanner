import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderHandlers,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

import { PageImagePreview } from './PageImagePreview';
import { audioFlowTokens } from './audioflow-tokens';

const t = audioFlowTokens;

type FeatherIconName = React.ComponentProps<typeof Feather>['name'];

interface StatusIconProps {
  icon: FeatherIconName;
  label: string;
  /** Active (completed) stage — filled/coloured. */
  active?: boolean;
  /** Stage disabled in general settings — greyed out with an "A" (automatic) marker. */
  auto?: boolean;
  /** Numeric badge (e.g. selected region count). */
  badge?: number;
  onPress?: () => void;
  pressable?: boolean;
  testID?: string;
}

function StatusIcon({
  icon,
  label,
  active = false,
  auto = false,
  badge,
  onPress,
  pressable = false,
  testID,
}: StatusIconProps) {
  const showBadge = badge != null && badge > 0;
  const color = auto
    ? t.color.text.onSurfaceMuted
    : active
      ? t.color.accent.softGreen
      : t.color.text.onSurfaceSubtle;

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled: !pressable }}
      disabled={!pressable}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.statusIcon,
        auto && styles.statusIconAuto,
        active && styles.statusIconActive,
        pressed && pressable && styles.pressed,
      ]}
    >
      <Feather name={icon} size={18} color={color} />
      {showBadge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
      {auto ? (
        <View style={styles.autoMark}>
          <Text style={styles.autoMarkText}>A</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

function StatusArrow() {
  return <Feather name="chevron-right" size={14} color={t.color.text.onSurfaceMuted} />;
}

export interface PageImageCardProps {
  imageId: string;
  imageUrl?: string | null;
  thumbnailUrl?: string | null;
  displayName: string;
  /** Ordinal position shown inside the drag handle; recomputed on reorder. */
  pageNumber: number;
  status?: 'uploaded' | 'pending';
  /** Number of OCR regions selected for this image. */
  regionCount?: number;
  /** General setting: region selection enabled. When false the region icon is greyed with "A". */
  areaSelectionEnabled?: boolean;
  /** General setting: OCR correction enabled. When false the OCR icon is greyed with "A". */
  ocrCorrectionEnabled?: boolean;
  /** OCR has run for this image. */
  ocrDone?: boolean;
  /** TTS audio has been assigned to this image. */
  hasAudio?: boolean;
  onSelectRegions?: (imageId: string) => void;
  onCorrectOcr?: (imageId: string) => void;
  onDelete: (imageId: string) => void;
  /** PanResponder handlers spread onto the drag handle (from DraggableImageList). */
  dragHandleProps?: GestureResponderHandlers;
  dragActive?: boolean;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

export function PageImageCard({
  imageId,
  imageUrl,
  thumbnailUrl,
  displayName,
  pageNumber,
  status = 'uploaded',
  regionCount = 0,
  areaSelectionEnabled = true,
  ocrCorrectionEnabled = false,
  ocrDone = false,
  hasAudio = false,
  onSelectRegions,
  onCorrectOcr,
  onDelete,
  dragHandleProps,
  dragActive = false,
  testID,
  style,
}: PageImageCardProps) {
  const pending = status === 'pending';

  const regionPressable = !pending && areaSelectionEnabled && !!onSelectRegions;
  const ocrPressable = !pending && ocrCorrectionEnabled && !!onCorrectOcr && ocrDone;

  const idFor = (suffix: string) => (testID ? `${testID}-${suffix}` : undefined);

  return (
    <View style={[styles.card, dragActive && styles.cardActive, style]} testID={testID}>
      {/* Column 1 — drag handle with ordinal number */}
      <View
        accessibilityLabel={`Przeciągnij ${displayName}, pozycja ${pageNumber}`}
        accessibilityRole="adjustable"
        style={styles.handle}
        testID={idFor('drag-handle')}
        {...(pending ? {} : (dragHandleProps ?? {}))}
      >
        <Feather name="menu" size={20} color={t.color.text.onSurfaceSubtle} />
        <View style={styles.ordinalBadge}>
          <Text style={styles.ordinalText}>{pageNumber}</Text>
        </View>
      </View>

      {/* Column 2 — thumbnail + name, then status icon row */}
      <View style={styles.center}>
        <View style={styles.topRow}>
          <PageImagePreview
            imageUrl={imageUrl ?? null}
            thumbnailUrl={thumbnailUrl ?? null}
            style={styles.thumb}
          />
          <Text style={styles.name} numberOfLines={2}>
            {displayName}
          </Text>
        </View>
        <View style={styles.statusRow}>
          <StatusIcon
            icon="crop"
            label={`Obszary OCR dla ${displayName}`}
            auto={!areaSelectionEnabled}
            badge={regionCount}
            active={regionCount > 0}
            pressable={regionPressable}
            onPress={() => onSelectRegions?.(imageId)}
            testID={idFor('status-regions')}
          />
          <StatusArrow />
          <StatusIcon
            icon="edit-3"
            label={`Korekta OCR dla ${displayName}`}
            auto={!ocrCorrectionEnabled}
            active={ocrDone}
            pressable={ocrPressable}
            onPress={() => onCorrectOcr?.(imageId)}
            testID={idFor('status-ocr')}
          />
          <StatusArrow />
          <StatusIcon
            icon="volume-2"
            label={`Audio dla ${displayName}`}
            active={hasAudio}
            testID={idFor('status-audio')}
          />
        </View>
      </View>

      {/* Column 3 — delete */}
      <View style={styles.actions}>
        <Pressable
          accessibilityLabel={`Usuń ${displayName}`}
          accessibilityRole="button"
          accessibilityState={{ disabled: pending }}
          disabled={pending}
          onPress={() => onDelete(imageId)}
          style={({ pressed }) => [
            styles.actionBtn,
            styles.actionBtnDanger,
            pressed && !pending && styles.pressed,
          ]}
          testID={idFor('delete')}
        >
          <Feather name="trash-2" size={18} color={t.color.accent.danger} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: t.color.surface.glass,
    borderRadius: t.radius.card,
    borderWidth: 1,
    borderColor: t.color.surface.glassEdge,
    padding: 10,
    marginBottom: 10,
  },
  cardActive: {
    borderColor: t.color.accent.pearl,
    opacity: 0.92,
  },
  handle: {
    width: 40,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  ordinalBadge: {
    marginTop: 2,
    minWidth: 20,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: t.color.accent.pearl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ordinalText: {
    color: t.color.text.onPearl,
    fontSize: 11,
    fontWeight: '900',
    lineHeight: 14,
  },
  center: { flex: 1 },
  topRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  thumb: { width: 46, height: 62, borderRadius: 8, marginRight: 10 },
  name: {
    flex: 1,
    color: t.color.text.onDark,
    fontSize: 14,
    fontWeight: '800',
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statusIcon: {
    minWidth: 36,
    height: 36,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: t.color.surface.glassLight,
    borderColor: t.color.surface.glassEdge,
    borderWidth: 1,
    borderRadius: 9,
  },
  statusIconAuto: { opacity: 0.45 },
  statusIconActive: { borderColor: t.color.accent.softGreen },
  pressed: { opacity: 0.7 },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: t.color.accent.pearl,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: t.color.text.onPearl,
    fontSize: 10,
    fontWeight: '900',
    lineHeight: 13,
  },
  autoMark: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: t.color.surface.glassEdge,
    borderRadius: 7,
    minWidth: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  autoMarkText: {
    color: t.color.text.onSurfaceSubtle,
    fontSize: 9,
    fontWeight: '900',
    lineHeight: 11,
  },
  actions: { marginLeft: 8, gap: 6 },
  actionBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: t.color.surface.glassLight,
    borderColor: t.color.surface.glassEdge,
    borderWidth: 1,
    borderRadius: 10,
  },
  actionBtnDanger: { backgroundColor: 'rgba(255, 143, 163, 0.10)' },
});
