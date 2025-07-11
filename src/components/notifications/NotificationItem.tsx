
"use client";

import type { Notification } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import Link from 'next/link';

interface NotificationItemProps {
  notification: Notification;
  onRead: (notificationId: string) => void;
}

const getNotificationMessage = (notification: Notification): string => {
    switch (notification.type) {
        case 'NEW_POST':
            return `publicou na comunidade.`;
        case 'POST_LIKE':
            return `curtiu sua publicação.`;
        case 'NEW_COMMENT':
            return `comentou na sua publicação.`;
        case 'REPLY':
            return `respondeu ao seu comentário.`;
        case 'COMMENT_LIKE':
            return `curtiu seu comentário.`;
        case 'CONGREGATION_APPROVAL':
            return `aprovou sua entrada na congregação.`;
        default:
            return 'enviou uma nova notificação.';
    }
}

export function NotificationItem({ notification, onRead }: NotificationItemProps) {
  const router = useRouter();
  
  const handleClick = () => {
    if (!notification.isRead) {
        onRead(notification.id);
    }
    router.push(notification.entityPath);
  }

  const message = getNotificationMessage(notification);

  return (
    <div
      onClick={handleClick}
      className={cn(
        "flex items-start gap-3 p-4 hover:bg-muted/50 cursor-pointer transition-colors",
        !notification.isRead && "bg-primary/5"
      )}
    >
      <Avatar className="h-10 w-10 border">
        {notification.actorPhotoURL && <AvatarImage src={notification.actorPhotoURL} alt={notification.actorName} />}
        <AvatarFallback>{notification.actorName?.[0].toUpperCase() || '?'}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <p className="text-sm">
          <span className="font-semibold">{notification.actorName}</span> {message}
        </p>
        <p className="text-xs text-muted-foreground">
          {new Date(notification.createdAt.seconds * 1000).toLocaleDateString()}
        </p>
      </div>
      {!notification.isRead && (
          <div className="w-2.5 h-2.5 bg-primary rounded-full self-center" title="Não lida"></div>
      )}
    </div>
  );
}
