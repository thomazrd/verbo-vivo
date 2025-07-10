import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import type { SharedContentDocument } from '@/lib/types';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { BookHeart, Download } from 'lucide-react';

async function getSharedContent(id: string): Promise<SharedContentDocument | null> {
  const docRef = doc(db, 'sharedContent', id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists() || docSnap.data().status === 'DELETED') {
    return null;
  }
  
  // Increment view count - do not await to avoid blocking render
  updateDoc(docRef, { viewCount: increment(1) }).catch(console.error);
  
  return { id: docSnap.id, ...docSnap.data() } as SharedContentDocument;
}

export default async function SharedContentPage({ params }: { params: { contentId: string } }) {
  const data = await getSharedContent(params.contentId);

  if (!data) {
    notFound();
  }
  
  const { content } = data;

  return (
    <div className="container mx-auto max-w-3xl py-12 px-4">
        <div className="bg-white p-8 sm:p-12 rounded-lg shadow-lg">
            <article className="prose prose-lg max-w-none prose-h1:text-primary prose-h1:font-bold prose-blockquote:border-primary">
                <h1>{content.title}</h1>
                <p className="lead">{content.opening}</p>
                
                {content.sections.map((section, index) => (
                    <div key={index} className="mt-8">
                        <blockquote>
                            <p className="text-xl italic">“{section.verse_text}”</p>
                            <footer>— {section.verse}</footer>
                        </blockquote>
                        <p>{section.explanation}</p>
                    </div>
                ))}

                <p className="mt-8">{content.conclusion}</p>
            </article>

            <div className="mt-12 pt-8 border-t border-dashed">
                <div className="bg-primary/10 p-6 rounded-lg text-center">
                    <BookHeart className="h-10 w-10 mx-auto text-primary mb-4" />
                    <h3 className="text-xl font-bold text-foreground">Gostou desta mensagem de esperança?</h3>
                    <p className="mt-2 text-muted-foreground">
                        Descubra mais insights, planos de estudo e uma comunidade de fé no aplicativo Verbo Vivo.
                    </p>
                    <Button asChild size="lg" className="mt-6">
                        <Link href="/">
                            <Download className="mr-2 h-5 w-5" />
                            Conhecer o Verbo Vivo
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    </div>
  );
}

export async function generateMetadata({ params }: { params: { contentId: string } }) {
  const data = await getSharedContent(params.contentId);
  const title = data ? data.content.title : "Uma mensagem de esperança para você";
  const description = data ? data.content.opening : "Uma reflexão baseada na Bíblia, preparada com carinho.";

  return {
    title: `${title} | Verbo Vivo`,
    description: description,
    openGraph: {
      title: title,
      description: description,
      type: 'article',
    },
  };
}
