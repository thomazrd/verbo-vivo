
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  linkTo: string;
  imageUrl: string;
  imageHint: string;
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
  linkTo,
  imageUrl,
  imageHint
}: FeatureCardProps) {
  return (
    <Link href={linkTo} className="group block h-full">
      <Card className="flex h-full flex-col overflow-hidden transition-all duration-300 ease-in-out group-hover:shadow-xl group-hover:-translate-y-1">
        <div className="aspect-video overflow-hidden relative">
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
            data-ai-hint={imageHint}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
        <CardHeader className="flex-row items-center gap-3 space-y-0 pb-2">
            <Icon className="h-5 w-5 text-primary" />
            <CardTitle className="text-base font-semibold">{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow pt-0">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
