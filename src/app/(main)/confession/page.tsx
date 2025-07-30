
"use client";

import { useSearchParams, useRouter } from 'next/navigation';
import { ConfessionSanctuary } from "@/components/confession/ConfessionSanctuary";
import { Suspense } from 'react';

function ConfessionPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const missionId = searchParams.get('missionId'); // This is the userPlanId

    const handleCompletion = () => {
        // If this was part of a mission, redirect to home with the missionCompleted flag
        // The root page will then handle showing the completion modal.
        if (missionId) {
            router.push(`/?missionCompleted=${missionId}`);
        }
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

