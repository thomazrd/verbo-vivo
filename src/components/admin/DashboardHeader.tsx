
"use client";

import { LeaderVerse } from "./LeaderVerse";

interface DashboardHeaderProps {
    userName: string;
}

export function DashboardHeader({ userName }: DashboardHeaderProps) {
  return (
    <div>
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
        Olá, {userName}!
      </h1>
      <p className="mt-2 text-lg text-muted-foreground">
        Que a paz do Senhor esteja com você.
      </p>
      <LeaderVerse />
    </div>
  );
}

    