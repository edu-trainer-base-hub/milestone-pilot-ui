const ACTIVE_SESSION_KEY = "english-coach:active-session-uuid";

const AUTOPLAY_PREF_KEY = "english-coach:preferences:autoplay";

/* ───────── active session id ───────── */

export function loadActiveSessionId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_SESSION_KEY);
  } catch {
    return null;
  }
}

export function saveActiveSessionId(id: string | null): void {
  try {
    if (id === null) {
      localStorage.removeItem(ACTIVE_SESSION_KEY);
    } else {
      localStorage.setItem(ACTIVE_SESSION_KEY, id);
    }
  } catch (err) {
    console.error("[englishCoachStorage] saveActiveSessionId failed", err);
  }
}

/* ───────── preferences ───────── */

export function loadAutoPlay(): boolean {
  try {
    const val = localStorage.getItem(AUTOPLAY_PREF_KEY);
    // default to false if not set
    return val === "true";
  } catch {
    return false;
  }
}

export function saveAutoPlay(enabled: boolean): void {
  try {
    localStorage.setItem(AUTOPLAY_PREF_KEY, String(enabled));
  } catch (err) {
    console.error("[englishCoachStorage] saveAutoPlay failed", err);
  }
}

/* ───────── cleanup ───────── */

export function clearAllCoachData(): void {
  try {
    localStorage.removeItem("english-coach:sessions:v1"); // clean up legacy data
    localStorage.removeItem(ACTIVE_SESSION_KEY);
    localStorage.removeItem(AUTOPLAY_PREF_KEY);
  } catch (err) {
    console.error("[englishCoachStorage] clearAllCoachData failed", err);
  }
}
