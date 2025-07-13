
"use client";

import { useEffect, useRef, useState } from "react";
import type { Message } from "@/lib/types";
import { Message as MessageComponent } from "./Message";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { BookHeart, ChevronDown, Loader2 } from "lucide-react";
import { VerseOfTheDay } from "./VerseOfTheDay";
import { Button } from "../ui/button";
import { AnimatePresence, motion } from "framer-motion";

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  loadMore: () => void;
  viewportRef: React.RefObject<HTMLDivElement>;
  onManualScroll: () => void;
}

export function MessageList({ messages, isLoading, isLoadingMore, hasMore, loadMore, viewportRef, onManualScroll }: MessageListProps) {
  const [showScrollButton, setShowScrollButton] = useState(false);

  const handleScroll = () => {
    onManualScroll();
    const viewport = viewportRef.current;
    if (viewport) {
      const isAtBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < 100;
      setShowScrollButton(!isAtBottom);
    }
  };

  const scrollToBottom = () => {
    if (viewportRef.current) {
        viewportRef.current.scrollTo({
            top: viewportRef.current.scrollHeight,
            behavior: 'smooth'
        });
    }
  };


  return (
    <div className="flex-1 relative overflow-hidden">
      <ScrollArea className="h-full" viewportRef={viewportRef} onScroll={handleScroll}>
        <div className="mx-auto max-w-3xl p-4 sm:p-6">
          <div className="flex justify-center mb-4">
            {isLoadingMore ? (
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            ) : hasMore ? (
              <Button variant="outline" size="sm" onClick={loadMore}>
                Carregar mais
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
      <AnimatePresence>
        {showScrollButton && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-4 right-4 z-10"
          >
            <Button size="icon" className="rounded-full shadow-lg h-10 w-10" onClick={scrollToBottom}>
              <ChevronDown className="h-5 w-5" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
