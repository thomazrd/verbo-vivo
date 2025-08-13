
"use client";

import { CreateBattlePlanWizard } from "@/components/battle-plans/CreateBattlePlanWizard";
import { useParams } from "next/navigation";

export default function EditBattlePlanPage() {
    const params = useParams();
    const planId = params.planId as string;
    
    // O Wizard agora aceita um planId para operar em modo de edição.
    return <CreateBattlePlanWizard planId={planId} />;
}
