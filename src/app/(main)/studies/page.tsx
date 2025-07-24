
"use client";

import { useState, useEffect, useMemo } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, getDocs, limit } from "firebase/firestore";
import type { Study } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchBar } from "@/components/studies/SearchBar";
import { BookCopy, FileWarning } from "lucide-react";
import { FeatureCard } from "@/components/home/FeatureCard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StudyCard } from "@/components/studies/StudyCard";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

// Função para normalizar texto para busca
const normalizeText = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

function StudiesShelf({ title, studies, isLoading }: { title: string; studies: Study[]; isLoading: boolean }) {
  if (isLoading) {
    return (
        <div>
            <Skeleton className="h-8 w-1/3 mb-4" />
            <div className="flex space-x-4 pb-4">
                <div className="w-64 space-y-2 shrink-0"><Skeleton className="w-full h-36" /><Skeleton className="h-4 w-5/6" /></div>
                <div className="w-64 space-y-2 shrink-0"><Skeleton className="w-full h-36" /><Skeleton className="h-4 w-5/6" /></div>
                <div className="w-64 space-y-2 shrink-0"><Skeleton className="w-full h-36" /><Skeleton className="h-4 w-5/6" /></div>
            </div>
        </div>
    );
  }

  if (studies.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        <Button variant="link" asChild>
          <Link href="/studies/all">Ver todos <ArrowRight className="ml-2 h-4 w-4"/></Link>
        </Button>
      </div>
      <div className="relative">
        <ScrollArea>
          <div className="flex space-x-4 pb-4">
            {studies.map((study) => (
              <StudyCard key={study.id} study={study} className="w-64 shrink-0" />
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  );
}


export default function StudiesPage() {
  const [allStudies, setAllStudies] = useState<Study[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const featuredStudy = useMemo(() => allStudies[0], [allStudies]);
  const recentStudies = useMemo(() => allStudies.slice(1, 6), [allStudies]);

  useEffect(() => {
    const fetchStudies = async () => {
      try {
        setIsLoading(true);
        const studiesQuery = query(
            collection(db, "studies"),
            where("status", "==", "PUBLISHED"),
            orderBy("publishedAt", "desc")
        );
        const snapshot = await getDocs(studiesQuery);
        const fetchedStudies: Study[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Study));
        setAllStudies(fetchedStudies);
      } catch (err) {
        console.error("Error fetching studies:", err);
        setError("Não foi possível carregar os estudos. Tente novamente mais tarde.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchStudies();
  }, []);

  const searchResults = useMemo(() => {
    if (!searchTerm) return [];
    const normalizedSearch = normalizeText(searchTerm);
    return allStudies.filter(study =>
      normalizeText(study.title).includes(normalizedSearch) ||
      study.tags?.some(tag => normalizeText(tag).includes(normalizedSearch))
    );
  }, [allStudies, searchTerm]);

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-center">
        <FileWarning className="mx-auto h-12 w-12 text-destructive" />
        <p className="mt-4 text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl py-8 px-4 h-full flex flex-col">
      <header className="mb-8 space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Estudos & Pílulas de Sabedoria</h1>
        <SearchBar
          onSearchChange={setSearchTerm}
          placeholder="Buscar por um tema ou título..."
        />
      </header>

      {searchTerm ? (
        <div className="flex-1">
          <h2 className="text-2xl font-bold mb-4">Resultados para "{searchTerm}"</h2>
          {searchResults.length > 0 ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {searchResults.map(study => <StudyCard key={study.id} study={study} />)}
            </div>
          ) : (
             <p className="text-muted-foreground">Nenhum resultado encontrado.</p>
          )}
        </div>
      ) : (
        <div className="space-y-12">
           {isLoading ? (
             <Skeleton className="aspect-video w-full lg:w-2/3 rounded-lg" />
           ) : featuredStudy ? (
             <FeatureCard
                icon={BookCopy}
                title={featuredStudy.title}
                description={featuredStudy.content.substring(0, 100) + '...'}
                linkTo={`/studies/${featuredStudy.id}`}
                imageUrl={featuredStudy.thumbnailUrl || "https://placehold.co/1200x600.png"}
                imageHint="featured study"
             />
           ) : null }
           
           <StudiesShelf title="Adicionados Recentemente" studies={recentStudies} isLoading={isLoading} />
           
           {allStudies.length === 0 && !isLoading && (
              <div className="text-center py-16">
                 <BookCopy className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">Nenhum estudo encontrado.</p>
              </div>
           )}
        </div>
      )}
    </div>
  );
}
