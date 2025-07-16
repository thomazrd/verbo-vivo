'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import i18n from '@/i18n';

const I18nInitializer = () => {
  const { user, loading } = useAuth();

  useEffect(() => {
    // This effect runs on language change and ensures the document lang attribute is updated.
    const handleLanguageChange = (lng: string) => {
      if (document.documentElement.lang !== lng) {
        document.documentElement.lang = lng;
      }
    };
    i18n.on('languageChanged', handleLanguageChange);
    
    // Set initial language
    handleLanguageChange(i18n.language);

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    }
  }, []);

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
