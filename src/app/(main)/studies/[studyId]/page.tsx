
import { StudyDetailClient } from '@/components/studies/StudyDetailClient';
import { db } from '@/lib/firebase-admin';
import type { Study } from '@/lib/types';
import { notFound } from 'next/navigation';
import { type Metadata } from 'next';
import { JSDOM } from 'jsdom';


// Esta função busca os dados no servidor, ANTES da página ser renderizada.
async function getStudy(id: string): Promise<Study | null> {
  const docRef = db.collection('studies').doc(id);
  const docSnap = await docRef.get();

  if (docSnap.exists && docSnap.data()?.status === 'PUBLISHED') {
    return { id: docSnap.id, ...docSnap.data() } as Study;
  }
  return null;
}

// Esta função usa os dados buscados para gerar as meta tags
export async function generateMetadata({ params }: { params: { studyId: string } }): Promise<Metadata> {
  const study = await getStudy(params.studyId);
  const defaultTitle = "Estudo | Verbo Vivo";
  const defaultDescription = "Aprofunde sua fé com estudos e pílulas de sabedoria.";
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

  // Se o estudo tiver meta tags pré-geradas, use-as
  if (study.metaTags) {
    const dom = new JSDOM(study.metaTags);
    const meta: { [key: string]: string } = {};
    dom.window.document.querySelectorAll('meta').forEach(tag => {
      const key = tag.getAttribute('property') || tag.getAttribute('name');
      const value = tag.getAttribute('content');
      if (key && value) {
        meta[key] = value;
      }
    });
    
    return {
        title: meta['og:title'] || study.title,
        description: meta['og:description'] || defaultDescription,
        openGraph: {
            title: meta['og:title'] || study.title,
            description: meta['og:description'] || defaultDescription,
            images: [meta['og:image'] || defaultImageUrl],
            url: meta['og:url'],
            type: 'article',
        },
        twitter: {
            card: 'summary_large_image',
            title: meta['twitter:title'] || study.title,
            description: meta['twitter:description'] || defaultDescription,
            images: [meta['twitter:image'] || defaultImageUrl],
        }
    }
  }

  // Fallback para estudos mais antigos que não têm o campo metaTags
  const description = study.content ? study.content.substring(0, 150) + '...' : defaultDescription;
  const imageUrl = study.thumbnailUrl || defaultImageUrl;

  return {
    title: study.title,
    description: description,
    openGraph: {
      title: study.title,
      description: description,
      images: [imageUrl],
    },
  };
}


// A página principal agora passa os dados iniciais para o componente cliente
export default async function StudyDetailPage({ params }: { params: { studyId: string } }) {
  const study = await getStudy(params.studyId);

  if (!study) {
    notFound();
  }

  return <StudyDetailClient initialStudy={study} />;
}
