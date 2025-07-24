
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, where } from "firebase/firestore";
import type { Study } from "@/lib/types";

import { Button } from "@/components/ui/button";
import { Plus, BookCopy, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudyListItem } from "@/components/admin/StudyListItem";

type StudyStatus = "ALL" | "PUBLISHED" | "DRAFT";

export default function StudiesListPage() {
  const searchParams = useSearchParams();
  const initialStatus = (searchParams.get("status")?.toUpperCase() || "ALL") as StudyStatus;

  const [studies, setStudies] = useState<Study[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<StudyStatus>(initialStatus);

  useEffect(() => {
    setIsLoading(true);
    let studiesQuery;
    if (activeTab === "ALL") {
      studiesQuery = query(collection(db, "studies"), orderBy("updatedAt", "desc"));
    } else {
      studiesQuery = query(
        collection(db, "studies"),
        where("status", "==", activeTab),
        orderBy("updatedAt", "desc")
      );
    }

    const unsubscribe = onSnapshot(
      studiesQuery,
      (snapshot) => {
        const fetchedStudies: Study[] = [];
        snapshot.forEach((doc) => {
          fetchedStudies.push({ id: doc.id, ...doc.data() } as Study);
        });
        setStudies(fetchedStudies);
        setIsLoading(false);
      },
      (error) => {
        console.error("Error fetching studies:", error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [activeTab]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Estudos</h1>
        <Button asChild>
          <Link href="/admin/studies/create">
            <Plus className="mr-2 h-4 w-4" />
            Criar Novo Estudo
          </Link>
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as StudyStatus)}>
        <TabsList>
          <TabsTrigger value="ALL">Todos</TabsTrigger>
          <TabsTrigger value="PUBLISHED">Publicados</TabsTrigger>
          <TabsTrigger value="DRAFT">Rascunhos</TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : studies.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <BookCopy className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">Nenhum estudo encontrado</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Crie um novo estudo para começar a compartilhar sabedoria.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {studies.map((study) => (
                <StudyListItem key={study.id} study={study} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
