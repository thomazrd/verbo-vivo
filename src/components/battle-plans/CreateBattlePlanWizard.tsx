
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
import { ArrowLeft, ArrowRight, Loader2, Plus, Trash2, Check, BookOpen, Smile, LockKeyhole, HeartHandshake, NotebookText, HandHeart } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import type { Mission, MissionType, UserBattlePlan, BattlePlan, BibleBook } from "@/lib/types";
import Image from "next/image";
import { Skeleton } from "../ui/skeleton";
import axios from 'axios';

const missionSchema = z.object({
  id: z.string().default(() => uuidv4()),
  day: z.number(),
  title: z.string().min(3, "O título da missão é muito curto."),
  type: z.enum(["BIBLE_READING", "PRAYER_SANCTUARY", "FEELING_JOURNEY", "CONFESSION", "JOURNAL_ENTRY", "FAITH_CONFESSION"]),
  content: z.object({
    path: z.string(),
    completionQueryParam: z.string().optional(),
    verse: z.string().optional(),
    details: z.any().optional(),
  }),
  leaderNote: z.string().optional(),
});

const planSchema = z.object({
  title: z.string().min(5, "O título deve ter pelo menos 5 caracteres.").max(100),
  description: z.string().min(10, "A descrição deve ter pelo menos 10 caracteres.").max(500),
  durationDays: z.number().min(1, "O plano deve durar pelo menos 1 dia.").max(90, "O plano não pode exceder 90 dias."),
  coverImageUrl: z.string().url("URL da imagem de capa inválida."),
  missions: z.array(missionSchema),
});

type PlanFormValues = z.infer<typeof planSchema>;

const MissionTypeDetails: Record<MissionType, { icon: React.ElementType, label: string, path: string, completionQueryParam?: string, requiresVerse?: boolean }> = {
    BIBLE_READING: { icon: BookOpen, label: "Leitura Bíblica", path: '/bible', requiresVerse: true, completionQueryParam: 'userPlanId' },
    PRAYER_SANCTUARY: { icon: HeartHandshake, label: "Santuário de Oração", path: '/prayer-sanctuary', completionQueryParam: 'missionId' },
    FEELING_JOURNEY: { icon: Smile, label: "Jornada de Sentimentos", path: '/feeling-journey', completionQueryParam: 'missionId' },
    CONFESSION: { icon: LockKeyhole, label: "Confessionário", path: '/confession', completionQueryParam: 'mission' },
    JOURNAL_ENTRY: { icon: NotebookText, label: "Anotação no Diário", path: '/journal', completionQueryParam: 'mission' },
    FAITH_CONFESSION: { icon: HandHeart, label: "Confissão de Fé", path: '/faith-confession', completionQueryParam: 'userPlanId' },
};

function BibleVerseSelector({ fieldIndex, control, setValue }: { fieldIndex: number, control: any, setValue: any }) {
    const [books, setBooks] = useState<BibleBook[]>([]);
    
    const details = useWatch({
        control,
        name: `missions.${fieldIndex}.content.details`
    });

    const selectedBook: BibleBook | undefined = details?.book;
    
    useEffect(() => {
        const fetchBooks = async () => {
            try {
                const response = await axios.get('/api/bible/books');
                setBooks(response.data);
            } catch (error) {
                console.error("Failed to fetch Bible books", error);
            }
        };
        fetchBooks();
    }, []);

    useEffect(() => {
        if (!details) return;

        const { book, chapter, startVerse, endVerse } = details;
        if (!book || !chapter) {
            setValue(`missions.${fieldIndex}.content.verse`, '');
            return;
        }

        let reference = `${book.name} ${chapter}`;
        if (startVerse) {
            reference += `:${startVerse}`;
            if (endVerse) {
                reference += `-${endVerse}`;
            }
        }
        setValue(`missions.${fieldIndex}.content.verse`, reference);

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
                        <Select onValueChange={field.onChange} value={field.value}>
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
                       <Input type="number" placeholder="Início" {...field} />
                    )}
                />
                <Controller
                    control={control}
                    name={`missions.${fieldIndex}.content.details.endVerse`}
                    render={({ field }) => (
                       <Input type="number" placeholder="Fim" {...field} />
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
        append({
            id: uuidv4(),
            day: day,
            title: `Missão para o Dia ${day}`,
            type: defaultType,
            content: { 
                path: MissionTypeDetails[defaultType].path, 
                verse: "",
                completionQueryParam: MissionTypeDetails[defaultType].completionQueryParam,
                details: {},
            },
            leaderNote: ""
        });
    };

    const handleTypeChange = (newType: MissionType, fieldIndex: number) => {
        const details = MissionTypeDetails[newType];
        setValue(`missions.${fieldIndex}.type`, newType);
        setValue(`missions.${fieldIndex}.content.path`, details.path);
        
        const completionParam = details.completionQueryParam;
        if (completionParam) {
            setValue(`missions.${fieldIndex}.content.completionQueryParam`, completionParam);
        } else {
             setValue(`missions.${fieldIndex}.content.completionQueryParam`, undefined);
        }

        if(!details.requiresVerse) {
            setValue(`missions.${fieldIndex}.content.verse`, '');
        }
    }
    
    return (
        <div className="space-y-4 rounded-lg bg-muted/50 p-4 border">
            <h3 className="font-semibold text-lg">Dia {day}</h3>
            {dayMissionIndices.map((fieldIndex) => {
                const missionType = missions[fieldIndex]?.type;
                const requiresVerse = MissionTypeDetails[missionType]?.requiresVerse;
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
                            
                             {requiresVerse && (
                                <BibleVerseSelector
                                    fieldIndex={fieldIndex}
                                    setValue={setValue}
                                    control={control}
                                />
                            )}
                            
                             <Label>Nota do Líder (Opcional)</Label>
                             <Controller
                                control={control}
                                name={`missions.${fieldIndex}.leaderNote`}
                                render={({ field }) => <Textarea {...field} placeholder="Um insight ou direção para esta missão..." />}
                            />
                        </CardContent>
                    </Card>
                )
            })}
             <Button variant="outline" className="w-full" onClick={addMission}><Plus className="h-4 w-4 mr-2"/>Adicionar Missão</Button>
        </div>
    )
}

