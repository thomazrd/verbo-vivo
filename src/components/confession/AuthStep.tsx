"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';

const formSchema = z.object({
  password: z.string().min(1, { message: 'A senha é obrigatória.' }),
});

interface AuthStepProps {
  onAuthenticated: () => void;
  onCancel: () => void;
}

export function AuthStep({ onAuthenticated, onCancel }: AuthStepProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { password: '' },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user || !user.email) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Usuário não encontrado ou sem e-mail associado.' });
      return;
    }
    setIsLoading(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, values.password);
      await reauthenticateWithCredential(user, credential);
      onAuthenticated();
    } catch (error) {
      console.error('Re-authentication failed:', error);
      toast({ variant: 'destructive', title: 'Falha na Autenticação', description: 'Senha incorreta. Por favor, tente novamente.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
        key="auth"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
    >
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Verificação de Segurança</CardTitle>
          <CardDescription>Para sua segurança, por favor, insira sua senha para acessar o confessionário.</CardDescription>
        </CardHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent>
                    <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Senha</FormLabel>
                        <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Entrar
                    </Button>
                </CardFooter>
            </form>
        </Form>
      </Card>
    </motion.div>
  );
}
