"use client";

import { ArticleEditor } from "@/components/blog/ArticleEditor";
import { useParams } from "next/navigation";

export default function EditArticlePage() {
  const params = useParams();
  const articleId = params.articleId as string;

  return <ArticleEditor articleId={articleId} />;
}
