

"use client";

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { generateShareableContent } from '@/ai/flows/shareable-content-generation';
import type { SharedContent } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Share2, Wand } from 'lucide-react';
import { ContentPreviewModal } from '@/components/esperanca/ContentPreviewModal';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const formSchema = z.object({
  problemDescription: z.string().min(10, { message: "Descreva a situação com pelo menos 10 caracteres." }).max(500, { message: "A descrição não pode ter mais de 500 caracteres." }),
  isLetter: z.boolean().default(false).optional(),
  recipientName: z.string().optional(),
  senderName: z.string().optional(),
}).refine(data => {
    if (data.isLetter) {
        return !!data.recipientName && !!data.senderName;
    }
    return true;
}, {
    message: "Nome do destinatário e do remetente são obrigatórios para o formato de carta.",
    path: ["recipientName"],
});

type FormValues = z.infer<typeof formSchema>;

export default function PonteDaEsperancaPage() {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const { i18n } = useTranslation();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<SharedContent | null>(null);
  const [generatedContentId, setGeneratedContentId] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      problemDescription: '',
      isLetter: false,
      recipientName: '',
      senderName: userProfile?.displayName || '',
    },
  });

  const isLetter = form.watch('isLetter');

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Você precisa estar logado para usar este recurso.' });
      return;
    }

    setIsGenerating(true);
    setGeneratedContent(null);
    setGeneratedContentId(null);

    try {
      // 1. Generate content with Genkit
      const content = await generateShareableContent({ 
        model: userProfile?.preferredModel,
        language: userProfile?.preferredLanguage || i18n.language,
        bibleVersion: userProfile?.preferredBibleVersion?.name || 'NVI',
        problemDescription: data.problemDescription,
        recipientName: data.isLetter ? data.recipientName : undefined,
      });

      // 2. Save to Firestore
      const docRef = await addDoc(collection(db, 'sharedContent'), {
        creatorId: user.uid,
        createdAt: serverTimestamp(),
        problemDescription: data.problemDescription,
        isLetter: data.isLetter,
        recipientName: data.recipientName || null,
        senderName: data.senderName || null,
        content: content,
        status: 'ACTIVE',
        viewCount: 0,
      });

      setGeneratedContent(content);
      setGeneratedContentId(docRef.id);
      setIsPreviewOpen(true);
      form.reset({
        ...form.getValues(),
        problemDescription: '',
        recipientName: '',
      });

    } catch (error) {
      console.error("Error generating or saving content:", error);
      toast({
        variant: 'destructive',
        title: 'Erro ao Gerar Conteúdo',
        description: 'Não foi possível gerar a página de esperança. Por favor, tente novamente.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <div className="container mx-auto max-w-2xl py-8 px-4">
        <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mb-4">
              <Share2 className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Ponte da Esperança</h1>
            <p className="mt-2 text-muted-foreground">
              Gere uma mensagem de esperança e conforto para compartilhar com alguém que precisa.
            </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Para quem é a mensagem?</CardTitle>
            <CardDescription>
              Descreva a situação que a pessoa está enfrentando. A IA usará isso para criar uma mensagem personalizada.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="problemDescription"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="problemDescription">
                        Situação da Pessoa
                      </Label>
                      <FormControl>
                        <Textarea
                          id="problemDescription"
                          placeholder="Ex: Meu primo está muito ansioso com o vestibular e com medo de não passar..."
                          className="min-h-[120px] resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isLetter"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Enviar como uma carta personalizada
                        </FormLabel>
                        <FormDescription>
                          O link gerado terá um visual de carta e a saudação será personalizada.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                
                <AnimatePresence>
                  {isLetter && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4 overflow-hidden"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <FormField
                          control={form.control}
                          name="recipientName"
                          render={({ field }) => (
                              <FormItem>
                              <FormLabel>Nome do Destinatário</FormLabel>
                              <FormControl>
                                  <Input placeholder="Ex: João Silva" {...field} />
                              </FormControl>
                              <FormMessage />
                              </FormItem>
                          )}
                          />
                           <FormField
                          control={form.control}
                          name="senderName"
                          render={({ field }) => (
                              <FormItem>
                              <FormLabel>Seu Nome (Remetente)</FormLabel>
                              <FormControl>
                                  <Input placeholder="Ex: Maria" {...field} />
                              </FormControl>
                              <FormMessage />
                              </FormItem>
                          )}
                          />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button type="submit" className="w-full" disabled={isGenerating}>
                  {isGenerating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Wand className="mr-2 h-4 w-4" />
                  )}
                  Gerar Ponte
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      {generatedContent && generatedContentId && (
         <ContentPreviewModal
            isOpen={isPreviewOpen}
            onClose={() => setIsPreviewOpen(false)}
            content={generatedContent}
            contentId={generatedContentId}
         />
      )}
    </>
  );
}
