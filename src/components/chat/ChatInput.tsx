"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mic, Send, Loader2 } from "lucide-react";
import { useSpeechToText } from "@/hooks/use-speech-to-text";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSubmit: (text: string) => void;
  isSending: boolean;
}

export function ChatInput({ onSubmit, isSending }: ChatInputProps) {
  const [text, setText] = useState("");
  const { isListening, transcript, startListening, stopListening, error } = useSpeechToText({
    onTranscriptChange: (newTranscript) => {
        setText(newTranscript);
    }
  });
  
  useEffect(() => {
      if (!isListening && transcript) {
          // Optional: handle submission automatically when listening stops
          // onSubmit(transcript);
          // setText('');
      }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening]);


  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      setText(''); // Clear text before starting new recording
      startListening();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isSending) return;
    onSubmit(text);
    setText("");
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <div className="border-t bg-background/80 p-4 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="relative mx-auto flex max-w-3xl items-end gap-2"
      >
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isListening ? "Ouvindo..." : "Digite sua mensagem ou use o microfone..."}
          className="min-h-[52px] resize-none pr-24"
          rows={1}
          disabled={isSending}
          aria-label="Caixa de texto da mensagem"
        />
        <div className="absolute bottom-2 right-2 flex gap-1">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={handleMicClick}
            disabled={isSending || !!error}
            aria-label={isListening ? "Parar gravação" : "Iniciar gravação"}
          >
            <Mic className={cn("h-5 w-5", isListening && "text-destructive animate-pulse")} />
          </Button>
          <Button type="submit" size="icon" disabled={!text.trim() || isSending}>
            {isSending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
            <span className="sr-only">Enviar mensagem</span>
          </Button>
        </div>
      </form>
       {error && <p className="mt-2 text-center text-xs text-destructive">{error}</p>}
    </div>
  );
}
