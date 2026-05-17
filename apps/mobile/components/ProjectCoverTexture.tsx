import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

const C1 = 'rgba(240, 234, 214, 0.55)';
const C2 = 'rgba(240, 234, 214, 0.22)';
const C3 = 'rgba(240, 234, 214, 0.10)';
const BG = 'rgba(70, 35, 45, 0.9)';

export function getTextureIndex(projectId: string): number {
  let sum = 0;
  for (let i = 0; i < projectId.length; i++) {
    sum += projectId.charCodeAt(i);
  }
  return sum % 10;
}

function centered(child: React.ReactElement, key: string | number) {
  return (
    <View key={key} style={[StyleSheet.absoluteFill, styles.center]}>
      {child}
    </View>
  );
}

function ConcentricRings() {
  const rings = [
    { size: 88, color: C1, bw: 1.5 },
    { size: 66, color: C2, bw: 1 },
    { size: 44, color: C1, bw: 1.5 },
    { size: 22, color: C2, bw: 1 },
  ];
  return (
    <View style={StyleSheet.absoluteFill}>
      {rings.map(({ size, color, bw }, i) =>
        centered(
          <View
            style={{ width: `${size}%`, aspectRatio: 1, borderRadius: 999, borderWidth: bw, borderColor: color }}
          />,
          i,
        ),
      )}
    </View>
  );
}

