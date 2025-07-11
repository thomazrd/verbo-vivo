import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin'; // Use admin SDK for server-side
import type { WisdomPearl } from '@/lib/types';

export const dynamic = 'force-dynamic';

// Helper function to get a random document
async function getRandomWisdomPearl(): Promise<WisdomPearl | null> {
  const pearlsRef = db.collection('wisdomPearls');
  
  // To get a random document, we can generate a random ID and query from there.
  // This is more scalable than fetching all documents.
  const key = pearlsRef.doc().id;

  const snapshot = await pearlsRef
    .where('__name__', '>=', key)
    .limit(1)
    .get();

  if (snapshot.empty) {
    // If no document is found, wrap around and search from the beginning.
    const firstSnapshot = await pearlsRef
      .orderBy('__name__')
      .limit(1)
      .get();
    
    if (firstSnapshot.empty) {
      return null;
    }
    const doc = firstSnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as WisdomPearl;
  }
  
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as WisdomPearl;
}


export async function GET() {
  try {
    const pearl = await getRandomWisdomPearl();

    if (!pearl) {
      return NextResponse.json({ message: 'Nenhuma pérola de sabedoria encontrada.' }, { status: 404 });
    }

    // Set cache headers - cache for 1 hour as per TDD
    const headers = new Headers();
    headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=59');

    return NextResponse.json(pearl, { status: 200, headers });

  } catch (error) {
    console.error("Erro ao buscar Pérola de Sabedoria:", error);
    return NextResponse.json({ message: 'Erro interno do servidor.' }, { status: 500 });
  }
}
