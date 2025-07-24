
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import type { Study } from '@/lib/types';
import type * as admin from 'firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const currentStudyId = searchParams.get('currentStudyId');
  const tagsString = searchParams.get('tags');
  const tags = tagsString ? tagsString.split(',').filter(tag => tag.trim() !== '') : [];

  if (!currentStudyId) {
    return NextResponse.json({ message: 'currentStudyId é obrigatório' }, { status: 400 });
  }

  try {
    let studiesQuery: admin.firestore.Query = db.collection("studies");
    
    // Sempre filtrar por estudos publicados
    studiesQuery = studiesQuery.where("status", "==", "PUBLISHED");
    
    // Aplicar lógicas de consulta diferentes baseadas na presença de tags
    if (tags.length > 0) {
      // Se houver tags, a prioridade é a relevância por tag.
      // Firestore não permite orderBy em um campo diferente do `array-contains-any` sem um índice composto.
      // A relevância por tag é mais importante aqui do que a data.
      studiesQuery = studiesQuery.where("tags", "array-contains-any", tags).limit(10);
    } else {
      // Se não houver tags, buscar os mais recentes.
      studiesQuery = studiesQuery.orderBy("publishedAt", "desc").limit(10);
    }

    const snapshot = await studiesQuery.get();
    
    // Filtra o estudo atual *depois* de receber os resultados do Firestore
    const fetchedStudies = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as Study))
      .filter(study => study.id !== currentStudyId);

    // Garante que retornamos no máximo 4 estudos
    const relatedStudies = fetchedStudies.slice(0, 4);

    return NextResponse.json(relatedStudies);

  } catch (error) {
    console.error("Erro ao buscar estudos relacionados:", error);
    return NextResponse.json({ message: 'Erro interno do servidor.' }, { status: 500 });
  }
}
