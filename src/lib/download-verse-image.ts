

interface VerseData {
  reference: string;
  text: string;
  version: string;
  authorName: string;
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
  
  if(startY - (lineHeight / 2) < 100) startY = 100;

  for (const l of lines) {
    context.fillText(l.trim(), x, startY);
    startY += lineHeight;
  }
  
  return startY;
}

export const downloadVerseImage = (verseData: VerseData): void => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return;

  const width = 1280;
  const height = 720;
  canvas.width = width;
  canvas.height = height;

  // Use um fundo que respeita a identidade visual do app
  const gradient = context.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#FFFFFF'); // Branco no topo
  gradient.addColorStop(1, '#E8F0FE'); // Azul claro de fundo do app
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  // Texto do versículo com a cor de texto principal
  const maxWidth = width - 160;
  context.font = 'italic 52px Georgia, serif';
  context.fillStyle = '#312E38'; // Cor de texto principal (foreground)
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  
  const lastLineY = wrapText(context, `“${verseData.text}”`, width / 2, height / 2, maxWidth, 64);

  // Texto da referência com a cor primária
  context.font = 'normal 36px "Palatino Linotype", "Book Antiqua", Palatino, serif';
  context.fillStyle = '#75A9FF'; // Cor primária
  const referenceText = `— ${verseData.reference} (${verseData.version})`;
  const referenceY = lastLineY + 20; // Espaçamento
  context.fillText(referenceText, width / 2, referenceY);
  
  // Marca d'água sutil
  context.globalAlpha = 0.5;
  context.font = 'bold 20px "PT Sans", sans-serif';
  context.fillStyle = '#A375FF'; // Cor de destaque (accent)
  context.textAlign = 'left';
  context.fillText('Gerado por Verbo Vivo', 40, height - 30);
  context.globalAlpha = 1.0;


  const link = document.createElement('a');
  link.download = `${verseData.reference.replace(/[:\s]/g, '_')}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
};
