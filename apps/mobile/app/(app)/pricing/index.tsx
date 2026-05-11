import { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { api } from '../../../lib/api';
import { AudioFlowScreen } from '../../../components/audioflow';

interface Plan {
  type: string;
  name: string;
  price: number;
  limits: { maxActiveProjects: number; maxPagesPerMonth: number };
  features: string[];
}

interface Usage {
  plan: string;
  pagesUsed: number;
  pagesLimit: number;
  projectsUsed: number;
  projectsLimit: number;
  periodMonth: string;
}

const PLAN_COLORS: Record<string, string> = {
  free: '#888',
  premium: '#f0a500',
  max: '#e94560',
};

export default function PricingScreen() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [planData, usageData] = await Promise.all([api.getPricing(), api.getMyUsage()]);
        setPlans(planData);
        setUsage(usageData);
      } catch {
        Alert.alert('Błąd', 'Nie udało się pobrać danych');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <AudioFlowScreen>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#e94560" />
        </View>
      </AudioFlowScreen>
    );
  }

  return (
    <AudioFlowScreen>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {usage && (
          <View style={styles.usageCard}>
            <Text style={styles.usageTitle}>Twoje wykorzystanie</Text>
            <Text style={styles.currentPlan}>
              Plan:{' '}
              <Text style={{ color: PLAN_COLORS[usage.plan] || '#888', fontWeight: 'bold' }}>
                {usage.plan.toUpperCase()}
              </Text>
            </Text>
            <View style={styles.usageRow}>
              <UsageBar label="Strony" used={usage.pagesUsed} limit={usage.pagesLimit} />
              <UsageBar label="Projekty" used={usage.projectsUsed} limit={usage.projectsLimit} />
            </View>
            <Text style={styles.period}>Okres: {usage.periodMonth}</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Pakiety</Text>

        {plans.map((plan) => {
          const isActive = usage?.plan === plan.type;
          return (
            <View key={plan.type} style={[styles.planCard, isActive && styles.planCardActive]}>
              <View style={styles.planHeader}>
                <Text style={[styles.planName, { color: PLAN_COLORS[plan.type] || '#e0e0e0' }]}>
                  {plan.name}
                </Text>
                <Text style={styles.planPrice}>
                  {plan.price === 0 ? 'Za darmo' : `${plan.price} zł/msc`}
                </Text>
              </View>
              <View style={styles.planLimits}>
                <Text style={styles.limitText}>Projekty: {plan.limits.maxActiveProjects}</Text>
                <Text style={styles.limitText}>Strony/msc: {plan.limits.maxPagesPerMonth}</Text>
              </View>
              <View style={styles.features}>
                {plan.features.map((f, i) => (
                  <Text key={i} style={styles.featureText}>
                    • {f}
                  </Text>
                ))}
              </View>
              {isActive && (
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>Aktywny</Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </AudioFlowScreen>
  );
}

function UsageBar({ label, used, limit }: { label: string; used: number; limit: number }) {
  const pct = limit > 0 ? Math.min(used / limit, 1) : 0;
  const color = pct >= 0.9 ? '#e94560' : pct >= 0.7 ? '#f0a500' : '#06d6a0';
  return (
    <View style={styles.usageBarContainer}>
      <Text style={styles.usageBarLabel}>{label}</Text>
      <View style={styles.usageBarBg}>
        <View style={[styles.usageBarFill, { width: `${pct * 100}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.usageBarValue}>
        {used} / {limit}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: 20 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  usageCard: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  usageTitle: { color: '#e0e0e0', fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  currentPlan: { color: '#888', fontSize: 14, marginBottom: 12 },
  usageRow: { flexDirection: 'row', gap: 16 },
  period: { color: '#666', fontSize: 12, marginTop: 8 },

  usageBarContainer: { flex: 1 },
  usageBarLabel: { color: '#888', fontSize: 12, marginBottom: 4 },
  usageBarBg: { height: 8, backgroundColor: '#0f3460', borderRadius: 4, overflow: 'hidden' },
  usageBarFill: { height: '100%', borderRadius: 4 },
  usageBarValue: { color: '#e0e0e0', fontSize: 13, marginTop: 4 },

  sectionTitle: { color: '#e0e0e0', fontSize: 20, fontWeight: 'bold', marginBottom: 16 },

  planCard: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  planCardActive: { borderColor: '#e94560', borderWidth: 2 },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planName: { fontSize: 20, fontWeight: 'bold' },
  planPrice: { color: '#e0e0e0', fontSize: 16, fontWeight: '600' },
  planLimits: { flexDirection: 'row', gap: 16, marginBottom: 8 },
  limitText: { color: '#888', fontSize: 13 },
  features: { marginTop: 4 },
  featureText: { color: '#aaa', fontSize: 13, lineHeight: 22 },
  activeBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#e9456033',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activeBadgeText: { color: '#e94560', fontSize: 11, fontWeight: '600' },
});
