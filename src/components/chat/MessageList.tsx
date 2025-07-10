"use client";

import { useEffect, useRef } from "react";
import { Message as MessageType } from "@/lib/types";
import { Message } from "./Message";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { BookHeart } from "lucide-react";
import { VerseOfTheDay } from "./VerseOfTheDay";

interface MessageListProps {
  messages: MessageType[];
  isLoading: boolean;
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <ScrollArea className="flex-1" ref={scrollAreaRef} viewportRef={viewportRef}>
      <div className="mx-auto max-w-3xl p-4 sm:p-6">
        {messages.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center justify-center pt-10 text-center gap-8">
            <VerseOfTheDay />
            <div className="mt-8">
              <h2 className="text-2xl font-bold">Verbo Vivo</h2>
              <p className="mt-2 text-muted-foreground">
                Como posso te ajudar hoje? Descreva uma situação ou faça uma pergunta.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {messages.map((msg) => (
              <Message key={msg.id} message={msg} />
            ))}
            {isLoading && (
              <div className="flex items-start space-x-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-primary/20">
                    <BookHeart className="h-6 w-6 text-primary"/>
                </div>
                <div className="w-full space-y-2">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
