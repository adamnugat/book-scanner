import React from 'react';
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type GestureResponderEvent,
  type PressableProps,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { BlurView } from 'expo-blur';

/**
 * Rodziny z {@link https://fonts.google.com/specimen/Quicksand Quicksand} i
 * {@link https://fonts.google.com/specimen/Varela+Round Varela Round} — jak w
 * `design-system/reference-views/Dashboard.html`. Ładowane w `app/_layout.tsx`.
 */
export const audioFlowFontFamilies = {
  quicksandSemiBold: 'Quicksand_600SemiBold',
  quicksandBold: 'Quicksand_700Bold',
  varelaRound: 'VarelaRound_400Regular',
} as const;

const ff = audioFlowFontFamilies;

export const audioFlowTokens = {
  color: {
    background: {
      heroBase: '#6b4c4c',
      deep1: '#2a1a1d',
      deep2: '#150b10',
      roseBloom: 'rgba(204, 153, 153, 0.5)',
      mauveBloom: 'rgba(179, 128, 128, 0.4)',
      deepRoseBloom: 'rgba(153, 102, 102, 0.5)',
    },
    surface: {
      glass: 'rgba(45, 30, 30, 0.45)',
      glassMuted: 'rgba(45, 30, 30, 0.35)',
      glassLight: 'rgba(255, 255, 255, 0.06)',
      glassLighter: 'rgba(255, 255, 255, 0.08)',
      glassHover: 'rgba(255, 255, 255, 0.12)',
      glassEdge: 'rgba(15, 10, 11, 0.6)',
      field: 'rgba(20, 12, 14, 0.55)',
    },
    accent: {
      pearl: '#F0EAD6',
      pearlBright: '#FBFCF8',
      pearlGlow: 'rgba(240, 234, 214, 0.4)',
      pearlBorder: 'rgba(240, 234, 214, 0.55)',
      pearlTint: 'rgba(240, 234, 214, 0.10)',
      softGreen: '#8ba88e',
      danger: '#ff8fa3',
    },
    text: {
      onDark: '#FFFFFF',
      onPearl: '#131316',
      onSurfaceSubtle: '#d4c0d7',
      onSurfaceMuted: 'rgba(255, 255, 255, 0.6)',
    },
  },
  spacing: {
    stackSm: 8,
    stackMd: 16,
    stackLg: 32,
    sectionGap: 48,
    gutterMobile: 16,
    marginMobile: 20,
  },
  radius: {
    sm: 4,
    md: 8,
    lg: 12,
    card: 16,
    panel: 24,
    full: 9999,
  },
  typography: {
    headlineLg: {
      fontFamily: ff.quicksandBold,
      fontSize: 32,
      letterSpacing: -0.64,
      lineHeight: 40,
    },
    headlineMd: {
      fontFamily: ff.quicksandSemiBold,
      fontSize: 24,
      lineHeight: 32,
    },
    bodyLg: {
      fontFamily: ff.varelaRound,
      fontSize: 18,
      fontWeight: '400' as const,
      lineHeight: 28,
    },
    bodyMd: {
      fontFamily: ff.varelaRound,
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 24,
    },
    labelMd: {
      fontFamily: ff.varelaRound,
      fontSize: 14,
      fontWeight: '600' as const,
      letterSpacing: 0.14,
      lineHeight: 20,
    },
    labelSm: {
      fontFamily: ff.varelaRound,
      fontSize: 12,
      fontWeight: '500' as const,
      lineHeight: 16,
    },
    eyebrow: { letterSpacing: 2.16, textTransform: 'uppercase' as const },
  },
  motion: {
    fastMs: 120,
    baseMs: 200,
    pulseMs: 2400,
  },
} as const;

export const audioFlowReferenceViews: Record<string, string> = {
  '/(app)': 'Dashboard.html',
  '/(auth)/login': 'Login.html',
  '/(app)/projects/new/index': 'New Project.html',
  '/(app)/projects/new/images': 'Add Photos.html',
  '/(app)/projects/[id]/index': 'Project Details.html',
  '/(app)/projects/[id]/images': 'Page Photos.html',
  '/(app)/projects/[id]/voice': 'Voice and Audio.html',
  '/(app)/projects/[id]/sharing': 'Share.html',
  '/(app)/projects/[id]/export': 'Export.html',
};

const t = audioFlowTokens;

interface AudioFlowScreenProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  variant?: 'login' | 'dimmed';
}

