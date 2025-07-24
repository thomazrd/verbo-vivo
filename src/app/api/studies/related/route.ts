
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import type { Study } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const currentStudyId = searchParams.get('currentStudyId');
  const tagsString = searchParams.get('tags');
  // Corrigido: Garante que as tags sejam filtradas para remover strings vazias.
  const tags = tagsString ? tagsString.split(',').filter(tag => tag.trim() !== '') : [];

  if (!currentStudyId) {
    return NextResponse.json({ message: 'currentStudyId é obrigatório' }, { status: 400 });
  }

  try {
    let studiesQuery;
    const studiesRef = db.collection("studies");
    
    // Corrigido: A condição agora verifica se o array de tags tem de fato conteúdo.
    if (tags.length > 0) {
      studiesQuery = studiesRef
        .where("status", "==", "PUBLISHED")
        .where("tags", "array-contains-any", tags)
        .orderBy("publishedAt", "desc")
        .limit(6);
    } else {
      studiesQuery = studiesRef
        .where("status", "==", "PUBLISHED")
        .orderBy("publishedAt", "desc")
        .limit(5);
    }

    const snapshot = await studiesQuery.get();
    
    const fetchedStudies = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as Study))
      .filter(study => study.id !== currentStudyId);

    const relatedStudies = fetchedStudies.slice(0, 4);

    return NextResponse.json(relatedStudies);

  } catch (error) {
    console.error("Erro ao buscar estudos relacionados:", error);
    return NextResponse.json({ message: 'Erro interno do servidor.' }, { status: 500 });
  }
}
