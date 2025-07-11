
"use client";

import type { CongregationMember } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useEffect, useState } from "react";
import { Badge } from "../ui/badge";
import { Loader2 } from "lucide-react";

interface MemberCardProps {
  member: CongregationMember;
  actions?: React.ReactNode;
  actionInProgress?: boolean;
}

export function MemberCard({ member, actions, actionInProgress }: MemberCardProps) {
  const [timeAgo, setTimeAgo] = useState('');

  useEffect(() => {
    const dateToCompare = member.status === 'PENDING' ? member.requestedAt : member.joinedAt;
    if (dateToCompare) {
      setTimeAgo(formatDistanceToNow(dateToCompare.toDate(), { addSuffix: true, locale: ptBR }));
    }
  }, [member.requestedAt, member.joinedAt, member.status]);

  const getStatusBadge = () => {
    switch(member.status) {
        case 'ADMIN':
            return <Badge variant="secondary" className="bg-primary/20 text-primary">Admin</Badge>;
        case 'MEMBER':
            return <Badge variant="outline">Membro</Badge>;
        case 'PENDING':
            return <Badge variant="default" className="bg-amber-500/20 text-amber-700 border-amber-500/30 hover:bg-amber-500/30">Pendente</Badge>;
        default:
            return null;
    }
  }

  return (
    <div className="flex items-center gap-4 p-3 rounded-lg border bg-card">
      <Avatar className="h-10 w-10 border">
        {member.photoURL && <AvatarImage src={member.photoURL} alt={member.displayName} />}
        <AvatarFallback>{member.displayName?.[0].toUpperCase() || '?'}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <p className="font-semibold text-sm">{member.displayName}</p>
        <p className="text-xs text-muted-foreground">
          {member.status === 'PENDING' ? 'Solicitado' : 'Entrou'} {timeAgo}
        </p>
      </div>
      {getStatusBadge()}
      <div className="flex items-center gap-2 min-w-[120px] justify-end">
        {actionInProgress ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : (
          actions
        )}
      </div>
    </div>
  );
}
