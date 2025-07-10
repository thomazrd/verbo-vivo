"use client";

import { useState } from "react";
import { Message as MessageType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BookHeart, User, Sparkles } from "lucide-react";
import { Button } from "../ui/button";
import { PlanCreationModal } from "./PlanCreationModal";

interface MessageProps {
  message: MessageType;
}

export function Message({ message }: MessageProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isUser = message.sender === "user";

  const highlightedText = message.text.replace(
    /([A-Za-z]+\s\d+:\d+(-\d+)?)/g,
    '<strong class="font-mono font-semibold text-primary">$1</strong>'
  );

  return (
    <>
      <div
        className={cn(
          "flex items-start gap-4",
          isUser ? "flex-row-reverse" : "flex-row"
        )}
      >
        <Avatar className="h-10 w-10 shrink-0 border">
          <AvatarFallback
            className={cn(
              isUser ? "bg-accent/20 text-accent" : "bg-primary/20 text-primary"
            )}
          >
            {isUser ? <User /> : <BookHeart />}
          </AvatarFallback>
        </Avatar>
        <div
          className={cn(
            "max-w-xl rounded-lg px-4 py-3 shadow-sm",
            isUser
              ? "rounded-br-none bg-primary text-primary-foreground"
              : "rounded-bl-none bg-card"
          )}
        >
          <div
            className="prose prose-sm max-w-none text-inherit"
            dangerouslySetInnerHTML={{ __html: highlightedText }}
          />
          {message.hasPlanButton && (
            <div className="mt-4 border-t border-primary/20 pt-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto px-2 py-1 text-xs text-primary-foreground hover:bg-primary/80"
                onClick={() => setIsModalOpen(true)}
              >
                <Sparkles className="mr-2 h-3 w-3" />
                Criar um plano de estudo sobre isso
              </Button>
            </div>
          )}
        </div>
      </div>
      {message.topic && (
        <PlanCreationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          topic={message.topic}
        />
      )}
    </>
  );
}
