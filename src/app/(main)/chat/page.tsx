
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
} from "firebase/firestore";
import { AnimatePresence, motion } from 'framer-motion';
import { MessageList } from "@/components/chat/MessageList";
import { ChatInput } from "@/components/chat/ChatInput";
import type { Message } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { bibleChatResponse } from "@/ai/flows/bible-chat-response";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

const PAGE_SIZE = 20;

export default function ChatPage() {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [isSending, setIsSending] = useState(false);
  
  const [showScrollButton, setShowScrollButton] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const wasAtBottomRef = useRef(true);

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
           
           // Check if message is already in the list to avoid duplicates from optimistic updates
           if(!messages.some(msg => msg.id === newMessage.id)) {
               const container = scrollContainerRef.current;
               if (container) {
                   const isScrolledToBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 150;
                   wasAtBottomRef.current = isScrolledToBottom;
               }
               setMessages((prevMessages) => [...prevMessages, newMessage]);
           }
        }
      });
    });

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, messages]);


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
    });
  }, [user]);

  // Auto-scroll logic for new messages
  useEffect(() => {
    if (wasAtBottomRef.current && scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
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
    if(querySnapshot.empty) {
        setHasMore(false);
        setIsLoadingMore(false);
        return;
    }

    const oldMsgs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message)).reverse();
    
    setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
    
    const container = scrollContainerRef.current;
    const previousScrollHeight = container?.scrollHeight || 0;

    wasAtBottomRef.current = false;
    setMessages(prev => [...oldMsgs, ...prev]);
    setHasMore(querySnapshot.docs.length === PAGE_SIZE);
    
    // Restore scroll position after new messages are rendered
    if(container) {
        requestAnimationFrame(() => {
            container.scrollTop = container.scrollHeight - previousScrollHeight;
        });
    }
    
    setIsLoadingMore(false);
  }, [user, hasMore, isLoadingMore, lastVisible]);

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (container) {
      const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 20;
      setShowScrollButton(!isAtBottom);
    }
  };

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
            top: scrollContainerRef.current.scrollHeight,
            behavior: 'smooth'
        });
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!user || !text.trim()) return;

    wasAtBottomRef.current = true;
    setIsSending(true);

    const userMessage: Omit<Message, 'id'> = {
      text,
      sender: "user",
      createdAt: Timestamp.now(),
    };

    try {
      // Add user message to Firestore first
      const docRef = await addDoc(collection(db, `users/${user.uid}/messages`), userMessage);
      
      // Update local state optimistically, but with the real ID
      setMessages(prev => [...prev, { ...userMessage, id: docRef.id }]);

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
    <div className="flex h-full flex-col relative">
      <div className="flex-1 overflow-y-auto" ref={scrollContainerRef} onScroll={handleScroll}>
        <MessageList 
          messages={messages} 
          isLoading={isLoading} 
          isLoadingMore={isLoadingMore}
          hasMore={hasMore}
          loadMore={loadMoreMessages}
          isSending={isSending}
        />
      </div>
      <AnimatePresence>
        {showScrollButton && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-[90px] left-1/2 -translate-x-1/2 z-10"
          >
            <Button size="icon" className="rounded-full shadow-lg h-10 w-10" onClick={scrollToBottom}>
              <ChevronDown className="h-5 w-5" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
      <ChatInput onSubmit={handleSendMessage} isSending={isSending} />
    </div>
  );
}
