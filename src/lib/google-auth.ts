import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User, 
  signOut 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Add Google Sheets full access scope
provider.addScope('https://www.googleapis.com/auth/spreadsheets');

let isSigningIn = false;
let cachedAccessToken: string | null = typeof window !== 'undefined' ? localStorage.getItem('google_access_token') : null;

export const initGoogleAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    const storedToken = localStorage.getItem('google_access_token');
    if (user && (cachedAccessToken || storedToken)) {
      const activeToken = cachedAccessToken || storedToken || '';
      if (onAuthSuccess) onAuthSuccess(user, activeToken);
    } else {
      if (!isSigningIn) {
        if (onAuthFailure) onAuthFailure();
      }
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('تعذر الحصول على رمز الوصول من جوجل OAuth');
    }

    cachedAccessToken = credential.accessToken;
    if (typeof window !== 'undefined') {
      localStorage.setItem('google_access_token', credential.accessToken);
    }
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign-in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getGoogleAccessToken = (): string | null => {
  if (!cachedAccessToken && typeof window !== 'undefined') {
    cachedAccessToken = localStorage.getItem('google_access_token');
  }
  return cachedAccessToken;
};

export const logoutGoogle = async () => {
  await signOut(auth);
  cachedAccessToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('google_access_token');
  }
};
