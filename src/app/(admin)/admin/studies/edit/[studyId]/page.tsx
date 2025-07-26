
"use client";

import { StudyEditor } from "@/components/admin/StudyEditor";
import { useParams } from "next/navigation";

export default function EditStudyPage() {
  const params = useParams();
  const studyId = params.studyId as string;

  return <StudyEditor studyId={studyId} />;
}

    