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
  /** Page slug on Microsoft Learn, appended to the reference's docsBase. */
  docs?: string;
}

export interface Category {
  name: string;
  color: string;
}

export const slugify = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
