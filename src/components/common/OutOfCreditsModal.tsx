
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BrainCircuit } from "lucide-react";

interface OutOfCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OutOfCreditsModal({ isOpen, onClose }: OutOfCreditsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center items-center">
          <BrainCircuit className="h-12 w-12 text-primary mb-4" />
          <DialogTitle className="text-2xl font-bold">Créditos de IA Esgotados</DialogTitle>
          <DialogDescription className="text-center">
            Você utilizou todos os seus créditos de IA para este ciclo. As funcionalidades que usam Inteligência Artificial generativa ficarão temporariamente indisponíveis.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="pt-4">
          <Button className="w-full" onClick={onClose}>
            Entendi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
