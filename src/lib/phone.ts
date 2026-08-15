/** Normaliza pra só dígitos com código do país (assume Brasil se não tiver DDI), pra poder achar
 * o mesmo convidado tanto quando ele se autocadastra quanto quando é importado via CSV. */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  return digits.length <= 11 ? '55' + digits : digits;
}
