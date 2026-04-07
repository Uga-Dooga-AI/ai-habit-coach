import { useState, useEffect } from 'react';
import {
  getSubscriptionStatus,
  purchaseMonthly,
  purchaseAnnual,
  restorePurchases,
} from '@/services/subscription';
import type { SubscriptionTier } from '@/services/types';

interface SubscriptionState {
  tier: SubscriptionTier;
  isTrialActive: boolean;
  expirationDate: string | null;
  loading: boolean;
}

const FREE_HABIT_LIMIT = 3;

export function useSubscription() {
  const [state, setState] = useState<SubscriptionState>({
    tier: 'free',
    isTrialActive: false,
    expirationDate: null,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;
    getSubscriptionStatus()
      .then((status) => {
        if (!cancelled) {
          setState({ ...status, loading: false });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setState((s) => ({ ...s, loading: false }));
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const isPremium = state.tier === 'premium' || state.tier === 'trial';

  const canAddHabit = (currentCount: number): boolean => {
    if (isPremium) return true;
    return currentCount < FREE_HABIT_LIMIT;
  };

  const handlePurchaseMonthly = async () => {
    const status = await purchaseMonthly();
    setState({ ...status, loading: false });
    return status;
  };

  const handlePurchaseAnnual = async () => {
    const status = await purchaseAnnual();
    setState({ ...status, loading: false });
    return status;
  };

  const handleRestorePurchases = async () => {
    const status = await restorePurchases();
    setState({ ...status, loading: false });
    return status;
  };

  return {
    tier: state.tier,
    isTrialActive: state.isTrialActive,
    expirationDate: state.expirationDate,
    loading: state.loading,
    isPremium,
    canAddHabit,
    purchaseMonthly: handlePurchaseMonthly,
    purchaseAnnual: handlePurchaseAnnual,
    restorePurchases: handleRestorePurchases,
  };
}
