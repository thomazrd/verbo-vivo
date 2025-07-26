
"use client";

import type { Message } from "@/lib/types";
import { Message as MessageComponent } from "./Message";
import { Skeleton } from "@/components/ui/skeleton";
import { BookHeart, ChevronDown, Loader2 } from "lucide-react";
import { VerseOfTheDay } from "./VerseOfTheDay";
import { Button } from "../ui/button";

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  loadMore: () => void;
  isSending: boolean;
}

export function MessageList({ 
  messages, 
  isLoading, 
  isLoadingMore, 
  hasMore, 
  loadMore,
  isSending,
}: MessageListProps) {
  
  return (
    <div className="relative h-full">
        <div className="mx-auto max-w-3xl p-4 sm:p-6 h-full">
          <div className="flex justify-center mb-4">
            {isLoadingMore ? (
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            ) : hasMore ? (
              <Button variant="outline" size="sm" onClick={loadMore}>
                Carregar mais antigas
              </Button>
            ) : (
              messages.length > 0 && <p className="text-xs text-muted-foreground">Início da conversa</p>
            )}
          </div>
          
          {messages.length === 0 && isLoading ? (
              <div className="space-y-8">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-start space-x-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-primary/20">
                            <BookHeart className="h-6 w-6 text-primary"/>
                        </div>
                        <div className="w-full space-y-2">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                        </div>
                    </div>
                ))}
            </div>
          ) : messages.length === 0 && !isLoading ? (
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
                <MessageComponent key={msg.id} message={msg} />
              ))}
              {isSending && (
                <div className="flex items-start space-x-4 animate-pulse">
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
    </div>
  );
}
