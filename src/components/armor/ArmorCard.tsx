
"use client";

import type { Armor } from '@/lib/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MoreVertical, Shield, Trash2, Pencil, Swords, Star, Plus, Check, Loader2, Eye } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, deleteDoc, updateDoc, arrayUnion, arrayRemove, writeBatch, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useState } from 'react';
import { ScrollArea } from '../ui/scroll-area';

interface ArmorCardProps {
  armor: Armor;
  isFavorited: boolean;
  isCommunityView?: boolean;
  isAlreadyAdded?: boolean;
}

export function ArmorCard({ armor, isFavorited, isCommunityView = false, isAlreadyAdded = false }: ArmorCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/armor/forge/${armor.id}`);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    try {
        const batch = writeBatch(db);
        const userArmorRef = doc(db, `users/${user.uid}/armors`, armor.id);
        
        // If the armor is shared, also delete from the shared collection
        if(armor.isShared) {
            const sharedArmorRef = doc(db, 'sharedArmors', armor.id);
            const sharedDoc = await getDoc(sharedArmorRef);
            if(sharedDoc.exists()) {
                batch.delete(sharedArmorRef);
            }
        }
        
        batch.delete(userArmorRef);

        await batch.commit();

        toast({
            title: "Armadura Desmontada",
            description: `A armadura "${armor.name}" foi removida.`,
        });
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Erro",
            description: "Não foi possível desmontar a armadura.",
        });
    }
  };
  
  const handleToggleFavorite = async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!user) return;
      const userRef = doc(db, 'users', user.uid);
      try {
          if (isFavorited) {
              await updateDoc(userRef, { favoriteArmorIds: arrayRemove(armor.id) });
          } else {
              await updateDoc(userRef, { favoriteArmorIds: arrayUnion(armor.id) });
          }
      } catch (error) {
           toast({
            variant: "destructive",
            title: "Erro",
            description: "Não foi possível favoritar a armadura.",
        });
      }
  }

  const handleAddCommunityArmor = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || isAlreadyAdded || isAdding) return;
    setIsAdding(true);

    try {
        const armorDataToAdd = {
            ...armor,
            originalArmorId: armor.id, // Keep track of the source
            userId: user.uid, // Set owner to current user
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            isShared: false, // Default to not shared
        };
        // Remove the ID from the data to be added, Firestore will generate a new one
        delete (armorDataToAdd as any).id;

        await addDoc(collection(db, `users/${user.uid}/armors`), armorDataToAdd);

        toast({
            title: "Armadura Adicionada!",
            description: `"${armor.name}" foi adicionada ao seu arsenal.`,
        });
    } catch(error) {
        console.error("Error adding community armor", error);
        toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível adicionar a armadura.'});
    } finally {
        setIsAdding(false);
    }
  }

  const isOwner = user?.uid === armor.userId;
  const authorInitial = armor.authorName?.[0]?.toUpperCase() || '?';

  return (
    <Dialog>
      <Card className="flex flex-col justify-between hover:shadow-md transition-shadow">
          <CardHeader>
              <div className="flex justify-between items-start gap-4">
                  <div className="flex items-center gap-4">
                      <Shield className="h-8 w-8 text-primary" />
                      <div>
                          <CardTitle className="text-lg">{armor.name}</CardTitle>
                          {armor.description && <CardDescription>{armor.description}</CardDescription>}
                      </div>
                  </div>
                  {isOwner && !isCommunityView && (
                      <AlertDialog>
                          <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()} data-testid={`more-button-${armor.id}`}>
                                      <MoreVertical className="h-4 w-4" />
                                  </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                  <DropdownMenuItem onClick={handleEdit}>
                                      <Pencil className="mr-2 h-4 w-4" />
                                      Editar
                                  </DropdownMenuItem>
                                  <AlertDialogTrigger asChild>
                                      <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={(e) => e.preventDefault()}>
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          Desmontar
                                      </DropdownMenuItem>
                                  </AlertDialogTrigger>
                              </DropdownMenuContent>
                          </DropdownMenu>
                           <AlertDialogContent>
                              <AlertDialogHeader>
                                  <AlertDialogTitle>Desmontar Armadura?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                      Esta ação é permanente e não pode ser desfeita. Você tem certeza que quer desmontar a armadura "{armor.name}"?
                                  </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                  <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                                      Desmontar
                                  </AlertDialogAction>
                              </AlertDialogFooter>
                          </AlertDialogContent>
                      </AlertDialog>
                  )}
              </div>
              
              {isCommunityView && armor.weapons.length > 0 && (
                <DialogTrigger asChild>
                    <button className="text-xs font-semibold text-primary hover:underline mt-2 text-left flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        Visualizar versículos ({armor.weapons.length})
                    </button>
                </DialogTrigger>
              )}

               {!isOwner && armor.authorName && (
                  <div className="flex items-center gap-2 pt-3 text-xs text-muted-foreground">
                      <Avatar className="h-5 w-5">
                          <AvatarImage src={armor.authorPhotoURL || ''} />
                          <AvatarFallback className="text-[10px]">{authorInitial}</AvatarFallback>
                      </Avatar>
                      <span>Forjada por {armor.authorName}</span>
                  </div>
              )}
          </CardHeader>
          <CardFooter className="flex justify-between items-center bg-muted/50 p-4">
              {isCommunityView ? (
                   <Button onClick={handleAddCommunityArmor} disabled={isAlreadyAdded || isAdding} className="w-full">
                      {isAdding ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : (isAlreadyAdded ? <Check className="mr-2 h-4 w-4"/> : <Plus className="mr-2 h-4 w-4"/>)}
                      {isAlreadyAdded ? 'Já Adicionada' : 'Adicionar às Minhas Armaduras'}
                  </Button>
              ) : (
                  <>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleToggleFavorite} data-testid={`favorite-button-${armor.id}`}>
                          <Star className={cn("h-5 w-5 text-muted-foreground transition-colors", isFavorited && "fill-yellow-400 text-yellow-400")} />
                      </Button>
                      <Button asChild>
                          <Link href={`/armor/battle/${armor.id}`}>
                              <Swords className="mr-2 h-4 w-4" />
                              Modo Batalha
                          </Link>
                      </Button>
                  </>
              )}
          </CardFooter>
      </Card>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
            <DialogTitle>{armor.name}</DialogTitle>
            <DialogDescription>
                Versículos desta armadura:
            </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4 -mr-4">
          <div className="space-y-3">
              {armor.weapons.map((weapon) => (
                  <div key={weapon.id} className="p-3 border rounded-md bg-muted/50">
                      <p className="font-semibold text-sm text-primary">{weapon.verseReference}</p>
                      <p className="text-sm text-muted-foreground mt-1">"{weapon.verseText}"</p>
                  </div>
              ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
