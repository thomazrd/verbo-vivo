// /api/bible/versions
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Força a rota a ser dinâmica

// Define a consistent output structure for Bible versions
interface NormalizedBibleVersion {
  id: string; // e.g., "nvi", "kjv", "cmn-union"
  name: string; // e.g., "Nova Versão Internacional", "King James Version", "Chinese Union Version (Simplified)"
  language: string; // e.g., "pt", "en", "zh"
  apiSource: 'abibliadigital' | 'apibible';
}

const ABIBLIA_API_URL = 'https://www.abibliadigital.com.br/api';
const API_BIBLE_URL = 'https://api.scripture.api.bible/v1';

// Normalization functions
function normalizeAbibliaDigitalVersions(data: any[], lang: string): NormalizedBibleVersion[] {
  // abibliadigital "versions" endpoint returns: [{ version: "nvi", verses: 31102 }, ...]
  // It doesn't explicitly return full names or language, so we infer or use fixed data.
  // This is a simplified normalization. The actual names might need to be mapped.
  return data.map(v => ({
    id: v.version,
    name: `${v.version.toUpperCase()} (${lang})`, // Placeholder name
    language: lang,
    apiSource: 'abibliadigital',
  }));
}

function normalizeApiBibleVersions(data: any[]): NormalizedBibleVersion[] {
  // API.Bible /bibles endpoint returns:
  // { data: [{ id: "de4e12af7f28f599-01", dblId: "de4e12af7f28f599-01", name: "King James Version", language: { id: "eng", name: "English" }, ... }] }
  return data.map(v => ({
    id: v.id,
    name: v.name,
    language: v.language.id.substring(0, 2), // Assuming language ID like "eng" maps to "en"
    apiSource: 'apibible',
  }));
}


export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lang = searchParams.get('lang')?.toLowerCase() || 'pt'; // Default to 'pt'
  
  const ABIBLIA_API_TOKEN = process.env.ABIBLIA_API_TOKEN;
  const API_BIBLE_KEY = process.env.API_BIBLE_KEY;


  try {
    let versions: NormalizedBibleVersion[] = [];

    if (['pt', 'en', 'es'].includes(lang)) {
      if (!ABIBLIA_API_TOKEN || ABIBLIA_API_TOKEN === "COLE_SEU_TOKEN_AQUI") {
        console.error('Token da API abibliadigital não configurado.');
        // Optionally, could try API.Bible as a fallback if configured for these languages too
        return NextResponse.json({ message: 'Token da API (abibliadigital) não configurado no servidor.' }, { status: 500 });
      }
      const response = await fetch(`${ABIBLIA_API_URL}/versions`, {
        headers: {
          Authorization: `Bearer ${ABIBLIA_API_TOKEN}`,
          Accept: 'application/json',
        },
        next: { revalidate: 86400 }, // Cache for 24 hours
      });
      if (!response.ok) {
        throw new Error(`Falha ao buscar dados da API abibliadigital: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      // Filter by language if abibliadigital provided mixed versions (though its /versions endpoint is not language specific)
      // For now, assuming all versions from abibliadigital are relevant for pt, en, es based on TDD
      // The TDD says abibliadigital is "excelente para Português, Inglês e Espanhol".
      // This API doesn't seem to allow filtering versions by language in the request.
      // It returns versions like NVI, ACF, KJV, RVR. We need to know which belongs to which language.
      // This is a simplification; a more robust solution would map specific versions to languages.
      // For example, 'nvi' and 'acf' for 'pt', 'kjv' for 'en', 'rvr' for 'es'.
      // The current normalization just assigns the requested `lang`.
      versions = normalizeAbibliaDigitalVersions(data, lang);

    } else if (['zh', 'ja'].includes(lang)) {
      if (!API_BIBLE_KEY) {
        console.error('Chave da API.Bible não configurada.');
        return NextResponse.json({ message: 'Chave da API (API.Bible) não configurada no servidor.' }, { status: 500 });
      }
      const apiBibleLangCode = lang === 'zh' ? 'zho' : 'jpn'; // API.Bible uses 3-letter codes
      const response = await fetch(`${API_BIBLE_URL}/bibles?language=${apiBibleLangCode}`, {
        headers: {
          'api-key': API_BIBLE_KEY,
          Accept: 'application/json',
        },
        next: { revalidate: 86400 }, // Cache for 24 hours
      });
      if (!response.ok) {
        throw new Error(`Falha ao buscar dados da API.Bible: ${response.status} ${response.statusText}`);
      }
      const result = await response.json();
      versions = normalizeApiBibleVersions(result.data);
    } else {
      return NextResponse.json({ message: `Idioma '${lang}' não suportado para versões da Bíblia.` }, { status: 400 });
    }

    return NextResponse.json(versions);

  } catch (error: any) {
    console.error(`Erro ao buscar versões da Bíblia para o idioma '${lang}':`, error.message);
    return NextResponse.json({ message: `Erro ao buscar versões: ${error.message}` }, { status: 500 });
  }
}
