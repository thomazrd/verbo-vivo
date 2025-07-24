
"use client";

import { useState, useEffect, useMemo } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import type { Study } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchBar } from "@/components/studies/SearchBar";
import { BookCopy, FileWarning } from "lucide-react";
import { FeatureCard } from "@/components/home/FeatureCard";
import { StudyCard } from "@/components/studies/StudyCard";
import { StudiesShelf } from "@/components/studies/StudiesShelf";

// Função para normalizar texto para busca
const normalizeText = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();


export default function StudiesPage() {
  const [allStudies, setAllStudies] = useState<Study[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const featuredStudy = useMemo(() => allStudies[0], [allStudies]);
  const recentStudies = useMemo(() => allStudies.slice(0, 7), [allStudies]);

  useEffect(() => {
    const fetchStudies = async () => {
      try {
        setIsLoading(true);
        const studiesQuery = query(
            collection(db, "studies"),
            where("status", "==", "PUBLISHED"),
            orderBy("updatedAt", "desc")
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
