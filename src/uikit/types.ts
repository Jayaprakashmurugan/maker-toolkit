// What a UI Kit item is: its catalog details, the options people can change, and how it builds its snippet.

import type { Snippet } from './model';

export type KitCategory = 'Navigation' | 'Inputs' | 'Feedback' | 'Data display' | 'Layouts' | 'Screens';

export const KIT_CATEGORIES: { id: KitCategory; blurb: string }[] = [
  { id: 'Navigation', blurb: 'Headers, sidebars, tabs and the way around an app.' },
  { id: 'Inputs', blurb: 'Buttons, fields, search and filters.' },
  { id: 'Feedback', blurb: 'Dialogs, banners, loading and empty states.' },
  { id: 'Data display', blurb: 'Lists, tables, pills and cards for your records.' },
  { id: 'Layouts', blurb: 'Screen skeletons built from containers.' },
  { id: 'Screens', blurb: 'Complete screens to start an app from.' },
];

export type KitOption =
  | { id: string; label: string; type: 'text'; default: string }
  | { id: string; label: string; type: 'select'; default: string; choices: { value: string; label: string }[] }
  | { id: string; label: string; type: 'toggle'; default: boolean }
  | { id: string; label: string; type: 'number'; default: number; min: number; max: number; step?: number }
  | { id: string; label: string; type: 'lines'; default: string[]; hint?: string };

export type KitValues = Record<string, string | number | boolean | string[]>;

export interface KitItem {
  slug: string;
  name: string;
  category: KitCategory;
  summary: string;
  keywords?: string[];
  options: KitOption[];
  build: (o: KitValues) => Snippet;
  /** The preview canvas: its size and background. */
  canvas: { w: number; h: number; bg?: 'page' | 'white' | 'dark' };
}

export const defaults = (item: KitItem): KitValues => Object.fromEntries(item.options.map((o) => [o.id, o.default]));

/** Read option values with the right types. */
export const reader = (o: KitValues) => ({
  s: (id: string) => String(o[id] ?? ''),
  n: (id: string) => Number(o[id] ?? 0),
  b: (id: string) => Boolean(o[id]),
  lines: (id: string) => (Array.isArray(o[id]) ? (o[id] as string[]) : String(o[id] ?? '').split('\n')).map((l) => l.trim()).filter(Boolean),
});
