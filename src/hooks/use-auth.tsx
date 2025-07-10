"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getAuth, onAuthStateChanged, User as FirebaseAuthUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { app, db } from '@/lib/firebase';
import type { UserProfile } from '@/lib/types'; // Import UserProfile
import i18n from '@/i18n'; // Import i18n instance

interface AuthContextType {
  user: FirebaseAuthUser | null; // Firebase Auth user
  userProfile: UserProfile | null; // Firestore user profile
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, userProfile: null, loading: true });

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseAuthUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Fetch user profile from Firestore
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const profileData = userDocSnap.data() as UserProfile;
          setUserProfile(profileData);
          if (profileData.preferredLanguage && profileData.preferredLanguage !== i18n.language) {
            // console.log(`AuthProvider: User ${firebaseUser.uid} has preferredLanguage ${profileData.preferredLanguage}. Changing i18n language.`);
            await i18n.changeLanguage(profileData.preferredLanguage);
          } else if (!profileData.preferredLanguage) {
            // If no preferred language is set in profile, ensure i18next uses its detection logic
            // This might involve re-triggering detection if needed, but usually i18next handles this on init.
            // For safety, we could explicitly set to null to let detectors run if a language was previously forced by another user.
            // await i18n.changeLanguage(null); // This will trigger fallback and detectors.
          }
        } else {
          // User document doesn't exist in Firestore yet (e.g., new user, onboarding not complete)
          setUserProfile(null);
          // Potentially clear any previously set language to fallback to browser/default
          // await i18n.changeLanguage(null);
        }
      } else {
        setUser(null);
        setUserProfile(null);
        // User logged out, clear any specific language and fallback to detection/default
        // await i18n.changeLanguage(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  return (
    <AuthContext.Provider value={{ user, userProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
