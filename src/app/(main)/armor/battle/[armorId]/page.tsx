
"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { Armor } from '@/lib/types';

import { BattleCarousel } from '@/components/armor/BattleCarousel';
import { Loader2 } from 'lucide-react';

export default function BattleModePage() {
    const { user } = useAuth();
    const router = useRouter();
    const params = useParams();
    const armorId = params.armorId as string;

    const [armor, setArmor] = useState<Armor | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user || !armorId) return;

        const fetchArmor = async () => {
            setLoading(true);
            try {
                const armorRef = doc(db, `users/${user.uid}/armors`, armorId);
                const docSnap = await getDoc(armorRef);

                if (docSnap.exists()) {
                    setArmor({ id: docSnap.id, ...docSnap.data() } as Armor);
                } else {
                    setError("Armadura não encontrada.");
                }
            } catch (e) {
                console.error("Error fetching armor:", e);
                setError("Não foi possível carregar a armadura.");
            } finally {
                setLoading(false);
            }
        };

        fetchArmor();
    }, [user, armorId]);

    if (loading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-background text-destructive">
                <p>{error}</p>
            </div>
        );
    }

    if (!armor) {
        // Should be covered by error state, but as a fallback
        router.push('/armor');
        return null;
    }

    return <BattleCarousel armor={armor} />;
}
