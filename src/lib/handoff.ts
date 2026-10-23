// Passes pasted JSON between the JSON tools in this browser tab only (sessionStorage).
const KEY = 'mt:handoff-json';

export function sendJson(json: string, to: string) {
  try {
    sessionStorage.setItem(KEY, json);
  } catch {}
  window.location.href = to;
}

export function takeJson(): string | null {
  try {
    const json = sessionStorage.getItem(KEY);
    if (json) sessionStorage.removeItem(KEY);
    return json;
  } catch {
    return null;
  }
}
