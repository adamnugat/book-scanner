/**
 * AudioFlow — Tailwind preset.
 * Lifted verbatim from the project views. Import into your tailwind.config.js:
 *
 *   module.exports = {
 *     presets: [require('./design-system/tailwind-preset.js')],
 *     content: [...],
 *   };
 */
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'glass-surface':       'rgba(45, 30, 30, 0.45)',
        'glass-surface-muted': 'rgba(45, 30, 30, 0.35)',
        'glass-light':         'rgba(255, 255, 255, 0.06)',
        'glass-edge':          'rgba(15, 10, 11, 0.6)',
        'surface-muted':       '#1b1b1e',
        'on-surface-subtle':   '#d4c0d7',
        'accent-glow':         '#F0EAD6',
        'pearl':               '#F0EAD6',
        'pearl-bright':        '#FBFCF8',
        'ink':                 '#131316',
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg:   '0.5rem',
        xl:   '0.75rem',
        card: '16px',
        panel:'24px',
        full: '9999px',
      },
      spacing: {
        'gutter-mobile': '16px',
        'stack-sm':       '8px',
        'stack-md':      '16px',
        'stack-lg':      '32px',
        'section-gap':   '48px',
        'margin-mobile': '20px',
      },
      fontFamily: {
        'headline-lg': ['Quicksand'],
        'headline-md': ['Quicksand'],
        'body-lg':     ['Varela Round'],
        'body-md':     ['Varela Round'],
        'label-md':    ['Varela Round'],
        'label-sm':    ['Varela Round'],
      },
      fontSize: {
        'headline-lg': ['32px', { lineHeight: '40px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline-md': ['24px', { lineHeight: '32px', fontWeight: '600' }],
        'body-lg':     ['18px', { lineHeight: '28px', fontWeight: '400' }],
        'body-md':     ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'label-md':    ['14px', { lineHeight: '20px', letterSpacing: '0.01em', fontWeight: '600' }],
        'label-sm':    ['12px', { lineHeight: '16px', fontWeight: '500' }],
      },
      boxShadow: {
        'pearl-cta':   '0 4px 20px rgba(240, 234, 214, 0.4)',
        'pearl-glow':  '0 0 12px rgba(240, 234, 214, 0.9)',
        'pearl-soft':  '0 0 22px rgba(240, 234, 214, 0.18)',
        'nav':         '0 -4px 20px rgba(0, 0, 0, 0.2)',
        'inset-hi':    'inset 1px 1px 0 rgba(255, 255, 255, 0.1)',
      },
      backgroundImage: {
        'pearl-grad':  'linear-gradient(135deg, #F0EAD6 0%, #FBFCF8 50%, #F0EAD6 100%)',
      },
    },
  },
};
