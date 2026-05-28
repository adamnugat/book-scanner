import { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';

import {
  AudioFlowFooterMenu,
} from '../../../components/audioflow';
import { AudioFlowScreenWithHeader } from '../../../components/audioflow-global-navigation';
import { FadeZoomContent } from '../../../components/FadeZoomContent';
import { audioFlowTokens } from '../../../components/audioflow-tokens';
import { api } from '../../../lib/api';

const t = audioFlowTokens;

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

const PLAN_ACCENT: Record<string, string> = {
  free: t.color.text.onSurfaceSubtle,
  premium: t.color.accent.pearl,
  max: t.color.accent.danger,
};

export default function PricingScreen() {
  const insets = useSafeAreaInsets();
  const footerPadding = 104 + Math.max(insets.bottom, 8);

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
      <AudioFlowScreenWithHeader title="Cennik i plan">
        <FadeZoomContent>
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={t.color.accent.danger} />
          </View>
        </FadeZoomContent>

        <AudioFlowFooterMenu
          active="library"
          bottomInset={insets.bottom}
          onCreatePress={() => router.push('/(app)/projects/new')}
          onLibraryPress={() => router.replace('/(app)')}
          playerDisabled
        />
      </AudioFlowScreenWithHeader>
    );
  }

  return (
    <AudioFlowScreenWithHeader title="Cennik i plan">
      <FadeZoomContent>
        <ScrollView
          style={styles.container}
          contentContainerStyle={[styles.content, { paddingBottom: footerPadding }]}
        >
          {usage && (
            <View style={styles.card}>
              <BlurView intensity={10} tint="dark" style={StyleSheet.absoluteFill} />
              <Text style={styles.cardTitle}>Twoje wykorzystanie</Text>
              <View style={styles.currentPlanRow}>
                <Text style={styles.currentPlanLabel}>Aktywny plan</Text>
                <Text style={[styles.currentPlanValue, { color: PLAN_ACCENT[usage.plan] ?? t.color.text.onSurfaceSubtle }]}>
                  {usage.plan.toUpperCase()}
                </Text>
              </View>
              <View style={styles.barsRow}>
                <UsageBar label="Strony" used={usage.pagesUsed} limit={usage.pagesLimit} />
                <UsageBar label="Audiobooki" used={usage.projectsUsed} limit={usage.projectsLimit} />
              </View>
              <Text style={styles.period}>Okres: {usage.periodMonth}</Text>
            </View>
          )}

          <Text style={styles.sectionLabel}>Pakiety</Text>

          {plans.map((plan) => {
            const isActive = usage?.plan === plan.type;
            const accent = PLAN_ACCENT[plan.type] ?? t.color.text.onSurfaceSubtle;
            return (
              <View key={plan.type} style={[styles.card, isActive && { borderColor: accent, borderWidth: 2 }]}>
                <BlurView intensity={10} tint="dark" style={StyleSheet.absoluteFill} />

                <View style={styles.planHeader}>
                  <View style={styles.planNameRow}>
                    <Text style={[styles.planName, { color: accent }]}>{plan.name}</Text>
                    {isActive && (
                      <View style={[styles.activeBadge, { backgroundColor: `${accent}22` }]}>
                        <Text style={[styles.activeBadgeText, { color: accent }]}>Aktywny</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.planPrice}>
                    {plan.price === 0 ? 'Za darmo' : `${plan.price} zł/msc`}
                  </Text>
                </View>

                <View style={styles.limitsRow}>
                  <LimitChip icon="layers" label={`${plan.limits.maxActiveProjects} audiobooków`} />
                  <LimitChip icon="file-text" label={`${plan.limits.maxPagesPerMonth} stron/msc`} />
                </View>

                <View style={styles.divider} />

                <View style={styles.features}>
                  {plan.features.map((f, i) => (
                    <View key={i} style={styles.featureRow}>
                      <Feather name="check" size={14} color={t.color.accent.softGreen} />
                      <Text style={styles.featureText}>{f}</Text>
                    </View>
                  ))}
                </View>
              </View>
            );
          })}
        </ScrollView>
      </FadeZoomContent>

      <AudioFlowFooterMenu
        active="library"
        bottomInset={insets.bottom}
        onCreatePress={() => router.push('/(app)/projects/new')}
        onLibraryPress={() => router.replace('/(app)')}
        playerDisabled
      />
    </AudioFlowScreenWithHeader>
  );
}

