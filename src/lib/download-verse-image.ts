

interface VerseData {
  reference: string;
  text: string;
  version: string;
  authorName: string;
}

function wrapText(context: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(' ');
  let line = '';
  let lineCount = 0;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = context.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      context.fillText(line, x, y);
      line = words[n] + ' ';
      y += lineHeight;
      lineCount++;
    } else {
      line = testLine;
    }
  }
  context.fillText(line, x, y);
  return lineCount + 1;
}

export const downloadVerseImage = (verseData: VerseData): void => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return;

  const width = 1280;
  const height = 720;
  canvas.width = width;
  canvas.height = height;

  // Background gradient
  const gradient = context.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#75A9FF'); // primary
  gradient.addColorStop(1, '#A375FF'); // accent
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
  
  // Optional: Add subtle pattern or texture here if desired

  // Text properties
  const maxWidth = width - 160; // 80px padding on each side
  const lineHeight = 64;

  // Verse Text
  context.font = 'italic bold 48px Georgia, serif';
  context.fillStyle = 'rgba(255, 255, 255, 0.9)';
  context.textAlign = 'center';
  
  const textY = height / 2; // Start text in the middle
  const lineCount = wrapText(context, `“${verseData.text}”`, width / 2, textY, maxWidth, lineHeight);
  
  // Adjust starting Y position to center the whole text block vertically
  const totalTextHeight = lineCount * lineHeight;
  const centeredY = (height - totalTextHeight) / 2 + 48; // 48 is first line's baseline
  
  // Clear and redraw text centered
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
  
  context.font = 'italic bold 48px Georgia, serif';
  context.fillStyle = 'rgba(255, 255, 255, 0.9)';
  wrapText(context, `“${verseData.text}”`, width / 2, centeredY, maxWidth, lineHeight);

  // Reference Text
  context.font = 'normal 32px Arial, sans-serif';
  context.fillStyle = 'rgba(255, 255, 255, 0.9)';
  context.fillText(`— ${verseData.reference} (${verseData.version})`, width / 2, centeredY + totalTextHeight);

  // Watermark / Author
  context.font = 'normal 20px Arial, sans-serif';
  context.fillStyle = 'rgba(255, 255, 255, 0.7)';
  context.fillText(`Compartilhado por ${verseData.authorName} via Verbo Vivo`, width / 2, height - 40);


  // Download logic
  const link = document.createElement('a');
  link.download = `${verseData.reference.replace(/[:\s]/g, '_')}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
};
