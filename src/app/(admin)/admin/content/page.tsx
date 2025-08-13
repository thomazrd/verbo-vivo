
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, where } from "firebase/firestore";
import type { Content } from "@/lib/types";

import { Button } from "@/components/ui/button";
import { Plus, FileText, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContentListItem } from "@/components/admin/ContentListItem";

type ContentStatus = "ALL" | "PUBLISHED" | "DRAFT";

export default function ContentsListPage() {
  const searchParams = useSearchParams();
  const initialStatus = (searchParams.get("status")?.toUpperCase() || "ALL") as ContentStatus;

  const [contents, setContents] = useState<Content[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ContentStatus>(initialStatus);

  useEffect(() => {
    setIsLoading(true);
    let contentQuery;
    const baseQuery = collection(db, "content");
    
    if (activeTab === "ALL") {
      contentQuery = query(baseQuery, orderBy("updatedAt", "desc"));
    } else {
      contentQuery = query(
        baseQuery,
        where("status", "==", activeTab),
        orderBy("updatedAt", "desc")
      );
    }

    const unsubscribe = onSnapshot(
      contentQuery,
      (snapshot) => {
        const fetchedContent: Content[] = [];
        snapshot.forEach((doc) => {
          fetchedContent.push({ id: doc.id, ...doc.data() } as Content);
        });
        setContents(fetchedContent);
        setIsLoading(false);
      },
      (error) => {
        console.error("Error fetching contents:", error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [activeTab]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Conteúdos</h1>
        <Button asChild>
          <Link href="/admin/content/create">
            <Plus className="mr-2 h-4 w-4" />
            Criar Novo Conteúdo
          </Link>
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ContentStatus)}>
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
          ) : contents.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">Nenhum conteúdo encontrado</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Crie um novo conteúdo para começar a compartilhar.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {contents.map((item) => (
                <ContentListItem key={item.id} content={item} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
