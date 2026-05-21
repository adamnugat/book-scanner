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
