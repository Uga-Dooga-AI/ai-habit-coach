import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSubscription } from '@/hooks/use-subscription';
import { useAnalytics, AnalyticsEvents } from '@/services/analytics';

const FEATURES = [
  { icon: '♾️', title: 'Unlimited Habits', description: 'Track as many habits as you want' },
  { icon: '🤖', title: 'AI Coaching Insights', description: 'Weekly personalized AI analysis' },
  { icon: '🔗', title: 'Habit Stacking', description: 'Chain habits for maximum impact' },
  { icon: '⭐', title: 'Priority Support', description: 'Get help when you need it' },
];

export default function PaywallScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ source?: string; ctaVariant?: string }>();
  const source = params.source ?? 'unknown';
  const ctaVariant = params.ctaVariant ?? 'a';

  const { purchaseMonthly, purchaseAnnual, restorePurchases, isPremium } = useSubscription();
  const analytics = useAnalytics();
  const shownAtRef = useRef(Date.now());

  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('monthly');
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    shownAtRef.current = Date.now();
    const ev = AnalyticsEvents.Paywall.paywallShown(source, 'paywall_screen');
    analytics.logEvent(ev.name, ev.params);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDismiss = () => {
    const viewDurationSec = Math.round((Date.now() - shownAtRef.current) / 1000);
    const ev = AnalyticsEvents.Paywall.paywallDismissed(source, viewDurationSec);
    analytics.logEvent(ev.name, ev.params);
    router.back();
  };

  const handlePurchase = async () => {
    const ctaEv = AnalyticsEvents.Paywall.paywallCtaTapped(selectedPlan, ctaVariant);
    analytics.logEvent(ctaEv.name, ctaEv.params);

    setPurchasing(true);
    try {
      const status = selectedPlan === 'monthly'
        ? await purchaseMonthly()
        : await purchaseAnnual();

      const productId = selectedPlan === 'monthly' ? 'premium_monthly' : 'premium_annual';
      const price = selectedPlan === 'monthly' ? 6.99 : 49.99;
      const startEv = AnalyticsEvents.Paywall.subscriptionStarted(
        productId, price, 'USD', selectedPlan, source, status.isTrialActive,
      );
      analytics.logEvent(startEv.name, startEv.params);

      if (status.isTrialActive) {
        const trialEv = AnalyticsEvents.Paywall.trialActivated(productId, 7, source);
        analytics.logEvent(trialEv.name, trialEv.params);
      }

      Alert.alert('Welcome to Premium!', 'Your subscription is now active.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Something went wrong. Please try again.';
      Alert.alert('Purchase Failed', message);
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const status = await restorePurchases();
      if (status.tier !== 'free') {
        const restoreEv = AnalyticsEvents.Paywall.subscriptionRestored(status.tier);
        analytics.logEvent(restoreEv.name, restoreEv.params);
        Alert.alert('Purchases Restored', 'Your premium access has been restored.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert('No Purchases Found', 'No previous purchases were found for this account.');
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Could not restore purchases. Try again later.';
      Alert.alert('Restore Failed', message);
    } finally {
      setRestoring(false);
    }
  };

  if (isPremium) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.alreadyPremium}>
          <Text style={styles.premiumEmoji}>⭐</Text>
          <Text style={styles.premiumTitle}>You&apos;re Premium!</Text>
          <Text style={styles.premiumSub}>Enjoy unlimited habits and AI coaching.</Text>
          <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
            <Text style={styles.closeButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeBtn} onPress={handleDismiss}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>✨ PREMIUM</Text>
          </View>
          <Text style={styles.title}>Unlock Premium</Text>
          <Text style={styles.subtitle}>Build unlimited habits with AI coaching</Text>
        </View>

        {/* Features */}
        <View style={styles.featuresList}>
          {FEATURES.map((f) => (
            <View key={f.title} style={styles.featureRow}>
              <View style={styles.featureIconBox}>
                <Text style={styles.featureIcon}>{f.icon}</Text>
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Pricing Cards */}
        <Text style={styles.pricingLabel}>Choose your plan</Text>
        <View style={styles.pricingCards}>
          <TouchableOpacity
            style={[styles.planCard, selectedPlan === 'monthly' && styles.planCardSelected]}
            onPress={() => setSelectedPlan('monthly')}
            activeOpacity={0.8}
          >
            {selectedPlan === 'monthly' && (
              <View style={styles.planCheck}>
                <Text style={styles.planCheckText}>✓</Text>
              </View>
            )}
            <Text style={styles.planName}>Monthly</Text>
            <Text style={styles.planPrice}>$6.99</Text>
            <Text style={styles.planPer}>per month</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.planCard, selectedPlan === 'annual' && styles.planCardSelected]}
            onPress={() => setSelectedPlan('annual')}
            activeOpacity={0.8}
          >
            <View style={styles.saveBadge}>
              <Text style={styles.saveBadgeText}>Save 40%</Text>
            </View>
            {selectedPlan === 'annual' && (
              <View style={styles.planCheck}>
                <Text style={styles.planCheckText}>✓</Text>
              </View>
            )}
            <Text style={styles.planName}>Annual</Text>
            <Text style={styles.planPrice}>$49.99</Text>
            <Text style={styles.planPer}>per year</Text>
            <Text style={styles.planEquiv}>~$4.17/mo</Text>
          </TouchableOpacity>
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={[styles.ctaButton, purchasing && styles.ctaButtonDisabled]}
          onPress={handlePurchase}
          disabled={purchasing}
          activeOpacity={0.85}
        >
          {purchasing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.ctaText}>Start 7-Day Free Trial</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.trialNote}>
          Free for 7 days, then {selectedPlan === 'monthly' ? '$6.99/mo' : '$49.99/yr'}.{'\n'}
          Cancel anytime.
        </Text>

        {/* Restore */}
        <TouchableOpacity
          style={styles.restoreBtn}
          onPress={handleRestore}
          disabled={restoring}
        >
          {restoring ? (
            <ActivityIndicator size="small" color="#8B8FA8" />
          ) : (
            <Text style={styles.restoreText}>Restore Purchases</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FF' },
  scroll: { padding: 24, paddingBottom: 48 },
  alreadyPremium: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  premiumEmoji: { fontSize: 64 },
  premiumTitle: { fontSize: 28, fontWeight: '700', color: '#1A1B2E' },
  premiumSub: { fontSize: 16, color: '#8B8FA8', textAlign: 'center' },
  closeButton: {
    backgroundColor: '#6C63FF',
    borderRadius: 14,
    paddingHorizontal: 32,
    paddingVertical: 14,
    marginTop: 8,
  },
  closeButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  header: { alignItems: 'center', marginBottom: 32 },
  closeBtn: {
    alignSelf: 'flex-end',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF0FB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  closeBtnText: { fontSize: 14, color: '#6B6F8A', fontWeight: '700' },
  badge: {
    backgroundColor: '#F4F3FF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#6C63FF',
  },
  badgeText: { fontSize: 12, fontWeight: '800', color: '#6C63FF', letterSpacing: 1 },
  title: { fontSize: 32, fontWeight: '800', color: '#1A1B2E', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#6B6F8A', textAlign: 'center', lineHeight: 24 },
  featuresList: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#E8EAF2',
    gap: 16,
  },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  featureIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F4F3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureIcon: { fontSize: 22 },
  featureText: { flex: 1 },
  featureTitle: { fontSize: 15, fontWeight: '700', color: '#1A1B2E', marginBottom: 2 },
  featureDesc: { fontSize: 13, color: '#8B8FA8', lineHeight: 18 },
  pricingLabel: { fontSize: 14, fontWeight: '600', color: '#8B8FA8', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  pricingCards: { flexDirection: 'row', gap: 12, marginBottom: 28 },
  planCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    borderWidth: 2,
    borderColor: '#E8EAF2',
    alignItems: 'center',
    position: 'relative',
  },
  planCardSelected: { borderColor: '#6C63FF', backgroundColor: '#F4F3FF' },
  planCheck: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#6C63FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  planCheckText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  saveBadge: {
    position: 'absolute',
    top: -10,
    backgroundColor: '#10B981',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  saveBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  planName: { fontSize: 14, fontWeight: '700', color: '#6B6F8A', marginTop: 16, marginBottom: 6 },
  planPrice: { fontSize: 28, fontWeight: '800', color: '#1A1B2E' },
  planPer: { fontSize: 12, color: '#8B8FA8', marginTop: 2 },
  planEquiv: { fontSize: 11, color: '#6C63FF', fontWeight: '600', marginTop: 4 },
  ctaButton: {
    backgroundColor: '#6C63FF',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 12,
  },
  ctaButtonDisabled: { opacity: 0.6 },
  ctaText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  trialNote: { fontSize: 12, color: '#8B8FA8', textAlign: 'center', lineHeight: 18, marginBottom: 20 },
  restoreBtn: { alignItems: 'center', paddingVertical: 8 },
  restoreText: { fontSize: 14, color: '#8B8FA8', textDecorationLine: 'underline' },
});
