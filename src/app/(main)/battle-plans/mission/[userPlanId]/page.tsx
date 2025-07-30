"use client";

import { MissionClient } from '@/components/battle-plans/MissionClient';

export default function MissionPage({ params }: { params: { userPlanId: string } }) {
  // O componente cliente irá buscar todos os dados necessários
  return <MissionClient userPlanId={params.userPlanId} />;
}
