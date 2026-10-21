const NAMESPACE = 'ham-boilerplate-ia';

function key(name: string): string {
  return `${NAMESPACE}:${name}`;
}

export function getAppStorage(name: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(key(name));
  } catch {
    return null;
  }
}

export function setAppStorage(name: string, value: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key(name), value);
  } catch {
    // localStorage indisponível (modo privado, storage cheio) — ignora silenciosamente.
  }
}
