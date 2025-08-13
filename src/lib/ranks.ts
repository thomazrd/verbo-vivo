import { LucideIcon, User, Shield, Gem, Star, Award, Crown, Diamond } from 'lucide-react';

export interface Rank {
  name: string;
  icon: LucideIcon;
  minPoints: number;
  color: string;
}

const ranks: Rank[] = [
  { name: 'Recruta', icon: User, minPoints: 0, color: 'text-slate-500' },
  { name: 'Soldado', icon: Shield, minPoints: 101, color: 'text-green-500' },
  { name: 'Cabo', icon: Gem, minPoints: 501, color: 'text-blue-500' },
  { name: 'Sargento', icon: Star, minPoints: 1001, color: 'text-purple-500' },
  { name: 'Tenente', icon: Award, minPoints: 2501, color: 'text-amber-500' },
  { name: 'Capitão', icon: Crown, minPoints: 5001, color: 'text-red-500' },
  { name: 'General de Fé', icon: Diamond, minPoints: 10001, color: 'text-primary' },
];

/**
 * Retorna a patente do usuário com base em sua pontuação.
 * @param points - A pontuação atual do usuário.
 * @returns O objeto Rank correspondente.
 */
export function getRank(points: number): Rank {
  let currentRank: Rank = ranks[0];
  for (const rank of ranks) {
    if (points >= rank.minPoints) {
      currentRank = rank;
    } else {
      break; 
    }
  }
  return currentRank;
}
