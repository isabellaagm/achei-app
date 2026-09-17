export function fileToImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

export function resizeToCanvas(img: HTMLImageElement | HTMLCanvasElement, maxDim: number): HTMLCanvasElement {
  let w = img.width;
  let h = img.height;
  if (w > h && w > maxDim) {
    h = Math.round((h * maxDim) / w);
    w = maxDim;
  } else if (h >= w && h > maxDim) {
    w = Math.round((w * maxDim) / h);
    h = maxDim;
  }
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
  return canvas;
}

export function canvasToBlob(canvas: HTMLCanvasElement, type = 'image/jpeg', quality = 0.85): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('falha ao gerar imagem'))), type, quality);
  });
}

/** Sobe um Blob direto pro R2 usando uma URL pré-assinada (PUT). */
export async function uploadToSignedUrl(url: string, blob: Blob, contentType: string) {
  const res = await fetch(url, { method: 'PUT', headers: { 'Content-Type': contentType }, body: blob });
  if (!res.ok) throw new Error(`Falha no upload (${res.status})`);
}
