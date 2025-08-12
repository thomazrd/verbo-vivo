
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { v4 as uuidv4 } from 'uuid';
import { db, storage } from "@/lib/firebase";
import { addDoc, collection, doc, serverTimestamp, writeBatch, getDoc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { AnimatePresence, motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Loader2, Plus, Trash2, Check, BookOpen, Wand2, RefreshCw, CalendarDays, ListTodo, Youtube } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import type { Mission, MissionType, UserBattlePlan, BattlePlan, BibleBook, GenerateBattlePlanOutput } from "@/lib/types";
import Image from "next/image";
import { Skeleton } from "../ui/skeleton";
import axios from 'axios';
import { generateBattlePlan } from "@/ai/flows/battle-plan-generation-flow";
import { bibleBooksByAbbrev } from "@/lib/bible-books-by-abbrev";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { Slider } from "../ui/slider";
import { MissionTypeDetails } from "@/lib/mission-details";

const missionSchema = z.object({
  id: z.string().default(() => uuidv4()),
  day: z.number(),
  title: z.string().min(3, "O título da missão é muito curto."),
  type: z.enum(["BIBLE_READING", "PRAYER_SANCTUARY", "FEELING_JOURNEY", "CONFESSION", "JOURNAL_ENTRY", "FAITH_CONFESSION", "YOUTUBE_VIDEO"]),
  content: z.object({
    path: z.string(),
    completionQueryParam: z.string().optional().nullable(),
    verse: z.string().optional().nullable(),
    details: z.any().optional(),
  }),
  leaderNote: z.string().optional().nullable(),
});

const planSchema = z.object({
  title: z.string().min(5, "O título deve ter pelo menos 5 caracteres.").max(100),
  description: z.string().min(10, "A descrição deve ter pelo menos 10 caracteres.").max(500),
  durationDays: z.number().min(1, "O plano deve durar pelo menos 1 dia.").max(90, "O plano não pode exceder 90 dias."),
  coverImageUrl: z.string().url("URL da imagem de capa inválida."),
  missions: z.array(missionSchema).min(1, "O plano deve ter pelo menos uma missão."),
});

type PlanFormValues = z.infer<typeof planSchema>;

function BibleVerseSelector({ fieldIndex, control, setValue }: { fieldIndex: number, control: any, setValue: any }) {
    const [books, setBooks] = useState<BibleBook[]>([]);
    
    const details = useWatch({
        control,
        name: `missions.${fieldIndex}.content.details`
    });

    const selectedBookAbbrev = details?.book?.abbrev?.pt;
    const selectedBook = books.find(b => b.abbrev.pt === selectedBookAbbrev);
    
    useEffect(() => {
        const fetchBooks = async () => {
            try {
                const response = await axios.get('/api/bible/books');
                setBooks(response.data);
                 if (details?.book?.name && !details?.book?.chapters) {
                    const fullBookData = response.data.find((b: BibleBook) => b.name === details.book.name);
                    if (fullBookData) {
                        setValue(`missions.${fieldIndex}.content.details.book`, fullBookData);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch Bible books", error);
            }
        };
        fetchBooks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!details) return;

        const { book, chapter, startVerse, endVerse } = details;
        if (!book?.name || !chapter) {
            setValue(`missions.${fieldIndex}.content.verse`, '');
            return;
        }
        
        let reference = `${book.name} ${chapter}`;
        if (startVerse) {
            reference += `:${startVerse}`;
            if (endVerse && endVerse > startVerse) {
                reference += `-${endVerse}`;
            }
        }
        setValue(`missions.${fieldIndex}.content.verse`, reference, { shouldValidate: true });

    }, [details, fieldIndex, setValue]);


    return (
        <div className="space-y-3 p-3 bg-muted rounded-md border">
            <Label>Definir Leitura</Label>
             <Controller
                control={control}
                name={`missions.${fieldIndex}.content.details.book`}
                render={({ field }) => (
                    <Select 
                        onValueChange={(bookId) => {
                            const book = books.find(b => b.abbrev.pt === bookId);
                            field.onChange(book);
                            setValue(`missions.${fieldIndex}.content.details.chapter`, undefined);
                        }} 
                        value={field.value?.abbrev?.pt}
                    >
                        <SelectTrigger><SelectValue placeholder="Escolha um livro..." /></SelectTrigger>
                        <SelectContent>
                            {books.map(book => (
                                <SelectItem key={book.abbrev.pt} value={book.abbrev.pt}>{book.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            />
            {selectedBook && (
                 <Controller
                    control={control}
                    name={`missions.${fieldIndex}.content.details.chapter`}
                    render={({ field }) => (
                        <Select onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} value={String(field.value || '')}>
                            <SelectTrigger><SelectValue placeholder="Escolha um capítulo..." /></SelectTrigger>
                            <SelectContent>
                                {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map(c => (
                                    <SelectItem key={c} value={String(c)}>{c}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                />
            )}
             <div className="grid grid-cols-2 gap-2">
                <Controller
                    control={control}
                    name={`missions.${fieldIndex}.content.details.startVerse`}
                    render={({ field }) => (
                       <Input type="number" placeholder="Início" {...field} onChange={e => field.onChange(e.target.value ? parseInt(e.target.value, 10) : undefined)}/>
                    )}
                />
                <Controller
                    control={control}
                    name={`missions.${fieldIndex}.content.details.endVerse`}
                    render={({ field }) => (
                       <Input type="number" placeholder="Fim" {...field} onChange={e => field.onChange(e.target.value ? parseInt(e.target.value, 10) : undefined)}/>
                    )}
                />
            </div>
             <Controller
                control={control}
                name={`missions.${fieldIndex}.content.verse`}
                render={({ field }) => (
                    <Input readOnly disabled {...field} placeholder="Referência final aparecerá aqui" />
                )}
            />
        </div>
    );
}


function MissionEditor({ control, day, setValue, watch }: { control: any, day: number, setValue: any, watch: any }) {
    const { fields, append, remove } = useFieldArray({
        control,
        name: `missions`
    });
    
    const missions = watch('missions');

    const dayMissionIndices = fields.reduce((acc, field, index) => {
        if((field as any).day === day) acc.push(index);
        return acc;
    }, [] as number[]);


    const addMission = () => {
        const defaultType: MissionType = "BIBLE_READING";
        const details = MissionTypeDetails[defaultType];
        append({
            id: uuidv4(),
            day: day,
            title: `Missão para o Dia ${day}`,
            type: defaultType,
            content: { 
                path: details.path, 
                verse: "",
                completionQueryParam: details.completionQueryParam || null,
                details: {},
            },
            leaderNote: "",
        }, { shouldFocus: true });
    };

    const handleTypeChange = (newType: MissionType, fieldIndex: number) => {
        const details = MissionTypeDetails[newType];
        setValue(`missions.${fieldIndex}.type`, newType);
        setValue(`missions.${fieldIndex}.content.path`, details.path);
        setValue(`missions.${fieldIndex}.content.completionQueryParam`, details.completionQueryParam || null);
        setValue(`missions.${fieldIndex}.content.details`, {});
        
        if(!details.requiresVerse) {
            setValue(`missions.${fieldIndex}.content.verse`, '');
        }
    }
    
    return (
        <div className="space-y-4 rounded-lg bg-muted/50 p-4 border">
            <h3 className="font-semibold text-lg">Dia {day}</h3>
            {dayMissionIndices.map((fieldIndex) => {
                const missionType = missions[fieldIndex]?.type;
                const missionDetails = MissionTypeDetails[missionType];
                const key = (fields[fieldIndex] as any).id;

                return (
                    <Card key={key}>
                        <CardContent className="p-4 space-y-3">
                             <div className="flex justify-between items-center">
                               <Label>Título da Missão</Label>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove(fieldIndex)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                            <Controller
                                control={control}
                                name={`missions.${fieldIndex}.title`}
                                render={({ field }) => <Input {...field} placeholder="Título da Missão" />}
                            />

                            <Label>Tipo de Missão</Label>
                             <Controller
                                control={control}
                                name={`missions.${fieldIndex}.type`}
                                render={({ field }) => (
                                    <Select onValueChange={(value) => handleTypeChange(value as MissionType, fieldIndex)} value={field.value}>
                                        <SelectTrigger><SelectValue placeholder="Escolha um tipo..." /></SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(MissionTypeDetails).map(([key, value]) => (
                                                <SelectItem key={key} value={key}>{value.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            
                             {missionType === 'BIBLE_READING' && (
                                <BibleVerseSelector
                                    fieldIndex={fieldIndex}
                                    setValue={setValue}
                                    control={control}
                                />
                            )}
                            {missionType === 'YOUTUBE_VIDEO' && (
                                 <div className="space-y-1">
                                    <Label>{missionDetails.verseLabel}</Label>
                                    <Controller
                                        control={control}
                                        name={`missions.${fieldIndex}.content.verse`}
                                        render={({ field }) => <Input {...field} value={field.value || ''} placeholder={missionDetails.versePlaceholder} />}
                                    />
                                 </div>
                            )}
                            
                             <Label>Nota do Líder (Opcional)</Label>
                             <Controller
                                control={control}
                                name={`missions.${fieldIndex}.leaderNote`}
                                render={({ field }) => <Textarea {...field} value={field.value || ''} placeholder="Um insight ou direção para esta missão..." />}
                            />
                        </CardContent>
                    </Card>
                )
            })}
             <Button type="button" variant="outline" className="w-full" onClick={addMission}><Plus className="h-4 w-4 mr-2"/>Adicionar Missão</Button>
        </div>
    )
}

const steps = [
  { id: "start", name: "Ponto de Partida"},
  { id: "details", name: "Detalhes" },
  { id: "missions", name: "Missões" },
  { id: "review", name: "Revisão" },
];

function parseVerseReference(ref: string | undefined | null) {
  if (!ref) return null;

  const match = ref.match(/^(.+?)\s+(\d+)(?::(\d+))?(?:-(\d+))?$/);
  if (!match) return null;

  const [, bookName, chapter, startVerse, endVerse] = match;
  
  const normalizedInputName = bookName.trim().replace(/^[0-9]+[ªº]?\s*/, '').toLowerCase();

  const bookAbbrev = Object.keys(bibleBooksByAbbrev).find(abbrev => {
    const bookData = bibleBooksByAbbrev[abbrev];
    const normalizedBookDataName = bookData.name.replace(/^[0-9]+[ªº]?\s*/, '').toLowerCase();
    
    return abbrev === normalizedInputName || 
           normalizedBookDataName === normalizedInputName ||
           bookData.name.toLowerCase() === bookName.trim().toLowerCase();
  });

  const book = bookAbbrev ? bibleBooksByAbbrev[bookAbbrev] : null;
  if (!book) return null;

  return {
    book: book,
    chapter: parseInt(chapter),
    startVerse: startVerse ? parseInt(startVerse) : undefined,
    endVerse: endVerse ? parseInt(endVerse) : undefined,
  };
}


export function CreateBattlePlanWizard({ planId }: { planId?: string }) {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(0);
  const [creationMode, setCreationMode] = useState<'ai' | 'manual' | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(!!planId);
  const isEditing = !!planId;

  // AI Generation State
  const [problemDescription, setProblemDescription] = useState('');
  const [durationDays, setDurationDays] = useState(7);
  const [missionsPerDay, setMissionsPerDay] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<GenerateBattlePlanOutput | null>(null);

  const form = useForm<PlanFormValues>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      title: "",
      description: "",
      durationDays: 7,
      coverImageUrl: "https://placehold.co/600x400.png",
      missions: [],
    },
  });

  const { control, trigger, getValues, watch, setValue, reset } = form;
  const duration = watch('durationDays');
  const missionsArray = watch('missions');

  useEffect(() => {
    if (isEditing) {
        setCreationMode('manual'); // Editing is always manual flow
        setCurrentStep(1); // Start at Details step
    }
  }, [isEditing]);

  useEffect(() => {
    if (isEditing && user) {
      const fetchPlan = async () => {
        setIsLoading(true);
        try {
          const planRef = doc(db, 'battlePlans', planId);
          const planSnap = await getDoc(planRef);
          if (planSnap.exists()) {
            const data = planSnap.data() as BattlePlan;
            if (data.creatorId !== user.uid) {
                toast({ variant: 'destructive', title: 'Acesso Negado', description: 'Você não tem permissão para editar este plano.'});
                router.push('/battle-plans');
                return;
            }
            reset(data);
          } else {
            toast({ variant: 'destructive', title: 'Erro', description: 'Plano de Batalha não encontrado.'});
            router.push('/battle-plans');
          }
        } catch (e) {
          console.error(e);
          toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível carregar o plano para edição.'});
        } finally {
          setIsLoading(false);
        }
      }
      fetchPlan();
    }
  }, [planId, user, isEditing, reset, router, toast]);

  const handleAiGeneration = async () => {
    if (!problemDescription.trim()) {
        toast({ variant: "destructive", title: "Descrição necessária", description: "Por favor, descreva o problema para a IA." });
        return;
    }
    setIsGenerating(true);
    setAiSuggestion(null);
    try {
        const result = await generateBattlePlan({ problemDescription, durationDays, missionsPerDay });
        setAiSuggestion(result);
    } catch(e) {
        console.error("AI plan generation failed", e);
        toast({ variant: "destructive", title: "Erro de IA", description: "Não foi possível gerar a sugestão. Tente novamente." });
    } finally {
        setIsGenerating(false);
    }
  };
  
  const handleUseAiSuggestion = () => {
    if (!aiSuggestion) return;
    
    const formattedMissions = aiSuggestion.missions.map((m): Mission => {
        const missionDetails = MissionTypeDetails[m.type];
        let contentDetails = {};
        if (m.type === 'BIBLE_READING' && m.content.verse) {
            contentDetails = parseVerseReference(m.content.verse) || {};
        }

        return {
            ...m,
            id: uuidv4(),
            content: {
                ...m.content,
                path: missionDetails.path,
                completionQueryParam: missionDetails.completionQueryParam || null,
                details: contentDetails,
            },
            leaderNote: m.leaderNote || null,
        };
    });

    form.reset({
        ...getValues(),
        title: aiSuggestion.title,
        description: aiSuggestion.description,
        durationDays: aiSuggestion.durationDays,
        missions: formattedMissions,
    });
    setCurrentStep(2);
  }

  const goToNextStep = async () => {
    let isValid = false;
    
    if (currentStep === 1) { // Validate Details
      isValid = await trigger(['title', 'description', 'durationDays', 'coverImageUrl']);
    } else if (currentStep === 2) { // Validate Missions
      isValid = getValues('missions').length > 0;
      if (!isValid) {
        toast({ variant: 'destructive', title: 'Missões Vazias', description: 'Adicione pelo menos uma missão para continuar.' });
      }
    } else { // All other steps can proceed
        isValid = true;
    }
    
    if (isValid && currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep === 1 && !isEditing) {
        setCreationMode(null);
        setCurrentStep(0);
        return;
    }
    
    if (currentStep > 0) {
        setCurrentStep(prev => prev - 1);
    }
  };
  
  const handleSavePlan = async (status: 'DRAFT' | 'PUBLISHED') => {
      if(!user || !userProfile) return;
      
      const isValid = await trigger();
      if (!isValid) {
          toast({ variant: 'destructive', title: 'Campos Inválidos', description: 'Por favor, corrija os erros antes de salvar.' });
          return;
      }

      setIsSaving(true);
      const values = getValues();
      
      const sanitizedMissions = values.missions.map(mission => ({
          ...mission,
          leaderNote: mission.leaderNote || null,
          content: {
              path: mission.content.path || null,
              verse: mission.content.verse || null,
              completionQueryParam: mission.content.completionQueryParam || null,
              details: {
                book: mission.content.details?.book || null,
                chapter: mission.content.details?.chapter || null,
                startVerse: mission.content.details?.startVerse || null,
                endVerse: mission.content.details?.endVerse || null,
              }
          }
      }));

      const finalValues = { ...values, missions: sanitizedMissions };
      console.log('Data to save:', JSON.stringify(finalValues, null, 2));


      try {
        if (isEditing && planId) {
            const planRef = doc(db, 'battlePlans', planId);
            await updateDoc(planRef, {
                ...finalValues,
                status,
                updatedAt: serverTimestamp(),
            });
        } else {
            const planDocId = uuidv4();
            const planData = {
                ...finalValues,
                id: planDocId,
                creatorId: user.uid,
                creatorName: userProfile.displayName || 'Anônimo',
                status,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };
            
            const batch = writeBatch(db);
            const planRef = doc(db, "battlePlans", planDocId);
            batch.set(planRef, planData);
            
            await batch.commit();
        }

          toast({ title: "Sucesso!", description: `Seu plano de batalha foi salvo como ${status === 'DRAFT' ? 'rascunho' : 'publicado'}.`});
          router.push('/battle-plans');
      } catch (error) {
          console.error("Error saving plan:", error);
          toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível salvar seu plano.' });
      } finally {
          setIsSaving(false);
      }
  }

  const renderStepContent = () => {    
    if (isEditing) {
        if (currentStep === 1) return renderDetailsStep();
        if (currentStep === 2) return renderMissionsStep();
        if (currentStep === 3) return renderReviewStep();
        return null;
    }
    
    switch (currentStep) {
        case 0: return renderStartStep();
        case 1:
            if (creationMode === 'ai') return renderAiPromptStep();
            if (creationMode === 'manual') return renderDetailsStep();
            return null;
        case 2: return renderMissionsStep();
        case 3: return renderReviewStep();
        default: return null;
    }
  }

  const renderStartStep = () => (
    <Card>
        <CardHeader>
            <CardTitle>Ponto de Partida</CardTitle>
            <CardDescription>Como você deseja iniciar a criação deste plano?</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
            <Button variant="outline" className="h-auto py-6 flex-col gap-2" onClick={() => { setCreationMode('ai'); setCurrentStep(1); }}>
                <Wand2 className="h-8 w-8" />
                <span className="font-bold">Criar com Inteligência Artificial</span>
                <span className="text-xs font-normal text-muted-foreground">Descreva um problema e deixe a IA montar o plano.</span>
            </Button>
            <Button variant="outline" className="h-auto py-6 flex-col gap-2" onClick={() => { setCreationMode('manual'); setCurrentStep(1); }}>
                <Plus className="h-8 w-8" />
                <span className="font-bold">Forjar Manualmente</span>
                <span className="text-xs font-normal text-muted-foreground">Crie seu plano do zero, missão por missão.</span>
            </Button>
        </CardContent>
    </Card>
  )
  
  const renderAiPromptStep = () => (
      <Card>
        <CardHeader>
            <CardTitle>Criar com IA</CardTitle>
            <CardDescription>Descreva o desafio e ajuste as opções para a IA criar um plano de batalha estratégico.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div>
              <Label htmlFor="problem-description">Descrição do Problema</Label>
              <Textarea id="problem-description" placeholder="Ex: Apatia espiritual na juventude, falta de comprometimento dos membros..." className="min-h-[120px]" value={problemDescription} onChange={(e) => setProblemDescription(e.target.value)} />
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <Label className="flex items-center gap-2"><CalendarDays className="h-4 w-4"/> Duração do Plano</Label>
                    <span className="font-bold text-primary">{durationDays} dias</span>
                </div>
                <Slider defaultValue={[7]} value={[durationDays]} min={3} max={30} step={1} onValueChange={(value) => setDurationDays(value[0])} />
            </div>

             <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <Label className="flex items-center gap-2"><ListTodo className="h-4 w-4"/> Missões por Dia</Label>
                    <span className="font-bold text-primary">{missionsPerDay}</span>
                </div>
                <Slider defaultValue={[1]} value={[missionsPerDay]} min={1} max={10} step={1} onValueChange={(value) => setMissionsPerDay(value[0])} />
            </div>


            <Button onClick={handleAiGeneration} disabled={isGenerating}> {isGenerating ? <Loader2 className="animate-spin mr-2"/> : <Wand2 className="mr-2"/>} Gerar Plano de Batalha </Button>
            {isGenerating && ( <p className="text-sm text-muted-foreground">A IA está montando uma estratégia... Isso pode levar um momento.</p> )}
            {aiSuggestion && (
                <div className="pt-4 border-t">
                    <h3 className="text-lg font-semibold">Sugestão do General</h3>
                    <div className="p-4 border rounded-lg mt-2 space-y-3 bg-muted/30">
                        <h4 className="font-bold">{aiSuggestion.title}</h4>
                        <p className="text-sm text-muted-foreground">{aiSuggestion.description}</p>
                        <p className="text-sm font-semibold">Duração: {aiSuggestion.durationDays} dias</p>
                        <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="item-1">
                                <AccordionTrigger>Ver {aiSuggestion.missions.length} missões sugeridas</AccordionTrigger>
                                <AccordionContent className="p-1">
                                    <div className="space-y-2 max-h-60 overflow-y-auto pr-3">
                                    {aiSuggestion.missions.sort((a,b) => a.day - b.day).map((mission, index) => {
                                        const Icon = MissionTypeDetails[mission.type]?.icon || BookOpen;
                                        return (
                                        <div key={index} className="p-2 border rounded-md bg-background">
                                            <p className="font-bold text-xs">Dia {mission.day}: {mission.title}</p>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                                <Icon className="h-3 w-3" />
                                                <span>{MissionTypeDetails[mission.type]?.label}</span>
                                                {mission.content.verse && <span className="font-mono">({mission.content.verse})</span>}
                                            </div>
                                        </div>
                                    )})}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                        <div className="flex gap-2 pt-2">
                            <Button onClick={() => handleUseAiSuggestion()}> <Check className="mr-2"/> Usar este Plano </Button>
                            <Button variant="outline" onClick={handleAiGeneration} disabled={isGenerating}> <RefreshCw className="mr-2"/> Gerar Novamente </Button>
                        </div>
                    </div>
                </div>
            )}
        </CardContent>
    </Card>
  )

  const renderDetailsStep = () => (
       <Card>
            <CardHeader><CardTitle>Detalhes do Plano</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                    <Controller control={control} name="title" render={({ field, fieldState }) => ( <div> <Label htmlFor="title">Título do Plano</Label> <Input id="title" {...field} /> {fieldState.error && <p className="text-destructive text-sm mt-1">{fieldState.error.message}</p>} </div> )}/>
                    <Controller control={control} name="description" render={({ field, fieldState }) => ( <div> <Label htmlFor="description">Descrição</Label> <Textarea id="description" {...field} /> {fieldState.error && <p className="text-destructive text-sm mt-1">{fieldState.error.message}</p>} </div> )}/>
                    <Controller control={control} name="durationDays" render={({ field, fieldState }) => ( <div> <Label htmlFor="durationDays">Duração (dias)</Label> <Input id="durationDays" type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10))} /> {fieldState.error && <p className="text-destructive text-sm mt-1">{fieldState.error.message}</p>} </div> )}/>
                    <Controller control={control} name="coverImageUrl" render={({ field, fieldState }) => ( <div> <Label htmlFor="coverImageUrl">URL da Imagem de Capa</Label> <Input id="coverImageUrl" {...field} /> {fieldState.error && <p className="text-destructive text-sm mt-1">{fieldState.error.message}</p>} </div> )}/>
            </CardContent>
        </Card>
  );

  const renderMissionsStep = () => (
      <div className="space-y-4">
          {Array.from({ length: duration || 0 }, (_, i) => (
              <MissionEditor key={i} control={control} day={i + 1} setValue={setValue} watch={watch} />
          ))}
      </div>
  );

  const renderReviewStep = () => (
     <Card>
        <CardHeader>
            <CardTitle>Revisar e Finalizar</CardTitle>
            <CardDescription>Confira se todas as informações estão corretas antes de finalizar.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="relative w-full aspect-video rounded-lg overflow-hidden">
                <Image src={getValues('coverImageUrl')} alt={getValues('title')} fill className="object-cover" />
            </div>
            <h2 className="text-2xl font-bold">{getValues('title')}</h2>
            <p className="text-muted-foreground">{getValues('description')}</p>
            <p className="font-semibold">{getValues('durationDays')} dias de treinamento, {getValues('missions').length} missões.</p>
                <Button onClick={() => handleSavePlan('DRAFT')} variant="secondary" disabled={isSaving}> {isSaving ? <Loader2 className="animate-spin mr-2"/> : null} Salvar como Rascunho </Button>
                <Button onClick={() => handleSavePlan('PUBLISHED')} disabled={isSaving}> {isSaving ? <Loader2 className="animate-spin mr-2"/> : null} Publicar Plano </Button>
        </CardContent>
    </Card>
  );


  if (isLoading) {
      return (
          <div className="container mx-auto max-w-4xl py-8 px-4 space-y-4">
              <Skeleton className="h-9 w-48 mb-8" />
              <Skeleton className="h-10 w-full mb-8" />
              <Card><CardContent className="p-6 space-y-4"><Skeleton className="h-8 w-1/4"/><Skeleton className="h-10 w-full"/><Skeleton className="h-10 w-full"/></CardContent></Card>
          </div>
      )
  }

  const stepIndex = isEditing ? currentStep : (creationMode ? currentStep : 0);
  const isNextButtonVisible = stepIndex < steps.length - 1;
  const isNextButtonDisabled = currentStep === 2 && missionsArray.length === 0;

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" size="icon" className="h-9 w-9" onClick={goToPreviousStep}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{isEditing ? 'Editar Plano de Batalha' : 'Criar Plano de Batalha'}</h1>
        </div>
      </div>
      
      {/* Stepper */}
      {!isEditing && (
        <div className="mb-8 flex items-center justify-center">
            {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                    <div className="flex flex-col items-center">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${index === stepIndex ? 'bg-primary text-primary-foreground' : (index < stepIndex ? 'bg-green-500 text-white' : 'bg-muted border')}`}>
                            {index < stepIndex ? <Check/> : index + 1}
                        </div>
                        <p className={`mt-1 text-xs text-center ${index === stepIndex ? 'font-semibold text-primary' : 'text-muted-foreground'}`}>{step.name}</p>
                    </div>
                    {index < steps.length - 1 && (
                        <div className={`h-0.5 w-8 sm:w-16 mx-2 ${index < stepIndex ? 'bg-primary/50' : 'bg-muted'}`} />
                    )}
                </div>
            ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
        >
            {renderStepContent()}
        </motion.div>
      </AnimatePresence>
      
      {/* Navigation */}
       <div className="mt-8 flex justify-between items-start">
            <Button variant="outline" onClick={goToPreviousStep} disabled={isSaving}>
                <ArrowLeft className="h-4 w-4 mr-2"/> Voltar
            </Button>
            
            {isNextButtonVisible && (
                 <div className="text-right">
                    <Button onClick={goToNextStep} disabled={isNextButtonDisabled || isSaving}>
                        Avançar <ArrowRight className="h-4 w-4 ml-2"/>
                    </Button>
                    {isNextButtonDisabled && (
                        <p className="text-xs text-destructive mt-1">Adicione pelo menos uma missão para continuar.</p>
                    )}
                </div>
            )}
        </div>
    </div>
  );
}
