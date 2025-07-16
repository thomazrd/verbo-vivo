"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import type { Article } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Newspaper, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function BlogIndexPage() {
  const { userProfile } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const canCreate = userProfile?.congregationStatus === 'ADMIN';

  useEffect(() => {
    const q = query(
      collection(db, "articles"),
      where("status", "==", "published"),
      orderBy("publishedAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedArticles: Article[] = [];
      snapshot.forEach((doc) => {
        fetchedArticles.push({ id: doc.id, ...doc.data() } as Article);
      });
      setArticles(fetchedArticles);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="container mx-auto max-w-7xl py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Artigos & Reflexões</h1>
          <p className="mt-1 text-muted-foreground">
            Conteúdo inspirador para aprofundar sua jornada de fé.
          </p>
        </div>
        {canCreate && (
          <Button asChild>
            <Link href="/blog/editor">
              <Plus className="mr-2 h-4 w-4" />
              Novo Artigo
            </Link>
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="flex flex-col">
              <Skeleton className="w-full aspect-video" />
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent className="flex-grow">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6 mt-2" />
              </CardContent>
              <CardFooter>
                 <Skeleton className="h-8 w-24" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/50 p-12 text-center h-96">
          <Newspaper className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-xl font-semibold">Nenhum artigo publicado ainda</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Volte em breve para ler nossas reflexões.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article) => (
            <Link href={`/blog/${article.slug}`} key={article.id} className="group block">
              <Card className="flex h-full flex-col overflow-hidden transition-all group-hover:shadow-md group-hover:border-primary/50">
                 <div className="relative w-full aspect-video bg-muted overflow-hidden">
                    {article.coverImageUrl ? (
                        <Image
                            src={article.coverImageUrl}
                            alt={article.title}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <Newspaper className="h-16 w-16 text-muted-foreground" />
                        </div>
                    )}
                </div>
                <CardHeader>
                  <CardTitle className="line-clamp-2">{article.title}</CardTitle>
                  {article.publishedAt && (
                     <CardDescription>
                       Publicado em {format(article.publishedAt.toDate(), "dd/MM/yy")} por {article.authorName}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="flex-grow">
                    {article.excerpt && (
                        <p className="text-sm text-muted-foreground line-clamp-3">
                            {article.excerpt}
                        </p>
                    )}
                </CardContent>
                <CardFooter className="flex justify-end p-4 pt-0">
                    <div className="flex items-center text-sm font-semibold text-primary">
                        Ler Artigo
                        <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
