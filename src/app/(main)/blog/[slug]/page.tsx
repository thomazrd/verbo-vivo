"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useParams, notFound } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import type { Article } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { marked } from "marked";
import { Calendar, User } from "lucide-react";

async function getArticleBySlug(slug: string): Promise<Article | null> {
  const q = query(
    collection(db, "articles"),
    where("slug", "==", slug),
    where("status", "==", "published"),
    limit(1)
  );

  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) {
    return null;
  }

  const doc = querySnapshot.docs[0];
  return { id: doc.id, ...doc.data() } as Article;
}

export default function ArticlePage() {
  const params = useParams();
  const slug = params.slug as string;
  const [article, setArticle] = useState<Article | null | undefined>(undefined);
  const [htmlContent, setHtmlContent] = useState("");

  useEffect(() => {
    if (slug) {
      getArticleBySlug(slug)
        .then((data) => {
          setArticle(data);
          if (data?.content) {
            setHtmlContent(marked.parse(data.content) as string);
          }
        })
        .catch(() => setArticle(null));
    }
  }, [slug]);

  if (article === undefined) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-12">
        <Skeleton className="h-12 w-3/4 mb-4" />
        <Skeleton className="h-6 w-1/2 mb-8" />
        <Skeleton className="h-96 w-full mb-8" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-5/6 mb-2" />
      </div>
    );
  }

  if (article === null) {
    notFound();
  }

  return (
    <div className="bg-background">
      <div className="w-full max-w-4xl mx-auto px-4 py-8 sm:py-12">
        <article>
          <header className="mb-8 text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight mb-4 text-foreground">
              {article.title}
            </h1>
            <div className="flex items-center justify-center gap-6 text-muted-foreground text-sm">
              <div className="flex items-center gap-2">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={article.authorPhotoURL || undefined} />
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <span>{article.authorName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <time dateTime={article.publishedAt?.toDate().toISOString()}>
                  {article.publishedAt
                    ? format(article.publishedAt.toDate(), "dd 'de' MMMM, yyyy", {
                        locale: ptBR,
                      })
                    : ""}
                </time>
              </div>
            </div>
          </header>

          {article.coverImageUrl && (
            <div className="relative w-full aspect-video rounded-lg overflow-hidden mb-8 shadow-lg">
              <Image
                src={article.coverImageUrl}
                alt={article.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

          <div
            className="prose prose-lg lg:prose-xl max-w-none prose-headings:font-bold prose-headings:text-foreground prose-a:text-primary hover:prose-a:underline prose-img:rounded-md"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </article>
      </div>
    </div>
  );
}
