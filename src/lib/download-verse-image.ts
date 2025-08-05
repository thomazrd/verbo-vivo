

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
  const lines = [];

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = context.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      lines.push(line);
      line = words[n] + ' ';
      lineCount++;
    } else {
      line = testLine;
    }
  }
  lines.push(line);
  lineCount++;

  const totalTextHeight = lineCount * lineHeight;
  let startY = y - totalTextHeight / 2 + lineHeight / 2;
  
  if(startY < 100) startY = 100; // Prevent text from going off top

  for (const l of lines) {
    context.fillText(l.trim(), x, startY);
    startY += lineHeight;
  }
}

export const downloadVerseImage = (verseData: VerseData): void => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return;

  const width = 1280;
  const height = 720;
  canvas.width = width;
  canvas.height = height;

  const backgroundImage = new Image();
  backgroundImage.crossOrigin = "anonymous"; // Important for cross-origin images
  backgroundImage.src = "https://placehold.co/1280x720.png"; // Placeholder with correct size

  backgroundImage.onload = () => {
    // Background Image
    context.drawImage(backgroundImage, 0, 0, width, height);

    // Dark Overlay
    context.fillStyle = 'rgba(20, 20, 40, 0.6)';
    context.fillRect(0, 0, width, height);

    // Text properties
    const maxWidth = width - 160; // 80px padding on each side

    // Verse Text
    context.font = 'italic bold 52px Georgia, serif';
    context.fillStyle = 'rgba(255, 255, 255, 0.95)';
    context.textAlign = 'center';
    context.shadowColor = 'rgba(0, 0, 0, 0.5)';
    context.shadowBlur = 10;
    
    wrapText(context, `“${verseData.text}”`, width / 2, height / 2, maxWidth, 64);
    
    // Clear shadow for other text
    context.shadowColor = 'transparent';
    context.shadowBlur = 0;

    // Reference Text
    context.font = 'normal 36px "Palatino Linotype", "Book Antiqua", Palatino, serif';
    context.fillStyle = 'rgba(255, 255, 255, 0.9)';
    const referenceText = `— ${verseData.reference} (${verseData.version})`;
    const textMetrics = context.measureText(`“${verseData.text}”`);
    const textHeight = (textMetrics.actualBoundingBoxAscent || 0) + (textMetrics.actualBoundingBoxDescent || 0);
    const referenceY = (height / 2) + (textHeight / 2) + 60;
    context.fillText(referenceText, width / 2, referenceY);


    // Watermark / Logo
    const logoImage = new Image();
    logoImage.src = 'https://dynamic.tiggomark.com.br/images/logo_icon_white.png';
    logoImage.onload = () => {
      context.globalAlpha = 0.7;
      context.drawImage(logoImage, width - 80, 40, 48, 48);
      context.globalAlpha = 1.0;

      // Download logic
      const link = document.createElement('a');
      link.download = `${verseData.reference.replace(/[:\s]/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
    logoImage.onerror = () => { // Fallback if logo fails
      const link = document.createElement('a');
      link.download = `${verseData.reference.replace(/[:\s]/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };
   backgroundImage.onerror = () => {
        alert("Não foi possível carregar a imagem de fundo. O download pode não ter a aparência esperada.");
   }
};
