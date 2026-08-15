/**
 * Similaridade por cosseno entre dois vetores de mesma dimensão.
 * Retorna algo entre -1 e 1 (na prática, entre 0 e 1 pra descritores de rosto).
 * A documentação da lib Human sugere que acima de 0.5 já pode ser considerado
 * um match — MATCH_THRESHOLD abaixo parte desse ponto, mas vale recalibrar
 * depois de testar com fotos reais do seu evento.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length);
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export const MATCH_THRESHOLD = 0.5;
