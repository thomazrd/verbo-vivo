
"use client";

import Link from "next/link";
import { PrayerCircle } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, ChevronRight } from "lucide-react";

interface CircleCardProps {
  circle: PrayerCircle;
}

export function CircleCard({ circle }: CircleCardProps) {

  return (
    <Link href={`/prayer-circles/${circle.id}`} className="block">
      <Card className="transition-all hover:shadow-md hover:border-primary/50">
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">{circle.name}</CardTitle>
              <CardDescription>
                {circle.members.length} membro(s) • Criado por {circle.authorName}
              </CardDescription>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
      </Card>
    </Link>
  );
}
