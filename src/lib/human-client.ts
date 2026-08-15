'use client';

// IMPORTANTE: nunca importe '@vladmandic/human' estaticamente aqui em cima.
// O pacote tem uma variante "node" que exige @tensorflow/tfjs-node (um binário
// nativo). Se o import for estático, o Next.js tenta empacotar esse módulo
// também no lado do servidor (mesmo sendo um arquivo 'use client') e a build
// quebra. Import dinâmico dentro da função resolve isso: só roda no navegador.
import type Human from '@vladmandic/human';

// Só existe uma instância do Human na página inteira — carregar os modelos
// de IA é pesado, então isso garante que só acontece uma vez.
let humanInstance: Human | null = null;
let loadingPromise: Promise<Human> | null = null;

export type LoadStatus = { stage: string; ready: boolean; error?: string };

export function getHuman(onProgress?: (s: LoadStatus) => void): Promise<Human> {
  if (humanInstance) return Promise.resolve(humanInstance);
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    onProgress?.({ stage: 'Carregando motor de reconhecimento facial…', ready: false });
    const { default: HumanCtor } = await import('@vladmandic/human');
    const human = new HumanCtor({
      modelBasePath: '/models/', // servido pelo nosso próprio domínio — sem CDN externo
      backend: 'webgl',
      cacheSensitivity: 0,
      warmup: 'none',
      debug: false,
      face: {
        enabled: true,
        detector: { rotation: true, maxDetected: 16 },
        mesh: { enabled: true },
        iris: { enabled: false },
        description: { enabled: true },
        emotion: { enabled: false },
        antispoof: { enabled: false },
        liveness: { enabled: false },
      },
      body: { enabled: false },
      hand: { enabled: false },
      object: { enabled: false },
      gesture: { enabled: false },
      segmentation: { enabled: false },
    });
    try {
      onProgress?.({ stage: 'Baixando modelos (só na primeira vez)…', ready: false });
      await human.load();
      onProgress?.({ stage: 'Pronto', ready: true });
      humanInstance = human;
      return human;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      onProgress?.({ stage: 'Erro ao carregar', ready: false, error: msg });
      loadingPromise = null; // permite tentar de novo
      throw err;
    }
  })();

  return loadingPromise;
}

export type DetectedFace = { embedding: number[]; box: [number, number, number, number]; score: number };

export async function detectFaces(
  input: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
  onProgress?: (s: LoadStatus) => void
): Promise<DetectedFace[]> {
  const human = await getHuman(onProgress);
  const result = await human.detect(input);
  return (result.face || [])
    .filter((f) => f.embedding && f.embedding.length > 0)
    .map((f) => ({
      embedding: Array.from(f.embedding as number[]),
      box: f.box as [number, number, number, number],
      score: f.faceScore ?? f.score ?? 0,
    }));
}

/** Escolhe o maior rosto detectado (o mais provável de ser o autor da selfie). */
export function largestFace(faces: DetectedFace[]): DetectedFace | null {
  if (!faces.length) return null;
  return [...faces].sort((a, b) => b.box[2] * b.box[3] - a.box[2] * a.box[3])[0];
}
