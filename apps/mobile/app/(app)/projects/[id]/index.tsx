import { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
  ScrollView,
  Dimensions,
  Image,
  Platform,
  ActionSheetIOS,
} from 'react-native';
import { Stack, useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { api } from '../../../../lib/api';
import type { ProjectResponse } from '@book-scanner/shared';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Szkic',
  ocr_processing: 'OCR w toku',
  ready_for_tts: 'Gotowe do TTS',
  completed: 'Gotowe',
};

const COVER_HEIGHT = Dimensions.get('window').height * 0.5;

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [project, setProject] = useState<ProjectResponse | null>(null);
  const [hasAudio, setHasAudio] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      (async () => {
        try {
          const [projectData, audioTracks] = await Promise.all([
            api.getProject(id),
            api.getAudioTracks(id),
          ]);

          if (!isActive) return;

          setProject(projectData);
          setHasAudio(audioTracks.length > 0);
        } catch {
          Alert.alert('Błąd', 'Nie udało się pobrać projektu');
          router.back();
        }
      })();

      return () => {
        isActive = false;
      };
    }, [id]),
  );

  const handleDelete = () => {
    Alert.alert('Usuń projekt', `Czy na pewno chcesz usunąć "${project?.title}"?`, [
      { text: 'Anuluj', style: 'cancel' },
      {
        text: 'Usuń',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteProject(id);
            router.replace('/(app)');
          } catch {
            Alert.alert('Błąd', 'Nie udało się usunąć projektu');
          }
        },
      },
    ]);
  };

  const handleEdit = () => {
    router.push(`/(app)/projects/${id}/edit`);
  };

  const handleProjectOptions = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Anuluj', 'Edytuj projekt', 'Usuń projekt'],
          cancelButtonIndex: 0,
          destructiveButtonIndex: 2,
          title: project?.title,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) handleEdit();
          if (buttonIndex === 2) handleDelete();
        },
      );
      return;
    }

    Alert.alert('Opcje projektu', 'Wybierz akcję', [
      { text: 'Edytuj projekt', onPress: handleEdit },
      { text: 'Usuń projekt', style: 'destructive', onPress: handleDelete },
      { text: 'Anuluj', style: 'cancel' },
    ]);
  };

  if (!project) {
    return (
      <>
        <Stack.Screen
          options={{
            headerTitle: '',
            headerTransparent: true,
            headerTintColor: '#fff',
          }}
        />
        <View style={styles.emptyState} />
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: '',
          headerTransparent: hasAudio,
          headerTintColor: '#fff',
          headerRight: () => (
            <Pressable
              accessibilityLabel="Opcje projektu"
              style={styles.headerAction}
              onPress={handleProjectOptions}
            >
              <Text style={styles.headerActionText}>...</Text>
            </Pressable>
          ),
        }}
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {hasAudio ? (
          <View style={[styles.coverHero, { height: COVER_HEIGHT }]}>
            {project.coverUrl ? (
              <Image source={{ uri: project.coverUrl }} style={styles.coverImage} />
            ) : (
              <View style={styles.mockCover}>
                <View style={styles.coverOrbPrimary} />
                <View style={styles.coverOrbSecondary} />
                <Text style={styles.coverKicker}>Audiobook</Text>
                <Text style={styles.coverTitle}>{project.title}</Text>
                <Text style={styles.coverSubtitle}>
                  {STATUS_LABELS[project.status] || project.status}
                </Text>
              </View>
            )}

            <View style={styles.coverScrim} />
            <View style={styles.coverControls}>
              <Text style={styles.coverControlsTitle}>{project.title}</Text>
              <Pressable
                style={styles.playButton}
                onPress={() => router.push(`/(app)/projects/${id}/player`)}
              >
                <Text style={styles.playButtonText}>Odtwarzaj audiobooka</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.creationHeader}>
            <Text style={styles.title}>{project.title}</Text>
            <Text style={styles.statusPill}>{STATUS_LABELS[project.status] || project.status}</Text>
            <View
              style={[
                styles.nextStepCard,
                project.status === 'ready_for_tts' && styles.nextStepCardReady,
              ]}
            >
              <Text style={styles.nextStepKicker}>Etap audiobooka</Text>
              <Text style={styles.nextStepTitle}>
                {project.status === 'ready_for_tts'
                  ? 'Następny krok: Text to Speech'
                  : 'Przygotuj tekst przed nagraniem'}
              </Text>
              <Text style={styles.nextStepBody}>
                {project.status === 'ready_for_tts'
                  ? 'OCR jest gotowy. Wybierz głos lektora, a potem uruchom generowanie audio dla zatwierdzonych scen.'
                  : 'Najpierw zakończ OCR i zatwierdź tekst scen.'}
              </Text>
              {project.status === 'ready_for_tts' && (
                <Pressable
                  style={styles.nextStepBtn}
                  onPress={() => router.push(`/(app)/projects/${id}/voice`)}
                >
                  <Text style={styles.nextStepBtnText}>Wybierz głos i generuj audio</Text>
                </Pressable>
              )}
            </View>
          </View>
        )}

        <View style={styles.toolsSection}>
          <Text style={styles.sectionTitle}>Narzędzia projektu</Text>
          <View style={styles.toolsGrid}>
            <Pressable
              style={styles.toolCard}
              onPress={() => router.push(`/(app)/projects/${id}/images`)}
            >
              <Text style={styles.toolKicker}>Treść</Text>
              <Text style={styles.toolTitle}>Zdjęcia stron</Text>
              <Text style={styles.toolBody}>Dodaj lub popraw materiał źródłowy.</Text>
            </Pressable>

            <Pressable
              style={styles.toolCard}
              onPress={() => router.push(`/(app)/projects/${id}/voice`)}
            >
              <Text style={styles.toolKicker}>Audio</Text>
              <Text style={styles.toolTitle}>Głos i audio</Text>
              <Text style={styles.toolBody}>
                {project.voiceId ? project.voiceId : 'Wybierz lektora i przebuduj ścieżki.'}
              </Text>
            </Pressable>

            <Pressable
              style={styles.toolCard}
              onPress={() => router.push(`/(app)/projects/${id}/sharing`)}
            >
              <Text style={styles.toolKicker}>Dostęp</Text>
              <Text style={styles.toolTitle}>Udostępnij</Text>
              <Text style={styles.toolBody}>Link i kod QR dla odbiorców.</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#101320' },
  content: { paddingBottom: 32 },
  emptyState: { flex: 1, backgroundColor: '#101320' },
  headerAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 19, 32, 0.45)',
    marginRight: 4,
  },
  headerActionText: { color: '#fff', fontSize: 24, fontWeight: '700', marginTop: -8 },
  coverHero: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: '#14182a',
  },
  coverImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  mockCover: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    backgroundColor: '#20233d',
  },
  coverOrbPrimary: {
    position: 'absolute',
    top: -80,
    right: -70,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(233, 69, 96, 0.38)',
  },
  coverOrbSecondary: {
    position: 'absolute',
    bottom: 42,
    left: -60,
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: 'rgba(6, 214, 160, 0.2)',
  },
  coverKicker: {
    color: '#f0a500',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  coverTitle: {
    color: '#fff',
    fontSize: 34,
    fontWeight: '800',
    lineHeight: 40,
    maxWidth: '78%',
  },
  coverSubtitle: {
    color: '#d7e4ef',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 14,
  },
  coverScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
  },
  coverControls: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 24,
  },
  coverControlsTitle: { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 12 },
  playButton: {
    backgroundColor: '#06d6a0',
    borderRadius: 18,
    paddingVertical: 17,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  playButtonText: { color: '#101320', fontSize: 16, fontWeight: '800' },
  creationHeader: { padding: 24, paddingBottom: 4 },
  title: { fontSize: 30, fontWeight: '800', color: '#fff', marginBottom: 10 },
  statusPill: {
    alignSelf: 'flex-start',
    color: '#d7e4ef',
    fontSize: 13,
    fontWeight: '700',
    backgroundColor: '#20233d',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 18,
  },
  nextStepCard: {
    backgroundColor: '#18213d',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#29355c',
  },
  nextStepCardReady: {
    borderColor: '#06d6a0',
    backgroundColor: '#073b3a',
  },
  nextStepKicker: {
    color: '#f0a500',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  nextStepTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 8 },
  nextStepBody: { color: '#c9d6df', fontSize: 14, lineHeight: 20 },
  nextStepBtn: {
    backgroundColor: '#06d6a0',
    borderRadius: 14,
    padding: 15,
    alignItems: 'center',
    marginTop: 16,
  },
  nextStepBtnText: { color: '#102027', fontSize: 15, fontWeight: '800' },
  toolsSection: { paddingHorizontal: 24, paddingTop: 24 },
  sectionTitle: { color: '#fff', fontSize: 19, fontWeight: '800', marginBottom: 14 },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  toolCard: {
    width: '48%',
    minHeight: 148,
    backgroundColor: '#18213d',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#29355c',
  },
  toolKicker: {
    color: '#f0a500',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    marginBottom: 18,
  },
  toolTitle: { color: '#fff', fontSize: 17, fontWeight: '800', marginBottom: 8 },
  toolBody: { color: '#aebbd3', fontSize: 13, lineHeight: 18 },
});
