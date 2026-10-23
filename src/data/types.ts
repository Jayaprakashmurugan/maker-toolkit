export type Lang = 'powerfx' | 'wdl';

export interface Param {
  name: string;
  description: string;
  optional?: boolean;
}

export interface Example {
  code: string;
  /** What the example returns or does. */
  result?: string;
}

export interface RefItem {
  name: string;
  category: string;
  /** One line, shown on cards and in search results. */
  summary: string;
  syntax: string;
  params?: Param[];
  examples: Example[];
  notes?: string[];
  /** Extra search words: tasks people type, like "remove duplicates". */
  tags?: string[];
  /** Page slug or anchor on Microsoft Learn, appended to the reference's docsBase. */
  docs?: string;
}

export interface Category {
  name: string;
  color: string;
}

/** One searchable reference (Power Apps formulas, Power Automate expressions, ...). */
export interface Reference {
  /** URL folder, e.g. "formula-reference". */
  slug: string;
  title: string;
  /** Product name used in page titles: "Patch function · Power Apps". */
  product: string;
  /** Small label above the page title. */
  kicker: string;
  description: string;
  /** Plural and singular words for the items: "formulas" / "formula". */
  noun: string;
  singular: string;
  language: Lang;
  searchPlaceholder: string;
  items: RefItem[];
  categories: Category[];
  docsBase: string;
  faqs: { q: string; a: string }[];
}

export const slugify = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
