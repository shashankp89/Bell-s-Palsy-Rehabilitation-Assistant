import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const demoMode =
  String(import.meta.env.VITE_USE_DEMO_MODE || 'false').toLowerCase() === 'true';

const isFirebaseConfigured = Object.values(firebaseConfig).every(Boolean);

export const firebaseReady = isFirebaseConfigured && !demoMode;

const app = firebaseReady ? initializeApp(firebaseConfig) : null;
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;

const adminCredentials = {
  email: (import.meta.env.VITE_ADMIN_EMAIL || 'admin@gmail.com').trim().toLowerCase(),
  password: import.meta.env.VITE_ADMIN_PASSWORD || 'Admin@123',
};

const allowedDomains = (import.meta.env.VITE_ALLOWED_EMAIL_DOMAINS || 'gmail.com,googlemail.com')
  .split(',')
  .map((item) => item.trim().toLowerCase())
  .filter(Boolean);

export function isAllowedGoogleEmail(email = '') {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  const domain = normalized.split('@')[1] || '';
  return allowedDomains.includes(domain) || normalized === adminCredentials.email;
}

export function getAdminCredentials() {
  return adminCredentials;
}

export function createGuestSession() {
  return {
    uid: 'guest-visitor',
    email: 'visitor@public.local',
    displayName: 'Visitor Preview',
    photoURL: null,
    role: 'guest',
  };
}

export function saveSession(user) {
  localStorage.setItem('symmetrack-session', JSON.stringify(user));
}

export function restoreSession() {
  const raw = localStorage.getItem('symmetrack-session');
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem('symmetrack-session');
  if (auth) {
    signOut(auth).catch(() => {});
  }
}

export async function loadUserSessions(uid) {
  if (!db || !uid || uid.startsWith('guest-') || uid.startsWith('admin-')) return [];
  const sessions = await getDocs(query(collection(db, 'users', uid, 'sessions'), orderBy('date', 'asc')));
  return sessions.docs.map((session) => session.data());
}

export async function saveUserSession(uid, record) {
  if (!db || !uid || uid.startsWith('guest-') || uid.startsWith('admin-')) return;
  await addDoc(collection(db, 'users', uid, 'sessions'), record);
}

export async function signInWithGoogle() {
  if (!firebaseReady) {
    if (demoMode) {
      return {
        uid: 'demo-google-user',
        email: 'demo@gmail.com',
        displayName: 'Demo Google User',
        photoURL: null,
        role: 'user',
      };
    }

    throw new Error('Firebase is not configured. Set VITE_FIREBASE_* values or enable VITE_USE_DEMO_MODE=true.');
  }

  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  const email = result.user.email || '';

  if (!isAllowedGoogleEmail(email)) {
    await signOut(auth);
    throw new Error('Only valid Google email accounts are allowed for sign-in.');
  }

  return {
    uid: result.user.uid,
    email,
    displayName: result.user.displayName || 'Google User',
    photoURL: result.user.photoURL,
    role: 'user',
  };
}

export async function signInWithEmailPassword(email, password) {
  if (!firebaseReady) {
    if (demoMode) {
      const normalized = email.trim().toLowerCase();
      if (normalized === 'demo@gmail.com' && password === 'Demo@123456') {
        return {
          uid: 'demo-email-user',
          email: normalized,
          displayName: 'Demo User',
          photoURL: null,
          role: 'user',
        };
      }
      throw new Error('Demo login failed. Use demo@gmail.com / Demo@123456');
    }

    throw new Error('Firebase is not configured. Use the real backend or set demo mode.');
  }

  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const emailValue = userCredential.user.email || '';

  if (!isAllowedGoogleEmail(emailValue)) {
    await signOut(auth);
    throw new Error('This email is not allowed on this platform.');
  }

  return {
    uid: userCredential.user.uid,
    email: emailValue,
    displayName: userCredential.user.displayName || 'Registered User',
    photoURL: userCredential.user.photoURL,
    role: 'user',
  };
}

export async function signInAsAdmin(email, password) {
  const normalized = (email || '').trim().toLowerCase();
  const adminEmail = adminCredentials.email;
  const adminPassword = adminCredentials.password;

  if (firebaseReady) {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const authenticatedEmail = (userCredential.user.email || '').toLowerCase();
    if (authenticatedEmail !== adminEmail) {
      await signOut(auth);
      throw new Error('This account is not the configured admin account.');
    }
    return {
      uid: userCredential.user.uid,
      email: authenticatedEmail,
      displayName: 'Recruiter Admin',
      photoURL: userCredential.user.photoURL,
      role: 'admin',
    };
  }

  if (normalized === adminEmail && password === adminPassword) {
    return {
      uid: 'admin-session',
      email: adminEmail,
      displayName: 'Recruiter Admin',
      photoURL: null,
      role: 'admin',
    };
  }

  if (demoMode && normalized === 'admin@gmail.com' && password === 'Admin@123') {
    return {
      uid: 'admin-demo-session',
      email: 'admin@gmail.com',
      displayName: 'Recruiter Admin',
      photoURL: null,
      role: 'admin',
    };
  }

  throw new Error('Invalid admin credentials.');
}
