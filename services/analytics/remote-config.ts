export interface RemoteConfigProvider {
  activeExperimentIds: string;
  variantValue(key: string): string | null;
  fetchAndActivate(): Promise<boolean>;
}

export class FirebaseRemoteConfigProvider implements RemoteConfigProvider {
  private remoteConfig: ReturnType<typeof this.getRemoteConfigModule> | null = null;

  private getRemoteConfigModule(): {
    default(): {
      setDefaults(defaults: Record<string, string>): Promise<void>;
      fetchAndActivate(): Promise<boolean>;
      getValue(key: string): { asString(): string };
    };
  } | null {
    try {
      return require('@react-native-firebase/remote-config');
    } catch {
      return null;
    }
  }

  get activeExperimentIds(): string {
    const mod = this.getRemoteConfigModule();
    if (!mod) return '';
    try {
      return mod.default().getValue('active_experiment_ids').asString();
    } catch {
      return '';
    }
  }

  variantValue(key: string): string | null {
    const mod = this.getRemoteConfigModule();
    if (!mod) return null;
    try {
      const value = mod.default().getValue(key).asString();
      return value || null;
    } catch {
      return null;
    }
  }

  async fetchAndActivate(): Promise<boolean> {
    const mod = this.getRemoteConfigModule();
    if (!mod) return false;
    try {
      return await mod.default().fetchAndActivate();
    } catch {
      return false;
    }
  }
}

export class StubRemoteConfigProvider implements RemoteConfigProvider {
  private values: Record<string, string>;

  constructor(values: Record<string, string> = {}) {
    this.values = values;
  }

  get activeExperimentIds(): string {
    return this.values['active_experiment_ids'] ?? '';
  }

  variantValue(key: string): string | null {
    return this.values[key] ?? null;
  }

  async fetchAndActivate(): Promise<boolean> {
    return true;
  }
}
