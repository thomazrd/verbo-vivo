
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { Loader2, Sparkles, CheckCircle, BookCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { generateStudyPlan } from "@/ai/flows/study-plan-generation";
import type { StudyPlanOutput } from "@/lib/types";

interface PlanCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  topic: string;
}

export function PlanCreationModal({ isOpen, onClose, topic }: PlanCreationModalProps) {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<StudyPlanOutput | null>(null);

  const summarizedTopic = topic.length > 100 ? `${topic.substring(0, 100)}...` : topic;

  const handleGeneratePlan = async () => {
    setIsLoading(true);
    setGeneratedPlan(null);
    try {
      const plan = await generateStudyPlan({ topic });
      setGeneratedPlan(plan);
    } catch (error) {
      console.error("Error generating plan:", error);
      toast({
        variant: "destructive",
        title: "Erro ao Gerar Plano",
        description: "Não foi possível gerar o plano de estudo. Tente novamente.",
      });
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePlan = async () => {
    if (!generatedPlan || !user) return;
    setIsSaving(true);
    try {
      const planData = {
        ...generatedPlan,
        tasks: generatedPlan.tasks.map(task => ({ ...task, completed: false })),
        createdAt: serverTimestamp(),
        userId: user.uid,
      };
      const docRef = await addDoc(collection(db, "users", user.uid, "plans"), planData);
      toast({
        title: "Plano Salvo!",
        description: "Seu novo plano de estudo está pronto.",
        action: (
          <Button variant="outline" size="sm" onClick={() => router.push(`/plans/${docRef.id}`)}>
            Ver Plano
          </Button>
        ),
      });
      onClose();
    } catch (error) {
      console.error("Error saving plan:", error);
      toast({
        variant: "destructive",
        title: "Erro ao Salvar",
        description: "Não foi possível salvar o plano. Tente novamente.",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      // Delay resetting the plan to avoid UI flicker on close
      setTimeout(() => setGeneratedPlan(null), 300);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Novo Plano de Estudo
          </DialogTitle>
          {!generatedPlan && (
            <DialogDescription>
              Criar um plano de estudo sobre: "{summarizedTopic}"?
            </DialogDescription>
          )}
        </DialogHeader>

        {!generatedPlan && !isLoading && (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">Clique abaixo para a IA gerar seu plano personalizado.</p>
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col items-center justify-center space-y-4 py-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Gerando seu plano... Isso pode levar um momento.</p>
          </div>
        )}

        {generatedPlan && !isLoading && (
          <div className="my-4 max-h-[50vh] overflow-y-auto pr-2">
            <h3 className="mb-4 text-lg font-semibold text-foreground">{generatedPlan.title}</h3>
            <ul className="space-y-3">
              {generatedPlan.tasks.map((task) => (
                <li key={task.day} className="flex items-start gap-3">
                   <CheckCircle className="mt-1 h-4 w-4 shrink-0 text-primary" />
                   <div>
                    <p className="font-semibold text-sm">Dia {task.day}: {task.verseReference}</p>
                    <p className="text-sm text-muted-foreground">{task.description}</p>
                   </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={isLoading || isSaving}>
            Cancelar
          </Button>
          {!generatedPlan ? (
            <Button onClick={handleGeneratePlan} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Gerar Plano
            </Button>
          ) : (
            <Button onClick={handleSavePlan} disabled={isSaving}>
              {isSaving ? (
                 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <BookCheck className="mr-2 h-4 w-4" />
              )}
              Salvar Plano
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
