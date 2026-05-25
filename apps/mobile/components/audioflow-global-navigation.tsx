import { useState, useEffect, type ComponentProps } from 'react';
import type { NativeStackHeaderProps } from '@react-navigation/native-stack';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../lib/auth-context';
import { api } from '../lib/api';
import {
  AudioFlowFooterMenu,
  AudioFlowLogo,
  GhostButton,
  RoundIconButton,
  TopAppBar,
  audioFlowTokens,
} from './audioflow';

const t = audioFlowTokens;
const SCREEN_BG = '#131316';

const PLAN_ACCENT: Record<string, string> = {
  free: t.color.text.onSurfaceSubtle,
  premium: t.color.accent.pearl,
  max: t.color.accent.danger,
};

interface Usage {
  plan: string;
  pagesUsed: number;
  pagesLimit: number;
  projectsUsed: number;
  projectsLimit: number;
  periodMonth: string;
}

function MenuUsageBar({ label, used, limit }: { label: string; used: number; limit: number }) {
  const pct = limit > 0 ? Math.min(used / limit, 1) : 0;
  const fillColor =
    pct >= 0.9 ? t.color.accent.danger :
    pct >= 0.7 ? t.color.accent.pearl :
    t.color.accent.softGreen;
  return (
    <View style={styles.usageBarContainer}>
      <Text style={styles.usageBarLabel}>{label}</Text>
      <View style={styles.usageBarBg}>
        <View style={[styles.usageBarFill, { width: `${pct * 100}%`, backgroundColor: fillColor }]} />
      </View>
      <Text style={styles.usageBarValue}>{used} / {limit}</Text>
    </View>
  );
}

function MenuUsageCard({ usage }: { usage: Usage }) {
  const accent = PLAN_ACCENT[usage.plan] ?? t.color.text.onSurfaceSubtle;
  return (
    <View style={styles.menuUsageCard}>
      <View style={styles.menuUsagePlanRow}>
        <Text style={styles.menuUsagePlanLabel}>Plan</Text>
        <Text style={[styles.menuUsagePlanValue, { color: accent }]}>{usage.plan.toUpperCase()}</Text>
      </View>
      <View style={styles.usageBarsRow}>
        <MenuUsageBar label="Strony" used={usage.pagesUsed} limit={usage.pagesLimit} />
        <MenuUsageBar label="Projekty" used={usage.projectsUsed} limit={usage.projectsLimit} />
      </View>
      <Text style={styles.menuUsagePeriod}>Okres: {usage.periodMonth}</Text>
    </View>
  );
}

function DashboardBrand() {
  return (
    <View style={styles.brandCenter}>
      <AudioFlowLogo />
      <Text style={styles.brandTitle}>AudioFlow</Text>
    </View>
  );
}

function NavigationMenuSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const router = useRouter();
  const { logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [usage, setUsage] = useState<Usage | null>(null);
  const [usageLoading, setUsageLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setUsageLoading(true);
    api.getMyUsage()
      .then(setUsage)
      .catch(() => setUsage(null))
      .finally(() => setUsageLoading(false));
  }, [visible]);

  const goPricing = () => {
    onClose();
    router.push('/(app)/pricing');
  };

  const doLogout = async () => {
    onClose();
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.menuOuter}>
        <BlurView
          experimentalBlurMethod="dimezisBlurView"
          intensity={60}
          style={StyleSheet.absoluteFillObject}
          tint="dark"
        >
          <Pressable
            accessibilityHint="Zamknij menu bez wyboru"
            accessibilityLabel="Zamknij menu"
            accessibilityRole="button"
            onPress={onClose}
            style={styles.menuBackdrop}
            testID="audioflow-global-menu-backdrop"
          />
        </BlurView>
        <View pointerEvents="box-none" style={StyleSheet.absoluteFillObject}>
          <View
            onStartShouldSetResponder={() => true}
            style={[
              styles.menuSheet,
              { paddingTop: insets.top + t.spacing.stackMd, paddingBottom: insets.bottom + t.spacing.stackMd },
            ]}
          >
            <View style={styles.menuSheetHeader}>
              <Text style={[t.typography.labelMd, styles.menuHeading]}>Menu</Text>
              <RoundIconButton featherIcon="x" label="Zamknij menu" onPress={onClose} />
            </View>
            <GhostButton label="Cennik" onPress={goPricing} style={styles.menuButton} />
            <View style={styles.menuSpacer} />
            {usageLoading && !usage && (
              <ActivityIndicator color={t.color.text.onSurfaceSubtle} size="small" />
            )}
            {usage && <MenuUsageCard usage={usage} />}
            <GhostButton
              label="Wyloguj"
              onPress={() => void doLogout()}
              style={styles.menuButton}
              textStyle={styles.logoutText}
              testID="audioflow-global-menu-logout"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function AudioFlowGlobalMenuButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <RoundIconButton featherIcon="menu" label="Menu" onPress={() => setOpen(true)} />
      <NavigationMenuSheet onClose={() => setOpen(false)} visible={open} />
    </>
  );
}

