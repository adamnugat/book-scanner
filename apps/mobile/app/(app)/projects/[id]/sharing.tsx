import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
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
      Alert.alert('Udostępniono', `Projekt udostępniony dla ${result.sharedWithEmail}`);
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
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#e94560" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Udostępnij projekt</Text>
      <View style={styles.shareRow}>
        <TextInput
          style={styles.emailInput}
          placeholder="Email użytkownika..."
          placeholderTextColor="#666"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Pressable style={styles.shareBtn} onPress={handleShare} disabled={sharing}>
          {sharing ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.shareBtnText}>Udostępnij</Text>
          )}
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Osoby z dostępem ({shares.length})</Text>
      {shares.length === 0 ? (
        <Text style={styles.emptyText}>Nikt nie ma jeszcze dostępu</Text>
      ) : (
        <FlatList
          data={shares}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.shareItem}>
              <View style={styles.shareInfo}>
                <Text style={styles.shareEmail}>{item.sharedWithEmail}</Text>
                <Text style={styles.shareRole}>{item.role}</Text>
              </View>
              <Pressable onPress={() => handleRevoke(item)}>
                <Text style={styles.revokeText}>Odbierz</Text>
              </Pressable>
            </View>
          )}
          style={styles.shareList}
        />
      )}

      <Text style={styles.sectionTitle}>Kod QR</Text>
      {qr ? (
        <View style={styles.qrSection}>
          <Image source={{ uri: qr.qrImageUrl }} style={styles.qrImage} resizeMode="contain" />
          <Text style={styles.deepLink} numberOfLines={2}>
            {qr.deepLinkUrl}
          </Text>
          <Pressable style={styles.shareLinkBtn} onPress={handleShareLink}>
            <Text style={styles.shareLinkBtnText}>Udostępnij link</Text>
          </Pressable>
          <Pressable style={styles.regenerateBtn} onPress={handleGenerateQr}>
            <Text style={styles.regenerateBtnText}>Wygeneruj ponownie</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable style={styles.generateQrBtn} onPress={handleGenerateQr} disabled={generatingQr}>
          {generatingQr ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.generateQrBtnText}>Wygeneruj QR</Text>
          )}
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent', padding: 20 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: {
    color: '#e0e0e0',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 12,
  },
  shareRow: { flexDirection: 'row', gap: 8 },
  emailInput: {
    flex: 1,
    backgroundColor: '#16213e',
    color: '#e0e0e0',
    borderRadius: 8,
    padding: 14,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  shareBtn: {
    backgroundColor: '#e94560',
    borderRadius: 8,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  shareBtnText: { color: '#fff', fontWeight: '600' },
  emptyText: { color: '#666', fontSize: 14 },
  shareList: { maxHeight: 200 },
  shareItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#16213e',
    borderRadius: 8,
    marginBottom: 6,
  },
  shareInfo: { flex: 1 },
  shareEmail: { color: '#e0e0e0', fontSize: 14 },
  shareRole: { color: '#888', fontSize: 12, marginTop: 2 },
  revokeText: { color: '#e94560', fontSize: 13 },
  qrSection: { alignItems: 'center' },
  qrImage: { width: 200, height: 200, backgroundColor: '#fff', borderRadius: 8 },
  deepLink: { color: '#888', fontSize: 12, marginTop: 8, textAlign: 'center' },
  shareLinkBtn: {
    backgroundColor: '#0f3460',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    paddingHorizontal: 24,
  },
  shareLinkBtnText: { color: '#e0e0e0', fontWeight: '600' },
  regenerateBtn: { marginTop: 8, padding: 8 },
  regenerateBtnText: { color: '#888', fontSize: 13 },
  generateQrBtn: { backgroundColor: '#e94560', borderRadius: 8, padding: 16, alignItems: 'center' },
  generateQrBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
