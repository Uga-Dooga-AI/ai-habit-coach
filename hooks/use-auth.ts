import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';

/**
 * Subscribe to Firebase auth state on mount.
 * Call this once in the root layout to bootstrap the auth listener.
 */
export function useAuthInit() {
  const init = useAuthStore((s) => s.init);

  useEffect(() => {
    const unsubscribe = init();
    return unsubscribe;
  }, [init]);
}

/** Convenience selectors for common auth state values. */
export function useAuth() {
  const state = useAuthStore((s) => s.state);
  const initialized = useAuthStore((s) => s.initialized);
  const loading = useAuthStore((s) => s.loading);

  return {
    state,
    initialized,
    loading,
    isSignedIn: state.status === 'signed_in',
    userId: state.status === 'signed_in' ? state.userId : null,
  };
}