export function AudioFlowScreen({
  children,
  style,
  testID = 'audioflow-screen',
  variant = 'dimmed',
}: AudioFlowScreenProps) {
  return (
    <View style={[styles.screen, style]} testID={testID}>
      <Image
        source={require('../assets/images/background.jpg')}
        style={[
          StyleSheet.absoluteFill,
          { opacity: variant === 'login' ? 1 : 0.3, width: '100%', height: '100%' },
        ]}
        resizeMode="cover"
      />
      {children}
    </View>
  );
}

export function GlassPanel({
  children,
  style,
  testID,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  return (
    <View style={[styles.glassPanel, style]} testID={testID}>
      {children}
    </View>
  );
}

interface AudioFlowButtonProps {
  label: string;
  onPress: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  left?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  testID?: string;
  accessibilityLabel?: string;
}

export function PearlButton({
  label,
  onPress,
  disabled = false,
  left,
  style,
  textStyle,
  testID,
  accessibilityLabel,
}: AudioFlowButtonProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.pearlButton,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {left}
      <Text style={[styles.pearlButtonText, textStyle]}>{label}</Text>
    </Pressable>
  );
}

export function GhostButton({
  label,
  onPress,
  disabled = false,
  left,
  style,
  textStyle,
  testID,
  accessibilityLabel,
}: AudioFlowButtonProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.ghostButton,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {left}
      <Text style={[styles.ghostButtonText, textStyle]}>{label}</Text>
    </Pressable>
  );
}

interface PickerCardProps extends Pick<PressableProps, 'onPress' | 'disabled' | 'testID'> {
  selected: boolean;
  title: string;
  body?: string;
  meta?: string;
  trailing?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function PickerCard({
  selected,
  title,
  body,
  meta,
  trailing,
  onPress,
  disabled,
  testID,
  style,
}: PickerCardProps) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.pickerCard,
        selected && styles.pickerCardSelected,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <View style={[styles.radioDot, selected && styles.radioDotSelected]} />
      <View style={styles.pickerContent}>
        <Text style={[styles.pickerTitle, selected && styles.pickerTitleSelected]}>{title}</Text>
        {body ? <Text style={styles.pickerBody}>{body}</Text> : null}
        {meta ? <Text style={styles.pickerMeta}>{meta}</Text> : null}
      </View>
      {trailing}
    </Pressable>
  );
}

export function SectionHeading({
  title,
  hint,
  style,
}: {
  title: string;
  hint?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={style}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {hint ? <Text style={styles.sectionHint}>{hint}</Text> : null}
    </View>
  );
}

export function Chip({ label, selected = false }: { label: string; selected?: boolean }) {
  return (
    <View style={[styles.chip, selected && styles.chipSelected]}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </View>
  );
}

export function TopAppBar({
  title = '',
  center,
  left,
  right,
  style,
}: {
  title?: string;
  /** When set, replaces the default title `<Text>` (e.g. dashboard brand row). */
  center?: React.ReactNode;
  left?: React.ReactNode;
  right?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.topAppBar, style]}>
      <View style={styles.topAppBarSide}>{left}</View>
      {center != null ? (
        <View style={styles.topAppBarCenter}>{center}</View>
      ) : (
        <View style={styles.topAppBarCenter}>
          <Text accessibilityRole="header" numberOfLines={1} style={styles.topAppBarTitle}>
            {title}
          </Text>
        </View>
      )}
      <View style={styles.topAppBarSide}>{right}</View>
    </View>
  );
}

export function RoundIconButton({
  label,
  icon,
  onPress,
  disabled = false,
  style,
}: {
  label: string;
  icon: string;
  onPress?: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.roundIconButton,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text style={styles.roundIconText}>{icon}</Text>
    </Pressable>
  );
}

export function AudioFlowLogo({
  size = 'sm',
  style,
}: {
  size?: 'sm' | 'lg';
  style?: StyleProp<ViewStyle>;
}) {
  const isLarge = size === 'lg';
  return (
    <View
      accessibilityLabel="Logo AudioFlow equalizer"
      accessibilityRole="image"
      accessible
      style={[styles.logoMark, isLarge && styles.logoMarkLarge, style]}
    >
      {[0.45, 0.76, 1, 0.64, 0.86].map((heightScale, index) => (
        <View
          key={`${heightScale}-${index}`}
          style={[
            styles.logoBar,
            isLarge && styles.logoBarLarge,
            { height: (isLarge ? 42 : 22) * heightScale },
          ]}
        />
      ))}
    </View>
  );
}

