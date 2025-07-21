
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import type { PrayerCircle } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, Check } from 'lucide-react';

interface VictoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  circle: PrayerCircle;
}

const victorySchema = z.object({
  testimony: z.string().min(20, { message: 'Por favor, detalhe o testemunho com pelo menos 20 caracteres.' }),
});

export function VictoryModal({ isOpen, onClose, circle }: VictoryModalProps) {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<z.infer<typeof victorySchema>>({
    resolver: zodResolver(victorySchema),
    defaultValues: { testimony: '' },
  });

  const handleSave = async (values: z.infer<typeof victorySchema>) => {
    if (!user || !userProfile) return;
    setIsSaving(true);
    try {
      await addDoc(collection(db, 'victories'), {
        circleId: circle.id,
        circleName: circle.name,
        testimony: values.testimony,
        recordedBy: user.uid,
        recordedByName: userProfile.displayName,
        recordedAt: serverTimestamp(),
        amenCount: 0,
        usersWhoSaidAmen: [],
      });
      toast({
        title: 'Vitória Registrada!',
        description: 'Seu testemunho foi adicionado ao Hall da Honra.',
      });
      onClose();
      form.reset();
    } catch (error) {
      console.error('Error saving victory:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível registrar a vitória.'
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleOpenChange = (open: boolean) => {
    if(!open) {
      form.reset();
      onClose();
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl font-bold text-amber-800">Glória a Deus! A vitória chegou.</DialogTitle>
          <DialogDescription>
            "Seu testemunho é uma arma poderosa. Compartilhe como Deus agiu para edificar a fé do batalhão." (Apocalipse 12:11)
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="testimony"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Testemunho</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva aqui o testemunho..."
                      className="min-h-[150px] resize-y"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit" disabled={isSaving} className="bg-amber-600 hover:bg-amber-700">
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                Registrar Vitória
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
