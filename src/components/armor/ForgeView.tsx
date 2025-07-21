
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { doc, getDoc, addDoc, updateDoc, collection, serverTimestamp, setDoc, writeBatch } from "firebase/firestore";
import type { Armor, ArmorWeapon } from "@/lib/types";
import { getBibleWeaponSuggestion } from "@/ai/flows/armor-suggestion-flow";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Plus, GripVertical, Trash2, Wand2, BookOpen, Share2 } from "lucide-react";
import { Skeleton } from "../ui/skeleton";
import { Checkbox } from "../ui/checkbox";
import { Separator } from "../ui/separator";

const armorFormSchema = z.object({
  name: z.string().min(3, { message: "O nome deve ter pelo menos 3 caracteres." }).max(50),
  description: z.string().max(200, "A descrição não pode ter mais de 200 caracteres.").optional(),
  isShared: z.boolean().default(false),
});

type ArmorFormValues = z.infer<typeof armorFormSchema>;

function SortableWeaponItem({ weapon, onRemove }: { weapon: ArmorWeapon; onRemove: (id: string) => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({id: weapon.id});

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };
    
    return (
        <div ref={setNodeRef} style={style} className="flex items-center gap-2 bg-card p-3 border rounded-lg shadow-sm">
             <Button variant="ghost" size="icon" className="cursor-grab h-10 w-10" {...attributes} {...listeners}>
                <GripVertical className="h-5 w-5 text-muted-foreground" />
             </Button>
            <div className="flex-1">
                <p className="font-semibold text-primary">{weapon.verseReference}</p>
                <p className="text-sm text-muted-foreground line-clamp-2">{weapon.verseText}</p>
            </div>
            <Button variant="ghost" size="icon" className="h-10 w-10 text-destructive" onClick={() => onRemove(weapon.id)}>
                <Trash2 className="h-5 w-5" />
            </Button>
        </div>
    );
}

