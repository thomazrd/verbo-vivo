// /api/bible/books
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Força a rota a ser dinâmica

const ABIBLIA_API_URL = 'https://www.abibliadigital.com.br/api';

export async function GET() {
  const ABIBLIA_API_TOKEN = process.env.ABIBLIA_API_TOKEN;

  if (!ABIBLIA_API_TOKEN || ABIBLIA_API_TOKEN === "COLE_SEU_TOKEN_AQUI") {
    return NextResponse.json({ message: 'Token da API não configurado no servidor.' }, { status: 500 });
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
    return NextResponse.json({ message: 'Erro ao buscar livros.' }, { status: 500 });
  }
}
