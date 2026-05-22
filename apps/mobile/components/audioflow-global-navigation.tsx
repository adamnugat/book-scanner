import { useState, type ComponentProps } from 'react';
import type { NativeStackHeaderProps } from '@react-navigation/native-stack';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../lib/auth-context';
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
          <View style={styles.menuForeground}>
            <View onStartShouldSetResponder={() => true} style={styles.menuSheet}>
              <Text style={[t.typography.labelMd, styles.menuHeading]}>Menu</Text>
              <GhostButton label="Cennik" onPress={goPricing} style={styles.menuButton} />
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
  menuForeground: {
    alignItems: 'center',
    paddingTop: 120,
  },
  menuSheet: {
    gap: t.spacing.stackMd,
    padding: t.spacing.stackLg,
    width: '90%',
  },
  menuHeading: {
    color: t.color.text.onDark,
    fontSize: 28,
    fontWeight: '100',
    lineHeight: 36,
    textAlign: 'center',
  },
  menuButton: {
    width: '100%',
  },
  logoutText: {
    color: t.color.accent.danger,
  },
});
