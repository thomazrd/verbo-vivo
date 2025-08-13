
"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import type { JournalEntry } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { PlusCircle, Tag } from "lucide-react";
import { JournalEditor } from "@/components/journal/JournalEditor";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearchParams } from "next/navigation";
import { MissionCompletionModal } from "@/components/battle-plans/MissionCompletionModal";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function JournalPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  
  const [missionToComplete, setMissionToComplete] = useState<string | null>(null);

  useEffect(() => {
    const missionParam = searchParams.get('mission');
    const planIdParam = searchParams.get('userPlanId');
    if (missionParam === 'true' && planIdParam) {
      handleNewEntry(planIdParam);
    }
    // This effect should only run once when the page loads with query params.
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

  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    entries.forEach(entry => {
        entry.tags?.forEach(tag => tagsSet.add(tag));
    });
    return Array.from(tagsSet).sort();
  }, [entries]);

  const filteredEntries = useMemo(() => {
    if (!selectedTag) return entries;
    return entries.filter(entry => entry.tags?.includes(selectedTag));
  }, [entries, selectedTag]);


  const handleNewEntry = (planId: string | null = null) => {
    setSelectedEntry(null);
    setMissionToComplete(planId);
    setIsEditorOpen(true);
  };

  const handleEditEntry = (entry: JournalEntry) => {
    setSelectedEntry(entry);
    setMissionToComplete(null); // Can't complete a mission by editing an old entry
    setIsEditorOpen(true);
  };
  
  const handleEditorClose = (open: boolean, wasSaved = false) => {
    setIsEditorOpen(open);
    if (!open && wasSaved && missionToComplete) {
      // The mission was completed, but the modal will now be shown by this component.
      // We don't need to do anything else here as the modal is now controlled by this page.
    } else if (!open) {
      // If the sheet is just closed without saving, clear any pending mission.
      setMissionToComplete(null);
    }
  };

  const handleModalClose = () => {
    setMissionToComplete(null);
  }

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
          <Button onClick={() => handleNewEntry()}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nova Entrada
          </Button>
        </div>
        
        {allTags.length > 0 && (
            <div className="my-6">
                <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                    <Tag className="h-4 w-4" />
                    <span>Filtrar por tags:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button 
                        variant={selectedTag === null ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedTag(null)}
                    >
                        Todos
                    </Button>
                    {allTags.map(tag => (
                        <Button 
                            key={tag}
                            variant={selectedTag === tag ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedTag(tag)}
                        >
                            {tag}
                        </Button>
                    ))}
                </div>
            </div>
        )}

        <div className="mt-8 space-y-4">
          {isLoading ? (
            <>
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
            </>
          ) : filteredEntries.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-muted-foreground/30 rounded-lg">
              <p className="text-muted-foreground">Nenhuma entrada encontrada.</p>
              {selectedTag ? (
                <p className="text-sm text-muted-foreground">Tente remover o filtro de tag.</p>
              ) : (
                <p className="text-sm text-muted-foreground">Clique em "Nova Entrada" para começar.</p>
              )}
            </div>
          ) : (
            filteredEntries.map((entry) => (
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
                 {entry.tags && entry.tags.length > 0 && (
                    <CardFooter className="flex flex-wrap gap-2 pt-4">
                        {entry.tags.map(tag => (
                            <Badge key={tag} variant="secondary">{tag}</Badge>
                        ))}
                    </CardFooter>
                 )}
              </Card>
            ))
          )}
        </div>
      </div>
      <JournalEditor
        isOpen={isEditorOpen}
        onOpenChange={handleEditorClose}
        entry={selectedEntry}
        missionUserPlanId={missionToComplete}
      />
       {missionToComplete && !isEditorOpen && (
        <MissionCompletionModal 
            userPlanId={missionToComplete}
            onClose={handleModalClose}
        />
      )}
    </>
  );
}
