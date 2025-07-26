
// /api/dictionary/[word]?lang=...
import { NextResponse } from 'next/server';
import axios from 'axios';

const DICTIONARY_API_URL = 'https://api.dictionaryapi.dev/api/v2/entries';

export async function GET(
  request: Request,
  { params }: { params: { word: string } }
) {
  const { word } = params;
  const { searchParams } = new URL(request.url);
  const lang = searchParams.get('lang') || 'pt'; // Default to Portuguese

  if (!word) {
    return NextResponse.json({ message: 'A palavra é obrigatória.' }, { status: 400 });
  }

  try {
    const response = await axios.get(`${DICTIONARY_API_URL}/${lang}/${word}`);
    return NextResponse.json(response.data);
  } catch (error: any) {
    if (error.response && error.response.status === 404) {
      const apiError = error.response.data;
      const message = apiError.title || `Nenhuma definição encontrada para "${word}".`;
      return NextResponse.json({ message }, { status: 404 });
    }
    console.error(`Erro no proxy do dicionário para a palavra "${word}" (lang: ${lang}):`, error);
    return NextResponse.json({ message: 'Erro ao buscar definição.' }, { status: 500 });
  }
}