function stackHeaderBg(options: NativeStackHeaderProps['options']): string {
  if (
    typeof options.headerStyle === 'object' &&
    options.headerStyle != null &&
    'backgroundColor' in options.headerStyle &&
    typeof (options.headerStyle as { backgroundColor?: string }).backgroundColor === 'string'
  ) {
    return (options.headerStyle as { backgroundColor: string }).backgroundColor;
  }
  return SCREEN_BG;
}

/** Safe-area + stałe tło jak w nagłówku Stack – używane też dla ekranów bez natywnego nagłówka (np. szczegóły projektu). */
export function AudioFlowTopChrome({
  backgroundColor = SCREEN_BG,
  children,
}: {
  backgroundColor?: string;
  children: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View
      accessibilityRole="toolbar"
      style={[styles.chrome, { paddingTop: insets.top + 8, backgroundColor }]}
    >
      <View style={[styles.chromeBleed, { backgroundColor }]}>{children}</View>
    </View>
  );
}

/** Górny pasek nawigacji — używany przez Stack (`screenOptions.header`). */
export function AudioFlowTopNavigation(props: NativeStackHeaderProps) {
  return <AudioFlowStackHeader {...props} />;
}

/** Dolne menu aplikacji (Biblioteka / Nowy / Odtwarzacz) — ten sam komponent co `AudioFlowFooterMenu`. */
export function AudioFlowBottomNavigation(props: ComponentProps<typeof AudioFlowFooterMenu>) {
  return <AudioFlowFooterMenu {...props} />;
}

export function AudioFlowStackHeader({ navigation, route, options, back }: NativeStackHeaderProps) {
  const isDashboardHome = route.name === 'index';

  const headerTitle =
    typeof options.headerTitle === 'string'
      ? options.headerTitle
      : typeof options.title === 'string'
        ? options.title
        : '';

  const showBack = !isDashboardHome && options.headerBackVisible !== false && back != null;

  return (
    <AudioFlowTopChrome backgroundColor={stackHeaderBg(options)}>
      <TopAppBar
        center={isDashboardHome ? <DashboardBrand /> : undefined}
        left={
          showBack ? (
            <RoundIconButton
              featherIcon="chevron-left"
              label="Wstecz"
              onPress={() => navigation.goBack()}
            />
          ) : undefined
        }
        right={<AudioFlowGlobalMenuButton />}
        title={headerTitle}
      />
    </AudioFlowTopChrome>
  );
}

const styles = StyleSheet.create({
  chrome: {
    width: '100%',
  },
  chromeBleed: {
    overflow: 'hidden',
    width: '100%',
  },
  brandCenter: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  brandTitle: {
    color: t.color.text.onDark,
    ...t.typography.labelMd,
    fontSize: 16,
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  menuOuter: {
    flex: 1,
  },
  menuBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  menuSheet: {
    flex: 1,
    gap: t.spacing.stackMd,
    paddingHorizontal: t.spacing.marginMobile,
  },
  menuSpacer: {
    flex: 1,
  },
  menuSheetHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  menuHeading: {
    color: t.color.text.onDark,
    fontSize: 28,
    fontWeight: '100',
    lineHeight: 36,
  },
  menuButton: {
    width: '100%',
  },
  logoutText: {
    color: t.color.accent.danger,
  },
  menuUsageCard: {
    backgroundColor: t.color.surface.glass,
    borderColor: t.color.surface.glassEdge,
    borderRadius: t.radius.card,
    borderWidth: 1,
    gap: t.spacing.stackSm,
    marginTop: t.spacing.stackSm,
    padding: t.spacing.stackMd,
  },
  menuUsagePlanRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  menuUsagePlanLabel: {
    ...t.typography.labelMd,
    color: t.color.text.onSurfaceSubtle,
  },
  menuUsagePlanValue: {
    ...t.typography.labelMd,
    fontWeight: '700',
  },
  usageBarsRow: {
    flexDirection: 'row',
    gap: t.spacing.stackMd,
  },
  usageBarContainer: {
    flex: 1,
  },
  usageBarLabel: {
    ...t.typography.labelSm,
    color: t.color.text.onSurfaceSubtle,
    marginBottom: 4,
  },
  usageBarBg: {
    backgroundColor: t.color.surface.glassLight,
    borderRadius: t.radius.full,
    height: 6,
    overflow: 'hidden',
  },
  usageBarFill: {
    borderRadius: t.radius.full,
    height: '100%',
  },
  usageBarValue: {
    ...t.typography.labelSm,
    color: t.color.text.onSurfaceMuted,
    marginTop: 4,
  },
  menuUsagePeriod: {
    ...t.typography.labelSm,
    color: t.color.text.onSurfaceMuted,
  },
});
