
"use client";

import { useState, useEffect, useMemo } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, getDocs } from "firestore";
import type { Study } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchBar } from "@/components/studies/SearchBar";
import { BookCopy, FileWarning } from "lucide-react";
import { StudiesGrid } from "@/components/studies/StudiesGrid";
import { TagCarousel } from "@/components/studies/TagCarousel";
import { Card } from "@/components/ui/card";

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
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

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
  
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    allStudies.forEach(study => {
        study.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags);
  }, [allStudies]);

  const filteredStudies = useMemo(() => {
    let studies = allStudies;

    if (selectedTag) {
        studies = studies.filter(study => study.tags?.includes(selectedTag));
    }

    if (searchTerm) {
      const normalizedSearch = normalizeText(searchTerm);
      studies = studies.filter(study =>
        normalizeText(study.title).includes(normalizedSearch) ||
        study.tags?.some(tag => normalizeText(tag).includes(normalizedSearch))
      );
    }
    return studies;
  }, [allStudies, searchTerm, selectedTag]);

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-center p-4">
        <Card className="max-w-md p-8">
            <FileWarning className="mx-auto h-12 w-12 text-destructive" />
            <p className="mt-4 text-destructive">{error}</p>
        </Card>
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
        <TagCarousel tags={allTags} selectedTag={selectedTag} onSelectTag={setSelectedTag} />
      </header>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="border bg-card rounded-lg overflow-hidden">
                    <Skeleton className="w-full aspect-video" />
                    <div className="p-4 space-y-3">
                        <Skeleton className="h-6 w-2/3" />
                    </div>
                </div>
            ))}
        </div>
      ) : filteredStudies.length > 0 ? (
         <StudiesGrid studies={filteredStudies} />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center bg-muted/30 rounded-lg p-8">
            <BookCopy className="h-16 w-16 text-muted-foreground" />
            <h3 className="mt-4 text-xl font-semibold">Nenhum estudo encontrado</h3>
            <p className="text-muted-foreground">Tente ajustar sua busca ou filtro de tags.</p>
        </div>
      )}

    </div>
  );
}