export function AudioFlowAppHeader({
  title = 'AudioFlow',
  subtitle,
  left,
  right,
  topInset = 0,
  style,
}: {
  title?: string;
  subtitle?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  topInset?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.appHeader, { paddingTop: topInset + 12 }, style]}>
      <View style={styles.appHeaderSide}>{left}</View>
      <View style={styles.appHeaderBrand}>
        <AudioFlowLogo />
        <View style={styles.appHeaderTextGroup}>
          <Text style={styles.appHeaderTitle}>{title}</Text>
          {subtitle ? <Text style={styles.appHeaderSubtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      <View style={styles.appHeaderSide}>{right}</View>
    </View>
  );
}

/** Vertical space occupied by `AudioFlowFooterMenu` pinned to the screen bottom */
export function audioFlowFooterMenuHeight(bottomInset = 0) {
  return 64 + Math.max(bottomInset, 8);
}

export function AudioFlowFooterMenu({
  active = 'library',
  bottomInset = 0,
  onLibraryPress,
  onCreatePress,
  onPlayerPress,
  playerDisabled = false,
  createIcon = '+',
  createLabel = 'Nowy audiobook',
  createDisabled = false,
  createTestID,
}: {
  active?: 'library' | 'player';
  bottomInset?: number;
  onLibraryPress?: (event: GestureResponderEvent) => void;
  onCreatePress: (event: GestureResponderEvent) => void;
  onPlayerPress?: (event: GestureResponderEvent) => void;
  playerDisabled?: boolean;
  createIcon?: string;
  createLabel?: string;
  createDisabled?: boolean;
  createTestID?: string;
}) {
  return (
    <View style={[styles.footerWrap, { paddingBottom: Math.max(bottomInset, 8) }]}>
      <View style={styles.footerMenu}>
        <BlurView experimentalBlurMethod="dimezisBlurView" intensity={20} style={styles.footerMenuBackground} tint="dark" />
        <Pressable
          accessibilityLabel="Biblioteka"
          accessibilityRole="button"
          onPress={onLibraryPress}
          style={({ pressed }) => [styles.footerItem, pressed && styles.pressed]}
        >
          <Text style={[styles.footerIcon, active === 'library' && styles.footerItemActive]}>
            ▦
          </Text>
          <Text style={[styles.footerLabel, active === 'library' && styles.footerItemActive]}>
            Biblioteka
          </Text>
        </Pressable>

        <Pressable
          accessibilityLabel={createLabel}
          accessibilityRole="button"
          accessibilityState={{ disabled: createDisabled }}
          disabled={createDisabled}
          onPress={onCreatePress}
          testID={createTestID}
          style={({ pressed }) => [
            styles.footerCreate,
            pressed && !createDisabled && styles.pressed,
            createDisabled && styles.footerItemDisabled,
          ]}
        >
          <Text style={styles.footerCreateText}>{createIcon}</Text>
        </Pressable>

        <Pressable
          accessibilityLabel="Odtwarzacz"
          accessibilityRole="button"
          accessibilityState={{ disabled: playerDisabled }}
          disabled={playerDisabled}
          onPress={onPlayerPress}
          style={({ pressed }) => [
            styles.footerItem,
            pressed && !playerDisabled && styles.pressed,
            playerDisabled && styles.footerItemDisabled,
          ]}
        >
          <Text style={[styles.footerIcon, active === 'player' && styles.footerItemActive]}>▶</Text>
          <Text style={[styles.footerLabel, active === 'player' && styles.footerItemActive]}>
            Odtwarzacz
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export function AudioFlowTextField({
  label,
  style,
  inputStyle,
  ...inputProps
}: TextInputProps & {
  label?: string;
  inputStyle?: StyleProp<TextStyle>;
}) {
  return (
    <View style={[styles.fieldGroup, style as StyleProp<ViewStyle>]}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={t.color.text.onSurfaceMuted}
        style={[audioFlowStyles.field, styles.textField, inputStyle]}
        {...inputProps}
      />
    </View>
  );
}

export function FormLink({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
}) {
  return <Text style={[styles.formLink, style]}>{children}</Text>;
}

export function StatusPill({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'neutral' | 'done';
}) {
  return (
    <View style={[styles.statusPill, tone === 'done' && styles.statusPillDone]}>
      <Text style={[styles.statusPillText, tone === 'done' && styles.statusPillTextDone]}>
        {label}
      </Text>
    </View>
  );
}

export function FilterChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: (event: GestureResponderEvent) => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.filterChipButton,
        selected && styles.filterChipButtonSelected,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.filterChipLabel, selected && styles.filterChipLabelSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function ProjectCard({
  title,
  meta,
  statusLabel,
  statusTone = 'neutral',
  onPress,
  actions,
  style,
  coverUrl,
}: {
  title: string;
  meta: string;
  statusLabel: string;
  statusTone?: 'neutral' | 'done';
  onPress: (event: GestureResponderEvent) => void;
  actions?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  coverUrl?: string | null;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.projectCard, pressed && styles.pressed, style]}
    >
      <View style={styles.projectCardHeader}>
        <View style={styles.projectCover}>
          {coverUrl ? (
            <Image resizeMode="cover" source={{ uri: coverUrl }} style={styles.projectCoverImage} />
          ) : (
            <View style={styles.projectCoverMock}>
              <View style={styles.projectCoverMockBand} />
              <View style={styles.projectCoverMockBandBottom} />
              <Text style={styles.projectCoverMockIcon}>📖</Text>
            </View>
          )}
        </View>
        <View style={styles.projectCardBody}>
          <View style={styles.projectTitleRow}>
            <Text numberOfLines={1} style={styles.projectTitle}>
              {title}
            </Text>
            <StatusPill label={statusLabel} tone={statusTone} />
          </View>
          <Text style={styles.projectMeta}>{meta}</Text>
          {actions ? <View style={styles.projectActions}>{actions}</View> : null}
        </View>
      </View>
    </Pressable>
  );
}

