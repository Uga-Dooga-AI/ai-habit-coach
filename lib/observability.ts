import Constants from 'expo-constants';
import { Platform } from 'react-native';

interface ObservabilityContext {
  appVersion: string;
  buildNumber: string;
  releaseChannel: string;
  platform: string;
  runtimeEnv: string;
}

interface ExperimentContext {
  experimentName: string;
  variantName: string;
}

function getCrashlyticsModule(): {
  default(): {
    setCrashlyticsCollectionEnabled(enabled: boolean): Promise<void>;
    setAttributes(attrs: Record<string, string>): Promise<void>;
    recordError(error: Error, reason?: string): void;
  };
} | null {
  if (process.env.EXPO_PUBLIC_FIREBASE_ENABLED === 'false') return null;
  try {
    return require('@react-native-firebase/crashlytics');
  } catch {
    return null;
  }
}

/**
 * Sets baseline Crashlytics custom keys on app startup.
 * Call once from root layout before any user interaction.
 * No-ops gracefully when Firebase native module is not linked.
 */
export async function initObservability(): Promise<void> {
  const mod = getCrashlyticsModule();
  if (!mod) return;

  const ctx = getObservabilityContext();

  try {
    await mod.default().setCrashlyticsCollectionEnabled(true);

    await mod.default().setAttributes({
      app_version: ctx.appVersion,
      build_number: ctx.buildNumber,
      release_channel: ctx.releaseChannel,
      platform: ctx.platform,
      runtime_env: ctx.runtimeEnv,
    });
  } catch {
    // Firebase native module not configured — skip silently
  }
}

/**
 * Records a non-fatal error to Crashlytics with a normalised reason code.
 */
export function recordNonFatal(reason: string, error: unknown): void {
  const mod = getCrashlyticsModule();
  if (!mod) return;

  const jsError =
    error instanceof Error ? error : new Error(String(error));
  jsError.message = `[${reason}] ${jsError.message}`;

  try {
    mod.default().recordError(jsError, reason);
  } catch {
    // Firebase native module not configured
  }
}

/**
 * Sets experiment/variant context as Crashlytics custom keys
 * so crash reports can be segmented by A/B test variant.
 */
export async function setExperimentContext(
  ctx: ExperimentContext,
): Promise<void> {
  const mod = getCrashlyticsModule();
  if (!mod) return;

  try {
    await mod.default().setAttributes({
      active_experiment: ctx.experimentName,
      active_variant: ctx.variantName,
    });
  } catch {
    // Firebase native module not configured
  }
}

function getObservabilityContext(): ObservabilityContext {
  const manifest = Constants.expoConfig;
  const easUpdate = Constants.expoGoConfig ?? {};

  return {
    appVersion: manifest?.version ?? 'unknown',
    buildNumber:
      Platform.select({
        ios: manifest?.ios?.buildNumber,
        android: manifest?.android?.versionCode?.toString(),
      }) ?? 'unknown',
    releaseChannel:
      (easUpdate as Record<string, unknown>)['releaseChannel'] as string ??
      'default',
    platform: Platform.OS,
    runtimeEnv: __DEV__ ? 'development' : 'production',
  };
}
