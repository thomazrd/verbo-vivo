
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { app, db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
import type { BibleVersion } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, userProfile: null, loading: true });

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth(app);

  useEffect(() => {
    // This listener handles the raw Firebase authentication state.
    const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
      setUser(authUser);
      // If user logs out, immediately clear profile and stop loading.
      if (!authUser) {
          setUserProfile(null);
          setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, [auth]);

  useEffect(() => {
    // This listener handles the Firestore user profile document.
    // It only runs if there's an authenticated user.
    if (!user) {
      // No user, so no profile to fetch. Loading state is handled by the auth listener.
      return;
    }

    // Start loading profile data.
    setLoading(true);
    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            const profile: UserProfile = {
              uid: docSnap.id,
              displayName: data.displayName || null,
              email: data.email || null,
              photoURL: data.photoURL || null,
              createdAt: data.createdAt,
              onboardingCompleted: data.onboardingCompleted || false,
              armorOnboardingCompleted: data.armorOnboardingCompleted || false,
              prayerCircleOnboardingCompleted: data.prayerCircleOnboardingCompleted || false,
              role: data.role || 'USER',
              preferredLanguage: data.preferredLanguage || null,
              preferredModel: data.preferredModel || null,
              preferredBibleVersion: data.preferredBibleVersion || null,
              favoriteArmorIds: data.favoriteArmorIds || [],
              congregationId: data.congregationId || null,
              congregationStatus: data.congregationStatus || 'NONE',
            };
            setUserProfile(profile);
        } else {
            // This case can happen if the user document hasn't been created yet after signup.
            // The root page will handle redirecting to onboarding where the doc is created.
            setUserProfile(null);
        }
        // Profile has been loaded (or confirmed not to exist), so loading is complete.
        setLoading(false);
    }, (error) => {
        console.error("Error fetching user profile:", error);
        setUserProfile(null);
        setLoading(false);
    });
    
    return () => unsubscribeProfile();

  }, [user]);

  return (
    <AuthContext.Provider value={{ user, userProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
