
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, orderBy, where, getDocs } from 'firebase/firestore';
import type { Armor } from '@/lib/types';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Shield } from 'lucide-react';
import { ArmorCard } from '@/components/armor/ArmorCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ArmorsList = ({ armors, isLoading, userProfile }: { armors: Armor[], isLoading: boolean, userProfile: any }) => {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <Skeleton className="h-36 w-full" />
                <Skeleton className="h-36 w-full" />
            </div>
        );
    }
    
    if (armors.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/50 p-12 text-center mt-6">
                <Shield className="h-16 w-16 text-muted-foreground" />
                <h3 className="mt-4 text-xl font-semibold">Nenhuma armadura encontrada.</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                    Seja o primeiro a forjar uma ou explore as da comunidade.
                </p>
            </div>
        )
    }

    const favoriteIds = userProfile?.favoriteArmorIds || [];
    const sortedArmors = [...armors].sort((a, b) => {
        const aIsFav = favoriteIds.includes(a.id);
        const bIsFav = favoriteIds.includes(b.id);
        if (aIsFav && !bIsFav) return -1;
        if (!aIsFav && bIsFav) return 1;
        return (b.updatedAt?.toMillis() || 0) - (a.updatedAt?.toMillis() || 0);
    });

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {sortedArmors.map(armor => (
                <ArmorCard 
                    key={armor.id} 
                    armor={armor}
                    isFavorited={favoriteIds.includes(armor.id)}
                />
            ))}
        </div>
    )
}

export default function MyArmorPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [myArmors, setMyArmors] = useState<Armor[]>([]);
  const [communityArmors, setCommunityArmors] = useState<Armor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/login');
      return;
    }
    
    if (userProfile && !userProfile.armorOnboardingCompleted) {
        router.push('/armor/onboarding');
        return;
    }

    // Listener for user's own armors
    const myArmorsQuery = query(
      collection(db, `users/${user.uid}/armors`), 
      orderBy('updatedAt', 'desc')
    );
    const unsubMyArmors = onSnapshot(myArmorsQuery, (snapshot) => {
      const userArmors: Armor[] = [];
      snapshot.forEach(doc => {
        userArmors.push({ id: doc.id, ...doc.data() } as Armor);
      });
      setMyArmors(userArmors);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching user armors:", error);
      setIsLoading(false);
    });

    // Listener for community armors
    const qCommunity = query(
      collection(db, "users"),
    );

    const unsubCommunityArmors = onSnapshot(qCommunity, async (usersSnapshot) => {
        const allSharedArmors : Armor[] = [];
        for (const userDoc of usersSnapshot.docs) {
            const sharedArmorsQuery = query(collection(userDoc.ref, "armors"), where("isShared", "==", true));
            const armorsSnapshot = await getDocs(sharedArmorsQuery);
            armorsSnapshot.forEach(armorDoc => {
                allSharedArmors.push({id: armorDoc.id, ...armorDoc.data()} as Armor);
            });
        }
        // Remove duplicates in case of multiple listeners
        const uniqueArmors = Array.from(new Map(allSharedArmors.map(a => [a.id, a])).values());
        setCommunityArmors(uniqueArmors);
    });


    return () => {
        unsubMyArmors();
        unsubCommunityArmors();
    }
  }, [user, userProfile, authLoading, router]);

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4 h-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meu Arsenal</h1>
          <p className="mt-1 text-muted-foreground">
            Suas armaduras espirituais para as batalhas da vida.
          </p>
        </div>
      </div>

       <Tabs defaultValue="my-armors">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="my-armors">Minhas Armaduras</TabsTrigger>
          <TabsTrigger value="community-armors">Comunidade</TabsTrigger>
        </TabsList>
        <TabsContent value="my-armors">
           <ArmorsList armors={myArmors} isLoading={isLoading} userProfile={userProfile} />
        </TabsContent>
        <TabsContent value="community-armors">
            <ArmorsList armors={communityArmors} isLoading={isLoading} userProfile={userProfile} />
        </TabsContent>
      </Tabs>


      <Button asChild className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg">
          <Link href="/armor/forge">
            <Plus className="h-6 w-6" />
            <span className="sr-only">Forjar Nova Armadura</span>
          </Link>
      </Button>
    </div>
  );
}
