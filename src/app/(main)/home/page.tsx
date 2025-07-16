
"use client";

import { useAuth } from "@/hooks/use-auth";
import { HomePageSkeleton } from "@/components/home/HomePageSkeleton";
import { WelcomeHeader } from "@/components/home/WelcomeHeader";
import { VerseOfTheDayCard } from "@/components/home/VerseOfTheDayCard";
import { FeatureGrid } from "@/components/home/FeatureGrid";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function HomePage() {
  const { userProfile, loading } = useAuth();
  const { t } = useTranslation();

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
      <VerseOfTheDayCard />
      <FeatureGrid />
    </div>
  );
}
