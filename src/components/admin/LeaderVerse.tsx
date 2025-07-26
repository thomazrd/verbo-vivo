
"use client";

import { useEffect, useState } from 'react';
import { Skeleton } from '../ui/skeleton';

const leaderVerses = [
    { text: "Confie no Senhor de todo o seu coração e não se apoie em seu próprio entendimento; reconheça o Senhor em todos os seus caminhos, e ele endireitará as suas veredas.", reference: "Provérbios 3:5-6" },
    { text: "Portanto, meus amados irmãos, mantenham-se firmes, e que nada os abale. Sejam sempre dedicados à obra do Senhor, pois vocês sabem que no Senhor o trabalho de vocês não será inútil.", reference: "1 Coríntios 15:58" },
    { text: "Pois Deus não nos deu espírito de covardia, mas de poder, de amor e de equilíbrio.", reference: "2 Timóteo 1:7" },
];

export function LeaderVerse() {
    const [verse, setVerse] = useState<{text: string; reference: string} | null>(null);

    useEffect(() => {
        const randomVerse = leaderVerses[Math.floor(Math.random() * leaderVerses.length)];
        setVerse(randomVerse);
    }, []);

    if (!verse) {
        return <Skeleton className="h-5 w-96 mt-4" />;
    }
    
    return (
        <blockquote className="mt-4 border-l-2 pl-4 italic text-muted-foreground">
            "{verse.text}" - {verse.reference}
        </blockquote>
    );
}

    