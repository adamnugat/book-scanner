import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { PageImagePreview } from './PageImagePreview';
import { audioFlowTokens } from './audioflow-tokens';

const t = audioFlowTokens;

type FeatherIconName = React.ComponentProps<typeof Feather>['name'];

interface IconActionButtonProps {
  icon: FeatherIconName;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: 'default' | 'danger';
  badge?: number;
  testID?: string;
}

function IconActionButton({
  icon,
  label,
  onPress,
  disabled = false,
  tone = 'default',
  badge,
  testID,
}: IconActionButtonProps) {
  const showBadge = badge != null && badge > 0;
  const color = tone === 'danger' ? t.color.accent.danger : t.color.text.onDark;

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.iconButton,
        tone === 'danger' && styles.iconButtonDanger,
        pressed && !disabled && styles.iconButtonPressed,
        disabled && styles.iconButtonDisabled,
      ]}
    >
      <Feather name={icon} size={22} color={color} />
      {showBadge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export interface PageImageCardProps {
  imageId: string;
  imageUrl?: string | null;
  thumbnailUrl?: string | null;
  displayName: string;
  pageNumber: number;
  index: number;
  total: number;
  regionCount?: number;
  status?: 'uploaded' | 'pending';
  onSelectRegions: (imageId: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onDelete: (imageId: string) => void;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

export function PageImageCard({
  imageId,
  imageUrl,
  thumbnailUrl,
  displayName,
  pageNumber,
  index,
  total,
  regionCount,
  status = 'uploaded',
  onSelectRegions,
  onMoveUp,
  onMoveDown,
  onDelete,
  testID,
  style,
}: PageImageCardProps) {
  const isFirst = index === 0;
  const isLast = index === total - 1;
  const pending = status === 'pending';

  return (
    <View style={[styles.card, style]} testID={testID}>
      <View style={styles.row}>
        <Text style={styles.pageNumber}>{pageNumber}</Text>
        <PageImagePreview
          imageUrl={imageUrl ?? undefined}
          thumbnailUrl={thumbnailUrl ?? undefined}
          style={styles.thumb}
        />
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {displayName}
          </Text>
          <View style={styles.actions}>
            <View style={styles.groupLeft}>
              <IconActionButton
                icon="crop"
                label={`Wybierz obszary OCR dla ${displayName}`}
                onPress={() => onSelectRegions(imageId)}
                badge={regionCount}
                disabled={pending}
                testID={testID ? `${testID}-select-regions` : undefined}
              />
            </View>
            <View style={styles.groupCenter}>
              <IconActionButton
                icon="arrow-up"
                label={`Przenieś ${displayName} wyżej`}
                onPress={() => onMoveUp(index)}
                disabled={isFirst || pending}
                testID={testID ? `${testID}-move-up` : undefined}
              />
              <IconActionButton
                icon="arrow-down"
                label={`Przenieś ${displayName} niżej`}
                onPress={() => onMoveDown(index)}
                disabled={isLast || pending}
                testID={testID ? `${testID}-move-down` : undefined}
              />
            </View>
            <View style={styles.groupRight}>
              <IconActionButton
                icon="trash-2"
                label={`Usuń ${displayName}`}
                onPress={() => onDelete(imageId)}
                tone="danger"
                disabled={pending}
                testID={testID ? `${testID}-delete` : undefined}
              />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: t.color.surface.glass,
    borderRadius: t.radius.card,
    borderWidth: 1,
    borderColor: t.color.surface.glassEdge,
    padding: 12,
    marginBottom: 10,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  pageNumber: {
    color: t.color.accent.pearl,
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
    width: 28,
  },
  thumb: { width: 58, height: 78, borderRadius: 10, marginHorizontal: 10 },
  info: { flex: 1 },
  name: {
    color: t.color.text.onDark,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  groupLeft: { flexDirection: 'row', alignItems: 'center' },
  groupCenter: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.stackSm },
  groupRight: { flexDirection: 'row', alignItems: 'center' },
  iconButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: t.color.surface.glassLight,
    borderColor: t.color.surface.glassEdge,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  iconButtonDanger: {
    backgroundColor: 'rgba(255, 143, 163, 0.10)',
  },
  iconButtonPressed: { opacity: 0.7 },
  iconButtonDisabled: { opacity: 0.35 },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: t.color.accent.pearl,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: t.color.text.onPearl,
    fontSize: 11,
    fontWeight: '900',
    lineHeight: 14,
  },
});
