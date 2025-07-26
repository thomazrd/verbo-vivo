
"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel';
import { useTranslation } from 'react-i18next';

interface PrayerCircleOnboardingProps {
    onComplete: () => void;
}

export function PrayerCircleOnboarding({ onComplete }: PrayerCircleOnboardingProps) {
  const [api, setApi] = useState<CarouselApi>();
  const { t } = useTranslation();

  const onboardingSteps = [
    {
      title: t('onboarding_circle_title_1'),
      description: t('onboarding_circle_desc_1'),
      imageSrc: "https://placehold.co/600x400.png",
      imageHint: "community prayer circle"
    },
    {
      title: t('onboarding_circle_title_2'),
      description: t('onboarding_circle_desc_2'),
      imageSrc: "https://placehold.co/600x400.png",
      imageHint: "reinforcements helping hand"
    },
    {
      title: t('onboarding_circle_title_3'),
      description: t('onboarding_circle_desc_3'),
      imageSrc: "https://placehold.co/600x400.png",
      imageHint: "celebration victory flag"
    }
  ];

  return (
    <div className="container mx-auto max-w-2xl py-8 px-4 flex flex-col items-center justify-center h-full text-center">
      <Carousel setApi={setApi} className="w-full">
        <CarouselContent>
          {onboardingSteps.map((step, index) => (
            <CarouselItem key={index}>
              <Card className="overflow-hidden bg-card border-none shadow-none">
                 <div className="w-full aspect-video bg-muted rounded-lg overflow-hidden relative">
                    <Image
                        src={step.imageSrc}
                        alt={step.title}
                        fill
                        className="object-cover"
                        data-ai-hint={step.imageHint}
                    />
                 </div>
                <CardContent className="p-6">
                  <h3 className="text-2xl font-bold tracking-tight">{step.title}</h3>
                  <p className="mt-2 text-muted-foreground">
                    {step.description}
                  </p>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
      <div className="mt-8 flex gap-4">
        <Button size="lg" onClick={api?.canScrollNext ? api.scrollNext : onComplete}>
            {api?.canScrollNext ? t('next_button') : t('onboarding_circle_start_button')}
        </Button>
      </div>
    </div>
  );
}
