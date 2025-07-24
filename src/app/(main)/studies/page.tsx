
"use client";

import { useState, useEffect, useMemo } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import type { Study } from "@/lib/types";

import { Skeleton } from "@/components/ui/skeleton";
import { StudyList } from "@/components/studies/StudyList";
import { SearchBar } from "@/components/studies/SearchBar";
import { TagCarousel } from "@/components/studies/TagCarousel";
import { BookCopy, FileWarning } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

// Função para normalizar texto para busca
const normalizeText = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export default function StudiesPage() {
  const [allStudies, setAllStudies] = useState<Study[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const { userProfile } = useAuth(); // Usado para obter a role de admin

  useEffect(() => {
    const fetchStudies = async () => {
      try {
        setIsLoading(true);
        // Acesso para Admin: busca todos os estudos.
        // Acesso para Usuário: busca apenas estudos publicados.
        const studiesQuery = userProfile?.role === 'ADMIN' 
            ? query(collection(db, "studies"), orderBy("publishedAt", "desc"))
            : query(
                collection(db, "studies"),
                where("status", "==", "PUBLISHED"),
                orderBy("publishedAt", "desc")
              );

        const snapshot = await getDocs(studiesQuery);
        const fetchedStudies: Study[] = [];
        const tagsSet = new Set<string>();
        
        snapshot.forEach((doc) => {
          const studyData = { id: doc.id, ...doc.data() } as Study;
          fetchedStudies.push(studyData);
          studyData.tags?.forEach(tag => tagsSet.add(tag));
        });
        
        setAllStudies(fetchedStudies);
        setAllTags(Array.from(tagsSet));
      } catch (err) {
        console.error("Error fetching studies:", err);
        setError("Não foi possível carregar os estudos. Tente novamente mais tarde.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchStudies();
  }, [userProfile]);

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

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4 h-full flex flex-col">
      <header className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Estudos & Pílulas de Sabedoria</h1>
        <p className="text-muted-foreground">
          Encontre alimento para sua alma e fortaleça sua jornada de fé.
        </p>
      </header>

      <div className="space-y-6 flex flex-col">
        <SearchBar
          onSearchChange={setSearchTerm}
          placeholder="Buscar por um tema ou título..."
        />
        
        {isLoading ? (
            <div className="flex gap-2">
                <Skeleton className="h-8 w-24 rounded-full" />
                <Skeleton className="h-8 w-20 rounded-full" />
                <Skeleton className="h-8 w-28 rounded-full" />
            </div>
        ) : allTags.length > 0 && (
             <TagCarousel
                tags={allTags}
                selectedTag={selectedTag}
                onSelectTag={setSelectedTag}
             />
        )}

        <div className="flex-1">
          {isLoading ? (
            <StudyList studies={[]} isLoading={true} />
          ) : error ? (
            <div className="text-center py-12">
              <FileWarning className="mx-auto h-12 w-12 text-destructive" />
              <p className="mt-4 text-destructive">{error}</p>
            </div>
          ) : filteredStudies.length === 0 ? (
            <div className="text-center py-12">
               <BookCopy className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">Nenhum estudo encontrado.</p>
            </div>
          ) : (
            <StudyList studies={filteredStudies} isLoading={false} />
          )}
        </div>
      </div>
    </div>
  );
}
