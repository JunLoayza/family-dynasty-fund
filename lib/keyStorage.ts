const KEY_NAME = "claude_api_key";
const MODEL_NAME = "claude_api_model";
const MODE_NAME = "claude_api_storage_mode";

export type StorageMode = "local" | "session";

function canUseLocal(): boolean {
  try {
    const t = "__t";
    localStorage.setItem(t, t);
    localStorage.removeItem(t);
    return true;
  } catch {
    return false;
  }
}

function canUseSession(): boolean {
  try {
    const t = "__t";
    sessionStorage.setItem(t, t);
    sessionStorage.removeItem(t);
    return true;
  } catch {
    return false;
  }
}

export function storageAvailable(): { local: boolean; session: boolean } {
  if (typeof window === "undefined") return { local: false, session: false };
  return { local: canUseLocal(), session: canUseSession() };
}

export function loadKey(): { key: string | null; model: string | null; mode: StorageMode } {
  if (typeof window === "undefined") return { key: null, model: null, mode: "local" };
  const avail = storageAvailable();
  if (avail.local) {
    const k = localStorage.getItem(KEY_NAME);
    if (k) {
      return {
        key: k,
        model: localStorage.getItem(MODEL_NAME),
        mode: "local",
      };
    }
  }
  if (avail.session) {
    const k = sessionStorage.getItem(KEY_NAME);
    if (k) {
      return {
        key: k,
        model: sessionStorage.getItem(MODEL_NAME),
        mode: "session",
      };
    }
  }
  return { key: null, model: null, mode: "local" };
}

export function saveKey(key: string, model: string, mode: StorageMode): void {
  if (typeof window === "undefined") return;
  clearKey();
  const store = mode === "local" ? localStorage : sessionStorage;
  try {
    store.setItem(KEY_NAME, key);
    store.setItem(MODEL_NAME, model);
    store.setItem(MODE_NAME, mode);
  } catch {
    // fall back to the other storage
    const fallback = mode === "local" ? sessionStorage : localStorage;
    fallback.setItem(KEY_NAME, key);
    fallback.setItem(MODEL_NAME, model);
    fallback.setItem(MODE_NAME, mode === "local" ? "session" : "local");
  }
}

export function clearKey(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY_NAME);
    localStorage.removeItem(MODEL_NAME);
    localStorage.removeItem(MODE_NAME);
  } catch {
    /* ignore */
  }
  try {
    sessionStorage.removeItem(KEY_NAME);
    sessionStorage.removeItem(MODEL_NAME);
    sessionStorage.removeItem(MODE_NAME);
  } catch {
    /* ignore */
  }
}

export function looksLikeApiKey(s: string): boolean {
  return /^sk-ant-api\d{2}-/.test(s.trim()) && s.trim().length > 30;
}
