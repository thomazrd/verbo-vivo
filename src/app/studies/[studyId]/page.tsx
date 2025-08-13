
import { StudyDetailClient } from '@/components/studies/StudyDetailClient';
import type { Study } from '@/lib/types';
import { type Metadata } from 'next';

export async function generateMetadata({ params }: { params: { studyId: string } }): Promise<Metadata> {
  // NOTA: No momento, esta função usa metadados genéricos para garantir a estabilidade.
  // Uma futura melhoria poderia envolver buscar o campo 'metaTags' de um estudo.
  const defaultTitle = "Pílula de Sabedoria: Ouça um estudo para edificar sua fé | Verbo Vivo";
  const defaultDescription = "Uma mensagem de esperança e sabedoria espera por você. Clique para ouvir este estudo em áudio e fortalecer sua jornada espiritual.";
  const defaultImageUrl = "https://dynamic.tiggomark.com.br/images/deep_dive.jpg";

  return {
    title: defaultTitle,
    description: defaultDescription,
    openGraph: {
      title: defaultTitle,
      description: defaultDescription,
      images: [defaultImageUrl],
      type: 'article',
    },
    twitter: {
        card: 'summary_large_image',
        title: defaultTitle,
        description: defaultDescription,
        images: [defaultImageUrl],
    }
  };
}


// The client component will now be responsible for fetching all the data.
export default async function StudyDetailPage({ params }: { params: { studyId: string } }) {
  // We pass a minimal initial object. The client will fetch the full data.
  const study = { id: params.studyId };
  return <StudyDetailClient initialStudy={study as Study} />;
}
