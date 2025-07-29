
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, updateDoc, increment, onSnapshot, getDoc, collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import type { Study } from "@/lib/types";
import Image from "next/image";

import { AudioPlayer } from "@/components/studies/AudioPlayer";
import { StudyContentAccordion } from "@/components/studies/StudyContentAccordion";
import { RelatedContentList } from "@/components/studies/RelatedContentList";
import { useAuth } from "@/hooks/use-auth";
import { Home, Share2, Search, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { HomePageSkeleton } from "../home/HomePageSkeleton";
import { ReactionButtons } from "./ReactionButtons";
import { Input } from "../ui/input";
import { Popover, PopoverContent, PopoverTrigger, PopoverAnchor } from "../ui/popover";
import Link from "next/link";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../ui/command";

interface StudyDetailClientProps {
  initialStudy: Partial<Study>; 
}

export function StudyDetailClient({ initialStudy }: StudyDetailClientProps) {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [study, setStudy] = useState<Study | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Study[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);


  useEffect(() => {
    if (!initialStudy.id) return;
    
    const unsub = onSnapshot(doc(db, "studies", initialStudy.id), (doc) => {
      if (doc.exists() && doc.data().status === 'PUBLISHED') {
        setStudy({ id: doc.id, ...doc.data() } as Study);
        setIsLoading(false);
      } else {
        setIsLoading(false);
        setStudy(null);
      }
    });

    return () => unsub();
  }, [initialStudy.id]);
  
  useEffect(() => {
    if (!study) return;
    const viewedKey = `viewed-${study.id}`;
    if (!sessionStorage.getItem(viewedKey)) {
      const studyRef = doc(db, "studies", study.id);
      updateDoc(studyRef, { viewCount: increment(1) }).catch(console.error);
      sessionStorage.setItem(viewedKey, 'true');
    }
  }, [study]);

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    
    const fetchResults = async () => {
        setIsSearchLoading(true);
        try {
            const q = query(
                collection(db, "studies"),
                where("status", "==", "PUBLISHED"),
                orderBy("title"),
                limit(10)
            );
            const snapshot = await getDocs(q);
            const allStudies = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Study));

            // Simple client-side search for now
            const filtered = allStudies.filter(s => 
                s.title.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setSearchResults(filtered);

        } catch (e) {
            console.error(e);
        } finally {
            setIsSearchLoading(false);
        }
    };

    const debounce = setTimeout(() => fetchResults(), 300);
    return () => clearTimeout(debounce);

  }, [searchQuery]);


  const handleShare = async () => {
    if (!study) return;
    const shareData = {
      title: `Estudo: ${study.title}`,
      text: `Confira este estudo edificante do Verbo Vivo: ${study.title}`,
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link Copiado!",
          description: "O link para este estudo foi copiado para sua área de transferência.",
        });
      }
    } catch (error: any) {
        if (error.name !== 'NotAllowedError' && error.name !== 'AbortError') {
            console.error('Error sharing study:', error);
            toast({
                variant: "destructive",
                title: "Erro ao compartilhar",
                description: "Não foi possível compartilhar este estudo.",
            });
        }
    }
  };
  
  const handleSelectResult = (studyId: string) => {
    router.push(`/studies/${studyId}`);
    setIsSearchOpen(false);
    setSearchQuery("");
  }


  if (isLoading || authLoading) {
    return <HomePageSkeleton />;
  }
  
  if (!study) {
    return (
        <div className="container mx-auto text-center py-10">
            <h1 className="text-2xl font-bold">Estudo não encontrado</h1>
            <p className="text-muted-foreground">Este estudo pode ter sido removido ou não está mais disponível.</p>
            <Button variant="link" onClick={() => router.push('/studies')}>Ver outros estudos</Button>
        </div>
    )
  }

  return (
    <>
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="flex justify-between items-center gap-2 mb-4">
            <Button
                variant="outline"
                size="icon"
                onClick={() => router.push('/home')}
                className="shrink-0"
            >
                <Home className="h-4 w-4" />
                <span className="sr-only">Início</span>
            </Button>
            
            <div className="relative flex-1">
                 <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
                    <PopoverAnchor asChild>
                         <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Buscar outro estudo..."
                                className="pl-10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => setIsSearchOpen(true)}
                            />
                             {searchQuery && (
                                <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
                                    onClick={() => setSearchQuery('')}
                                >
                                    <X className="h-4 w-4"/>
                                </Button>
                             )}
                        </div>
                    </PopoverAnchor>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
                       <Command shouldFilter={false}>
                            <CommandList>
                                {isSearchLoading && <CommandEmpty>Buscando...</CommandEmpty>}
                                {!isSearchLoading && searchResults.length === 0 && searchQuery.length > 1 && <CommandEmpty>Nenhum resultado.</CommandEmpty>}
                                <CommandGroup>
                                {searchResults.map(s => (
                                    <CommandItem key={s.id} onSelect={() => handleSelectResult(s.id)} value={s.title}>
                                        <div className="flex items-center gap-3">
                                            <div className="relative w-16 h-10 shrink-0 bg-muted rounded-md overflow-hidden">
                                                <Image src={s.thumbnailUrl || ''} alt={s.title} fill className="object-cover" />
                                            </div>
                                            <span className="truncate">{s.title}</span>
                                        </div>
                                    </CommandItem>
                                ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>

             <Button
                size="sm"
                onClick={handleShare}
                className="bg-accent text-accent-foreground hover:bg-accent/90 shrink-0"
            >
                <Share2 className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Compartilhar</span>
            </Button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-12 gap-y-8">
            
            <div className="lg:col-span-2 space-y-8">
                <div className="w-full">
                    <AudioPlayer study={study} />
                </div>

                <ReactionButtons study={study} user={user} />

                <StudyContentAccordion 
                    markdownContent={study.content}
                    practicalChallenge={study.practicalChallenge}
                />
            </div>

            <aside className="lg:col-span-1 space-y-6">
                 <h2 className="text-xl font-bold tracking-tight">Próximos Estudos</h2>
                 <RelatedContentList
                    user={user}
                    currentStudyId={study.id}
                    tags={study.tags}
                 />
            </aside>

        </div>
      </div>
    </>
  );
}
