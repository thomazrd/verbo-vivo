"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { marked } from "marked";
import { db, storage } from "@/lib/firebase";
import { doc, getDoc, addDoc, updateDoc, setDoc, collection, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "@/hooks/use-auth";
import type { Article } from "@/lib/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, UploadCloud, X, Eye, FileText, Save, Send } from "lucide-react";

const articleSchema = z.object({
  title: z.string().min(5, { message: "O título deve ter pelo menos 5 caracteres." }),
  content: z.string().min(50, { message: "O artigo deve ter pelo menos 50 caracteres." }),
});

type ArticleFormValues = z.infer<typeof articleSchema>;

function slugify(text: string): string {
    return text
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/--+/g, '-');
}

export function ArticleEditor({ articleId }: { articleId?: string }) {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(!!articleId);
  const [isSaving, setIsSaving] = useState(false);
  
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ArticleFormValues>({
    resolver: zodResolver(articleSchema),
    defaultValues: { title: "", content: "" },
  });

  useEffect(() => {
    if (articleId) {
      const fetchArticle = async () => {
        const docRef = doc(db, "articles", articleId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() } as Article;
          setArticle(data);
          form.reset({ title: data.title, content: data.content });
          setCoverImagePreview(data.coverImageUrl);
        } else {
          toast({ variant: "destructive", title: "Erro", description: "Artigo não encontrado." });
          router.push("/blog");
        }
        setIsLoading(false);
      };
      fetchArticle();
    }
  }, [articleId, form, router, toast]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast({ variant: "destructive", title: "Arquivo inválido", description: "Por favor, selecione uma imagem." });
        return;
      }
      setCoverImageFile(file);
      setCoverImagePreview(URL.createObjectURL(file));
    }
  };

  const removeCoverImage = () => {
    setCoverImageFile(null);
    setCoverImagePreview(null);
    if(fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSave = async (values: ArticleFormValues, status: 'draft' | 'published') => {
    if (!user || !userProfile) {
        toast({ variant: "destructive", title: "Não autenticado", description: "Você precisa estar logado." });
        return;
    }
    
    setIsSaving(true);
    let newCoverImageUrl = article?.coverImageUrl || null;

    try {
        const currentId = articleId || article?.id;

        if (coverImageFile && currentId) {
            const storagePath = `articles/${currentId}/${coverImageFile.name}`;
            const storageRef = ref(storage, storagePath);
            await uploadBytes(storageRef, coverImageFile);
            newCoverImageUrl = await getDownloadURL(storageRef);
        }

        const excerpt = values.content.substring(0, 150).replace(/\s+$/, '') + '...';
        const slug = slugify(values.title);

        const data = {
            title: values.title,
            content: values.content,
            coverImageUrl: newCoverImageUrl,
            authorId: user.uid,
            authorName: userProfile.displayName || "Anônimo",
            authorPhotoURL: userProfile.photoURL,
            updatedAt: serverTimestamp(),
            excerpt,
            slug,
            status,
        };

        if(status === 'published' && (!article || article.status !== 'published')) {
            (data as any).publishedAt = serverTimestamp();
        }

        if(currentId) {
            await updateDoc(doc(db, "articles", currentId), data);
        } else {
            const newDocRef = await addDoc(collection(db, "articles"), {
                ...data,
                createdAt: serverTimestamp(),
            });
            // Update URL to edit mode
            router.replace(`/blog/editor/${newDocRef.id}`);
        }
        
        toast({ title: "Sucesso!", description: `Artigo salvo como ${status === 'draft' ? 'rascunho' : 'publicado'}.` });

    } catch (error) {
        console.error("Error saving article:", error);
        toast({ variant: "destructive", title: "Erro ao salvar", description: "Não foi possível salvar o artigo." });
    } finally {
        setIsSaving(false);
    }
  }

  if (isLoading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="container mx-auto max-w-5xl py-8 px-4">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => router.push('/blog')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Editor de Artigos</h1>
          <p className="text-muted-foreground">{articleId ? 'Editando artigo existente' : 'Criando um novo artigo'}</p>
        </div>
      </div>

      <Form {...form}>
        <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel className="text-lg">Título</FormLabel>
                            <FormControl>
                                <Input placeholder="O título do seu artigo" {...field} className="text-lg h-12" />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                     <Tabs defaultValue="edit" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="edit"><FileText className="mr-2 h-4 w-4"/> Escrever</TabsTrigger>
                            <TabsTrigger value="preview"><Eye className="mr-2 h-4 w-4"/> Visualizar</TabsTrigger>
                        </TabsList>
                        <TabsContent value="edit">
                             <FormField
                                control={form.control}
                                name="content"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Escreva seu artigo aqui. Você pode usar Markdown para formatação."
                                            className="min-h-[400px] resize-y font-mono"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </TabsContent>
                         <TabsContent value="preview">
                            <div 
                                className="prose max-w-none min-h-[400px] rounded-md border p-4"
                                dangerouslySetInnerHTML={{ __html: marked.parse(form.watch('content') || 'Comece a escrever para ver a pré-visualização.') as string }}
                            />
                        </TabsContent>
                    </Tabs>
                </div>
                <div className="md:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                           <CardTitle>Publicação</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4">
                             <Button onClick={form.handleSubmit(d => handleSave(d, 'draft'))} variant="secondary" disabled={isSaving}>
                                <Save className="mr-2"/>
                                {isSaving ? 'Salvando...' : 'Salvar Rascunho'}
                            </Button>
                            <Button onClick={form.handleSubmit(d => handleSave(d, 'published'))} disabled={isSaving}>
                                <Send className="mr-2"/>
                                {isSaving ? 'Publicando...' : 'Publicar Artigo'}
                            </Button>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                           <CardTitle>Imagem de Capa</CardTitle>
                           <CardDescription>Esta imagem aparecerá no topo do seu artigo.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden"/>
                            {coverImagePreview ? (
                                <div className="relative">
                                    <Image src={coverImagePreview} alt="Preview" width={400} height={200} className="rounded-md w-full aspect-video object-cover"/>
                                    <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={removeCoverImage}>
                                        <X className="h-4 w-4"/>
                                    </Button>
                                </div>
                            ) : (
                                <button type="button" onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-md hover:border-primary transition-colors">
                                    <UploadCloud className="h-8 w-8 text-muted-foreground"/>
                                    <span className="text-sm text-muted-foreground mt-2">Clique para enviar</span>
                                </button>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </form>
      </Form>
    </div>
  );
}
