// /api/bible/books
import { NextResponse } from 'next/server';

const ABIBLIA_API_URL = 'https://www.abibliadigital.com.br/api';

export async function GET() {
  const ABIBLIA_API_TOKEN = process.env.ABIBLIA_API_TOKEN;

  // Se o token não estiver configurado, retorna uma lista vazia para não quebrar a UI
  if (!ABIBLIA_API_TOKEN || ABIBLIA_API_TOKEN === "COLE_SEU_TOKEN_AQUI") {
    console.warn('Token da API abibliadigital.com.br não configurado. A busca de livros retornará vazia.');
    return NextResponse.json([], { status: 200 });
  }

  try {
    const response = await fetch(`${ABIBLIA_API_URL}/books`, {
      headers: {
        Authorization: `Bearer ${ABIBLIA_API_TOKEN}`,
        Accept: 'application/json',
      },
      // Cache por 24 horas
      next: { revalidate: 86400 },
    });

    if (!response.ok) {
      throw new Error(`Falha ao buscar dados da API: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Erro no proxy para /books:", error);
    // Em caso de erro na API externa, também retorna uma lista vazia.
    return NextResponse.json([], { status: 200 });
  }
}
