/**
 * ============================================================
 * EasyBuy - AI-Powered E-Commerce Mobile Application
 * ------------------------------------------------------------
 * Author      : Bhaskar Das
 * Institution : DPGITM
 * Internship  : 2026
 * ------------------------------------------------------------
 * © 2026 Bhaskar Das. All rights reserved.
 * Unauthorized copying, redistribution, or plagiarism of
 * this source code is strictly prohibited.
 * ============================================================
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { GuestAuthModal } from '../components/auth/GuestAuthModal';
import { registerForPushNotificationsAsync } from '../utils/notifications';

export type AuthStateType = 'loading' | 'authenticated' | 'guest' | 'logged_out';

export interface EasyBuyUser {
  uid: string;
  email: string;
  fullName?: string;
  phone?: string;
  gender?: string;
  dob?: string;
  photoURL?: string;
  isAdmin?: boolean;
  pushToken?: string;
}

interface AuthContextType {
  authState: AuthStateType;
  isAuthenticated: boolean;
  isGuest: boolean;
  user: EasyBuyUser | null;
  setGuestMode: () => Promise<void>;
  exitGuestMode: () => Promise<void>;
  setAuthenticatedUser: (user: EasyBuyUser) => Promise<void>;
  logout: () => Promise<void>;
  requireAuth: (actionPrompt?: string, onAuthenticated?: () => void) => boolean;
  openAuthModal: (actionPrompt?: string) => void;
  closeAuthModal: () => void;
}

const GUEST_STORAGE_KEY = 'easybuy_guest_mode';
const USER_SESSION_KEY = 'easybuy_user_session';

const AuthContext = createContext<AuthContextType>({
  authState: 'loading',
  isAuthenticated: false,
  isGuest: false,
  user: null,
  setGuestMode: async () => {},
  exitGuestMode: async () => {},
  setAuthenticatedUser: async () => {},
  logout: async () => {},
  requireAuth: () => false,
  openAuthModal: () => {},
  closeAuthModal: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthStateType>('loading');
  const [user, setUser] = useState<EasyBuyUser | null>(null);
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [authModalPrompt, setAuthModalPrompt] = useState<string | undefined>(undefined);

  // Synchronize Firebase Auth & local session storage
  useEffect(() => {
    let isMounted = true;

    // Firebase Auth listener
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!isMounted) return;
      if (firebaseUser) {
        let defaultName = 'User';
        if (firebaseUser.email) {
          const prefix = firebaseUser.email.split('@')[0];
          defaultName = prefix.charAt(0).toUpperCase() + prefix.slice(1);
        }

        let profile: EasyBuyUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          fullName: firebaseUser.displayName || defaultName,
          photoURL: firebaseUser.photoURL || undefined,
        };

        try {
          let snap = await getDoc(doc(db, 'users', firebaseUser.uid));
          
          if (!snap.exists() && firebaseUser.email) {
            const stableUidFallback = 'user_' + firebaseUser.email.toLowerCase().replace(/[^a-z0-9]/g, '');
            snap = await getDoc(doc(db, 'users', stableUidFallback));
          }

          if (snap.exists()) {
            const d = snap.data();
            profile = {
              ...profile,
              fullName: d.fullName || d.name || profile.fullName,
              phone: d.phone,
              gender: d.gender,
              dob: d.dob,
              isAdmin: d.isAdmin || false,
            };
          }
          
          // FETCH PUSH TOKEN
          const token = await registerForPushNotificationsAsync();
          if (token) {
            profile.pushToken = token;
            await updateDoc(doc(db, 'users', firebaseUser.uid), { pushToken: token }).catch(() => console.log("Failed to save push token"));
          }
          
        } catch (profileErr) {
          __DEV__ && console.warn('[AuthContext] Profile fetch error:', profileErr);
        }

        await AsyncStorage.removeItem(GUEST_STORAGE_KEY);
        await AsyncStorage.setItem(USER_SESSION_KEY, JSON.stringify(profile));
        setUser(profile);
        setAuthState('authenticated');
      } else if (isMounted) {
        const isGuestStored = await AsyncStorage.getItem(GUEST_STORAGE_KEY);
        setUser(null);
        setAuthState(isGuestStored === 'true' ? 'guest' : 'logged_out');
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const setAuthenticatedUser = async (userData: EasyBuyUser) => {
    try {
      await AsyncStorage.removeItem(GUEST_STORAGE_KEY);
      await AsyncStorage.setItem(USER_SESSION_KEY, JSON.stringify(userData));
      setUser(userData);
      setAuthState('authenticated');
    } catch (e) {
      console.log('Error setting authenticated user:', e);
    }
  };

  const setGuestMode = async () => {
    try {
      await AsyncStorage.removeItem(USER_SESSION_KEY);
      await AsyncStorage.setItem(GUEST_STORAGE_KEY, 'true');
      setUser(null);
      setAuthState('guest');
    } catch (e) {
      console.log('Error activating guest mode:', e);
    }
  };

  const exitGuestMode = async () => {
    try {
      await AsyncStorage.removeItem(GUEST_STORAGE_KEY);
      const storedSession = await AsyncStorage.getItem(USER_SESSION_KEY);
      if (storedSession) {
        const parsed = JSON.parse(storedSession);
        setUser(parsed);
        setAuthState('authenticated');
      } else {
        setAuthState('logged_out');
      }
    } catch (e) {
      console.log('Error exiting guest mode:', e);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem(USER_SESSION_KEY);
      await AsyncStorage.removeItem(GUEST_STORAGE_KEY);
      await AsyncStorage.removeItem('isAdmin');
      // Clear user-specific data so next login starts fresh
      await AsyncStorage.removeItem('easybuy_cart_items');
      await AsyncStorage.removeItem('easybuy_wishlist_items');
      try {
        signOut(auth).catch(() => {});
      } catch {}
      setUser(null);
      setAuthState('logged_out');
    } catch (e) {
      console.log('Logout error:', e);
    }
  };

  const openAuthModal = (actionPrompt?: string) => {
    setAuthModalPrompt(actionPrompt);
    setAuthModalVisible(true);
  };

  const closeAuthModal = () => {
    setAuthModalVisible(false);
    setAuthModalPrompt(undefined);
  };

  /**
   * Universal Auth Guard Helper
   */
  const requireAuth = (actionPrompt?: string, onAuthenticated?: () => void): boolean => {
    if (authState === 'authenticated' && user) {
      onAuthenticated?.();
      return true;
    }

    openAuthModal(actionPrompt);
    return false;
  };

  const isGuest = authState === 'guest';
  const isAuthenticated = authState === 'authenticated' && user !== null;

  return (
    <AuthContext.Provider
      value={{
        authState,
        isAuthenticated,
        isGuest,
        user,
        setGuestMode,
        exitGuestMode,
        setAuthenticatedUser,
        logout,
        requireAuth,
        openAuthModal,
        closeAuthModal,
      }}
    >
      {children}
      <GuestAuthModal
        visible={authModalVisible}
        onClose={closeAuthModal}
        actionPrompt={authModalPrompt}
      />
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

