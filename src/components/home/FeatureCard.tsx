
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  linkTo: string;
  imageUrl: string;
  imageHint: string;
  className?: string;
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
  linkTo,
  imageUrl,
  imageHint,
  className,
}: FeatureCardProps) {
  return (
    <Link href={linkTo} className={cn("group block h-full", className)}>
      <Card className="flex h-full flex-col overflow-hidden transition-all duration-300 ease-in-out group-hover:shadow-xl group-hover:-translate-y-1">
        <div className="aspect-video overflow-hidden relative">
          <Image
            src={imageUrl}
            alt={title}
            fill
            unoptimized={true}
            className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
            data-ai-hint={imageHint}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
           <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
           <div className="absolute bottom-0 left-0 p-4">
              <h3 className="text-lg font-bold text-white shadow-black/50 [text-shadow:0_1px_3px_var(--tw-shadow-color)]">{title}</h3>
           </div>
        </div>
      </Card>
    </Link>
  );
}