function LimitChip({ icon, label }: { icon: React.ComponentProps<typeof Feather>['name']; label: string }) {
  return (
    <View style={styles.limitChip}>
      <Feather name={icon} size={12} color={t.color.text.onSurfaceSubtle} />
      <Text style={styles.limitChipText}>{label}</Text>
    </View>
  );
}

function UsageBar({ label, used, limit }: { label: string; used: number; limit: number }) {
  const pct = limit > 0 ? Math.min(used / limit, 1) : 0;
  const fillColor =
    pct >= 0.9 ? t.color.accent.danger :
    pct >= 0.7 ? t.color.accent.pearl :
    t.color.accent.softGreen;
  return (
    <View style={styles.usageBarContainer}>
      <Text style={styles.usageBarLabel}>{label}</Text>
      <View style={styles.usageBarBg}>
        <View style={[styles.usageBarFill, { width: `${pct * 100}%`, backgroundColor: fillColor }]} />
      </View>
      <Text style={styles.usageBarValue}>{used} / {limit}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: t.spacing.marginMobile, gap: t.spacing.stackSm },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  card: {
    backgroundColor: t.color.surface.glass,
    borderColor: t.color.surface.glassEdge,
    borderRadius: t.radius.card,
    borderWidth: 1,
    overflow: 'hidden',
    padding: t.spacing.stackMd,
  },

  cardTitle: {
    ...t.typography.headlineMd,
    fontSize: 18,
    color: t.color.text.onDark,
    marginBottom: t.spacing.stackSm,
  },
  currentPlanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  currentPlanLabel: {
    ...t.typography.labelMd,
    color: t.color.text.onSurfaceSubtle,
  },
  currentPlanValue: {
    ...t.typography.labelMd,
    fontWeight: '700',
  },
  barsRow: { flexDirection: 'row', gap: t.spacing.stackMd },
  period: {
    ...t.typography.labelSm,
    color: t.color.text.onSurfaceMuted,
    marginTop: t.spacing.stackSm,
  },

  usageBarContainer: { flex: 1 },
  usageBarLabel: {
    ...t.typography.labelSm,
    color: t.color.text.onSurfaceSubtle,
    marginBottom: 4,
  },
  usageBarBg: {
    height: 6,
    backgroundColor: t.color.surface.glassLight,
    borderRadius: t.radius.full,
    overflow: 'hidden',
  },
  usageBarFill: { height: '100%', borderRadius: t.radius.full },
  usageBarValue: {
    ...t.typography.labelSm,
    color: t.color.text.onSurfaceMuted,
    marginTop: 4,
  },

  sectionLabel: {
    ...t.typography.headlineMd,
    fontSize: 20,
    color: t.color.text.onDark,
    marginTop: t.spacing.stackSm,
    marginBottom: 4,
  },

  planNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.stackSm,
    flexShrink: 1,
  },
  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: t.radius.lg,
  },
  activeBadgeText: {
    ...t.typography.labelSm,
    fontWeight: '700',
  },

  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: t.spacing.stackSm,
  },
  planName: {
    ...t.typography.headlineMd,
    fontSize: 22,
  },
  planPrice: {
    ...t.typography.labelMd,
    color: t.color.text.onDark,
    fontWeight: '700',
  },

  limitsRow: {
    flexDirection: 'row',
    gap: t.spacing.stackSm,
    marginBottom: t.spacing.stackSm,
  },
  limitChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: t.color.surface.glassLight,
    borderRadius: t.radius.md,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  limitChipText: {
    ...t.typography.labelSm,
    color: t.color.text.onSurfaceSubtle,
  },

  divider: {
    height: 1,
    backgroundColor: t.color.surface.glassEdge,
    marginBottom: t.spacing.stackSm,
  },

  features: { gap: 6 },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    ...t.typography.labelMd,
    color: t.color.text.onSurfaceSubtle,
  },
});
