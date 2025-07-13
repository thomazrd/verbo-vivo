
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
  onSnapshot,
  addDoc,
  Timestamp,
  doc,
  limitToLast,
  endBefore,
} from "firebase/firestore";
import { MessageList } from "@/components/chat/MessageList";
import { ChatInput } from "@/components/chat/ChatInput";
import type { Message } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { bibleChatResponse } from "@/ai/flows/bible-chat-response";

const PAGE_SIZE = 20;

export default function ChatPage() {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [isSending, setIsSending] = useState(false);
  
  const viewportRef = useRef<HTMLDivElement>(null);
  const isAutoScrolling = useRef(true);

  // Subscribe to new messages
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, `users/${user.uid}/messages`),
      orderBy("createdAt", "desc"),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
       snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
           const newMessage = { id: change.doc.id, ...change.doc.data() } as Message;
           // Add new message only if it's not already in the list
           setMessages((prevMessages) => {
               if (prevMessages.some(msg => msg.id === newMessage.id)) {
                   return prevMessages;
               }
               isAutoScrolling.current = true;
               return [...prevMessages, newMessage];
           });
        }
      });
    });

    return () => unsubscribe();
  }, [user]);

  // Initial load
  useEffect(() => {
    if (!user) return;
    setIsLoading(true);

    const q = query(
      collection(db, `users/${user.uid}/messages`),
      orderBy("createdAt", "desc"),
      limit(PAGE_SIZE)
    );

    getDocs(q).then((querySnapshot) => {
      const msgs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message)).reverse();
      setMessages(msgs);
      setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
      setHasMore(querySnapshot.docs.length === PAGE_SIZE);
      setIsLoading(false);
      isAutoScrolling.current = true;
    });
  }, [user]);
  
  // Auto-scroll logic
  useEffect(() => {
    if (isAutoScrolling.current && viewportRef.current) {
        setTimeout(() => {
            if(viewportRef.current) {
                viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
            }
        }, 100);
    }
  }, [messages]);


  const loadMoreMessages = useCallback(async () => {
    if (!user || !hasMore || isLoadingMore) return;
    setIsLoadingMore(true);

    const q = query(
      collection(db, `users/${user.uid}/messages`),
      orderBy("createdAt", "desc"),
      startAfter(lastVisible),
      limit(PAGE_SIZE)
    );

    const querySnapshot = await getDocs(q);
    const oldMsgs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message)).reverse();
    
    setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
    
    const viewport = viewportRef.current;
    const previousScrollHeight = viewport?.scrollHeight || 0;

    setMessages(prev => [...oldMsgs, ...prev]);
    setHasMore(querySnapshot.docs.length === PAGE_SIZE);
    
    // Restore scroll position after new messages are rendered
    if(viewport) {
        requestAnimationFrame(() => {
            viewport.scrollTop = viewport.scrollHeight - previousScrollHeight;
        });
    }

    setIsLoadingMore(false);
  }, [user, hasMore, isLoadingMore, lastVisible]);


  const handleSendMessage = async (text: string) => {
    if (!user || !text.trim()) return;

    isAutoScrolling.current = true;
    setIsSending(true);

    const userMessage: Omit<Message, 'id'> = {
      text,
      sender: "user",
      createdAt: Timestamp.now(),
    };

    try {
      await addDoc(collection(db, `users/${user.uid}/messages`), userMessage);
      
      const aiResponse = await bibleChatResponse({
        model: userProfile?.preferredModel,
        user_question: text,
        bible_verses: ["João 3:16 - Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna."]
      });

      const aiMessage: Omit<Message, 'id'> = {
        text: aiResponse.response,
        sender: "ai",
        createdAt: Timestamp.now(),
        citedVerses: aiResponse.verses,
        hasPlanButton: true,
        topic: text,
      };
      await addDoc(collection(db, `users/${user.uid}/messages`), aiMessage);

    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Omit<Message, 'id'> = {
        text: "Desculpe, não consegui processar sua pergunta agora. Por favor, tente novamente.",
        sender: "ai",
        createdAt: Timestamp.now(),
      };
      await addDoc(collection(db, `users/${user.uid}/messages`), errorMessage);
       toast({
        variant: "destructive",
        title: "Erro de IA",
        description: "Não foi possível obter uma resposta da IA. Verifique sua conexão ou tente mais tarde.",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
        <MessageList 
            messages={messages} 
            isLoading={isLoading} 
            isLoadingMore={isLoadingMore}
            hasMore={hasMore}
            loadMore={loadMoreMessages}
            viewportRef={viewportRef}
            onManualScroll={() => { isAutoScrolling.current = false; }}
        />
        <ChatInput onSubmit={handleSendMessage} isSending={isSending} />
    </div>
  );
}
