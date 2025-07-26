
"use client";

import { X } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ScrollArea } from "../ui/scroll-area";
import { Skeleton } from "../ui/skeleton";

interface ExplanationCardProps {
  title: string;
  isLoading: boolean;
  content: string | React.ReactNode;
  onClose: () => void;
  className?: string;
}

export function ExplanationCard({ title, isLoading, content, onClose, className }: ExplanationCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex-row items-center justify-between space-y-0 p-4 border-b">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="p-4">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : (
          <ScrollArea className="h-full max-h-48">
            {typeof content === 'string' ? <p className="text-sm text-muted-foreground whitespace-pre-wrap">{content}</p> : content}
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

    