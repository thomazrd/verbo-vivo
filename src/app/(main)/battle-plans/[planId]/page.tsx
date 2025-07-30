
"use client";

import { BattlePlanDetailClient } from '@/components/battle-plans/BattlePlanDetailClient';

export default function BattlePlanDetailPage({ params }: { params: { planId: string } }) {
  // O componente cliente irá buscar todos os dados necessários
  return <BattlePlanDetailClient planId={params.planId} />;
}
