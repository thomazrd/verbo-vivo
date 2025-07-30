"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import type { JournalEntry } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { JournalEditor } from "@/components/journal/JournalEditor";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearchParams, useRouter } from "next/navigation";

export default function JournalPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  
  const [missionUserPlanId, setMissionUserPlanId] = useState<string | null>(null);

  useEffect(() => {
    const missionParam = searchParams.get('mission');
    const planIdParam = searchParams.get('userPlanId');
    if (missionParam === 'true' && planIdParam) {
      setMissionUserPlanId(planIdParam);
      handleNewEntry();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    };
    setIsLoading(true);
    const q = query(
      collection(db, "journals"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userEntries: JournalEntry[] = [];
      snapshot.forEach((doc) => {
        userEntries.push({ id: doc.id, ...doc.data() } as JournalEntry);
      });
      setEntries(userEntries);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching journal entries:", error);
      setIsLoading(false)
    });

    return () => unsubscribe();
  }, [user]);

  const handleNewEntry = () => {
    setSelectedEntry(null);
    setIsEditorOpen(true);
  };

  const handleEditEntry = (entry: JournalEntry) => {
    setSelectedEntry(entry);
    setMissionUserPlanId(null);
    setIsEditorOpen(true);
  };
  
  const handleEditorClose = (open: boolean, wasSaved = false) => {
    setIsEditorOpen(open);
    if (!open) {
      if (wasSaved && missionUserPlanId) {
        router.push(`/?missionCompleted=${missionUserPlanId}`);
      }
      setMissionUserPlanId(null);
    }
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case "Pedido":
        return "bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/20";
      case "Agradecimento":
        return "bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/20";
      case "Reflexão":
        return "bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <>
      <div className="container mx-auto max-w-4xl py-8 px-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Meu Diário</h1>
            <p className="mt-1 text-muted-foreground">
              Um espaço para suas orações, agradecimentos e reflexões.
            </p>
          </div>
          <Button onClick={handleNewEntry}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nova Entrada
          </Button>
        </div>

        <div className="mt-8 space-y-4">
          {isLoading ? (
            <>
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
            </>
          ) : entries.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-muted-foreground/30 rounded-lg">
              <p className="text-muted-foreground">Nenhuma entrada no diário ainda.</p>
              <p className="text-sm text-muted-foreground">Clique em "Nova Entrada" para começar.</p>
            </div>
          ) : (
            entries.map((entry) => (
              <Card key={entry.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => handleEditEntry(entry)}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{entry.title || "Sem título"}</CardTitle>
                      <CardDescription>
                        {entry.createdAt ? format(entry.createdAt.toDate(), "dd 'de' MMMM, yyyy", { locale: ptBR }) : ''}
                      </CardDescription>
                    </div>
                    <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${getCategoryBadgeColor(entry.category)}`}>
                      {entry.category}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-2 text-muted-foreground">{entry.content}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
      <JournalEditor
        isOpen={isEditorOpen}
        onOpenChange={handleEditorClose}
        entry={selectedEntry}
        missionUserPlanId={missionUserPlanId}
      />
    </>
  );
}
