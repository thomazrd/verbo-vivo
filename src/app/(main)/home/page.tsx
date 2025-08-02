
"use client";

import { useAuth } from "@/hooks/use-auth";
import { HomePageSkeleton } from "@/components/home/HomePageSkeleton";
import { WelcomeHeader } from "@/components/home/WelcomeHeader";
import { VerseOfTheDayCard } from "@/components/home/VerseOfTheDayCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { TodayMissions } from "@/components/home/TodayMissions";
import { StudiesShelf } from "@/components/studies/StudiesShelf";
import { useEffect, useState } from "react";
import type { Study } from "@/lib/types";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function HomePage() {
  const { userProfile, loading } = useAuth();
  const { t } = useTranslation();
  const [latestStudies, setLatestStudies] = useState<Study[]>([]);
  const [studiesLoading, setStudiesLoading] = useState(true);

  useEffect(() => {
    const fetchStudies = async () => {
      try {
        const studiesQuery = query(
          collection(db, "studies"),
          where("status", "==", "PUBLISHED"),
          orderBy("publishedAt", "desc"),
          limit(10)
        );
        const snapshot = await getDocs(studiesQuery);
        const fetchedStudies = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Study));
        setLatestStudies(fetchedStudies);
      } catch (err) {
        console.error("Error fetching latest studies:", err);
      } finally {
        setStudiesLoading(false);
      }
    };
    fetchStudies();
  }, []);

  if (loading) {
    return <HomePageSkeleton />;
  }

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center h-full">
        <Alert variant="destructive" className="max-w-md">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{t('toast_data_error_title')}</AlertTitle>
            <AlertDescription>
              {t('toast_data_error_desc')}
            </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-7xl py-8 px-4 space-y-8">
      <WelcomeHeader userName={userProfile.displayName || t('default_username')} />
      <TodayMissions />
      <VerseOfTheDayCard />
      <StudiesShelf 
        title="Estudos Recentes"
        studies={latestStudies}
        isLoading={studiesLoading}
      />
    </div>
  );
}
