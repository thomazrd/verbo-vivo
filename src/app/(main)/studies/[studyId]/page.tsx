
import { StudyDetailClient } from '@/components/studies/StudyDetailClient';
import type { Study } from '@/lib/types';
import { notFound } from 'next/navigation';
import { type Metadata } from 'next';

// NOTE: The database call is commented out to prevent server-side auth errors in production.
// This function will now generate generic meta tags for sharing previews.
async function getStudy(id: string): Promise<Partial<Study> | null> {
    try {
        // This server-side fetch is causing authentication issues in the current production environment.
        // For now, we return a partial object to allow the page to render.
        // This is a temporary measure until the root cause of the server auth issue is resolved.
        return { id: id, title: "Estudo Bíblico" };

    } catch (error) {
        console.error("Server-side getStudy failed:", error);
        // Return a generic object to allow the page to render without dynamic metadata.
        return { id: id, title: "Estudo Bíblico" };
    }
}


export async function generateMetadata({ params }: { params: { studyId: string } }): Promise<Metadata> {
  const study = await getStudy(params.studyId);
  const defaultTitle = "Pílula de Sabedoria: Ouça um estudo para edificar sua fé | Verbo Vivo";
  const defaultDescription = "Uma mensagem de esperança e sabedoria espera por você. Clique para ouvir este estudo em áudio e fortalecer sua jornada espiritual.";
  const defaultImageUrl = "https://dynamic.tiggomark.com.br/images/deep_dive.jpg";

  if (!study) {
    return {
      title: defaultTitle,
      description: defaultDescription,
      openGraph: {
        title: defaultTitle,
        description: defaultDescription,
        images: [defaultImageUrl],
      },
    };
  }
  
  // Since we cannot reliably fetch all study data, we use a generic fallback.
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