function GridDots() {
  return (
    <View style={[StyleSheet.absoluteFill, styles.center]}>
      <View style={styles.gridWrap}>
        {Array.from({ length: 4 }).map((_, r) => (
          <View key={r} style={styles.gridRow}>
            {Array.from({ length: 3 }).map((_, c) => (
              <View
                key={c}
                style={[styles.dot, { backgroundColor: (r + c) % 2 === 0 ? C1 : C2 }]}
              />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

function DiagonalStripes() {
  return (
    <View style={[StyleSheet.absoluteFill, styles.overflow]}>
      {[-2, 10, 22, 34, 46, 58, 70, 82].map((offset, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            top: -80,
            left: `${offset}%`,
            width: 8,
            height: 300,
            backgroundColor: i % 2 === 0 ? C1 : C2,
            transform: [{ rotate: '35deg' }],
          }}
        />
      ))}
    </View>
  );
}

function PlusCross() {
  return (
    <View style={StyleSheet.absoluteFill}>
      <View style={[styles.barH, { height: '30%', top: '35%', backgroundColor: C2 }]} />
      <View style={[styles.barV, { width: '30%', left: '35%', backgroundColor: C2 }]} />
      <View style={[styles.barH, { height: '10%', top: '45%', backgroundColor: C1 }]} />
      <View style={[styles.barV, { width: '10%', left: '45%', backgroundColor: C1 }]} />
    </View>
  );
}

function CornerArcs() {
  return (
    <View style={[StyleSheet.absoluteFill, styles.overflow]}>
      {(['tl', 'tr', 'bl', 'br'] as const).map((corner, i) => (
        <View
          key={corner}
          style={{
            position: 'absolute',
            width: '160%',
            aspectRatio: 1,
            borderRadius: 999,
            borderWidth: 1.5,
            borderColor: i % 2 === 0 ? C1 : C2,
            top: corner.startsWith('t') ? '-100%' : undefined,
            bottom: corner.startsWith('b') ? '-100%' : undefined,
            left: corner.endsWith('l') ? '-80%' : undefined,
            right: corner.endsWith('r') ? '-80%' : undefined,
          }}
        />
      ))}
    </View>
  );
}

function DiamondCenter() {
  const sizes = [80, 58, 38, 20];
  return (
    <View style={StyleSheet.absoluteFill}>
      {sizes.map((s, i) =>
        centered(
          <View
            style={{
              width: `${s}%`,
              aspectRatio: 1,
              borderWidth: 1.5,
              borderColor: i % 2 === 0 ? C1 : C2,
              transform: [{ rotate: '45deg' }],
            }}
          />,
          i,
        ),
      )}
    </View>
  );
}

function HorizontalWaves() {
  const waves = [
    { top: '10%', opacity: 0.55 },
    { top: '28%', opacity: 0.35 },
    { top: '46%', opacity: 0.55 },
    { top: '64%', opacity: 0.35 },
    { top: '82%', opacity: 0.2 },
  ];
  return (
    <View style={[StyleSheet.absoluteFill, styles.overflow]}>
      {waves.map((w, i) => (
        <View
          key={i}
          style={{
            position: 'absolute' as const,
            top: w.top as `${number}%`,
            left: '-20%' as const,
            right: '-20%' as const,
            height: 80,
            borderTopWidth: 1.5,
            borderColor: `rgba(240, 234, 214, ${w.opacity})`,
            borderTopLeftRadius: 60,
            borderTopRightRadius: 60,
          }}
        />
      ))}
    </View>
  );
}

function NestedRotatedSquares() {
  const frames = [
    { size: 72, angle: 0 },
    { size: 62, angle: 15 },
    { size: 52, angle: 30 },
    { size: 42, angle: 45 },
  ];
  return (
    <View style={StyleSheet.absoluteFill}>
      {frames.map(({ size, angle }, i) =>
        centered(
          <View
            style={{
              width: `${size}%`,
              aspectRatio: 1,
              borderWidth: 1.2,
              borderColor: i % 2 === 0 ? C1 : C2,
              transform: [{ rotate: `${angle}deg` }],
            }}
          />,
          i,
        ),
      )}
    </View>
  );
}

function RadialLines() {
  const angles = [0, 22.5, 45, 67.5, 90, 112.5, 135, 157.5];
  return (
    <View style={[StyleSheet.absoluteFill, styles.center, styles.overflow]}>
      {angles.map((angle, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            width: '110%',
            height: 1,
            backgroundColor: i % 2 === 0 ? C2 : C3,
            transform: [{ rotate: `${angle}deg` }],
          }}
        />
      ))}
      <View style={styles.radialDot} />
    </View>
  );
}

function AbstractBlobs() {
  return (
    <View style={[StyleSheet.absoluteFill, styles.overflow]}>
      <View
        style={{
          position: 'absolute',
          top: '-30%',
          left: '-20%',
          width: '90%',
          aspectRatio: 1,
          borderRadius: 999,
          backgroundColor: 'rgba(240, 234, 214, 0.08)',
          borderWidth: 1,
          borderColor: C2,
        }}
      />
      <View
        style={{
          position: 'absolute',
          bottom: '-20%',
          right: '-30%',
          width: '85%',
          aspectRatio: 1,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: C1,
          backgroundColor: 'rgba(240, 234, 214, 0.05)',
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: '30%',
          left: '20%',
          width: '40%',
          aspectRatio: 1,
          borderRadius: 999,
          backgroundColor: C3,
        }}
      />
    </View>
  );
}

const TEXTURES = [
  ConcentricRings,
  GridDots,
  DiagonalStripes,
  PlusCross,
  CornerArcs,
  DiamondCenter,
  HorizontalWaves,
  NestedRotatedSquares,
  RadialLines,
  AbstractBlobs,
];

export function ProjectCoverTexture({
  projectId,
  style,
}: {
  projectId: string;
  style?: StyleProp<ViewStyle>;
}) {
  const index = getTextureIndex(projectId);
  const TexturePattern = TEXTURES[index];

  return (
    <View style={[styles.container, style]}>
      <TexturePattern />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: BG,
    flex: 1,
    overflow: 'hidden',
  },
  overflow: {
    overflow: 'hidden',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridWrap: {
    gap: 12,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dot: {
    borderRadius: 99,
    height: 6,
    width: 6,
  },
  barH: {
    left: 0,
    position: 'absolute',
    right: 0,
  },
  barV: {
    bottom: 0,
    position: 'absolute',
    top: 0,
  },
  radialDot: {
    backgroundColor: C1,
    borderRadius: 6,
    height: 12,
    width: 12,
  },
});
