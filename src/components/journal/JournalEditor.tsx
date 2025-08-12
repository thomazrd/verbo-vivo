

"use client";

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import type { JournalEntry } from '@/lib/types';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trash2, BellRing } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Switch } from '../ui/switch';
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';
import { cn } from '@/lib/utils';


interface JournalEditorProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean, wasSaved?: boolean) => void;
  entry: JournalEntry | null;
  missionUserPlanId?: string | null;
}

const formSchema = z.object({
  title: z.string().max(100, "O título deve ter no máximo 100 caracteres.").optional(),
  content: z.string().min(1, "O conteúdo não pode estar vazio."),
  category: z.enum(['Pedido', 'Agradecimento', 'Reflexão'], {
    required_error: "Por favor, selecione uma categoria."
  }),
  tags: z.string().optional(),
  reminderSchedule: z.object({
      isEnabled: z.boolean().default(false),
      days: z.array(z.string()).optional(),
      time: z.string().optional(),
  }).optional(),
});


const weekDays = [
    { id: 'dom', label: 'D' },
    { id: 'seg', label: 'S' },
    { id: 'ter', label: 'T' },
    { id: 'qua', label: 'Q' },
    { id: 'qui', label: 'Q' },
    { id: 'sex', label: 'S' },
    { id: 'sab', label: 'S' },
]

export function JournalEditor({ isOpen, onOpenChange, entry, missionUserPlanId }: JournalEditorProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      content: '',
      category: 'Reflexão',
      tags: '',
      reminderSchedule: {
          isEnabled: false,
          days: [],
          time: '08:00',
      },
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (entry) {
        form.reset({
          title: entry.title || '',
          content: entry.content,
          category: entry.category,
          tags: entry.tags?.join(', ') || '',
          reminderSchedule: entry.reminderSchedule || { isEnabled: false, days: [], time: '08:00' },
        });
      } else {
        form.reset({
          title: '',
          content: '',
          category: 'Reflexão',
          tags: '',
          reminderSchedule: { isEnabled: false, days: [], time: '08:00' },
        });
      }
    }
  }, [isOpen, entry, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) return;
    setIsSaving(true);
    
    const tagsArray = values.tags ? values.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];

    const dataToSave = {
      title: values.title,
      content: values.content,
      category: values.category,
      tags: tagsArray,
      reminderSchedule: values.reminderSchedule?.isEnabled ? values.reminderSchedule : null,
    };

    try {
      if (entry) {
        // Update existing entry
        const entryRef = doc(db, 'journals', entry.id);
        await updateDoc(entryRef, {
          ...dataToSave,
          updatedAt: serverTimestamp(),
        });
        toast({ title: "Entrada atualizada com sucesso!" });
      } else {
        // Create new entry
        await addDoc(collection(db, 'journals'), {
          ...dataToSave,
          userId: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        toast({ title: "Entrada criada com sucesso!" });
      }
      
      onOpenChange(false, true); // Close sheet and signal save

    } catch (error) {
      console.error("Error saving journal entry:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível salvar a entrada.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !entry) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'journals', entry.id));
      toast({ title: "Entrada excluída com sucesso." });
      onOpenChange(false);
    } catch (error) {
       console.error("Error deleting journal entry:", error);
       toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível excluir a entrada.",
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  const reminderEnabled = form.watch('reminderSchedule.isEnabled');

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg w-full flex flex-col">
        <SheetHeader>
          <SheetTitle>{entry ? 'Editar Entrada' : 'Nova Entrada no Diário'}</SheetTitle>
          <SheetDescription>
            {entry ? 'Edite sua reflexão ou pedido.' : 'Registre aqui seus pensamentos, orações e gratidões.'}
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto -mx-6 px-6">
        <Form {...form}>
          <form id="journal-editor-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-2">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Um título para sua entrada" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Pedido">Pedido</SelectItem>
                      <SelectItem value="Agradecimento">Agradecimento</SelectItem>
                      <SelectItem value="Reflexão">Reflexão</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags (Opcional)</FormLabel>
                   <FormControl>
                    <Input placeholder="Fé, provação, gratidão..." {...field} />
                  </FormControl>
                  <FormDescription>
                    Separe as tags por vírgula.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conteúdo</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Escreva aqui..."
                      className="resize-y min-h-[200px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Reminder Section */}
            <Accordion type="single" collapsible>
                <AccordionItem value="reminder" className="border rounded-md px-3">
                    <AccordionTrigger className="py-3 hover:no-underline">
                        <div className="flex items-center gap-2">
                            <BellRing className="h-4 w-4"/>
                            Lembrete de Leitura
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4 space-y-4">
                        <FormField
                            control={form.control}
                            name="reminderSchedule.isEnabled"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                    <div className="space-y-0.5">
                                        <FormLabel>Ativar Lembrete</FormLabel>
                                        <FormDescription>Receba notificações para reler esta anotação.</FormDescription>
                                    </div>
                                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                </FormItem>
                            )}
                        />
                        {reminderEnabled && (
                            <>
                               <Controller
                                    control={form.control}
                                    name="reminderSchedule.days"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Repetir em:</FormLabel>
                                            <FormControl>
                                                <ToggleGroup
                                                    type="multiple"
                                                    variant="outline"
                                                    className="justify-start flex-wrap gap-1.5"
                                                    value={field.value}
                                                    onValueChange={field.onChange}
                                                >
                                                    {weekDays.map(day => (
                                                        <ToggleGroupItem key={day.id} value={day.id} className="h-9 w-9 p-0 text-xs">
                                                            {day.label}
                                                        </ToggleGroupItem>
                                                    ))}
                                                </ToggleGroup>
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="reminderSchedule.time"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Horário</FormLabel>
                                            <FormControl>
                                                <Input type="time" {...field} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </>
                        )}
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
          </form>
        </Form>
        </div>
        <SheetFooter className="flex-col-reverse sm:flex-row sm:justify-between pt-4 border-t mt-auto">
            <div>
            {entry && (
                <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button type="button" variant="destructive" disabled={isDeleting}>
                    {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                    Excluir
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Isso excluirá permanentemente sua entrada do diário.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Continuar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
                </AlertDialog>
            )}
            </div>
            <div className="flex gap-2 justify-end">
            <SheetClose asChild>
                <Button type="button" variant="outline">Cancelar</Button>
            </SheetClose>
            <Button type="submit" form="journal-editor-form" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar
            </Button>
            </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
