// The theme a visitor picked, kept in their own browser (localStorage) and applied to every UI Kit page.
// Nothing is sent anywhere.

import { COLOR_KEYS, STATUS_KEYS, themeById, themeVars, type ColorKey, type KitTheme, type StatusIndex } from './theme';

export const THEME_KEY = 'mt-uikit-theme';
export const THEME_EVENT = 'mt-uikit-theme';

export interface StoredTheme {
  base: string;
  colors?: Partial<Record<ColorKey, string>>;
  status?: Partial<Record<StatusIndex, string>>;
  statusFont?: Partial<Record<StatusIndex, string>>;
}

const HEX = /^#[0-9A-Fa-f]{6}$/;

/** A preset with the visitor's own colors on top. Bad values are ignored. */
export function resolveTheme(st: StoredTheme | null | undefined): KitTheme {
  const base = themeById(st?.base ?? 'slate');
  if (!st) return base;
  const colors = { ...base.colors };
  for (const k of COLOR_KEYS) if (st.colors?.[k] && HEX.test(st.colors[k]!)) colors[k] = st.colors[k]!.toUpperCase();
  const status = { ...base.status };
  const statusFont = { ...base.statusFont };
  for (const i of STATUS_KEYS) {
    if (st.status?.[i] && HEX.test(st.status[i]!)) status[i] = st.status[i]!.toUpperCase();
    if (st.statusFont?.[i] && HEX.test(st.statusFont[i]!)) statusFont[i] = st.statusFont[i]!.toUpperCase();
  }
  const custom = Boolean(st.colors && Object.keys(st.colors).length) || Boolean(st.status && Object.keys(st.status).length);
  return { ...base, id: custom ? 'custom' : base.id, name: custom ? `${base.name} (custom)` : base.name, colors, status, statusFont };
}

export function loadStored(): StoredTheme | null {
  try {
    const raw = localStorage.getItem(THEME_KEY);
    return raw ? (JSON.parse(raw) as StoredTheme) : null;
  } catch {
    return null;
  }
}

export function saveStored(st: StoredTheme | null) {
  try {
    if (st) localStorage.setItem(THEME_KEY, JSON.stringify(st));
    else localStorage.removeItem(THEME_KEY);
  } catch {
    /* private mode: the theme just won't be remembered */
  }
  const t = resolveTheme(st);
  applyTheme(t);
  window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: st }));
}

/** Puts a theme's CSS variables on the page, so every preview repaints in it. */
export function applyTheme(t: KitTheme) {
  const root = document.documentElement;
  for (const [k, v] of Object.entries(themeVars(t))) root.style.setProperty(k, v);
}
