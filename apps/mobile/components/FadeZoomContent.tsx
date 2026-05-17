import { useEffect, useRef } from 'react';
import { Animated, Easing, type ViewStyle } from 'react-native';

interface FadeZoomContentProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function FadeZoomContent({ children, style }: FadeZoomContentProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, scale]);

  return (
    <Animated.View style={[{ flex: 1, opacity, transform: [{ scale }] }, style]}>
      {children}
    </Animated.View>
  );
}