function AddWeaponModal({ onAddWeapon }: { onAddWeapon: (weapon: Omit<ArmorWeapon, 'id' | 'bibleVersion'> & { bibleVersion?: string }) => void }) {
    const [battle, setBattle] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<Omit<ArmorWeapon, 'id'>[]>([]);
    
    // State for manual entry
    const [manualReference, setManualReference] = useState('');
    const [manualText, setManualText] = useState('');
    const [manualVersion, setManualVersion] = useState('NVI');
    
    const { toast } = useToast();

    const handleGenerateSuggestions = async () => {
        if (!battle.trim()) {
            toast({ variant: 'destructive', title: 'Campo obrigatório', description: 'Descreva a batalha para obter sugestões.'});
            return;
        }
        setIsLoading(true);
        setSuggestions([]);
        try {
            const result = await getBibleWeaponSuggestion({ battle });
            setSuggestions(result.weapons);
        } catch(e) {
            console.error(e);
            toast({ variant: 'destructive', title: 'Erro de IA', description: 'Não foi possível buscar sugestões.'});
        } finally {
            setIsLoading(false);
        }
    }

    const handleAddSuggestion = (weapon: Omit<ArmorWeapon, 'id'>) => {
        onAddWeapon(weapon);
        toast({ title: 'Arma adicionada!', description: `${weapon.verseReference} foi adicionada à sua armadura.`});
        setSuggestions(current => current.filter(s => s.verseReference !== weapon.verseReference));
    }

    const handleAddManual = () => {
        if (!manualReference.trim() || !manualText.trim() || !manualVersion.trim()) {
            toast({ variant: 'destructive', title: 'Campos obrigatórios', description: 'Preencha todos os campos para adicionar a arma manualmente.'});
            return;
        }
        const newWeapon = {
            verseReference: manualReference,
            verseText: manualText,
            bibleVersion: manualVersion
        };
        onAddWeapon(newWeapon);
        toast({ title: 'Arma adicionada!', description: `${newWeapon.verseReference} foi adicionada à sua armadura.`});
        setManualReference('');
        setManualText('');
    }

    return (
        <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
                <DialogTitle>Adicionar Arma</DialogTitle>
                <DialogDescription>
                   Adicione um versículo à sua armadura usando a sugestão da IA ou inserindo manualmente.
                </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                {/* AI Suggestion Section */}
                <div className="space-y-4">
                    <div className="text-center">
                        <h3 className="font-semibold text-foreground">Sugestão da IA</h3>
                        <p className="text-xs text-muted-foreground">Descreva uma batalha e receba versículos.</p>
                    </div>
                    <div className="space-y-2">
                        <FormLabel>Qual batalha esta arma irá combater?</FormLabel>
                        <div className="flex gap-2">
                            <Input 
                                value={battle}
                                onChange={(e) => setBattle(e.target.value)}
                                placeholder="Ex: Insegurança, impaciência..."
                            />
                            <Button onClick={handleGenerateSuggestions} disabled={isLoading}>
                                {isLoading ? <Loader2 className="animate-spin" /> : <Wand2 />}
                            </Button>
                        </div>
                    </div>
                    {suggestions.length > 0 && (
                        <div className="space-y-3 pt-2">
                            {suggestions.map(s => (
                                <div key={s.verseReference} className="flex items-center gap-3 p-3 border rounded-md bg-muted/50">
                                    <div className="flex-1">
                                        <p className="font-semibold text-sm">{s.verseReference}</p>
                                        <p className="text-sm text-muted-foreground">{s.verseText}</p>
                                    </div>
                                    <Button size="sm" onClick={() => handleAddSuggestion(s)}>
                                        <Plus className="h-4 w-4"/>
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Manual Entry Section */}
                <div className="space-y-4">
                     <div className="text-center">
                        <h3 className="font-semibold text-foreground">Adicionar Manualmente</h3>
                        <p className="text-xs text-muted-foreground">Insira um versículo de sua escolha.</p>
                    </div>
                    <div className="space-y-2">
                        <FormLabel>Referência</FormLabel>
                        <Input value={manualReference} onChange={(e) => setManualReference(e.target.value)} placeholder="Ex: João 3:16" />
                    </div>
                     <div className="space-y-2">
                        <FormLabel>Texto do Versículo</FormLabel>
                        <Textarea value={manualText} onChange={(e) => setManualText(e.target.value)} placeholder="Porque Deus amou o mundo..." />
                    </div>
                     <div className="space-y-2">
                        <FormLabel>Versão da Bíblia</FormLabel>
                        <Input value={manualVersion} onChange={(e) => setManualVersion(e.target.value)} placeholder="Ex: NVI" />
                    </div>
                    <Button className="w-full" onClick={handleAddManual}>
                         <Plus className="h-4 w-4 mr-2"/>
                        Adicionar Arma
                    </Button>
                </div>
            </div>
            <DialogFooter className="mt-4">
                <DialogTrigger asChild><Button variant="outline">Fechar</Button></DialogTrigger>
            </DialogFooter>
        </DialogContent>
    );
}


export function ForgeView({ armorId }: { armorId?: string }) {
    const { user, userProfile } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(!!armorId);
    const [isSaving, setIsSaving] = useState(false);
    const [weapons, setWeapons] = useState<ArmorWeapon[]>([]);
    
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const form = useForm<ArmorFormValues>({
        resolver: zodResolver(armorFormSchema),
        defaultValues: { name: "", description: "", isShared: false },
    });

    useEffect(() => {
        if (armorId && user) {
            const fetchArmor = async () => {
                const docRef = doc(db, `users/${user.uid}/armors`, armorId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data() as Armor;
                    form.reset({ name: data.name, description: data.description, isShared: data.isShared });
                    setWeapons(data.weapons || []);
                } else {
                    toast({ variant: 'destructive', title: 'Erro', description: 'Armadura não encontrada.' });
                    router.push('/armor');
                }
                setIsLoading(false);
            };
            fetchArmor();
        }
    }, [armorId, user, form, router, toast]);

    const handleDragEnd = (event: DragEndEvent) => {
        const {active, over} = event;
        if (over && active.id !== over.id) {
            setWeapons((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    }
    
    const addWeapon = (weapon: Omit<ArmorWeapon, 'id' | 'bibleVersion'> & { bibleVersion?: string }) => {
        setWeapons(current => [...current, { ...weapon, id: uuidv4(), bibleVersion: weapon.bibleVersion || 'NVI' }]);
    }

    const removeWeapon = (id: string) => {
        setWeapons(current => current.filter(w => w.id !== id));
    }

    const onSubmit = async (values: ArmorFormValues) => {
        if (!user || !userProfile) return;
        setIsSaving(true);
        const armorData = {
            ...values,
            userId: user.uid,
            authorName: userProfile.displayName || null,
            authorPhotoURL: userProfile.photoURL || null,
            weapons,
            updatedAt: serverTimestamp(),
        };

        try {
            if (armorId) {
                // Editing an existing armor
                const batch = writeBatch(db);
                const userArmorRef = doc(db, `users/${user.uid}/armors`, armorId);
                const sharedArmorRef = doc(db, 'sharedArmors', armorId);

                batch.update(userArmorRef, armorData);

                if (values.isShared) {
                    batch.set(sharedArmorRef, armorData); // Use set to create or overwrite
                } else {
                    // Check if doc exists before trying to delete
                    const sharedDoc = await getDoc(sharedArmorRef);
                    if (sharedDoc.exists()) {
                       batch.delete(sharedArmorRef);
                    }
                }
                await batch.commit();
            } else {
                // Creating a new armor
                const userArmorRef = await addDoc(collection(db, `users/${user.uid}/armors`), {
                    ...armorData,
                    createdAt: serverTimestamp(),
                });

                if (values.isShared) {
                    // Create the shared version with the same ID
                    const sharedArmorRef = doc(db, 'sharedArmors', userArmorRef.id);
                    await setDoc(sharedArmorRef, {
                        ...armorData,
                        createdAt: serverTimestamp()
                    });
                }
            }
            toast({ title: 'Armadura salva!', description: 'Seu arsenal foi atualizado.'});
            router.push('/armor');
        } catch (error) {
            console.error("Error saving armor: ", error);
            toast({ variant: 'destructive', title: 'Erro ao salvar', description: 'Não foi possível salvar a armadura.'});
        } finally {
            setIsSaving(false);
        }
    }

    if (isLoading) {
        return (
            <div className="container mx-auto max-w-4xl py-8 px-4 space-y-4">
                <Skeleton className="h-9 w-48 mb-8" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-32 w-full" />
            </div>
        )
    }

    return (
        <div className="container mx-auto max-w-4xl py-8 px-4">
            <div className="flex items-center gap-4 mb-8">
                <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => router.push('/armor')}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{armorId ? 'Editar Armadura' : 'Forjar Nova Armadura'}</h1>
                    <p className="text-muted-foreground">{armorId ? "Ajuste suas armas para a batalha." : "Prepare suas defesas espirituais."}</p>
                </div>
            </div>
            
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Missão</CardTitle>
                            <CardDescription>Defina o nome e o propósito desta armadura.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nome da Armadura</FormLabel>
                                        <FormControl><Input placeholder="Ex: Armadura contra o Medo" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Descrição (Opcional)</FormLabel>
                                        <FormControl><Textarea placeholder="Ex: Para momentos de aflição e preocupação..." {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Armas Espirituais</CardTitle>
                            <CardDescription>Adicione e organize os versículos que irão compor sua armadura. Arraste para reordenar.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                <SortableContext items={weapons} strategy={verticalListSortingStrategy}>
                                    <div className="space-y-3">
                                        {weapons.map(weapon => (
                                            <SortableWeaponItem key={weapon.id} weapon={weapon} onRemove={removeWeapon} />
                                        ))}
                                    </div>
                                </SortableContext>
                            </DndContext>
                             {weapons.length === 0 && (
                                <div className="text-center py-8 border-2 border-dashed rounded-lg">
                                    <BookOpen className="mx-auto h-10 w-10 text-muted-foreground" />
                                    <p className="mt-4 text-sm font-semibold text-muted-foreground">Nenhuma arma adicionada.</p>
                                </div>
                            )}
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button type="button" variant="outline" className="w-full mt-4">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Adicionar Arma
                                    </Button>
                                </DialogTrigger>
                                <AddWeaponModal onAddWeapon={addWeapon}/>
                            </Dialog>
                        </CardContent>
                    </Card>
                    
                     <Card>
                        <CardHeader>
                            <CardTitle>Visibilidade</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <FormField
                                control={form.control}
                                name="isShared"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base flex items-center gap-2">
                                            <Share2 className="h-4 w-4" />
                                            Compartilhar com a Comunidade
                                        </FormLabel>
                                        <FormDescription>
                                            Permita que outros usuários vejam e usem esta armadura.
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button type="submit" size="lg" disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {armorId ? 'Salvar Alterações' : 'Forjar Armadura'}
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}
