const KEY = "edu.favorites.v1";

export function getFavorites(): Set<string> {
  try {
    const raw = localStorage.getItem(KEY);
    return new Set<string>(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set<string>();
  }
}

export function toggleFavorite(id: string): Set<string> {
  const set = getFavorites();
  set.has(id) ? set.delete(id) : set.add(id);
  localStorage.setItem(KEY, JSON.stringify([...set]));
  return set;
}

export function isFavorite(id: string): boolean {
  return getFavorites().has(id);
}
