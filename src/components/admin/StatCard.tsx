
"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { Skeleton } from "../ui/skeleton";

interface StatCardProps {
  title: string;
  count: number;
  icon: LucideIcon;
  href: string;
  isLoading: boolean;
}

export function StatCard({ title, count, icon: Icon, href, isLoading }: StatCardProps) {
  return (
    <Link href={href}>
      <Card className="hover:border-primary/50 hover:bg-muted/50 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-1/3" />
          ) : (
            <div className="text-2xl font-bold">{count}</div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

    