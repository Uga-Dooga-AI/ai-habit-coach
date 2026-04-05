import type { RemoteConfigProvider } from './remote-config';

export interface AnalyticsTracker {
  logEvent(name: string, params?: Record<string, string | number | boolean>): void;
  logScreenView(screenName: string, screenClass?: string): void;
  setUserProperty(name: string, value: string | null): void;
  setUserId(userId: string | null): void;
}

export class FirebaseAnalyticsTracker implements AnalyticsTracker {
  private getAnalyticsModule(): {
    default(): {
      logEvent(name: string, params?: Record<string, string | number | boolean>): Promise<void>;
      logScreenView(params: { screen_name: string; screen_class?: string }): Promise<void>;
      setUserProperty(name: string, value: string | null): Promise<void>;
      setUserId(userId: string | null): Promise<void>;
    };
  } | null {
    try {
      return require('@react-native-firebase/analytics');
    } catch {
      return null;
    }
  }

  logEvent(name: string, params?: Record<string, string | number | boolean>): void {
    const mod = this.getAnalyticsModule();
    if (!mod) return;
    try {
      mod.default().logEvent(name, params);
    } catch {
      // silently fail if Firebase is not configured
    }
  }

  logScreenView(screenName: string, screenClass?: string): void {
    const mod = this.getAnalyticsModule();
    if (!mod) return;
    try {
      mod.default().logScreenView({
        screen_name: screenName,
        ...(screenClass ? { screen_class: screenClass } : {}),
      });
    } catch {
      // silently fail
    }
  }

  setUserProperty(name: string, value: string | null): void {
    const mod = this.getAnalyticsModule();
    if (!mod) return;
    try {
      mod.default().setUserProperty(name, value);
    } catch {
      // silently fail
    }
  }

  setUserId(userId: string | null): void {
    const mod = this.getAnalyticsModule();
    if (!mod) return;
    try {
      mod.default().setUserId(userId);
    } catch {
      // silently fail
    }
  }
}

export class AppMetricaTracker implements AnalyticsTracker {
  private remoteConfig: RemoteConfigProvider;

  constructor(remoteConfig: RemoteConfigProvider) {
    this.remoteConfig = remoteConfig;
  }

  private enrichParams(params: Record<string, string | number | boolean> = {}): Record<string, string | number | boolean> {
    const experimentIds = this.remoteConfig.activeExperimentIds;
    if (experimentIds) {
      return { ...params, active_experiments: experimentIds };
    }
    return params;
  }

  logEvent(name: string, params?: Record<string, string | number | boolean>): void {
    const enriched = this.enrichParams(params);
    try {
      const AppMetrica = require('@appmetrica/react-native-analytics');
      AppMetrica.reportEvent(name, enriched);
    } catch {
      // AppMetrica SDK not installed
    }
  }

  logScreenView(screenName: string, _screenClass?: string): void {
    this.logEvent('screen_view', { screen_name: screenName });
  }

  setUserProperty(name: string, value: string | null): void {
    try {
      const AppMetrica = require('@appmetrica/react-native-analytics');
      AppMetrica.setUserProfileAttributes([
        { key: name, value: value ?? '' },
      ]);
    } catch {
      // AppMetrica SDK not installed
    }
  }

  setUserId(userId: string | null): void {
    try {
      const AppMetrica = require('@appmetrica/react-native-analytics');
      if (userId) {
        AppMetrica.setUserProfileID(userId);
      }
    } catch {
      // AppMetrica SDK not installed
    }
  }
}

export class CompositeTracker implements AnalyticsTracker {
  private trackers: ReadonlyArray<AnalyticsTracker>;

  constructor(trackers: ReadonlyArray<AnalyticsTracker>) {
    this.trackers = trackers;
  }

  logEvent(name: string, params?: Record<string, string | number | boolean>): void {
    for (const tracker of this.trackers) {
      tracker.logEvent(name, params);
    }
  }

  logScreenView(screenName: string, screenClass?: string): void {
    for (const tracker of this.trackers) {
      tracker.logScreenView(screenName, screenClass);
    }
  }

  setUserProperty(name: string, value: string | null): void {
    for (const tracker of this.trackers) {
      tracker.setUserProperty(name, value);
    }
  }

  setUserId(userId: string | null): void {
    for (const tracker of this.trackers) {
      tracker.setUserId(userId);
    }
  }
}

export class StubTracker implements AnalyticsTracker {
  logEvent(_name: string, _params?: Record<string, string | number | boolean>): void {}
  logScreenView(_screenName: string, _screenClass?: string): void {}
  setUserProperty(_name: string, _value: string | null): void {}
  setUserId(_userId: string | null): void {}
}
