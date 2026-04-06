import React, { createContext, useContext } from 'react';
import type { AnalyticsTracker } from './tracker';

const AnalyticsContext = createContext<AnalyticsTracker | null>(null);

export function AnalyticsProvider({ tracker, children }: { tracker: AnalyticsTracker; children: React.ReactNode }) {
  return <AnalyticsContext.Provider value={tracker}>{children}</AnalyticsContext.Provider>;
}

export function useAnalytics(): AnalyticsTracker {
  const tracker = useContext(AnalyticsContext);
  if (!tracker) throw new Error('useAnalytics must be used within AnalyticsProvider');
  return tracker;
}
