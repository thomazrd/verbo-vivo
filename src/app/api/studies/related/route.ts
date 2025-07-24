
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
    
    studiesQuery = studiesQuery.where("status", "==", "PUBLISHED");
    
    if (tags.length > 0) {
      studiesQuery = studiesQuery.where("tags", "array-contains-any", tags);
    }
    
    // A ordenação principal será por data
    studiesQuery = studiesQuery.orderBy("publishedAt", "desc").limit(10); // Busca um pouco mais para garantir que teremos 4 após filtrar

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
