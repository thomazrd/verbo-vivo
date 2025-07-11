
import { Skeleton } from "@/components/ui/skeleton";

export function HomePageSkeleton() {
  return (
    <div className="container mx-auto max-w-7xl py-8 px-4 space-y-8 animate-pulse">
      {/* WelcomeHeader Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-9 w-1/3" />
        <Skeleton className="h-5 w-1/2" />
      </div>

      {/* VerseOfTheDayCard Skeleton */}
      <Skeleton className="h-48 w-full rounded-lg" />

      {/* FeatureGrid Skeleton */}
      <div>
        <Skeleton className="h-8 w-1/4 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="border bg-card rounded-lg overflow-hidden">
                    <Skeleton className="w-full aspect-video" />
                    <div className="p-4 space-y-3">
                        <Skeleton className="h-6 w-2/3" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-4/5" />
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}
