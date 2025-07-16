
"use client";

import { useTranslation } from "react-i18next";

interface WelcomeHeaderProps {
    userName: string;
}

export function WelcomeHeader({ userName }: WelcomeHeaderProps) {
  const { t } = useTranslation();

  return (
    <div>
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
        {t('home_welcome', { name: userName })}
      </h1>
      <p className="mt-2 text-lg text-muted-foreground">
        {t('home_welcome_subtitle')}
      </p>
    </div>
  );
}
