import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleProp,
  StyleSheet,
  Text,
  View,
  type ImageStyle,
} from 'react-native';

interface PageImagePreviewProps {
  imageUrl: string | null;
  thumbnailUrl?: string | null;
  style?: StyleProp<ImageStyle>;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
}

export function PageImagePreview({
  imageUrl,
  thumbnailUrl = null,
  style,
  resizeMode = 'contain',
}: PageImagePreviewProps) {
  const sourceUri = thumbnailUrl || imageUrl;
  const [loading, setLoading] = useState(Boolean(sourceUri));
  const [hasError, setHasError] = useState(!sourceUri);

  useEffect(() => {
    setLoading(Boolean(sourceUri));
    setHasError(!sourceUri);
  }, [sourceUri]);

  return (
    <View style={[styles.container, style]}>
      {sourceUri && !hasError && (
        <Image
          source={{ uri: sourceUri }}
          style={styles.image}
          resizeMode={resizeMode}
          onLoad={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setHasError(true);
          }}
        />
      )}
      {loading && !hasError && (
        <View style={styles.stateOverlay}>
          <ActivityIndicator color="#e94560" />
          <Text style={styles.stateText}>Ładowanie zdjęcia...</Text>
        </View>
      )}
      {hasError && (
        <View style={styles.stateOverlay}>
          <Text style={styles.errorText}>Nie można wyświetlić zdjęcia</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f3460',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  stateOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    backgroundColor: '#0f3460',
  },
  stateText: {
    color: '#cbd5e1',
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },
  errorText: {
    color: '#f8fafc',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
});