const steps = [
  { id: "details", name: "Detalhes" },
  { id: "missions", name: "Missões" },
  { id: "review", name: "Revisão" },
];

export function CreateBattlePlanWizard({ planId }: { planId?: string }) {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(!!planId);
  const isEditing = !!planId;

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

  const goToNextStep = async () => {
    let fieldsToValidate: (keyof PlanFormValues)[] = [];
    if(currentStep === 0) fieldsToValidate = ['title', 'description', 'durationDays', 'coverImageUrl'];

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
        if(currentStep === 0) { 
            const currentMissions = getValues('missions');
            if(currentMissions.length !== duration) {
                const newMissions: Mission[] = Array.from({ length: duration }, (_, i) => {
                    const defaultType: MissionType = 'BIBLE_READING';
                    return {
                        id: uuidv4(),
                        day: i + 1,
                        title: `Missão do Dia ${i+1}`,
                        type: defaultType,
                        content: { 
                            path: MissionTypeDetails[defaultType].path, 
                            verse: "",
                            completionQueryParam: MissionTypeDetails[defaultType].completionQueryParam,
                            details: {}
                        },
                        leaderNote: ""
                    }
                });
                 setValue('missions', newMissions);
            }
        }
        setCurrentStep((prev) => prev + 1);
    }
  };

  const goToPreviousStep = () => {
    setCurrentStep((prev) => prev - 1);
  };
  
  const handleSavePlan = async (status: 'DRAFT' | 'PUBLISHED') => {
      if(!user || !userProfile) return;
      setIsSaving(true);
      
      const values = getValues();

      try {
        if (isEditing) {
            const planRef = doc(db, 'battlePlans', planId);
            await updateDoc(planRef, {
                ...values,
                status,
                updatedAt: serverTimestamp(),
            });
        } else {
            const planDocId = uuidv4();
            const planData = {
                ...values,
                id: planDocId,
                creatorId: user.uid,
                creatorName: userProfile.displayName || 'Anônimo',
                status,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };
            const userPlanData: UserBattlePlan = {
                id: planDocId,
                userId: user.uid,
                planId: planDocId,
                planTitle: values.title,
                planCoverImageUrl: values.coverImageUrl,
                planCreatorId: user.uid,
                startDate: new Date() as any,
                status: 'IN_PROGRESS',
                progressPercentage: 0,
                consentToShareProgress: true,
                completedMissionIds: [],
            };
            const batch = writeBatch(db);
            const planRef = doc(db, "battlePlans", planDocId);
            batch.set(planRef, planData);
            const userPlanRef = doc(db, `users/${user.uid}/battlePlans`, planDocId);
            batch.set(userPlanRef, userPlanData);
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

  if (isLoading) {
      return (
          <div className="container mx-auto max-w-4xl py-8 px-4 space-y-4">
              <Skeleton className="h-9 w-48 mb-8" />
              <Skeleton className="h-10 w-full mb-8" />
              <Card><CardContent className="p-6 space-y-4"><Skeleton className="h-8 w-1/4"/><Skeleton className="h-10 w-full"/><Skeleton className="h-10 w-full"/></CardContent></Card>
          </div>
      )
  }


  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{isEditing ? 'Editar Plano de Batalha' : 'Criar Plano de Batalha'}</h1>
        </div>
      </div>
      
      {/* Stepper */}
      <div className="mb-8 flex items-center justify-center">
        {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
                 <div className="flex flex-col items-center">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${index <= currentStep ? 'bg-primary text-primary-foreground' : 'bg-muted border'}`}>
                        {index < currentStep ? <Check/> : index + 1}
                    </div>
                    <p className={`mt-1 text-xs ${index <= currentStep ? 'font-semibold' : ''}`}>{step.name}</p>
                 </div>
                {index < steps.length - 1 && (
                    <div className={`h-0.5 w-16 mx-2 ${index < currentStep ? 'bg-primary' : 'bg-muted'}`} />
                )}
            </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
        >
          {currentStep === 0 && (
            <Card>
                <CardHeader><CardTitle>1. Detalhes do Plano</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                     <Controller
                        control={control} name="title"
                        render={({ field, fieldState }) => (
                            <div>
                                <Label htmlFor="title">Título do Plano</Label>
                                <Input id="title" {...field} />
                                {fieldState.error && <p className="text-destructive text-sm mt-1">{fieldState.error.message}</p>}
                            </div>
                        )}
                    />
                     <Controller
                        control={control} name="description"
                        render={({ field, fieldState }) => (
                            <div>
                                <Label htmlFor="description">Descrição</Label>
                                <Textarea id="description" {...field} />
                                {fieldState.error && <p className="text-destructive text-sm mt-1">{fieldState.error.message}</p>}
                            </div>
                        )}
                    />
                    <Controller
                        control={control} name="durationDays"
                        render={({ field, fieldState }) => (
                            <div>
                                <Label htmlFor="durationDays">Duração (dias)</Label>
                                <Input id="durationDays" type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10))} />
                                {fieldState.error && <p className="text-destructive text-sm mt-1">{fieldState.error.message}</p>}
                            </div>
                        )}
                    />
                    <Controller
                        control={control} name="coverImageUrl"
                        render={({ field, fieldState }) => (
                            <div>
                                <Label htmlFor="coverImageUrl">URL da Imagem de Capa</Label>
                                <Input id="coverImageUrl" {...field} />
                                {fieldState.error && <p className="text-destructive text-sm mt-1">{fieldState.error.message}</p>}
                            </div>
                        )}
                    />
                </CardContent>
            </Card>
          )}

          {currentStep === 1 && (
              <div className="space-y-4">
                  {Array.from({ length: duration }, (_, i) => (
                      <MissionEditor key={i} control={control} day={i + 1} setValue={setValue} watch={watch} />
                  ))}
              </div>
          )}

          {currentStep === 2 && (
             <Card>
                <CardHeader>
                    <CardTitle>3. Revisão e Finalização</CardTitle>
                    <CardDescription>Confira se todas as informações estão corretas antes de finalizar.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden">
                        <Image src={getValues('coverImageUrl')} alt={getValues('title')} fill className="object-cover" />
                    </div>
                    <h2 className="text-2xl font-bold">{getValues('title')}</h2>
                    <p className="text-muted-foreground">{getValues('description')}</p>
                    <p className="font-semibold">{getValues('durationDays')} dias de treinamento.</p>
                     <Button onClick={() => handleSavePlan('DRAFT')} variant="secondary" disabled={isSaving}>
                        {isSaving ? <Loader2 className="animate-spin mr-2"/> : null} Salvar como Rascunho
                    </Button>
                    <Button onClick={() => handleSavePlan('PUBLISHED')} disabled={isSaving}>
                         {isSaving ? <Loader2 className="animate-spin mr-2"/> : null} Publicar Plano
                    </Button>
                </CardContent>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>
      
      {/* Navigation */}
      <div className="mt-8 flex justify-between">
            <Button variant="outline" onClick={goToPreviousStep} disabled={currentStep === 0}>
                <ArrowLeft className="h-4 w-4 mr-2"/> Voltar
            </Button>
            <Button onClick={goToNextStep} disabled={currentStep === steps.length - 1}>
                Avançar <ArrowRight className="h-4 w-4 ml-2"/>
            </Button>
        </div>

    </div>
  );
}
