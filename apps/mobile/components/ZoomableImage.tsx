import { useState } from 'react';
import { Image, ImageResizeMode, LayoutChangeEvent, ScrollView, StyleSheet, View, ViewStyle } from 'react-native';

interface ZoomableImageProps {
  uri: string | null;
  style?: ViewStyle;
  resizeMode?: ImageResizeMode;
}

export function ZoomableImage({ uri, style, resizeMode = 'contain' }: ZoomableImageProps) {
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);

  function onLayout(e: LayoutChangeEvent) {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) setSize({ width, height });
  }

  if (!uri) return null;

  return (
    <View style={[styles.container, style]} onLayout={onLayout}>
      {size && (
        <ScrollView
          style={{ width: size.width, height: size.height }}
          contentContainerStyle={{ width: size.width, height: size.height }}
          maximumZoomScale={3}
          minimumZoomScale={1}
          centerContent
          bouncesZoom
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          scrollEnabled
        >
          <Image
            source={{ uri }}
            style={{ width: size.width, height: size.height }}
            resizeMode={resizeMode}
          />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});
