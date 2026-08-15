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

/**
 * Abre o menu nativo de compartilhar do celular (Web Share API), que no iOS/Android tem a opção
 * "Salvar imagem"/"Salvar na galeria" — é o único jeito de salvar direto no app de Fotos a partir
 * do navegador. Se o navegador não suportar, cai pro download normal do arquivo.
 */
export async function shareOrDownloadImage(url: string, filename: string) {
  const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
  if (nav.canShare && nav.share) {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });
      if (nav.canShare({ files: [file] })) {
        await nav.share({ files: [file] });
        return;
      }
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return; // usuário cancelou, não faz fallback
    }
  }
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
