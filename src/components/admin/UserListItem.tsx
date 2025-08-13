
"use client";

import type { UserProfile } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BrainCircuit, User, Loader2, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "../ui/input";
import { doc, increment, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

interface UserListItemProps {
  user: UserProfile;
}

const addCreditsSchema = z.object({
  credits: z.number().int().min(1, "O valor deve ser maior que zero."),
});

type AddCreditsFormValues = z.infer<typeof addCreditsSchema>;

export function UserListItem({ user }: UserListItemProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const form = useForm<AddCreditsFormValues>({
    resolver: zodResolver(addCreditsSchema),
    defaultValues: { credits: 100 },
  });

  const onSubmit = async (values: AddCreditsFormValues) => {
    setIsSaving(true);
    try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
            aiCredits: increment(values.credits)
        });
        toast({
            title: "Créditos Adicionados!",
            description: `${values.credits} créditos foram adicionados para ${user.displayName}.`
        });
        setIsModalOpen(false);
        form.reset();
    } catch (error) {
        console.error("Error adding credits:", error);
        toast({
            variant: "destructive",
            title: "Erro",
            description: "Não foi possível adicionar os créditos."
        });
    } finally {
        setIsSaving(false);
    }
  }

  const createdAt = user.createdAt
    ? format(user.createdAt.toDate(), "'Entrou em' dd/MM/yyyy", { locale: ptBR })
    : "Data de entrada desconhecida";

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <div className="flex items-center p-3 gap-4 rounded-md border hover:bg-muted/50">
        <Avatar className="h-10 w-10">
          <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "Avatar"} />
          <AvatarFallback>{user.displayName?.[0] || <User className="h-4 w-4"/>}</AvatarFallback>
        </Avatar>
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
          <div>
            <p className="font-semibold text-sm truncate">{user.displayName}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            <p className="text-xs text-muted-foreground">{createdAt}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={user.role === 'ADMIN' ? "default" : "outline"}>{user.role || 'USER'}</Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
                <BrainCircuit className="h-3 w-3"/>
                {user.aiCredits ?? 0}
            </Badge>
          </div>
        </div>
        <DialogTrigger asChild>
            <Button size="sm">
                <Plus className="h-4 w-4 mr-2"/>
                Créditos
            </Button>
        </DialogTrigger>
      </div>

      <DialogContent>
          <DialogHeader>
              <DialogTitle>Adicionar Créditos de IA</DialogTitle>
              <DialogDescription>
                  Adicione créditos para o usuário: <span className="font-semibold">{user.displayName}</span>
              </DialogDescription>
          </DialogHeader>
          <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
                  <FormField
                  control={form.control}
                  name="credits"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Quantidade de Créditos</FormLabel>
                      <FormControl>
                          <Input 
                              type="number" 
                              placeholder="100" 
                              {...field} 
                              onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)}
                          />
                      </FormControl>
                      <FormMessage />
                      </FormItem>
                  )}
                  />
                  <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                      <Button type="submit" disabled={isSaving}>
                          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                          Adicionar
                      </Button>
                  </DialogFooter>
              </form>
          </Form>
      </DialogContent>
    </Dialog>
  );
}
