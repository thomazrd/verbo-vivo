
"use client";

import { useState } from "react";
import { Message as MessageType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BookHeart, User, Sparkles } from "lucide-react";
import { Button } from "../ui/button";
import { PlanCreationModal } from "./PlanCreationModal";
import { marked } from 'marked';
import { VerseCard } from "./VerseCard";

interface MessageProps {
  message: MessageType;
}

export function Message({ message }: MessageProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isUser = message.sender === "user";
  const htmlContent = marked.parse(message.text) as string;

  return (
    <>
      <div
        className={cn(
          "flex items-start gap-4",
          isUser ? "justify-end" : "justify-start"
        )}
      >
        {!isUser && (
            <Avatar className="h-10 w-10 shrink-0 border">
                <AvatarFallback className="bg-primary/20 text-primary">
                    <BookHeart />
                </AvatarFallback>
            </Avatar>
        )}
        <div className={cn("max-w-xl flex flex-col gap-3")}>
            <div
            className={cn(
                "rounded-lg px-4 py-3 shadow-sm",
                isUser
                ? "rounded-br-none bg-primary text-primary-foreground"
                : "rounded-bl-none bg-card"
            )}
            >
            <div
                className="prose prose-sm max-w-none text-inherit prose-p:my-2 prose-headings:my-3"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
            </div>
            
            {message.citedVerses && message.citedVerses.map((verse, index) => (
                <VerseCard key={index} reference={verse.reference} text={verse.text} version={verse.bibleVersion}/>
            ))}

            {message.hasPlanButton && (
                <div className="mt-1 text-left">
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto px-2 py-1 text-xs text-primary hover:bg-primary/10"
                    onClick={() => setIsModalOpen(true)}
                >
                    <Sparkles className="mr-2 h-3 w-3" />
                    Criar um plano de estudo sobre isso
                </Button>
                </div>
            )}
        </div>
        {isUser && (
            <Avatar className="h-10 w-10 shrink-0 border">
                <AvatarFallback className="bg-accent/80 text-accent-foreground">
                    <User />
                </AvatarFallback>
            </Avatar>
        )}
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
