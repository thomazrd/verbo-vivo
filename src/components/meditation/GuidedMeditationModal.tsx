

"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Wand } from "lucide-react";
import type { Verse } from "@/lib/types";
import { generateMeditationQuestions } from "@/ai/flows/guided-meditation-generation";
import { useTranslation } from "react-i18next";

interface GuidedMeditationModalProps {
  isOpen: boolean;
  onClose: () => void;
  verse: Verse | null;
}

export function GuidedMeditationModal({ isOpen, onClose, verse }: GuidedMeditationModalProps) {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const { i18n } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState("");

  useEffect(() => {
    // Reset state when the modal is reopened with a new verse
    if (isOpen) {
      setQuestions([]);
      setAnswers([]);
      setCurrentQuestionIndex(0);
      setCurrentAnswer("");
    }
  }, [isOpen]);

  const handleGenerateQuestions = async () => {
    if (!verse) return;
    setIsLoading(true);
    try {
      const result = await generateMeditationQuestions({ 
          model: userProfile?.preferredModel,
          language: userProfile?.preferredLanguage || i18n.language,
          bible_verse: verse.text 
      });
      setQuestions(result.questions);
    } catch (error) {
      console.error("Error generating meditation questions:", error);
      toast({
        variant: "destructive",
        title: "Erro ao Gerar Perguntas",
        description: "Não foi possível carregar as perguntas. Tente novamente.",
      });
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    setAnswers([...answers, currentAnswer]);
    setCurrentAnswer("");
    setCurrentQuestionIndex(prev => prev + 1);
  };

  const handleFinish = async () => {
    if (!user || !verse) return;
    setIsSaving(true);
    const finalAnswers = [...answers, currentAnswer];
    const responses = questions.map((q, i) => ({ question: q, answer: finalAnswers[i] || "" }));
    
    try {
      await addDoc(collection(db, "meditations"), {
        userId: user.uid,
        verseReference: verse.reference,
        verseText: verse.text,
        responses,
        createdAt: serverTimestamp(),
      });
      toast({
        title: "Meditação Salva!",
        description: "Sua reflexão foi guardada.",
      });
      onClose();
    } catch (error) {
      console.error("Error saving meditation:", error);
      toast({
        variant: "destructive",
        title: "Erro ao Salvar",
        description: "Não foi possível salvar sua meditação.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center space-y-4 py-8">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Gerando perguntas para meditação...</p>
        </div>
      );
    }

    if (questions.length > 0) {
      return (
        <div className="space-y-4 py-4">
          <p className="font-semibold text-foreground">{questions[currentQuestionIndex]}</p>
          <Textarea
            placeholder="Escreva sua reflexão aqui..."
            value={currentAnswer}
            onChange={(e) => setCurrentAnswer(e.target.value)}
            className="min-h-[150px]"
          />
        </div>
      );
    }

    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground">Clique abaixo para iniciar uma meditação guiada sobre este versículo.</p>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Meditação Guiada</DialogTitle>
          {verse && (
            <DialogDescription>
              “{verse.text}” — {verse.reference}
            </DialogDescription>
          )}
        </DialogHeader>
        {renderContent()}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          {questions.length === 0 ? (
            <Button onClick={handleGenerateQuestions} disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand className="mr-2 h-4 w-4" />}
              Iniciar Meditação
            </Button>
          ) : currentQuestionIndex < questions.length - 1 ? (
            <Button onClick={handleNext} disabled={!currentAnswer.trim()}>
              Próximo
            </Button>
          ) : (
            <Button onClick={handleFinish} disabled={isSaving || !currentAnswer.trim()}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Finalizar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
