
"use client";

import { useSearchParams, useRouter } from 'next/navigation';
import { ConfessionSanctuary } from "@/components/confession/ConfessionSanctuary";
import { Suspense } from 'react';

function ConfessionPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const missionId = searchParams.get('missionId');

    const handleCompletion = () => {
        const url = missionId ? `/?missionCompleted=${missionId}` : '/';
        router.push(url);
    };

    return <ConfessionSanctuary onCompleted={handleCompletion} />;
}


export default function ConfessionPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <ConfessionPageContent />
        </Suspense>
    );
}
