"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  Timestamp,
} from "firebase/firestore";
import { MessageList } from "@/components/chat/MessageList";
import { ChatInput } from "@/components/chat/ChatInput";
import type { Message } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { bibleChatResponse } from "@/ai/flows/bible-chat-response";

export default function ChatPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, `users/${user.uid}/messages`),
      orderBy("createdAt", "asc")
    );
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const msgs: Message[] = [];
      querySnapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() } as Message);
      });
      setMessages(msgs);
    });
    return () => unsubscribe();
  }, [user]);

  const handleSendMessage = async (text: string) => {
    if (!user || !text.trim()) return;

    const userMessage: Omit<Message, 'id'> = {
      text,
      sender: "user",
      createdAt: Timestamp.now(),
    };

    setIsLoading(true);
    try {
      await addDoc(collection(db, `users/${user.uid}/messages`), userMessage);
      
      const aiResponseText = await bibleChatResponse({
        user_question: text,
        bible_verses: ["João 3:16 - Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna."]
      });

      const aiMessage: Omit<Message, 'id'> = {
        text: aiResponseText,
        sender: "ai",
        createdAt: Timestamp.now(),
        hasPlanButton: true, // Enable by default for now
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
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <MessageList messages={messages} isLoading={isLoading} />
      <ChatInput onSubmit={handleSendMessage} isSending={isLoading} />
    </div>
  );
}
