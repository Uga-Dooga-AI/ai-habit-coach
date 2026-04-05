import crashlytics from '@react-native-firebase/crashlytics';
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

/**
 * Sets baseline Crashlytics custom keys on app startup.
 * Call once from root layout before any user interaction.
 */
export async function initObservability(): Promise<void> {
  const ctx = getObservabilityContext();

  await crashlytics().setCrashlyticsCollectionEnabled(true);

  await crashlytics().setAttributes({
    app_version: ctx.appVersion,
    build_number: ctx.buildNumber,
    release_channel: ctx.releaseChannel,
    platform: ctx.platform,
    runtime_env: ctx.runtimeEnv,
  });
}

/**
 * Records a non-fatal error to Crashlytics with a normalised reason code.
 */
export function recordNonFatal(reason: string, error: unknown): void {
  const jsError =
    error instanceof Error ? error : new Error(String(error));
  jsError.message = `[${reason}] ${jsError.message}`;

  crashlytics().recordError(jsError, reason);
}

/**
 * Sets experiment/variant context as Crashlytics custom keys
 * so crash reports can be segmented by A/B test variant.
 */
export async function setExperimentContext(
  ctx: ExperimentContext,
): Promise<void> {
  await crashlytics().setAttributes({
    active_experiment: ctx.experimentName,
    active_variant: ctx.variantName,
  });
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
