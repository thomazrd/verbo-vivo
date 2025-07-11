
"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useNotifications } from "@/hooks/use-notifications";
import { NotificationItem } from "./NotificationItem";
import { ScrollArea } from "../ui/scroll-area";
import { db } from "@/lib/firebase";
import { doc, writeBatch } from "firebase/firestore";

export function NotificationBell() {
  const { notifications, unreadCount } = useNotifications();

  const handleMarkAsRead = async (notificationId: string) => {
    const notificationRef = doc(db, 'notifications', notificationId);
    await writeBatch(db).update(notificationRef, { isRead: true }).commit();
  }

  const handleMarkAllAsRead = async () => {
    const batch = writeBatch(db);
    notifications.forEach(notification => {
      if (!notification.isRead) {
        const docRef = doc(db, 'notifications', notification.id);
        batch.update(docRef, { isRead: true });
      }
    });
    await batch.commit();
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center border-2 border-background">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <div className="p-4 border-b">
            <div className="flex justify-between items-center">
                <h4 className="font-semibold">Notificações</h4>
                {unreadCount > 0 && (
                    <Button variant="link" size="sm" className="h-auto p-0" onClick={handleMarkAllAsRead}>
                        Marcar todas como lidas
                    </Button>
                )}
            </div>
        </div>
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground p-8">
              Você não tem notificações.
            </div>
          ) : (
            <div className="divide-y">
                {notifications.map((notification) => (
                    <NotificationItem 
                        key={notification.id} 
                        notification={notification} 
                        onRead={handleMarkAsRead}
                    />
                ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
