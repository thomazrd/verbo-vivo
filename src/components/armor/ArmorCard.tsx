
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
import { Button } from '@/components/ui/button';
import { MoreVertical, Shield, BookCopy, Trash2, Pencil, Swords, Star } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, deleteDoc, updateDoc, arrayUnion, arrayRemove, writeBatch } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

interface ArmorCardProps {
  armor: Armor;
  isFavorited: boolean;
}

export function ArmorCard({ armor, isFavorited }: ArmorCardProps) {
  const router = useRouter();
  const { user, userProfile } = useAuth();
  const { toast } = useToast();

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
        const sharedArmorRef = doc(db, 'sharedArmors', armor.id);

        batch.delete(userArmorRef);
        batch.delete(sharedArmorRef); // Attempt to delete from shared as well

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

  const isOwner = user?.uid === armor.userId;
  const authorInitial = armor.authorName?.[0]?.toUpperCase() || '?';

  return (
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
                {isOwner && (
                    <AlertDialog>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                <DropdownMenuItem onClick={handleEdit}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem disabled>
                                    <BookCopy className="mr-2 h-4 w-4" />
                                    Duplicar
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
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleToggleFavorite}>
                <Star className={cn("h-5 w-5 text-muted-foreground transition-colors", isFavorited && "fill-yellow-400 text-yellow-400")} />
            </Button>
            <Button asChild>
                <Link href={`/armor/battle/${armor.id}`}>
                    <Swords className="mr-2 h-4 w-4" />
                    Modo Batalha
                </Link>
            </Button>
        </CardFooter>
    </Card>
  );
}
