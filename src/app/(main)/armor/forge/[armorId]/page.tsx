
"use client";

import { useParams } from "next/navigation";
import { ForgeView } from "@/components/armor/ForgeView";

export default function EditArmorPage() {
    const params = useParams();
    const armorId = params.armorId as string;
    
    return <ForgeView armorId={armorId} />;
}
