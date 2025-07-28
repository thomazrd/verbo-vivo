import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { db } from '@/lib/firebase-admin';
import type { Study } from '@/lib/types';
import { StudyDetailClient } from '@/components/studies/StudyDetailClient';

const DEFAULT_THUMBNAIL = "https://dynamic.tiggomark.com.br/images/deep_dive.jpg";

async function getStudy(id: string): Promise<Study | null> {
  const docRef = db.collection('studies').doc(id);
  const docSnap = await docRef.get();

  if (docSnap.exists && docSnap.data()?.status === 'PUBLISHED') {
    return { id: docSnap.id, ...docSnap.data() } as Study;
  }
  return null;
}

type Props = {
  params: { studyId: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const study = await getStudy(params.studyId);

  if (!study) {
    return {
      title: 'Estudo não encontrado | Verbo Vivo',
    }
  }

  const studyTitle = study.title;
  const studyImage = study.thumbnailUrl || DEFAULT_THUMBNAIL;
  // Usar o início do conteúdo ou uma descrição padrão
  const description = study.content 
    ? study.content.substring(0, 150) + '...'
    : "Ouça este estudo edificante e fortaleça sua fé. Disponível no app Verbo Vivo.";

  return {
    title: `${studyTitle} | Verbo Vivo`,
    description,
    openGraph: {
      title: studyTitle,
      description: description,
      images: [
        {
          url: studyImage,
          width: 1200,
          height: 630,
          alt: studyTitle,
        },
      ],
      locale: 'pt_BR',
      type: 'article',
      siteName: 'Verbo Vivo',
    },
    twitter: {
        card: 'summary_large_image',
        title: studyTitle,
        description: description,
        images: [studyImage],
    },
  }
}

export default async function StudyDetailPage({ params }: Props) {
  const study = await getStudy(params.studyId);

  if (!study) {
    notFound();
  }

  return <StudyDetailClient study={study} />;
}