export function AudioFlowProgressBar({
  progress,
  accessibilityLabel = 'Postęp odtwarzania',
}: {
  progress: number;
  accessibilityLabel?: string;
}) {
  const boundedProgress = Math.max(0, Math.min(progress, 1));

  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="progressbar"
      style={styles.progressTrack}
    >
      <View style={[styles.progressFill, { width: `${boundedProgress * 100}%` }]} />
    </View>
  );
}

export function AudioFlowPlayerPanel({
  progress,
  currentTime,
  totalTime,
  onPlayPress,
  onPreviousPress,
  onNextPress,
}: {
  progress: number;
  currentTime: string;
  totalTime: string;
  onPlayPress: (event: GestureResponderEvent) => void;
  onPreviousPress?: (event: GestureResponderEvent) => void;
  onNextPress?: (event: GestureResponderEvent) => void;
}) {
  return (
    <GlassPanel style={styles.playerPanel}>
      <AudioFlowProgressBar progress={progress} />
      <View style={styles.playerTimeRow}>
        <Text style={styles.playerTimeCurrent}>{currentTime}</Text>
        <Text style={styles.playerTimeTotal}>{totalTime}</Text>
      </View>
      <View style={styles.playerControls}>
        <RoundIconButton
          label="Poprzedni rozdział"
          icon="‹‹"
          onPress={onPreviousPress ?? onPlayPress}
        />
        <Pressable
          accessibilityLabel="Odtwarzaj lub pauza"
          accessibilityRole="button"
          onPress={onPlayPress}
          style={({ pressed }) => [styles.playerPlayButton, pressed && styles.pressed]}
        >
          <Text style={styles.playerPlayIcon}>▶</Text>
        </Pressable>
        <RoundIconButton label="Następny rozdział" icon="››" onPress={onNextPress ?? onPlayPress} />
      </View>
    </GlassPanel>
  );
}

export function ProjectToolTile({
  title,
  body,
  icon,
  meta,
  accessibilityLabel,
  onPress,
  style,
}: {
  title: string;
  body: string;
  icon: string;
  meta?: string;
  accessibilityLabel: string;
  onPress: (event: GestureResponderEvent) => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.toolTile, pressed && styles.pressed, style]}
    >
      <View style={styles.toolTileHeader}>
        <View style={styles.toolTileIconWrap}>
          <Text style={styles.toolTileIcon}>{icon}</Text>
        </View>
        {meta ? <Text style={styles.toolTileMeta}>{meta}</Text> : null}
      </View>
      <View>
        <Text style={styles.toolTileTitle}>{title}</Text>
        <Text style={styles.toolTileBody}>{body}</Text>
      </View>
    </Pressable>
  );
}

