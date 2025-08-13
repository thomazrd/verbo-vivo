// /api/bible/verses/[version]/[abbrev]/[chapter]
import { NextResponse } from 'next/server';

const ABIBLIA_API_URL = 'https://www.abibliadigital.com.br/api';

export async function GET(
  request: Request,
  { params }: { params: { version: string; abbrev: string; chapter: string } }
) {
  const { version, abbrev, chapter } = params;
  const ABIBLIA_API_TOKEN = process.env.ABIBLIA_API_TOKEN;

  if (!ABIBLIA_API_TOKEN || ABIBLIA_API_TOKEN === "COLE_SEU_TOKEN_AQUI") {
    console.warn('Token da API abibliadigital.com.br não configurado. A busca de versículos retornará erro.');
    return NextResponse.json({ message: 'Token da API não configurado no servidor.' }, { status: 500 });
  }

  try {
    const response = await fetch(`${ABIBLIA_API_URL}/verses/${version}/${abbrev}/${chapter}`, {
      headers: {
        Authorization: `Bearer ${ABIBLIA_API_TOKEN}`,
        Accept: 'application/json',
      },
      // Cache por 24 horas
      next: { revalidate: 86400 },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erro da API abibliadigital: ${errorText}`);
      throw new Error(`Falha ao buscar dados da API: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Erro no proxy para /verses/${version}/${abbrev}/${chapter}:`, error);
    return NextResponse.json({ message: 'Erro ao buscar dados da Bíblia.' }, { status: 500 });
  }
}
