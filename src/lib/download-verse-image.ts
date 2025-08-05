

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
  
  if(startY - (lineHeight / 2) < 100) startY = 100; // Prevent text from going off top

  for (const l of lines) {
    context.fillText(l.trim(), x, startY);
    startY += lineHeight;
  }
  
  // Return the y position of the last line of text for reference positioning
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

  // Create gradient background matching the PostCard
  const gradient = context.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#5b21b6'); // from-purple-800
  gradient.addColorStop(0.5, '#312e81'); // via-indigo-900
  gradient.addColorStop(1, '#0f172a'); // to-slate-900
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  // Verse Text properties
  const maxWidth = width - 160; // 80px padding on each side
  context.font = 'italic 52px Georgia, serif';
  context.fillStyle = 'rgba(255, 255, 255, 0.95)';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.shadowColor = 'rgba(0, 0, 0, 0.5)';
  context.shadowBlur = 10;
  context.shadowOffsetY = 2;
  
  const lastLineY = wrapText(context, `“${verseData.text}”`, width / 2, height / 2, maxWidth, 64);
  
  // Clear shadow for reference text
  context.shadowColor = 'transparent';
  context.shadowBlur = 0;
  context.shadowOffsetY = 0;

  // Reference Text
  context.font = 'normal 36px "Palatino Linotype", "Book Antiqua", Palatino, serif';
  context.fillStyle = 'rgba(255, 255, 255, 0.9)';
  const referenceText = `— ${verseData.reference} (${verseData.version})`;
  const referenceY = lastLineY; // Position below the main text
  context.fillText(referenceText, width / 2, referenceY);

  // Watermark / Logo
  const logoImage = new Image();
  logoImage.crossOrigin = "anonymous";
  logoImage.src = 'https://dynamic.tiggomark.com.br/images/logo_icon_white.png';
  logoImage.onload = () => {
    context.globalAlpha = 0.5;
    context.drawImage(logoImage, width - 40 - 16, 16, 40, 40); // 40x40px icon, 16px from top-right
    context.globalAlpha = 1.0;

    // Download logic
    const link = document.createElement('a');
    link.download = `${verseData.reference.replace(/[:\s]/g, '_')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }
  logoImage.onerror = () => { // Fallback if logo fails
    console.error("Could not load logo for canvas.");
    const link = document.createElement('a');
    link.download = `${verseData.reference.replace(/[:\s]/g, '_')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }
};
