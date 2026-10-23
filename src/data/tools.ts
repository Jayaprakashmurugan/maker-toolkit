import { formulas, categories, docsBase } from './power-apps-formulas';

export interface Tool {
  title: string;
  description: string;
  href?: string;
  status: 'live' | 'planned';
  meta?: string;
}

export const powerAppsReference = {
  slug: 'formula-reference',
  title: 'Power Apps Formula Reference',
  description:
    'Every common Power Fx formula with syntax, parameters, copy-ready examples and maker tips. Search by name or by task.',
  items: formulas,
  categories,
  docsBase,
};

export const tools: Tool[] = [
  {
    title: powerAppsReference.title,
    description: 'Search Power Fx formulas by name or by task. Copy syntax and examples in one click.',
    href: `/${powerAppsReference.slug}/`,
    status: 'live',
    meta: `${formulas.length} formulas · ${categories.length} categories`,
  },
  {
    title: 'Power Automate Expressions',
    description: 'The same explorer for workflow expression functions: strings, dates, collections and more.',
    status: 'planned',
  },
  {
    title: 'Expression Beautifier',
    description: 'Paste a long one-line expression and get it back indented and readable.',
    status: 'planned',
  },
];
