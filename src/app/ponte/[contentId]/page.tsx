
'use client';

import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import type { SharedContentDocument } from '@/lib/types';
import { notFound, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { BookHeart, Download, Mail, MailOpen } from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

async function getSharedContent(id: string): Promise<SharedContentDocument | null> {
  const docRef = doc(db, 'sharedContent', id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists() || docSnap.data().status === 'DELETED') {
    return null;
  }
  
  // Increment view count only once when data is fetched server-side
  // We avoid incrementing on client-side state changes
  if (typeof window === 'undefined') {
    updateDoc(docRef, { viewCount: increment(1) }).catch(console.error);
  }
  
  return { id: docSnap.id, ...docSnap.data() } as SharedContentDocument;
}


function LetterView({ data }: { data: SharedContentDocument }) {
  const [isOpened, setIsOpened] = useState(false);

  return (
    <div className="bg-white p-4 sm:p-8 rounded-lg shadow-lg min-h-[60vh] flex flex-col justify-between">
      <AnimatePresence mode="wait">
        {!isOpened ? (
          <motion.div
            key="envelope"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
            className="flex flex-col items-center justify-center text-center flex-1"
          >
            <Mail className="w-24 h-24 text-primary/30" />
            <p className="font-serif text-2xl mt-4 text-muted-foreground">Uma carta para</p>
            <h1 className="font-serif text-5xl font-bold text-foreground mt-2">{data.recipientName}</h1>
            <p className="mt-8 text-muted-foreground">Com carinho, de {data.senderName}.</p>
            <Button onClick={() => setIsOpened(true)} size="lg" className="mt-12 rounded-full h-16 w-16 shadow-lg">
                <MailOpen className="w-8 h-8"/>
            </Button>
            <p className="mt-2 text-xs text-muted-foreground font-mono">Abrir</p>
          </motion.div>
        ) : (
          <motion.div
            key="letter-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 0.3, duration: 0.5 } }}
            className="flex flex-col justify-between h-full"
          >
              <article className="prose prose-lg max-w-none prose-h1:text-primary prose-h1:font-bold prose-blockquote:border-primary font-serif">
                <h1>Uma Palavra de Paz para o seu Coração</h1>
                <p className="mt-8">{data.content.opening}</p>
                
                {data.content.sections.map((section, index) => (
                    <div key={index} className="mt-8">
                        <blockquote className="border-l-4 border-primary bg-muted/30 p-4 italic rounded-r-lg text-foreground/80">
                            <p className="text-xl">“{section.verse_text}”</p>
                            <footer className="text-base not-italic text-right text-foreground/60">— {section.verse}</footer>
                        </blockquote>
                        <p className="mt-4">{section.explanation}</p>
                    </div>
                ))}

                <p className="mt-8">{data.content.conclusion}</p>
                 <p className="mt-8 not-prose text-muted-foreground">Com carinho,<br/>{data.senderName}</p>
            </article>
            <Footer />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StandardView({ data }: { data: SharedContentDocument }) {
  const { content } = data;

  return (
    <div className="bg-white p-8 sm:p-12 rounded-lg shadow-lg">
        <article className="prose prose-lg max-w-none prose-h1:text-primary prose-h1:font-bold prose-blockquote:border-primary">
            <h1>Uma Palavra de Paz para o seu Coração</h1>
            <p className="lead">
              Um amigo que se importa com você pediu para lhe entregar esta mensagem de esperança.
              Acreditamos que, mesmo nos momentos difíceis, a Palavra de Deus pode trazer conforto e direção.
            </p>

            <p className="mt-8">{content.opening}</p>
            
            {content.sections.map((section, index) => (
                <div key={index} className="mt-8">
                    <blockquote className="border-l-4 border-primary bg-muted/30 p-4 italic rounded-r-lg">
                        <p className="text-xl">“{section.verse_text}”</p>
                        <footer className="text-base not-italic text-right">— {section.verse}</footer>
                    </blockquote>
                    <p className="mt-4">{section.explanation}</p>
                </div>
            ))}

            <p className="mt-8">{content.conclusion}</p>
        </article>
        <Footer />
    </div>
  )
}

function Footer() {
    return (
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
    )
}


export default function SharedContentPage({ params }: { params: { contentId: string } }) {
  const [data, setData] = useState<SharedContentDocument | null | 'not-found'>(null);

  useEffect(() => {
    getSharedContent(params.contentId)
      .then(content => {
        setData(content || 'not-found');
      })
      .catch(() => setData('not-found'));
  }, [params.contentId]);

  if (data === 'not-found') {
    notFound();
  }

  if (!data) {
    return (
       <div className="container mx-auto max-w-3xl py-12 px-4">
        <div className="bg-white p-8 sm:p-12 rounded-lg shadow-lg space-y-4 animate-pulse">
            <div className="h-8 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-full"></div>
            <div className="h-4 bg-muted rounded w-5/6"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-3xl py-12 px-4">
      {data.isLetter ? <LetterView data={data} /> : <StandardView data={data} />}
    </div>
  );
}
