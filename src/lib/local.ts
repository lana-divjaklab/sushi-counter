const CLIENT_ID_KEY = "sushi-counter/client-id";
const DISPLAY_NAME_KEY = "sushi-counter/display-name";
const ACTIVE_TABLE_KEY = "sushi-counter/active-table-code";

export function getOrCreateClientId() {
  const existing = localStorage.getItem(CLIENT_ID_KEY);
  if (existing) return existing;
  const next = crypto.randomUUID();
  localStorage.setItem(CLIENT_ID_KEY, next);
  return next;
}

export function getStoredDisplayName() {
  return localStorage.getItem(DISPLAY_NAME_KEY) ?? "";
}

export function setStoredDisplayName(name: string) {
  localStorage.setItem(DISPLAY_NAME_KEY, name);
}

export function getActiveTableCode() {
  return localStorage.getItem(ACTIVE_TABLE_KEY) ?? "";
}

export function setActiveTableCode(code: string) {
  if (!code) {
    localStorage.removeItem(ACTIVE_TABLE_KEY);
    return;
  }
  localStorage.setItem(ACTIVE_TABLE_KEY, code.toUpperCase());
}