export const audioFlowStyles = StyleSheet.create({
  headlineLg: {
    ...t.typography.headlineLg,
    color: t.color.text.onDark,
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  headlineMd: {
    ...t.typography.headlineMd,
    color: t.color.text.onDark,
    textShadowColor: 'rgba(255, 255, 255, 0.24)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  eyebrow: {
    ...t.typography.labelSm,
    ...t.typography.eyebrow,
    color: t.color.text.onSurfaceSubtle,
  },
  body: {
    ...t.typography.bodyMd,
    color: t.color.text.onSurfaceSubtle,
  },
  field: {
    backgroundColor: t.color.surface.field,
    borderColor: t.color.surface.glassEdge,
    borderRadius: t.radius.lg,
    borderWidth: 1,
    color: t.color.text.onDark,
    ...t.typography.bodyMd,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
});

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#131316',
    overflow: 'hidden',
  },
  glassPanel: {
    backgroundColor: t.color.surface.glass,
    borderColor: t.color.surface.glassEdge,
    borderRadius: t.radius.panel,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
  },
  pearlButton: {
    alignItems: 'center',
    backgroundColor: t.color.accent.pearl,
    borderRadius: t.radius.full,
    boxShadow: `0 4px 20px ${t.color.accent.pearlGlow}`,
    flexDirection: 'row',
    gap: t.spacing.stackSm,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 18,
    paddingVertical: 12,
    shadowColor: t.color.accent.pearl,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
  },
  pearlButtonText: {
    color: t.color.text.onPearl,
    fontFamily: ff.varelaRound,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  ghostButton: {
    alignItems: 'center',
    backgroundColor: t.color.surface.glassLight,
    borderColor: t.color.surface.glassEdge,
    borderRadius: t.radius.full,
    borderWidth: 1,
    flexDirection: 'row',
    gap: t.spacing.stackSm,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  ghostButtonText: {
    color: t.color.text.onDark,
    fontFamily: ff.varelaRound,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.97 }],
  },
  disabled: {
    opacity: 0.35,
  },
  pickerCard: {
    alignItems: 'flex-start',
    backgroundColor: t.color.surface.glassMuted,
    borderColor: t.color.surface.glassEdge,
    borderRadius: t.radius.card,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  pickerCardSelected: {
    backgroundColor: t.color.accent.pearlTint,
    borderColor: t.color.accent.pearlBorder,
    shadowColor: t.color.accent.pearl,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 22,
  },
  radioDot: {
    borderColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: t.radius.full,
    borderWidth: 1.5,
    height: 20,
    marginTop: 2,
    width: 20,
  },
  radioDotSelected: {
    backgroundColor: t.color.accent.pearl,
    borderColor: t.color.accent.pearl,
    shadowColor: t.color.accent.pearl,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 10,
  },
  pickerContent: {
    flex: 1,
    minWidth: 0,
  },
  pickerTitle: {
    color: t.color.text.onDark,
    ...t.typography.labelMd,
    fontSize: 16,
    lineHeight: 22,
  },
  pickerTitleSelected: {
    color: t.color.accent.pearl,
  },
  pickerBody: {
    color: t.color.text.onSurfaceSubtle,
    ...t.typography.labelMd,
    marginTop: 4,
  },
  pickerMeta: {
    color: t.color.text.onSurfaceMuted,
    ...t.typography.labelSm,
    marginTop: 4,
  },
  sectionTitle: {
    ...t.typography.headlineMd,
    color: t.color.text.onDark,
  },
  sectionHint: {
    ...t.typography.labelMd,
    color: t.color.text.onSurfaceSubtle,
    marginTop: 4,
  },
  chip: {
    backgroundColor: t.color.surface.glassLight,
    borderColor: t.color.surface.glassEdge,
    borderRadius: t.radius.full,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipSelected: {
    backgroundColor: t.color.accent.pearlTint,
    borderColor: t.color.accent.pearlBorder,
  },
  chipText: {
    color: t.color.text.onSurfaceSubtle,
    ...t.typography.labelSm,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: t.color.text.onDark,
  },
  topAppBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: t.spacing.marginMobile,
    paddingVertical: 16,
  },
  topAppBarSide: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    minWidth: 40,
  },
  topAppBarCenter: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: t.spacing.stackSm,
  },
  topAppBarTitle: {
    ...t.typography.labelMd,
    ...t.typography.eyebrow,
    ...(Platform.OS === 'android' ? { includeFontPadding: false as const } : {}),
    color: t.color.text.onSurfaceSubtle,
    textAlign: 'center',
  },
  roundIconButton: {
    alignItems: 'center',
    backgroundColor: t.color.surface.glassLighter,
    borderColor: t.color.surface.glassEdge,
    borderRadius: t.radius.full,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  roundIconText: {
    color: t.color.text.onDark,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
  },
  appHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 12,
    paddingHorizontal: t.spacing.marginMobile,
  },
  appHeaderSide: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
  },
  appHeaderBrand: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  appHeaderIcon: {
    color: t.color.text.onDark,
    fontSize: 30,
    fontWeight: '700',
    lineHeight: 32,
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowRadius: 10,
  },
  logoMark: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 3,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  logoMarkLarge: {
    gap: 5,
    height: 64,
    marginBottom: t.spacing.stackMd,
    width: 64,
  },
  logoBar: {
    backgroundColor: t.color.text.onDark,
    borderRadius: t.radius.full,
    boxShadow: '0 0 10px rgba(255, 255, 255, 0.3)',
    shadowColor: t.color.text.onDark,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    width: 3,
  },
  logoBarLarge: {
    width: 6,
  },
  appHeaderTextGroup: {
    alignItems: 'center',
  },
  appHeaderTitle: {
    color: t.color.text.onDark,
    ...t.typography.labelMd,
    fontSize: 16,
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  appHeaderSubtitle: {
    color: t.color.text.onSurfaceSubtle,
    fontFamily: ff.varelaRound,
    fontSize: 11,
    lineHeight: 14,
    marginTop: 1,
  },
  footerWrap: {
    bottom: 0,
    left: 0,
    paddingHorizontal: t.spacing.marginMobile,
    position: 'absolute',
    right: 0,
  },
  footerMenuBackground: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: t.radius.panel,
    overflow: 'hidden',
  },
  footerMenu: {
    alignItems: 'center',
    backgroundColor: t.color.surface.glass,
    borderColor: t.color.surface.glassEdge,
    borderRadius: t.radius.panel,
    borderWidth: 1,
    flexDirection: 'row',
    height: 64,
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
  },
  footerItem: {
    alignItems: 'center',
    flex: 1,
    gap: 2,
    justifyContent: 'center',
  },
  footerItemDisabled: {
    opacity: 0.45,
  },
  footerIcon: {
    color: t.color.text.onSurfaceSubtle,
    fontSize: 19,
    fontWeight: '700',
    lineHeight: 21,
  },
  footerLabel: {
    color: t.color.text.onSurfaceSubtle,
    ...t.typography.labelSm,
    fontWeight: '600',
  },
  footerItemActive: {
    color: t.color.text.onDark,
  },
  footerCreate: {
    alignItems: 'center',
    backgroundColor: t.color.accent.pearl,
    borderRadius: t.radius.full,
    boxShadow: `0 4px 20px ${t.color.accent.pearlGlow}`,
    height: 56,
    justifyContent: 'center',
    marginTop: -28,
    shadowColor: t.color.accent.pearl,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    width: 56,
  },
  footerCreateText: {
    color: t.color.text.onPearl,
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 36,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    ...t.typography.labelMd,
    color: t.color.text.onSurfaceSubtle,
    paddingHorizontal: 2,
  },
  textField: {
    backgroundColor: 'rgba(19, 19, 22, 0.5)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: t.radius.lg,
  },
  formLink: {
    color: t.color.accent.pearl,
    ...t.typography.labelMd,
  },
  statusPill: {
    backgroundColor: t.color.surface.glassLighter,
    borderColor: t.color.surface.glassEdge,
    borderRadius: t.radius.full,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusPillDone: {
    backgroundColor: t.color.accent.pearlTint,
    borderColor: t.color.accent.pearlBorder,
  },
  statusPillText: {
    color: t.color.text.onSurfaceSubtle,
    ...t.typography.labelSm,
    fontWeight: '700',
  },
  statusPillTextDone: {
    color: t.color.accent.pearl,
  },
  filterChipButton: {
    backgroundColor: t.color.surface.glassLight,
    borderColor: t.color.surface.glassEdge,
    borderRadius: t.radius.full,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  filterChipButtonSelected: {
    backgroundColor: t.color.accent.pearlTint,
    borderColor: t.color.accent.pearlBorder,
  },
  filterChipLabel: {
    color: t.color.text.onSurfaceSubtle,
    ...t.typography.labelSm,
    fontWeight: '600',
  },
  filterChipLabelSelected: {
    color: t.color.text.onDark,
  },
  projectCard: {
    backgroundColor: t.color.surface.glass,
    borderColor: t.color.surface.glassEdge,
    borderRadius: t.radius.panel,
    borderWidth: 1,
    marginBottom: t.spacing.stackMd,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
  },
  projectCardHeader: {
    flexDirection: 'row',
    minHeight: 112,
  },
  projectCover: {
    backgroundColor: t.color.accent.pearlTint,
    borderRightColor: t.color.surface.glassEdge,
    borderRightWidth: 1,
    overflow: 'hidden',
    width: 128,
  },
  projectCoverImage: {
    height: '100%',
    width: '100%',
  },
  projectCoverMock: {
    alignItems: 'center',
    backgroundColor: 'rgba(70, 35, 45, 0.9)',
    flex: 1,
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  projectCoverMockBand: {
    backgroundColor: 'rgba(240, 234, 214, 0.12)',
    bottom: 0,
    height: '40%',
    left: 0,
    position: 'absolute',
    right: 0,
  },
  projectCoverMockBandBottom: {
    backgroundColor: 'rgba(240, 234, 214, 0.06)',
    height: 2,
    left: 0,
    position: 'absolute',
    right: 0,
    top: '60%',
  },
  projectCoverMockIcon: {
    fontSize: 36,
  },
  projectCardBody: {
    flex: 1,
    justifyContent: 'space-between',
    minWidth: 0,
    padding: 14,
  },
  projectTitleRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 8,
  },
  projectTitle: {
    color: t.color.text.onDark,
    flex: 1,
    ...t.typography.labelMd,
    fontSize: 16,
    lineHeight: 22,
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  projectMeta: {
    color: t.color.text.onSurfaceSubtle,
    ...t.typography.labelSm,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },
  projectActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  progressTrack: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: t.radius.full,
    height: 6,
    overflow: 'hidden',
  },
  progressFill: {
    backgroundColor: t.color.accent.pearl,
    borderRadius: t.radius.full,
    height: '100%',
    shadowColor: t.color.accent.pearl,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
  playerPanel: {
    gap: t.spacing.stackSm,
    padding: t.spacing.stackMd,
  },
  playerTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -2,
  },
  playerTimeCurrent: {
    color: t.color.text.onDark,
    ...t.typography.labelSm,
    fontVariant: ['tabular-nums'],
    fontWeight: '700',
  },
  playerTimeTotal: {
    color: t.color.text.onSurfaceSubtle,
    ...t.typography.labelSm,
    fontVariant: ['tabular-nums'],
    fontWeight: '600',
  },
  playerControls: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  playerPlayButton: {
    alignItems: 'center',
    backgroundColor: t.color.accent.pearl,
    borderRadius: t.radius.full,
    boxShadow: `0 4px 24px ${t.color.accent.pearlGlow}`,
    height: 64,
    justifyContent: 'center',
    shadowColor: t.color.accent.pearl,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    width: 64,
  },
  playerPlayIcon: {
    color: t.color.text.onPearl,
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 32,
    marginLeft: 3,
  },
  toolTile: {
    backgroundColor: t.color.surface.glass,
    borderColor: t.color.surface.glassEdge,
    borderRadius: t.radius.panel,
    borderWidth: 1,
    gap: t.spacing.stackMd,
    justifyContent: 'space-between',
    minHeight: 160,
    padding: t.spacing.stackMd,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    width: '47%',
  },
  toolTileHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  toolTileIconWrap: {
    alignItems: 'center',
    backgroundColor: t.color.surface.glassLighter,
    borderColor: t.color.surface.glassEdge,
    borderRadius: t.radius.lg,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  toolTileIcon: {
    color: t.color.accent.pearl,
    fontSize: 22,
    fontWeight: '700',
  },
  toolTileMeta: {
    color: t.color.text.onSurfaceSubtle,
    ...t.typography.labelSm,
    fontWeight: '700',
  },
  toolTileTitle: {
    color: t.color.text.onDark,
    ...t.typography.labelMd,
    fontSize: 16,
    lineHeight: 22,
  },
  toolTileBody: {
    color: t.color.text.onSurfaceSubtle,
    ...t.typography.labelSm,
    lineHeight: 17,
    marginTop: 4,
  },
});
