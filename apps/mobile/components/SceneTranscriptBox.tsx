import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { audioFlowTokens } from './audioflow';

const LINE_HEIGHT = 24;
const VISIBLE_LINES = 5;
const CENTER_ROW = 2;
const BOX_HEIGHT = LINE_HEIGHT * VISIBLE_LINES; // 120
const FADE_BANDS = 8;
const FADE_BAND_HEIGHT = 5;

const t = audioFlowTokens;

// `top` value that centers `currentLine` in the BOX_HEIGHT viewport.
// Absolutely positioned textWrap starts at top=0; to put line L at row CENTER_ROW:
//   top = CENTER_ROW * LINE_HEIGHT - L * LINE_HEIGHT
const getTop = (totalLines: number, progress: number): number => {
  const bounded = Math.min(1, Math.max(0, progress));
  const currentLine = (totalLines - 1) * bounded;
  return (CENTER_ROW - currentLine) * LINE_HEIGHT;
};

type Props = {
  text: string | null | undefined;
  positionMs: number;
  durationMs: number;
  isPlaying: boolean;
  resetKey?: string | number;
  style?: StyleProp<ViewStyle>;
};

export function SceneTranscriptBox({
  text,
  positionMs,
  durationMs,
  isPlaying,
  resetKey,
  style,
}: Props) {
  // Measured from an invisible clone outside overflow:hidden — works on all platforms
  const [measuredHeight, setMeasuredHeight] = useState(0);
  // Animate `top` (layout property) instead of `transform: translateY` (creates separate
  // CALayer on iOS that doesn't correctly inherit width, causing Text to skip line-wrapping).
  // Absolutely positioned View with left:0/right:0 always gets the correct container width.
  const animTop = useRef(new Animated.Value(CENTER_ROW * LINE_HEIGHT)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);
  const positionMsRef = useRef(positionMs);
  positionMsRef.current = positionMs;

  const hasText = typeof text === 'string' && text.trim().length > 0;
  const displayText = hasText ? text! : 'Brak transkrypcji dla tej sceny';
  const totalLines = measuredHeight > 0 ? Math.max(1, Math.round(measuredHeight / LINE_HEIGHT)) : 1;

  const handleMeasureLayout = (e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    if (h > 0 && Math.abs(h - measuredHeight) > 0.5) {
      setMeasuredHeight(h);
    }
  };

  // Reset on scene change
  useEffect(() => {
    animRef.current?.stop();
    animRef.current = null;
    animTop.setValue(CENTER_ROW * LINE_HEIGHT);
    setMeasuredHeight(0);
  }, [resetKey, text, animTop]);

  // Start/stop animation on playback state, scene, duration, or measurement change.
  // positionMs read via ref — not in deps — to avoid restarting every 500ms audio tick.
  useEffect(() => {
    animRef.current?.stop();
    animRef.current = null;

    if (!isPlaying || !hasText || durationMs <= 0 || measuredHeight === 0) return;

    const pos = positionMsRef.current;
    const progress = Math.min(1, Math.max(0, pos / durationMs));
    const startTop = getTop(totalLines, progress);
    const endTop = getTop(totalLines, 1);
    const remainingMs = Math.max(100, durationMs - pos);

    animTop.setValue(startTop);

    const anim = Animated.timing(animTop, {
      toValue: endTop,
      duration: remainingMs,
      easing: Easing.linear,
      useNativeDriver: false,
    });
    animRef.current = anim;
    anim.start(({ finished }) => {
      if (finished) animRef.current = null;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, resetKey, text, durationMs, totalLines, measuredHeight, animTop]);

  return (
    <View style={[styles.wrapper, style]}>
      {/*
       * Invisible measurement clone rendered OUTSIDE the overflow:hidden container.
       * onLayout on text inside overflow:hidden can return clipped height on web.
       * This clone has identical text styles and the same horizontal padding,
       * so its measured height equals the actual text height.
       */}
      <Text
        accessibilityElementsHidden
        importantForAccessibility="no"
        onLayout={handleMeasureLayout}
        style={styles.measureText}
      >
        {hasText ? displayText : ''}
      </Text>

      <View style={styles.container}>
        <Animated.View style={[styles.textWrap, { top: animTop }]}>
          <Text style={[styles.text, !hasText && styles.placeholder]}>{displayText}</Text>
        </Animated.View>

        <View pointerEvents="none" style={[styles.fadeOverlay, styles.fadeTop]}>
          {Array.from({ length: FADE_BANDS }).map((_, i) => (
            <View
              key={`top-${i}`}
              style={{
                height: FADE_BAND_HEIGHT,
                backgroundColor: t.color.background.deep1,
                opacity: 1 - i / FADE_BANDS,
              }}
            />
          ))}
        </View>
        <View pointerEvents="none" style={[styles.fadeOverlay, styles.fadeBottom]}>
          {Array.from({ length: FADE_BANDS }).map((_, i) => (
            <View
              key={`bot-${i}`}
              style={{
                height: FADE_BAND_HEIGHT,
                backgroundColor: t.color.background.deep1,
                opacity: (i + 1) / FADE_BANDS,
              }}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  // Invisible clone for height measurement — positioned outside the clipping container
  measureText: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    opacity: 0,
    pointerEvents: 'none' as never,
    fontSize: 16,
    lineHeight: LINE_HEIGHT,
    paddingHorizontal: t.spacing.stackMd,
    textAlign: 'center',
  },
  container: {
    height: BOX_HEIGHT,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: t.color.background.deep1,
    borderRadius: t.radius.md,
    width: '100%',
  },
  // Absolutely positioned so left:0/right:0 gives explicit pixel width — Text wraps correctly.
  // Animated `top` is a layout property (not a transform), so no separate CALayer is created.
  textWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: t.spacing.stackMd,
  },
  text: {
    color: t.color.text.onDark,
    fontSize: 16,
    lineHeight: LINE_HEIGHT,
    textAlign: 'center',
  },
  placeholder: {
    color: t.color.text.onSurfaceSubtle,
    fontStyle: 'italic',
  },
  fadeOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  fadeTop: {
    top: 0,
  },
  fadeBottom: {
    bottom: 0,
    flexDirection: 'column',
  },
});
