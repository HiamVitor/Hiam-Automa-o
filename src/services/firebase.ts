import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, onSnapshot, getDoc } from 'firebase/firestore';
import type { AccessAccount, AdminUser, MediaItem, PersonalCredential } from '../types';

const firebaseConfig = {
  apiKey: 'AIzaSyBDyft_hnFxcdA4tBU5Uv1UkRNBr8r1JEY',
  authDomain: 'teste-a69c4.firebaseapp.com',
  projectId: 'teste-a69c4',
  storageBucket: 'teste-a69c4.firebasestorage.app',
  messagingSenderId: '62432958325',
  appId: '1:62432958325:web:35a836c8f9330ab7aee53c',
  measurementId: 'G-XZJ991DGXR',
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export interface CloudPayload {
  mediaList?: MediaItem[];
  acessosList?: AccessAccount[];
  senhasPessoaisList?: PersonalCredential[];
  adminsList?: AdminUser[];
  ultimaAtualizacao?: string;
}

export async function saveToCloud(payload: CloudPayload): Promise<void> {
  const docRef = doc(db, 'dados', 'principal');
  await setDoc(
    docRef,
    {
      ...payload,
      ultimaAtualizacao: new Date().toISOString(),
    },
    { merge: true }
  );
}

export async function fetchFromCloudOnce(): Promise<CloudPayload | null> {
  const docRef = doc(db, 'dados', 'principal');
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return snap.data() as CloudPayload;
  }
  return null;
}

export function subscribeToCloud(
  onData: (data: CloudPayload | null) => void,
  onError: (err: unknown) => void
): () => void {
  const docRef = doc(db, 'dados', 'principal');
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        onData(snap.data() as CloudPayload);
      } else {
        onData(null);
      }
    },
    (err) => {
      onError(err);
    }
  );
}

function toFinanceiroDocKey(userLogin: string): string {
  const safe = userLogin.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  return `financeiro_${safe || 'default'}`;
}

export async function saveFinanceiroToCloud(userLogin: string, state: unknown): Promise<void> {
  const key = toFinanceiroDocKey(userLogin);
  const now = new Date().toISOString();
  try {
    await setDoc(
      doc(db, 'dados', key),
      {
        userLogin: userLogin.trim().toLowerCase(),
        state,
        ultimaAtualizacao: now,
      },
      { merge: true }
    );
  } catch {
    await setDoc(
      doc(db, 'dados', 'principal'),
      {
        [key]: state,
        ultimaAtualizacao: now,
      },
      { merge: true }
    );
  }
}

export async function fetchFinanceiroFromCloud(userLogin: string): Promise<unknown | null> {
  const key = toFinanceiroDocKey(userLogin);
  try {
    const snap = await getDoc(doc(db, 'dados', key));
    if (snap.exists()) {
      const data = snap.data();
      if (data && data.state) return data.state;
    }
  } catch {
    // Fallback to principal document below
  }
  try {
    const principalSnap = await getDoc(doc(db, 'dados', 'principal'));
    if (principalSnap.exists()) {
      const data = principalSnap.data();
      if (data && data[key]) return data[key];
    }
  } catch {
    // Ignore cloud fetch failure; local storage handles offline persistence
  }
  return null;
}

export function subscribeFinanceiroCloud(
  userLogin: string,
  onData: (state: unknown | null) => void
): () => void {
  const key = toFinanceiroDocKey(userLogin);
  let fallbackUnsub: (() => void) | null = null;

  const primaryUnsub = onSnapshot(
    doc(db, 'dados', key),
    (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        onData(data?.state ?? null);
      }
    },
    () => {
      if (!fallbackUnsub) {
        fallbackUnsub = onSnapshot(
          doc(db, 'dados', 'principal'),
          (snap) => {
            if (snap.exists()) {
              const data = snap.data();
              if (data && data[key]) {
                onData(data[key]);
              }
            }
          },
          () => {
            // Keep local mode if Firestore rules deny read
          }
        );
      }
    }
  );

  return () => {
    primaryUnsub();
    if (fallbackUnsub) fallbackUnsub();
  };
}

