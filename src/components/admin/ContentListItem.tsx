
"use client";

import type { Content } from "@/lib/types";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { db } from "@/lib/firebase";
import { doc, deleteDoc } from "firebase/firestore";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
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
} from "@/components/ui/alert-dialog";
import { Edit, Trash2, FileText, Video, Newspaper, Image as ImageIcon } from "lucide-react";

interface ContentListItemProps {
  content: Content;
}

const contentTypeIcons = {
    MARKDOWN: FileText,
    VIDEO_URL: Video,
    ARTICLE_URL: Newspaper,
    IMAGE_URL: ImageIcon
};

const DEFAULT_THUMBNAIL = "https://dynamic.tiggomark.com.br/images/deep_dive.jpg";

export function ContentListItem({ content }: ContentListItemProps) {
  const router = useRouter();
  const { toast } = useToast();

  const handleDelete = async () => {
    try {
      await deleteDoc(doc(db, "content", content.id));
      toast({
        title: "Conteúdo Excluído",
        description: `O conteúdo "${content.title}" foi removido com sucesso.`,
      });
    } catch (error) {
      console.error("Error deleting content:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível excluir o conteúdo.",
      });
    }
  };

  const timeAgo = content.updatedAt
    ? formatDistanceToNow(content.updatedAt.toDate(), { addSuffix: true, locale: ptBR })
    : "data desconhecida";

  const imageUrl = content.thumbnailUrl || DEFAULT_THUMBNAIL;
  const TypeIcon = contentTypeIcons[content.contentType] || FileText;

  return (
    <Card className="flex items-center p-4 gap-4 hover:bg-muted/50 transition-colors">
      <div className="relative w-24 h-24 sm:w-32 sm:h-20 shrink-0 bg-muted rounded-md overflow-hidden">
        <Image
          src={imageUrl}
          alt={content.title}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 96px, 128px"
        />
        <div className="absolute top-1 left-1 bg-black/50 text-white rounded-full p-1">
           <TypeIcon className="h-3 w-3" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {content.status === "PUBLISHED" ? (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Publicado
            </Badge>
          ) : (
            <Badge variant="outline">Rascunho</Badge>
          )}
        </div>
        <h3 className="font-semibold text-lg truncate">{content.title}</h3>
        <p className="text-sm text-muted-foreground">Atualizado {timeAgo}</p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push(`/admin/content/edit/${content.id}`)}
        >
          <Edit className="h-4 w-4" />
          <span className="sr-only">Editar</span>
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="icon">
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Excluir</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. Isso excluirá permanentemente o conteúdo
                "{content.title}".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive hover:bg-destructive/90"
                onClick={handleDelete}
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Card>
  );
}
