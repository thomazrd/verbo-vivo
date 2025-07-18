
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
} from "@/components/ui/alert-dialog"
import { Button } from '@/components/ui/button';
import { MoreVertical, Shield, BookCopy, Trash2, Pencil, Swords } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface ArmorCardProps {
  armor: Armor;
}

export function ArmorCard({ armor }: ArmorCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleEdit = () => {
    router.push(`/armor/forge/${armor.id}`);
  };

  const handleDelete = async () => {
    if (!user) return;
    try {
        await deleteDoc(doc(db, `users/${user.uid}/armors`, armor.id));
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
                <AlertDialog>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={handleEdit}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem disabled>
                                <BookCopy className="mr-2 h-4 w-4" />
                                Duplicar
                            </DropdownMenuItem>
                            <AlertDialogTrigger asChild>
                                <DropdownMenuItem className="text-destructive focus:text-destructive">
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
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                                Desmontar
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </CardHeader>
        <CardFooter className="flex justify-between items-center bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">{armor.weapons.length} arma(s)</p>
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
