
"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { db, storage } from "@/lib/firebase";
import { doc, getDoc, addDoc, updateDoc, collection, serverTimestamp, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "@/hooks/use-auth";
import type { Content, ContentType } from "@/lib/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, UploadCloud, X, Save, Send, Link as LinkIcon, Image as ImageIcon, FileText, Video, Newspaper } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../ui/alert-dialog";
import { MarkdownEditor } from "./MarkdownEditor";
import { PrayerOfSower } from "./PrayerOfSower";
import { CelebrationOverlay } from "./CelebrationOverlay";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";


const contentTypes: { id: ContentType, label: string, icon: React.ElementType }[] = [
    { id: 'MARKDOWN', label: 'Texto (Markdown)', icon: FileText },
    { id: 'VIDEO_URL', label: 'Vídeo (URL)', icon: Video },
    { id: 'ARTICLE_URL', label: 'Artigo (URL)', icon: Newspaper },
    { id: 'IMAGE_URL', label: 'Imagem (URL)', icon: ImageIcon },
];

const contentFormSchema = z.object({
  title: z.string().min(5, { message: "O título deve ter pelo menos 5 caracteres." }),
  description: z.string().min(10, "A descrição deve ter pelo menos 10 caracteres." ),
  contentType: z.enum(['MARKDOWN', 'VIDEO_URL', 'ARTICLE_URL', 'IMAGE_URL']),
  contentValue: z.string().min(1, "O conteúdo/URL é obrigatório."),
  thumbnailUrl: z.string().url({ message: "Por favor, insira uma URL de imagem válida." }).optional().or(z.literal('')),
  tags: z.string().optional(),
});

type ContentFormValues = z.infer<typeof contentFormSchema>;
type SubmitAction = 'DRAFT' | 'PUBLISHED';

export function ContentEditor({ contentId }: { contentId?: string }) {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [content, setContent] = useState<Content | null>(null);
  const [isLoading, setIsLoading] = useState(!!contentId);
  const [isSaving, setIsSaving] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const submitActionRef = useRef<SubmitAction>('DRAFT');

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ContentFormValues>({
    resolver: zodResolver(contentFormSchema),
    defaultValues: { 
        title: "", 
        description: "", 
        contentType: 'MARKDOWN', 
        contentValue: "", 
        thumbnailUrl: "", 
        tags: "" 
    },
  });

  const formThumbnailUrl = form.watch("thumbnailUrl");
  const selectedContentType = form.watch("contentType");

  useEffect(() => {
    if (contentId && user) {
      const fetchContent = async () => {
        setIsLoading(true);
        const docRef = doc(db, "content", contentId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() } as Content;
          setContent(data);
          form.reset({
             title: data.title, 
             description: data.description,
             contentType: data.contentType,
             contentValue: data.contentValue,
             thumbnailUrl: data.thumbnailUrl || "",
             tags: data.tags?.join(', ') || ''
            });
          setThumbnailPreview(data.thumbnailUrl);
        } else {
          toast({ variant: "destructive", title: "Erro", description: "Conteúdo não encontrado." });
          router.push("/admin/content");
        }
        setIsLoading(false);
      };
      fetchContent();
    }
  }, [contentId, user, form, router, toast]);

  useEffect(() => {
    if (formThumbnailUrl && !thumbnailFile) {
        setThumbnailPreview(formThumbnailUrl);
    } else if (!formThumbnailUrl && !thumbnailFile && content?.thumbnailUrl) {
        setThumbnailPreview(content.thumbnailUrl);
    } else if (!formThumbnailUrl && !thumbnailFile) {
        setThumbnailPreview(null);
    }
  }, [formThumbnailUrl, thumbnailFile, content?.thumbnailUrl]);


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      const filePreviewUrl = URL.createObjectURL(file);
      setThumbnailPreview(filePreviewUrl);
      form.setValue("thumbnailUrl", "");
    }
  };

  const removeThumbnail = () => {
    setThumbnailFile(null);
    setThumbnailPreview(null);
    form.setValue("thumbnailUrl", "");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFormSubmit = async (values: ContentFormValues) => {
    const status = submitActionRef.current;
    if (!user || !userProfile) return;
    setIsSaving(true);
    let finalThumbnailUrl = values.thumbnailUrl || content?.thumbnailUrl || "https://dynamic.tiggomark.com.br/images/deep_dive.jpg";

    try {
      const docId = contentId || content?.id || doc(collection(db, "content")).id;

      if (thumbnailFile) {
        const storagePath = `content/${docId}/thumbnail/${thumbnailFile.name}`;
        const storageRef = ref(storage, storagePath);
        await uploadBytes(storageRef, thumbnailFile);
        finalThumbnailUrl = await getDownloadURL(storageRef);
      }
      
      const tagsArray = values.tags ? values.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];

      const dataToSave: any = {
        title: values.title,
        description: values.description,
        contentType: values.contentType,
        contentValue: values.contentValue,
        thumbnailUrl: finalThumbnailUrl,
        tags: tagsArray,
        authorId: user.uid,
        authorName: userProfile.displayName,
        updatedAt: serverTimestamp(),
        status,
      };

      const docRef = doc(db, "content", docId);
      if (contentId) {
        if (status === 'PUBLISHED' && content?.status !== 'PUBLISHED') {
            dataToSave.publishedAt = serverTimestamp();
        }
        await updateDoc(docRef, dataToSave);
      } else {
        dataToSave.createdAt = serverTimestamp();
        if (status === 'PUBLISHED') {
            dataToSave.publishedAt = serverTimestamp();
        } else {
            dataToSave.publishedAt = null;
        }
        await setDoc(docRef, dataToSave);
      }
      
      toast({ title: "Sucesso!", description: `Conteúdo salvo como ${status === 'DRAFT' ? 'rascunho' : 'publicado'}.` });

      if (status === 'PUBLISHED') {
        setShowCelebration(true);
      } else {
        router.push('/admin/content');
      }

    } catch (error) {
      console.error("Error saving content:", error);
      toast({ variant: "destructive", title: "Erro ao Salvar", description: "Não foi possível salvar o conteúdo." });
    } finally {
      setIsSaving(false);
    }
  };
  
  const onCelebrationEnd = () => {
      setShowCelebration(false);
      router.push('/admin/content');
  }

  if (isLoading) {
    return <div className="flex h-full items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  const triggerSubmit = (action: SubmitAction) => {
    submitActionRef.current = action;
    form.handleSubmit(handleFormSubmit)();
  };

  const renderContentInput = (field: any) => {
      switch(selectedContentType) {
          case 'MARKDOWN':
              return <MarkdownEditor value={field.value} onChange={field.onChange} />;
          case 'VIDEO_URL':
              return <Input placeholder="https://www.youtube.com/watch?v=..." {...field} />;
          case 'ARTICLE_URL':
              return <Input placeholder="https://meublog.com/artigo" {...field} />;
          case 'IMAGE_URL':
              return <Input placeholder="https://site.com/imagem.jpg" {...field} />;
          default:
              return null;
      }
  }

  return (
    <>
    <AnimatePresence>
        {showCelebration && <CelebrationOverlay onComplete={onCelebrationEnd} />}
    </AnimatePresence>
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => router.push('/admin/content')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{contentId ? 'Editar Conteúdo' : 'Criar Novo Conteúdo'}</h1>
        </div>
      </div>
      
      <div className="mb-6"><PrayerOfSower /></div>

      <Form {...form}>
        <form onSubmit={e => e.preventDefault()}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            <div className="md:col-span-2 space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg">Título</FormLabel>
                    <FormControl>
                      <Input placeholder="Um título claro e convidativo" {...field} className="text-lg h-12" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg">Descrição</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Uma breve descrição que explique o conteúdo." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contentValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg">Conteúdo Principal</FormLabel>
                    <FormControl>
                        {renderContentInput(field)}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
                />
            </div>

            <div className="md:col-span-1 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Publicação</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <Button type="button" onClick={() => triggerSubmit('DRAFT')} variant="secondary" disabled={isSaving}>
                    <Save className="mr-2" /> {isSaving ? 'Salvando...' : 'Salvar Rascunho'}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button type="button" disabled={isSaving}>
                        <Send className="mr-2" /> Publicar
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Pronto para publicar?</AlertDialogTitle>
                        <AlertDialogDescription>
                          O conteúdo ficará visível para todos os usuários. Deseja continuar?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => triggerSubmit('PUBLISHED')}>
                          Publicar Agora
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Detalhes do Conteúdo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="contentType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Conteúdo</FormLabel>
                           <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {contentTypes.map(type => {
                                const Icon = type.icon;
                                return (
                                  <SelectItem key={type.id} value={type.id}>
                                      <div className="flex items-center gap-2">
                                        <Icon className="h-4 w-4" />
                                        <span>{type.label}</span>
                                      </div>
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                  <div>
                    <FormLabel>Imagem de Capa (Thumbnail)</FormLabel>
                    <Tabs defaultValue="upload" className="w-full mt-2">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="upload"><ImageIcon className="mr-2 h-4 w-4"/>Upload</TabsTrigger>
                        <TabsTrigger value="link"><LinkIcon className="mr-2 h-4 w-4"/>Link</TabsTrigger>
                      </TabsList>
                      <TabsContent value="upload" className="pt-4">
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-md hover:border-primary transition-colors">
                            <UploadCloud className="h-8 w-8 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground mt-2">Clique para enviar</span>
                        </button>
                      </TabsContent>
                      <TabsContent value="link" className="pt-2">
                         <FormField
                            control={form.control}
                            name="thumbnailUrl"
                            render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                <Input placeholder="https://exemplo.com/imagem.jpg" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                         />
                      </TabsContent>
                    </Tabs>

                    {thumbnailPreview && (
                      <div className="relative mt-2">
                        <Image src={thumbnailPreview} alt="Preview" width={400} height={200} className="rounded-md w-full aspect-video object-cover" />
                        <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={removeThumbnail}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tags (Opcional)</FormLabel>
                        <FormControl>
                          <Input placeholder="ansiedade, fé, perdão" {...field} />
                        </FormControl>
                         <FormDescription>Separe as tags por vírgula.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </Form>
    </div>
    </>
  );
}
