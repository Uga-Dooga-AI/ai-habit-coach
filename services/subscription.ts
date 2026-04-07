import type { SubscriptionTier } from './types';

const API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY;
const IS_DEV = process.env.NODE_ENV === 'development' || __DEV__;

export interface SubscriptionStatus {
  tier: SubscriptionTier;
  isTrialActive: boolean;
  expirationDate: string | null;
}

/**
 * Configure RevenueCat SDK. Call once at app startup.
 * If EXPO_PUBLIC_REVENUECAT_API_KEY is not set, operates in mock/deferred mode.
 */
export async function configureSubscription(): Promise<void> {
  if (!API_KEY) {
    console.warn('[subscription] EXPO_PUBLIC_REVENUECAT_API_KEY not set — running in mock mode');
    return;
  }

  try {
    const Purchases = (await import('react-native-purchases')).default;
    await Purchases.configure({ apiKey: API_KEY });
  } catch (e) {
    console.warn('[subscription] Failed to configure RevenueCat:', e);
  }
}

/**
 * Get current subscription status.
 * Falls back gracefully: dev gets premium, prod without key gets free.
 */
export async function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  if (!API_KEY) {
    if (IS_DEV) {
      return { tier: 'premium', isTrialActive: false, expirationDate: null };
    }
    return { tier: 'free', isTrialActive: false, expirationDate: null };
  }

  try {
    const Purchases = (await import('react-native-purchases')).default;
    const customerInfo = await Purchases.getCustomerInfo();

    const premiumEntitlement = customerInfo.entitlements.active['premium'];
    if (premiumEntitlement) {
      const isTrial = premiumEntitlement.periodType === 'TRIAL';
      const tier: SubscriptionTier = isTrial ? 'trial' : 'premium';
      return {
        tier,
        isTrialActive: isTrial,
        expirationDate: premiumEntitlement.expirationDate ?? null,
      };
    }

    return { tier: 'free', isTrialActive: false, expirationDate: null };
  } catch (e) {
    console.warn('[subscription] getSubscriptionStatus error:', e);
    return { tier: 'free', isTrialActive: false, expirationDate: null };
  }
}

/**
 * Purchase monthly subscription.
 * Returns updated subscription status.
 */
export async function purchaseMonthly(): Promise<SubscriptionStatus> {
  if (!API_KEY) {
    console.warn('[subscription] purchaseMonthly called in mock mode');
    return { tier: 'premium', isTrialActive: true, expirationDate: null };
  }

  try {
    const Purchases = (await import('react-native-purchases')).default;
    const offerings = await Purchases.getOfferings();
    const monthly = offerings.current?.monthly;
    if (!monthly) throw new Error('Monthly offering not available');

    const { customerInfo } = await Purchases.purchasePackage(monthly);
    const entitlement = customerInfo.entitlements.active['premium'];
    if (entitlement) {
      const isTrial = entitlement.periodType === 'TRIAL';
      return {
        tier: isTrial ? 'trial' : 'premium',
        isTrialActive: isTrial,
        expirationDate: entitlement.expirationDate ?? null,
      };
    }
    return { tier: 'free', isTrialActive: false, expirationDate: null };
  } catch (e: unknown) {
    // User cancelled purchase — not an error we want to throw
    if (e && typeof e === 'object' && 'userCancelled' in e && (e as { userCancelled: boolean }).userCancelled) {
      return await getSubscriptionStatus();
    }
    throw e;
  }
}

/**
 * Purchase annual subscription.
 * Returns updated subscription status.
 */
export async function purchaseAnnual(): Promise<SubscriptionStatus> {
  if (!API_KEY) {
    console.warn('[subscription] purchaseAnnual called in mock mode');
    return { tier: 'premium', isTrialActive: false, expirationDate: null };
  }

  try {
    const Purchases = (await import('react-native-purchases')).default;
    const offerings = await Purchases.getOfferings();
    const annual = offerings.current?.annual;
    if (!annual) throw new Error('Annual offering not available');

    const { customerInfo } = await Purchases.purchasePackage(annual);
    const entitlement = customerInfo.entitlements.active['premium'];
    if (entitlement) {
      const isTrial = entitlement.periodType === 'TRIAL';
      return {
        tier: isTrial ? 'trial' : 'premium',
        isTrialActive: isTrial,
        expirationDate: entitlement.expirationDate ?? null,
      };
    }
    return { tier: 'free', isTrialActive: false, expirationDate: null };
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'userCancelled' in e && (e as { userCancelled: boolean }).userCancelled) {
      return await getSubscriptionStatus();
    }
    throw e;
  }
}

/**
 * Restore previous purchases.
 * Returns updated subscription status.
 */
export async function restorePurchases(): Promise<SubscriptionStatus> {
  if (!API_KEY) {
    console.warn('[subscription] restorePurchases called in mock mode');
    return { tier: 'free', isTrialActive: false, expirationDate: null };
  }

  try {
    const Purchases = (await import('react-native-purchases')).default;
    const customerInfo = await Purchases.restorePurchases();
    const entitlement = customerInfo.entitlements.active['premium'];
    if (entitlement) {
      const isTrial = entitlement.periodType === 'TRIAL';
      return {
        tier: isTrial ? 'trial' : 'premium',
        isTrialActive: isTrial,
        expirationDate: entitlement.expirationDate ?? null,
      };
    }
    return { tier: 'free', isTrialActive: false, expirationDate: null };
  } catch (e) {
    console.warn('[subscription] restorePurchases error:', e);
    throw e;
  }
}
