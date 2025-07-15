
// /api/dictionary/[word]
import { NextResponse } from 'next/server';
import axios from 'axios';

const DICIONARIO_API_URL = 'https://significado.herokuapp.com';

export async function GET(
  request: Request,
  { params }: { params: { word: string } }
) {
  const { word } = params;

  if (!word) {
    return NextResponse.json({ message: 'A palavra é obrigatória.' }, { status: 400 });
  }

  try {
    // A API que estou usando é a "significado.herokuapp.com", 
    // que não requer chave e parece mais estável que a "dicionario-aberto".
    const response = await axios.get(`${DICIONARIO_API_URL}/${word}`);

    if (response.data.error) {
        return NextResponse.json({ message: 'Palavra não encontrada' }, { status: 404 });
    }

    return NextResponse.json(response.data);

  } catch (error: any) {
    if (error.response && error.response.status === 404) {
      return NextResponse.json({ message: 'Palavra não encontrada' }, { status: 404 });
    }
    console.error(`Erro no proxy do dicionário para a palavra "${word}":`, error);
    return NextResponse.json({ message: 'Erro ao buscar definição.' }, { status: 500 });
  }
}

    