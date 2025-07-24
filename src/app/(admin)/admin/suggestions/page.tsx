
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, addDoc, serverTimestamp } from "firebase/firestore";
import type { Suggestion, Study } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Lightbulb, Archive, Sparkles, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

function SuggestionCard({ suggestion }: { suggestion: Suggestion }) {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAction = async (action: "archive" | "draft") => {
    setIsProcessing(true);
    const suggestionRef = doc(db, "suggestions", suggestion.id);
    
    try {
      if (action === "archive") {
        await updateDoc(suggestionRef, { status: "ARCHIVED" });
        toast({ title: "Sugestão arquivada." });
      } else if (action === "draft" && user) {
        const newStudyRef = await addDoc(collection(db, "studies"), {
          title: suggestion.text,
          content: "",
          audioUrl: "",
          thumbnailUrl: null,
          authorId: user.uid,
          authorName: user.displayName || "Comandante",
          status: "DRAFT",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          publishedAt: null,
          practicalChallenge: "",
          tags: [],
        });
        await updateDoc(suggestionRef, { status: "ACTIONED" });
        toast({ title: "Rascunho criado!", description: "Você foi redirecionado para o editor." });
        router.push(`/admin/studies/edit/${newStudyRef.id}`);
      }
    } catch (error) {
      console.error(`Error performing action ${action}:`, error);
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível completar a ação." });
      setIsProcessing(false);
    }
    // No need to set isProcessing to false on success for draft, as it navigates away
  };

  const timeAgo = suggestion.submittedAt
    ? formatDistanceToNow(suggestion.submittedAt.toDate(), { addSuffix: true, locale: ptBR })
    : "";

  return (
    <Card>
      <CardHeader>
        <CardDescription>Enviado {timeAgo}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-lg font-medium text-foreground">"{suggestion.text}"</p>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        {isProcessing && <Loader2 className="h-5 w-5 animate-spin" />}
        {!isProcessing && (
          <>
            <Button variant="ghost" size="sm" onClick={() => handleAction("archive")}>
              <Archive className="mr-2 h-4 w-4" /> Arquivar
            </Button>
            <Button size="sm" onClick={() => handleAction("draft")}>
              <Sparkles className="mr-2 h-4 w-4" /> Transformar em Rascunho
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}

export default function SuggestionsPage() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "suggestions"),
      where("status", "==", "NEW"),
      orderBy("submittedAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newSuggestions: Suggestion[] = [];
      snapshot.forEach(doc => {
        newSuggestions.push({ id: doc.id, ...doc.data() } as Suggestion);
      });
      setSuggestions(newSuggestions);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching suggestions:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      <h1 className="text-3xl font-bold">Sugestões dos Usuários</h1>
      <Card>
        <CardHeader>
          <CardTitle>Voz da Comunidade</CardTitle>
          <CardDescription>Analise e transforme as sugestões da comunidade em novos estudos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-36 w-full" />)
          ) : suggestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center">
              <Lightbulb className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">Caixa de Sugestões Vazia</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Novas sugestões dos usuários aparecerão aqui.
              </p>
            </div>
          ) : (
            suggestions.map(s => <SuggestionCard key={s.id} suggestion={s} />)
          )}
        </CardContent>
      </Card>
    </div>
  );
}
