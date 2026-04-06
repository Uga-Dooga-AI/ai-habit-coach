import {
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithCredential,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
  type AuthCredential,
} from 'firebase/auth';
import { getFirebaseAuth } from './firebase';

export type AuthState =
  | { status: 'unknown' }
  | { status: 'signed_out' }
  | { status: 'signed_in'; userId: string; user: User };

export function subscribeAuthState(
  callback: (state: AuthState) => void,
): () => void {
  const auth = getFirebaseAuth();
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      callback({ status: 'signed_in', userId: user.uid, user });
    } else {
      callback({ status: 'signed_out' });
    }
  });
}

export async function signInAnon(): Promise<string> {
  const auth = getFirebaseAuth();
  const result = await signInAnonymously(auth);
  return result.user.uid;
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<string> {
  const auth = getFirebaseAuth();
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user.uid;
}

export async function createAccountWithEmail(
  email: string,
  password: string,
): Promise<string> {
  const auth = getFirebaseAuth();
  const result = await createUserWithEmailAndPassword(auth, email, password);
  return result.user.uid;
}

export async function signInWithOAuthCredential(
  credential: AuthCredential,
): Promise<string> {
  const auth = getFirebaseAuth();
  const result = await signInWithCredential(auth, credential);
  return result.user.uid;
}

export async function getIdToken(): Promise<string> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user) throw new Error('Not signed in');
  return user.getIdToken();
}

export async function signOut(): Promise<void> {
  const auth = getFirebaseAuth();
  await firebaseSignOut(auth);
}

export function getCurrentUserId(): string | null {
  const auth = getFirebaseAuth();
  return auth.currentUser?.uid ?? null;
}
