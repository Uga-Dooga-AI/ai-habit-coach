import { usePathname } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useAnalytics } from './analytics-provider';

export function useScreenTracking(): void {
  const pathname = usePathname();
  const tracker = useAnalytics();
  const prevPathname = useRef<string | null>(null);

  useEffect(() => {
    if (pathname !== prevPathname.current) {
      tracker.logScreenView(pathname);
      prevPathname.current = pathname;
    }
  }, [pathname, tracker]);
}
