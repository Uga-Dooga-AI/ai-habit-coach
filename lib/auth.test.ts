jest.mock('./firebase', () => ({
  getFirebaseAuth: jest.fn(),
  isFirebaseConfigured: jest.fn(),
}));

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn(),
  signInAnonymously: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signInWithCredential: jest.fn(),
  signOut: jest.fn(),
}));

import { onAuthStateChanged } from 'firebase/auth';
import { getFirebaseAuth, isFirebaseConfigured } from './firebase';
import { signInAnon, subscribeAuthState } from './auth';

describe('auth fallback', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('reports signed_out without initializing Firebase when config is missing', () => {
    (isFirebaseConfigured as jest.Mock).mockReturnValue(false);

    const callback = jest.fn();
    const unsubscribe = subscribeAuthState(callback);

    expect(callback).toHaveBeenCalledWith({ status: 'signed_out' });
    expect(getFirebaseAuth).not.toHaveBeenCalled();
    expect(onAuthStateChanged).not.toHaveBeenCalled();

    unsubscribe();
  });

  it('throws an explicit error for sign-in attempts when config is missing', async () => {
    (isFirebaseConfigured as jest.Mock).mockReturnValue(false);

    await expect(signInAnon()).rejects.toThrow(
      'Firebase Auth is not configured for this build',
    );
  });
});
