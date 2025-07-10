
"use client";

import { useState } from "react";
import { Message as MessageType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BookHeart, User, Sparkles } from "lucide-react";
import { Button } from "../ui/button";
import { PlanCreationModal } from "./PlanCreationModal";
import { marked } from 'marked';

interface MessageProps {
  message: MessageType;
}

const extractVerses = (text: string): [string, { reference: string, text: string }[]] => {
  const verseRegex = /((?:[1-3]\s)?[A-Za-z]+)\s(\d+):(\d+(?:-\d+)?)\s-\s(.+)/g;
  const verses: { reference: string, text: string }[] = [];
  
  const cleanText = text.replace(verseRegex, (match, book, chapter, verseNum, verseText) => {
    const reference = `${book} ${chapter}:${verseNum}`;
    verses.push({ reference, text: verseText.trim() });
    return ''; // Remove the verse from the main text
  }).trim();

  return [cleanText, verses];
};


export function Message({ message }: MessageProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isUser = message.sender === "user";

  const [mainText, citedVerses] = extractVerses(message.text);
  const htmlContent = marked.parse(mainText) as string;

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
        <div className={cn("max-w-xl flex flex-col gap-2")}>
            <div
            className={cn(
                "rounded-lg px-4 py-3 shadow-sm",
                isUser
                ? "rounded-br-none bg-primary text-primary-foreground"
                : "rounded-bl-none bg-card"
            )}
            >
            <div
                className="prose prose-sm max-w-none text-inherit prose-p:my-4 prose-headings:my-3"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
            </div>
            
            {citedVerses.map((verse, index) => (
                <blockquote key={index} className="mt-2 border-l-4 border-primary/50 pl-4 italic bg-muted/50 p-4 rounded-r-lg">
                    <p className="text-sm text-foreground not-italic leading-relaxed">"{verse.text}"</p>
                    <footer className="text-xs text-right text-muted-foreground not-italic mt-3">— {verse.reference}</footer>
                </blockquote>
            ))}

            {message.hasPlanButton && (
                <div className="mt-2 text-left">
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
