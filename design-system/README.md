# AudioFlow — Design System

Glass / pearl design system for the AudioFlow audiobook-studio mobile app.
Extracted from the project's HTML views and `tools-shared.css`.

## Files

| File | Use it for |
|---|---|
| `Design System.html` | Open in a browser — visual catalog of every token & component. |
| `tokens.json` | Machine-readable design tokens. Import into RN / Flutter / Tailwind / Style Dictionary. |
| `tokens.css` | Same tokens as CSS custom properties (drop-in for any web view). |
| `tailwind-preset.js` | Tailwind theme extension lifted from the source views. |
| `README.md` | This file. |

## Foundations (quick reference)

### Color
- **Hero background** — warm burgundy `#6b4c4c` with three radial-gradient blooms (rose 0.5, mauve 0.4, deep-rose 0.5). Always behind everything.
- **Glass surface** — `rgba(45,30,30,0.45)` + `blur(3px)` + `1px rgba(15,10,11,0.6)` border + `inset 1px 1px 0 rgba(255,255,255,0.1)` highlight.
- **Pearl accent** — `#F0EAD6` (with `#FBFCF8` highlight in 135° gradient). Used for CTAs, slider fills, live status, primary icons.
- **Text** — white on glass; `#d4c0d7` (`on-surface-subtle`) for secondary copy; `#131316` on pearl.

### Type
- **Headlines** — Quicksand 600/700. `headline-lg` 32/40 -0.02em, `headline-md` 24/32.
- **Body / labels** — Varela Round. `body-md` 16/24, `label-md` 14/20 +0.01em, `label-sm` 12/16.
- **Eyebrow labels** — uppercase, `letter-spacing: 0.18em` (`0.14em` for status).
- **Glow text** — `text-shadow: 0 0 12px rgba(255,255,255,0.3)` on hero titles & section heads.

### Spacing
`stack-sm 8` · `stack-md 16` · `stack-lg 32` · `section-gap 48` · `margin-mobile 20` · `gutter-mobile 16`.

### Radius
Cards `16px`, panels `24px`, pills `9999px`. Tailwind `lg 0.5rem`, `xl 0.75rem`.

### Motion
- `pulseGlow` 2.4s ease-in-out infinite — for play button, status dot.
- `transform 120ms ease` for press feedback (`active:scale(0.97)`).
- `background/border-color 200ms ease` for hover.

## Components shipped

Buttons: **pearl-btn** (primary CTA, gradient) · **ghost-btn** (secondary).
Surfaces: **glass-panel** (deep) · **glass-panel-light** (frosted white).
Inputs: **picker-card** (radio-style selectable row) · **audio-slider** / **progress slider**.
Indicators: **status-pill** with pulsing dot · **glow-text**.
Navigation: **top-app-bar** (back + eyebrow + more) · **bottom-nav** with raised pearl FAB.
Content tiles: **tool-tile** (square glass card with icon chip + meta + title + sub).
Imagery: **cover-art** abstract gradient block + decorative SVG waves/rings + dark `cover-overlay` for legibility.

## Layout

Mobile-only: `max-width: 480px`, centered, `min-height: max(884px, 100dvh)`.
Top app bar 56px, bottom nav 64px with -24px raised FAB.

## Iconography

Material Symbols Outlined, axes `wght 100..700`, `FILL 0..1`. Primary tint `#F0EAD6`.

## How to use for the mobile-app refactor

1. Map `tokens.json` into your platform's token system (Style Dictionary, RN theme, Compose, etc.).
2. Keep the burgundy hero + glass layering — it's the visual signature.
3. Pearl is your ONE accent — don't multiply accents; rely on tonal contrast (glass-panel vs glass-panel-light) for hierarchy.
4. Every interactive surface gets the inset highlight + glass-edge border combo. That's what reads as "glass."
5. Press feedback is universal: scale(0.97) + 120ms.
