import { bibleBooksByAbbrev } from '@/lib/bible-books-by-abbrev';

export function parseVerseReference(ref: string) {
  if (!ref) return null;

  // Tenta corresponder a formatos como "1 Samuel 17:45" ou "Jó 1:1"
  // Esta expressão regular captura o nome do livro (incluindo números e espaços),
  // o número do capítulo e, opcionalmente, os números de versículo inicial e final.
  const match = ref.match(/^(.+?)\s+(\d+)(?::(\d+))?(?:-(\d+))?$/);
  if (!match) return null;

  const [, bookName, chapterStr, startVerseStr, endVerseStr] = match;

  // Remove números e espaços do início do nome do livro para normalização
  // Ex: "1 Samuel" -> "samuel", "Salmos" -> "salmos"
  const normalizedInputName = bookName
    .trim()
    .replace(/^[0-9]\s*/, '')
    .toLowerCase();
  
  // Encontra a abreviação correta do livro no nosso mapa
  const bookAbbrev = Object.keys(bibleBooksByAbbrev).find(abbrev => {
    const bookData = bibleBooksByAbbrev[abbrev];
    const normalizedBookDataName = bookData.name
      .replace(/^[0-9][ªº]?\s*/, '')
      .toLowerCase();
    
    // Compara a abreviação, o nome normalizado e o nome completo
    return abbrev === normalizedInputName || 
           normalizedBookDataName === normalizedInputName ||
           bookData.name.toLowerCase() === bookName.trim().toLowerCase();
  });

  const book = bookAbbrev ? bibleBooksByAbbrev[bookAbbrev] : null;
  if (!book) return null;

  const chapter = parseInt(chapterStr, 10);
  const startVerse = startVerseStr ? parseInt(startVerseStr, 10) : 1;
  const endVerse = endVerseStr ? parseInt(endVerseStr, 10) : undefined;
  
  return {
    bookAbbrev: book.abbrev.pt,
    chapter: chapter,
    startVerse: startVerse,
    endVerse: endVerse
  };
}
