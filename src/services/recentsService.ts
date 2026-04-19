const KEY = "edu.recents.v1";
type Recent = { id: string; at: number };

export function getRecents(): Recent[] {
  try {
    const raw = localStorage.getItem(KEY);
    const list: Recent[] = raw ? JSON.parse(raw) : [];
    return list.sort((a, b) => b.at - a.at).slice(0, 10);
  } catch {
    return [];
  }
}

export function pushRecent(id: string) {
  const list = getRecents().filter((r) => r.id !== id);
  list.unshift({ id, at: Date.now() });
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, 20)));
}
