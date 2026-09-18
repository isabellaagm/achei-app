const KEY = 'achei_guest';

export type SavedGuest = { id: string; name: string };

export function loadSavedGuest(): SavedGuest | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.id === 'string' && typeof parsed.name === 'string') return parsed;
    return null;
  } catch {
    return null;
  }
}

export function saveGuest(guest: SavedGuest) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY, JSON.stringify(guest));
  } catch {
    // localStorage pode estar bloqueado (modo privado) — não é crítico, só não lembra da próxima vez
  }
}

export function clearSavedGuest() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(KEY);
  } catch {
    // idem
  }
}
