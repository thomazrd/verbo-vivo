'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import i18n from '@/i18n';

const I18nInitializer = () => {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading || !user) {
      return;
    }

    const checkUserLanguagePreference = async () => {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          const preferredLanguage = userData.preferredLanguage;
          const currentLanguage = i18n.language;
          
          if (preferredLanguage && preferredLanguage !== currentLanguage) {
            // Only change if the stored preference is different from the current
            // language (which might have been set by the browser detector).
            i18n.changeLanguage(preferredLanguage);
          }
        }
      } catch (error) {
        console.error("Error fetching user's language preference:", error);
      }
    };

    checkUserLanguagePreference();
  }, [user, loading]);

  // This component doesn't render anything itself.
  return null;
};

export default I18nInitializer;
