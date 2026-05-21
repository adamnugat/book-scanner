import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';

import { audioFlowTokens } from './audioflow-tokens';

type FeatherIconName = React.ComponentProps<typeof Feather>['name'];

export interface SectionTileProps {
  title: string;
  summary?: string;
  description?: string;
  trailingIcon?: FeatherIconName | null;
  onPress?: () => void;
  expanded?: boolean;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

const t = audioFlowTokens;

export function SectionTile({
  title,
  summary,
  description,
  trailingIcon = 'edit-2',
  onPress,
  expanded = false,
  children,
  style,
  accessibilityLabel,
}: SectionTileProps) {
  const showSummary = !expanded && !!summary;
  const hasBody = expanded && (!!description || !!children);

  return (
    <View style={[styles.tile, style]}>
      <BlurView intensity={10} tint="dark" style={StyleSheet.absoluteFill} />
      <Pressable
        accessibilityLabel={accessibilityLabel ?? title}
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [styles.header, pressed && styles.pressed]}
      >
        <Text style={styles.title}>{title}</Text>
        {showSummary && (
          <Text style={styles.summary} numberOfLines={1}>
            {summary}
          </Text>
        )}
        {trailingIcon && (
          <View style={styles.iconWrap}>
            <Feather
              name={trailingIcon}
              size={18}
              color={t.color.text.onSurfaceSubtle}
            />
          </View>
        )}
      </Pressable>
      {hasBody && (
        <View style={styles.body}>
          {description && (
            <Text style={styles.description}>{description}</Text>
          )}
          {children}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    backgroundColor: t.color.surface.glass,
    borderColor: t.color.surface.glassEdge,
    borderRadius: t.radius.panel,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  pressed: {
    opacity: 0.7,
  },
  title: {
    ...t.typography.headlineMd,
    color: t.color.text.onDark,
  },
  summary: {
    color: t.color.text.onSurfaceSubtle,
    ...t.typography.labelMd,
    flex: 1,
    marginLeft: 10,
    textAlign: 'right',
  },
  iconWrap: {
    marginLeft: 8,
    padding: 8,
  },
  body: {
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  description: {
    ...t.typography.bodyMd,
    color: t.color.text.onSurfaceSubtle,
    marginBottom: 14,
  },
});
