import { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { api } from '../../../../lib/api';
import {
  audioFlowTokens,
  GlassPanel,
  PearlButton,
  GhostButton,
  AudioFlowTextField,
  SectionHeading,
} from '../../../../components/audioflow';
import { FadeZoomContent } from '../../../../components/FadeZoomContent';
import { AudioFlowScreenWithHeader } from '../../../../components/audioflow-global-navigation';

const t = audioFlowTokens;

interface ShareEntry {
  id: string;
  sharedWithUserId: string;
  sharedWithEmail: string;
  role: string;
  createdAt: string;
}

interface QrData {
  deepLinkUrl: string;
  webFallbackUrl?: string;
  qrImageUrl: string;
}

export default function SharingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [shares, setShares] = useState<ShareEntry[]>([]);
  const [qr, setQr] = useState<QrData | null>(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [generatingQr, setGeneratingQr] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [shareList, qrData] = await Promise.all([
          api.getShares(id),
          api.getQr(id).catch(() => null),
        ]);
        setShares(shareList);
        setQr(qrData);
      } catch {
        Alert.alert('Błąd', 'Nie udało się pobrać danych');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleShare = async () => {
    if (!email.trim()) {
      Alert.alert('Błąd', 'Podaj adres email');
      return;
    }
    setSharing(true);
    try {
      const result = await api.shareProject(id, email.trim().toLowerCase());
      setShares((prev) => [...prev, result as unknown as ShareEntry]);
      setEmail('');
      Alert.alert('Udostępniono', `Audiobook udostępniony dla ${result.sharedWithEmail}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Nie udało się udostępnić';
      Alert.alert('Błąd', msg);
    } finally {
      setSharing(false);
    }
  };

  const handleRevoke = (share: ShareEntry) => {
    Alert.alert('Odbierz dostęp', `Odebrać dostęp ${share.sharedWithEmail}?`, [
      { text: 'Anuluj', style: 'cancel' },
      {
        text: 'Odbierz',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.revokeShare(id, share.sharedWithUserId);
            setShares((prev) => prev.filter((s) => s.id !== share.id));
          } catch {
            Alert.alert('Błąd', 'Nie udało się odebrać dostępu');
          }
        },
      },
    ]);
  };

  const handleGenerateQr = async () => {
    setGeneratingQr(true);
    try {
      const data = await api.generateQr(id);
      setQr(data);
    } catch {
      Alert.alert('Błąd', 'Nie udało się wygenerować QR');
    } finally {
      setGeneratingQr(false);
    }
  };

  const handleShareLink = () => {
    if (!qr) return;
    const url = qr.webFallbackUrl || qr.deepLinkUrl;
    Share.share({ message: `Posłuchaj audiobooka: ${url}`, url });
  };

  if (loading) {
    return (
      <AudioFlowScreenWithHeader title="Udostępnianie">
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={t.color.accent.pearl} />
        </View>
      </AudioFlowScreenWithHeader>
    );
  }

  return (
    <AudioFlowScreenWithHeader title="Udostępnianie">
      <FadeZoomContent>
        <View style={styles.container}>
          <FlatList
            data={shares}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={
              <>
                <SectionHeading title="Udostępnij audiobook" style={styles.sectionHeading} />
                <View style={styles.shareRow}>
                  <AudioFlowTextField
                    placeholder="Email użytkownika..."
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={styles.emailField}
                  />
                  <PearlButton
                    label={sharing ? '…' : 'Udostępnij'}
                    onPress={handleShare}
                    disabled={sharing}
                    style={styles.shareBtn}
                  />
                </View>

                <SectionHeading
                  title={`Osoby z dostępem (${shares.length})`}
                  style={styles.sectionHeading}
                />
                {shares.length === 0 && (
                  <Text style={styles.emptyText}>Nikt nie ma jeszcze dostępu</Text>
                )}
              </>
            }
            renderItem={({ item }) => (
              <GlassPanel style={styles.shareItem}>
                <View style={styles.shareInfo}>
                  <Text style={styles.shareEmail}>{item.sharedWithEmail}</Text>
                  <Text style={styles.shareRole}>{item.role}</Text>
                </View>
                <Pressable onPress={() => handleRevoke(item)}>
                  <Text style={styles.revokeText}>Odbierz</Text>
                </Pressable>
              </GlassPanel>
            )}
            ListFooterComponent={
              <>
                <SectionHeading title="Kod QR" style={styles.sectionHeading} />
                {qr ? (
                  <GlassPanel style={styles.qrPanel}>
                    <Image
                      source={{ uri: qr.qrImageUrl }}
                      style={styles.qrImage}
                      resizeMode="contain"
                    />
                    <Text style={styles.deepLink} numberOfLines={2}>
                      {qr.deepLinkUrl}
                    </Text>
                    <GhostButton
                      label="Udostępnij link"
                      onPress={handleShareLink}
                      style={styles.qrActionBtn}
                    />
                    <Pressable style={styles.regenerateBtn} onPress={handleGenerateQr}>
                      <Text style={styles.regenerateText}>Wygeneruj ponownie</Text>
                    </Pressable>
                  </GlassPanel>
                ) : (
                  <PearlButton
                    label={generatingQr ? '…' : 'Wygeneruj QR'}
                    onPress={handleGenerateQr}
                    disabled={generatingQr}
                  />
                )}
              </>
            }
            contentContainerStyle={styles.listContent}
          />
        </View>
      </FadeZoomContent>
    </AudioFlowScreenWithHeader>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: t.spacing.gutterMobile, paddingBottom: 40 },
  sectionHeading: { marginTop: t.spacing.stackMd, marginBottom: t.spacing.stackSm },
  shareRow: { flexDirection: 'row', gap: t.spacing.stackSm, alignItems: 'flex-end' },
  emailField: { flex: 1 },
  shareBtn: { minWidth: 110 },
  emptyText: {
    color: t.color.text.onSurfaceMuted,
    fontSize: 14,
    fontFamily: 'VarelaRound_400Regular',
  },
  shareItem: {
    borderRadius: t.radius.card,
    padding: 12,
    marginBottom: t.spacing.stackSm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  shareInfo: { flex: 1 },
  shareEmail: {
    color: t.color.text.onDark,
    fontSize: 14,
    fontFamily: 'VarelaRound_400Regular',
  },
  shareRole: {
    color: t.color.text.onSurfaceMuted,
    fontSize: 12,
    fontFamily: 'VarelaRound_400Regular',
    marginTop: 2,
  },
  revokeText: {
    color: t.color.accent.danger,
    fontSize: 13,
    fontFamily: 'VarelaRound_400Regular',
  },
  qrPanel: {
    borderRadius: t.radius.card,
    padding: t.spacing.gutterMobile,
    alignItems: 'center',
    gap: t.spacing.stackSm,
  },
  qrImage: { width: 200, height: 200, backgroundColor: '#fff', borderRadius: t.radius.md },
  deepLink: {
    color: t.color.text.onSurfaceMuted,
    fontSize: 12,
    fontFamily: 'VarelaRound_400Regular',
    textAlign: 'center',
  },
  qrActionBtn: { alignSelf: 'stretch' },
  regenerateBtn: { padding: 8 },
  regenerateText: {
    color: t.color.text.onSurfaceMuted,
    fontSize: 13,
    fontFamily: 'VarelaRound_400Regular',
  },
});
