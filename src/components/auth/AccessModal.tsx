
"use client";

import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BookHeart } from "lucide-react";

interface AccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AccessModal({ isOpen, onClose }: AccessModalProps) {
  const router = useRouter();

  const handleNavigate = (path: string) => {
    onClose();
    router.push(path);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center items-center">
            <BookHeart className="h-12 w-12 text-primary mb-4" />
          <DialogTitle className="text-2xl font-bold">Continue sua Jornada de Crescimento</DialogTitle>
          <DialogDescription>
            Para acessar todo o conteúdo, crie uma conta gratuita ou faça login.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-col sm:space-x-0 gap-2">
          <Button size="lg" onClick={() => handleNavigate('/signup')}>
            Criar Conta Gratuitamente
          </Button>
          <Button size="lg" variant="outline" onClick={() => handleNavigate('/login')}>
            Entrar (já tenho uma conta)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
