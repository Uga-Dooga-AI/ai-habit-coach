import { create } from 'zustand';
import {
  type AuthState,
  subscribeAuthState,
  signInAnon,
  signInWithEmail,
  createAccountWithEmail,
  signInWithOAuthCredential,
  getIdToken,
  signOut,
} from '@/lib/auth';
import type { AuthCredential } from 'firebase/auth';

interface AuthStore {
  state: AuthState;
  initialized: boolean;
  loading: boolean;

  /** Start listening to Firebase auth state. Call once at app bootstrap. */
  init: () => () => void;

  signInAnonymously: () => Promise<string>;
  signInWithEmail: (email: string, password: string) => Promise<string>;
  createAccountWithEmail: (email: string, password: string) => Promise<string>;
  signInWithCredential: (credential: AuthCredential) => Promise<string>;
  getIdToken: () => Promise<string>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  state: { status: 'unknown' },
  initialized: false,
  loading: false,

  init: () => {
    const unsubscribe = subscribeAuthState((authState) => {
      set({ state: authState, initialized: true });
    });
    return unsubscribe;
  },

  signInAnonymously: async () => {
    set({ loading: true });
    try {
      return await signInAnon();
    } finally {
      set({ loading: false });
    }
  },

  signInWithEmail: async (email, password) => {
    set({ loading: true });
    try {
      return await signInWithEmail(email, password);
    } finally {
      set({ loading: false });
    }
  },

  createAccountWithEmail: async (email, password) => {
    set({ loading: true });
    try {
      return await createAccountWithEmail(email, password);
    } finally {
      set({ loading: false });
    }
  },

  signInWithCredential: async (credential) => {
    set({ loading: true });
    try {
      return await signInWithOAuthCredential(credential);
    } finally {
      set({ loading: false });
    }
  },

  getIdToken: () => getIdToken(),

  signOut: async () => {
    set({ loading: true });
    try {
      await signOut();
    } finally {
      set({ loading: false });
    }
  },
}));
