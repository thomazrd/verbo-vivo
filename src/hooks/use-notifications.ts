
"use client";

import { useEffect, useState } from 'react';
import { useAuth } from './use-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import type { Notification } from '@/lib/types';
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { app } from '@/lib/firebase';
import { useToast } from './use-toast';

// This state will be shared across all instances of the hook
const notificationState: {
  notifications: Notification[],
  unreadCount: number,
  listeners: Array<(state: Omit<typeof notificationState, 'listeners'>) => void>,
  updateState: (newState: Partial<Omit<typeof notificationState, 'listeners' | 'updateState'>>) => void
} = {
  notifications: [],
  unreadCount: 0,
  listeners: [],
  updateState(newState) {
    Object.assign(notificationState, newState);
    notificationState.listeners.forEach(listener => listener({
        notifications: notificationState.notifications,
        unreadCount: notificationState.unreadCount
    }));
  }
};


export const useNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [{ notifications, unreadCount }, setState] = useState(notificationState);

  useEffect(() => {
    // Register a listener to update this hook's state
    notificationState.listeners.push(setState);
    // Cleanup on unmount
    return () => {
      const index = notificationState.listeners.indexOf(setState);
      if (index > -1) {
        notificationState.listeners.splice(index, 1);
      }
    };
  }, []);

  useEffect(() => {
    if (!user) {
      // Clear state on logout
      notificationState.updateState({ notifications: [], unreadCount: 0 });
      return;
    }

    // --- In-App Notifications Listener ---
    const q = query(
      collection(db, 'notifications'),
      where('recipientId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newNotifications: Notification[] = [];
      let newUnreadCount = 0;
      snapshot.forEach(doc => {
        const data = doc.data() as Omit<Notification, 'id'>;
        newNotifications.push({ id: doc.id, ...data });
        if (!data.isRead) {
          newUnreadCount++;
        }
      });
      notificationState.updateState({ notifications: newNotifications, unreadCount: newUnreadCount });
    });
    
    // --- Push Notifications Setup ---
    const setupPushNotifications = async () => {
      // DEVELOPER NOTE: To enable push notifications, you need two things:
      // 1. A VAPID key defined in your environment variables as NEXT_PUBLIC_FIREBASE_VAPID_KEY.
      //    You can generate this in your Firebase Project Settings > Cloud Messaging > Web configuration.
      // 2. The "Firebase Cloud Messaging API (V1)" must be enabled in your Google Cloud project.
      //    If you see a "Missing or insufficient permissions" error, enable it here:
      //    https://console.cloud.google.com/apis/library/fcm.googleapis.com
      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
      if (!vapidKey || vapidKey === "COLE_AQUI_SUA_CHAVE_VAPID") {
        console.warn("Chave VAPID do Firebase não configurada. As notificações push estão desativadas.");
        return;
      }
      
      // Check if Notification API is supported
      if (typeof window !== 'undefined' && 'Notification' in window) {
        const messaging = getMessaging(app);
        
        // Handle incoming messages when the app is in the foreground
        onMessage(messaging, (payload) => {
          console.log('Message received. ', payload);
          toast({
            title: payload.notification?.title,
            description: payload.notification?.body,
          });
        });
        
        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                const currentToken = await getToken(messaging, { vapidKey });
                if (currentToken) {
                  // Save the token to Firestore
                  const tokenRef = doc(db, 'userPushTokens', currentToken);
                  await setDoc(tokenRef, {
                    userId: user.uid,
                    token: currentToken,
                    platform: 'web',
                    createdAt: serverTimestamp(),
                  }, { merge: true });
                } else {
                  console.log('No registration token available. Request permission to generate one.');
                }
            }
        } catch(err: any) {
             if (err.code === 'messaging/permission-blocked' || err.code === 'messaging/permission-default') {
                console.log('Notification permission not granted.');
            } else if (err.code === 'messaging/token-subscribe-failed') {
                 console.error('FCM token subscription failed. This is likely due to the Firebase Cloud Messaging API (V1) not being enabled. Please enable it in your Google Cloud Console: https://console.cloud.google.com/apis/library/fcm.googleapis.com');
            } else {
                console.error('An error occurred while retrieving token. ', err);
            }
        }
      }
    }

    setupPushNotifications();

    return () => unsubscribe();
  }, [user, toast]);

  return { notifications, unreadCount };
};
