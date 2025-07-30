
"use client";

import { useSearchParams } from 'next/navigation';
import { Suspense, useState, useEffect } from 'react';
import { ConfessionSanctuary } from "@/components/confession/ConfessionSanctuary";
import { MissionCompletionModal } from '@/components/battle-plans/MissionCompletionModal';

function ConfessionPageContent() {
    const searchParams = useSearchParams();
    const missionIdFromParams = searchParams.get('missionId');

    const [missionToComplete, setMissionToComplete] = useState<string | null>(null);

    // This effect runs once to check if we came from a mission.
    useEffect(() => {
        if (missionIdFromParams) {
            // We don't open the modal yet, just store the ID.
            // The modal will be triggered by onCompleted.
        }
    }, [missionIdFromParams]);

    const handleCompletion = () => {
        // If this was part of a mission, trigger the completion modal.
        if (missionIdFromParams) {
            setMissionToComplete(missionIdFromParams);
        }
        // If not from a mission, this does nothing, and the user can navigate away freely.
    };

    const handleModalClose = () => {
        setMissionToComplete(null);
        // User can now navigate away or start another confession.
    };

    return (
        <>
            <ConfessionSanctuary onCompleted={handleCompletion} />
            {missionToComplete && (
                <MissionCompletionModal 
                    userPlanId={missionToComplete}
                    onClose={handleModalClose}
                />
            )}
        </>
    );
}


export default function ConfessionPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <ConfessionPageContent />
        </Suspense>
    );
}
