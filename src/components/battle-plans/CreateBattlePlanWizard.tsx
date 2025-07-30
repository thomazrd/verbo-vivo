
"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { v4 as uuidv4 } from 'uuid';
import { db, storage } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { AnimatePresence, motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Loader2, Plus, Trash2, Check, BookOpen, MessageSquare, Brain, Smile, LockKeyhole, HeartHandshake } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import type { Mission, MissionType } from "@/lib/types";
import Image from "next/image";

const missionSchema = z.object({
  id: z.string().default(() => uuidv4()),
  day: z.number(),
  title: z.string().min(3, "O título da missão é muito curto."),
  type: z.enum(["BIBLE_READING", "PRAYER_SANCTUARY", "FEELING_JOURNEY", "CONFESSION"]),
  content: z.object({
    path: z.string(),
    completionQueryParam: z.string().optional(),
    verse: z.string().optional(),
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
    BIBLE_READING: { icon: BookOpen, label: "Leitura Bíblica", path: '/bible', requiresVerse: true },
    PRAYER_SANCTUARY: { icon: HeartHandshake, label: "Santuário de Oração", path: '/prayer-sanctuary', completionQueryParam: 'completed' },
    FEELING_JOURNEY: { icon: Smile, label: "Jornada de Sentimentos", path: '/feeling-journey', completionQueryParam: 'completed' },
    CONFESSION: { icon: LockKeyhole, label: "Confessionário", path: '/confession', completionQueryParam: 'completed' },
};


function MissionEditor({ control, day, getValues, setValue }: { control: any, day: number, getValues: any, setValue: any }) {
    const { fields, append, remove } = useFieldArray({
        control,
        name: `missions`
    });

    const dayMissions = fields.filter(field => (field as any).day === day);
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
                verse: "Filipenses 4:13",
                completionQueryParam: MissionTypeDetails[defaultType].completionQueryParam,
            },
            leaderNote: ""
        });
    };

    const handleTypeChange = (newType: MissionType, fieldIndex: number) => {
        const details = MissionTypeDetails[newType];
        setValue(`missions.${fieldIndex}.type`, newType);
        setValue(`missions.${fieldIndex}.content.path`, details.path);
        setValue(`missions.${fieldIndex}.content.completionQueryParam`, details.completionQueryParam);
        if(!details.requiresVerse) {
            setValue(`missions.${fieldIndex}.content.verse`, '');
        }
    }
    
    return (
        <div className="space-y-4 rounded-lg bg-muted/50 p-4 border">
            <h3 className="font-semibold text-lg">Dia {day}</h3>
            {dayMissionIndices.map((fieldIndex, index) => {
                const mission = getValues().missions[fieldIndex];
                const currentMissionType = getValues().missions[fieldIndex].type;
                const requiresVerse = MissionTypeDetails[currentMissionType]?.requiresVerse;

                return (
                    <Card key={mission.id}>
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
                                    <Select onValueChange={(value) => handleTypeChange(value as MissionType, fieldIndex)} defaultValue={field.value}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(MissionTypeDetails).map(([key, value]) => (
                                                <SelectItem key={key} value={key}>{value.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            
                            {requiresVerse && (
                                <div>
                                    <Label>Referência Bíblica</Label>
                                    <Controller
                                        control={control}
                                        name={`missions.${fieldIndex}.content.verse`}
                                        render={({ field }) => (
                                            <Input {...field} placeholder="Ex: Filipenses 4:13" />
                                        )}
                                    />
                                </div>
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

export function CreateBattlePlanWizard() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

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

  const { control, trigger, getValues, watch, setValue } = form;
  const duration = watch('durationDays');

  const goToNextStep = async () => {
    let fieldsToValidate: (keyof PlanFormValues)[] = [];
    if(currentStep === 0) fieldsToValidate = ['title', 'description', 'durationDays', 'coverImageUrl'];

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
        if(currentStep === 0) { // After step 1, generate missions structure if not present
            const currentMissions = getValues('missions');
            if(currentMissions.length !== duration) {
                const defaultType: MissionType = 'BIBLE_READING';
                const newMissions: Mission[] = Array.from({ length: duration }, (_, i) => ({
                    id: uuidv4(),
                    day: i + 1,
                    title: `Missão do Dia ${i+1}`,
                    type: defaultType,
                    content: { 
                        path: MissionTypeDetails[defaultType].path,
                        verse: "",
                        completionQueryParam: MissionTypeDetails[defaultType].completionQueryParam,
                    },
                    leaderNote: ""
                }));
                 form.setValue('missions', newMissions);
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
      const planData = {
          ...values,
          creatorId: user.uid,
          creatorName: userProfile.displayName || 'Anônimo',
          status,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
      };
      
      try {
          await addDoc(collection(db, "battlePlans"), planData);
          toast({ title: "Sucesso!", description: `Seu plano de batalha foi salvo como ${status === 'DRAFT' ? 'rascunho' : 'publicado'}.`});
          router.push('/battle-plans');
      } catch (error) {
          console.error("Error saving plan:", error);
          toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível salvar seu plano.' });
      } finally {
          setIsSaving(false);
      }
  }


  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Criar Plano de Batalha</h1>
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
                      <MissionEditor key={i} control={control} day={i + 1} getValues={getValues} setValue={setValue} />
                  ))}
              </div>
          )}

          {currentStep === 2 && (
             <Card>
                <CardHeader>
                    <CardTitle>3. Revisão e Publicação</CardTitle>
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
