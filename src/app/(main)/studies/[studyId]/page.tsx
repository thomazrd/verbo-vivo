
import '@/lib/firebase-admin-init'; // Garante a inicialização do Admin SDK
import { type Metadata, type ResolvingMetadata } from 'next';
import { notFound } from 'next/navigation';
import { db } from '@/lib/firebase-admin';
import type { Study } from '@/lib/types';
import { StudyDetailClient } from '@/components/studies/StudyDetailClient';

type Props = {
  params: { studyId: string };
};

const DEFAULT_IMAGE_URL = "https://dynamic.tiggomark.com.br/images/logo-192.png";

async function getStudy(id: string): Promise<Study | null> {
  const docRef = db.collection('studies').doc(id);
  const docSnap = await docRef.get();

  if (docSnap.exists && docSnap.data()?.status === 'PUBLISHED') {
    // Note: We are not incrementing view count here on the server to avoid
    // inflating numbers from bots/crawlers. View count is handled on the client.
    return { id: docSnap.id, ...docSnap.data() } as Study;
  }
  return null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const study = await getStudy(params.studyId);

  if (!study) {
    return {
      title: 'Estudo não encontrado',
    };
  }
  
  const excerpt = study.content 
    ? study.content.substring(0, 150) + '...'
    : 'Um estudo edificante para fortalecer sua fé.';

  return {
    title: `${study.title} | Verbo Vivo`,
    description: excerpt,
    openGraph: {
      title: study.title,
      description: excerpt,
      url: `https://verbo-vivo.app/studies/${study.id}`, // Replace with your actual domain
      siteName: 'Verbo Vivo',
      images: [
        {
          url: study.thumbnailUrl || DEFAULT_IMAGE_URL,
          width: 1200,
          height: 630,
        },
      ],
      locale: 'pt_BR',
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: study.title,
      description: excerpt,
      images: [study.thumbnailUrl || DEFAULT_IMAGE_URL],
    },
  };
}

export default async function StudyDetailPage({ params }: Props) {
  const study = await getStudy(params.studyId);

  if (!study) {
    notFound();
  }

  return <StudyDetailClient study={study} />;
}
