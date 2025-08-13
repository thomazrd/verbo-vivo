
"use client";

import { ContentEditor } from "@/components/admin/ContentEditor";
import { useParams } from "next/navigation";

export default function EditContentPage() {
  const params = useParams();
  const contentId = params.contentId as string;

  return <ContentEditor contentId={contentId} />;
}
