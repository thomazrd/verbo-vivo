
interface VerseData {
  reference: string;
  text: string;
  version: string;
  authorName?: string | null;
  orientation?: 'horizontal' | 'vertical';
}

function wrapText(context: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(' ');
  let line = '';
  const lines = [];

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = context.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      lines.push(line);
      line = words[n] + ' ';
    } else {
      line = testLine;
    }
  }
  lines.push(line);
  
  const lineCount = lines.length;
  const totalTextHeight = lineCount * lineHeight;
  let startY = y - totalTextHeight / 2 + lineHeight / 2;
  
  if(startY - (lineHeight / 2) < 150) startY = 150; // Ensure it does not go too high

  for (const l of lines) {
    context.fillText(l.trim(), x, startY);
    startY += lineHeight;
  }
  
  return startY;
}

// SVG path for the BookOpen icon
const bookOpenIconPath = new Path2D("M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z");

export const downloadVerseImage = (verseData: VerseData): void => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return;

  const orientation = verseData.orientation || 'horizontal';
  const isHorizontal = orientation === 'horizontal';

  const width = isHorizontal ? 1200 : 1080;
  const height = isHorizontal ? 630 : 1920;
  canvas.width = width;
  canvas.height = height;

  // Gradiente de fundo consistente com o PostCard
  const gradient = context.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#f3e8ff');    // from-purple-100
  gradient.addColorStop(0.5, '#e0e7ff'); // via-indigo-100
  gradient.addColorStop(1, '#f1f5f9');    // to-slate-100
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  // -- Conteúdo Centralizado ---
  const maxWidth = width - 160;
  
  // 1. Renderizar o texto do versículo primeiro para obter sua altura e posição
  const verseFontSize = isHorizontal ? 50 : 72;
  const verseLineHeight = isHorizontal ? 62 : 88;
  context.font = `italic ${verseFontSize}px Georgia, serif`;
  context.fillStyle = '#312e81'; // Cor do texto do versículo (indigo-950/90)
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  const lastLineY = wrapText(context, `“${verseData.text}”`, width / 2, height / 2 + 40, maxWidth, verseLineHeight);

  // 2. Renderizar a referência e o ícone ACIMA do texto do versículo
  const referenceFontSize = isHorizontal ? 32 : 48;
  const referenceY = (height / 2 + 40) - ((lastLineY - (height / 2 + 40)) / 2) - (isHorizontal ? 100 : 150); // Posição calculada
  
  // Medir o texto da referência para centralizar o conjunto (ícone + texto)
  context.font = `bold ${referenceFontSize}px "PT Sans", sans-serif`;
  context.fillStyle = '#5a67d8'; // Cor da referência (indigo-600)
  const referenceText = `${verseData.reference} (${verseData.version})`;
  const referenceMetrics = context.measureText(referenceText);
  const iconWidth = isHorizontal ? 28 : 42;
  const iconGap = isHorizontal ? 12 : 18;
  const totalHeaderWidth = iconWidth + iconGap + referenceMetrics.width;
  const headerStartX = (width - totalHeaderWidth) / 2;

  // Desenhar o Ícone
  context.save();
  context.translate(headerStartX, referenceY - (isHorizontal ? 14 : 21)); // Ajuste vertical
  context.scale(isHorizontal ? 1.2 : 1.8, isHorizontal ? 1.2 : 1.8); // Aumenta o tamanho do ícone
  context.fillStyle = '#5a67d8'; // Cor do ícone
  context.fill(bookOpenIconPath);
  context.restore();

  // Escrever a Referência
  context.textAlign = 'left';
  context.fillText(referenceText, headerStartX + iconWidth + iconGap, referenceY);


  // Marca d'água 'Verbo Vivo' sutil no rodapé
  const authorText = "Compartilhado via Verbo Vivo";
  context.font = `bold ${isHorizontal ? 20 : 28}px "PT Sans", sans-serif`;
  context.fillStyle = 'rgba(0, 0, 0, 0.25)'; // Cor sutil
  context.textAlign = 'center';
  context.fillText(authorText, width / 2, height - (isHorizontal ? 30 : 60));


  const link = document.createElement('a');
  link.download = `${verseData.reference.replace(/[:\s]/g, '_')}_${orientation}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
};
