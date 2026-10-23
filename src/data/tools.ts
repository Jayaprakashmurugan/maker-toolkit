import { powerAppsReference, powerAutomateReference } from './references';

export interface Tool {
  title: string;
  description: string;
  href?: string;
  status: 'live' | 'planned';
  meta?: string;
}

export const tools: Tool[] = [
  {
    title: powerAppsReference.title,
    description: 'Search Power Fx formulas by name or by task. Copy syntax and examples in one click.',
    href: `/${powerAppsReference.slug}/`,
    status: 'live',
    meta: `${powerAppsReference.items.length} formulas · ${powerAppsReference.categories.length} categories`,
  },
  {
    title: powerAutomateReference.title,
    description: 'Every workflow expression function: strings, dates, collections, conversions and more.',
    href: `/${powerAutomateReference.slug}/`,
    status: 'live',
    meta: `${powerAutomateReference.items.length} expressions · ${powerAutomateReference.categories.length} categories`,
  },
  {
    title: 'Expression Beautifier',
    description: 'Paste a long one-line expression and get it back indented, color-coded and checked.',
    href: '/expression-beautifier/',
    status: 'live',
    meta: 'Power Automate + Power Fx',
  },
  {
    title: 'Expression Picker',
    description: 'Paste a step’s JSON, click the value you need, and copy its Power Automate expression and Power Apps formula.',
    href: '/json-expression-picker/',
    status: 'live',
    meta: 'Power Automate + Power Apps',
  },
  {
    title: 'List Copier',
    description: 'Copy a SharePoint list and its columns to another site or tenant, with no app registration needed.',
    href: '/list-copier/',
    status: 'live',
    meta: 'SharePoint · Microsoft Lists',
  },
  {
    title: 'JSON Schema Helper',
    description: 'Paste sample JSON and get a Parse JSON schema that won’t fail on nulls, plus an expression for every field.',
    href: '/json-schema-helper/',
    status: 'live',
    meta: 'Power Automate · Parse JSON',
  },
];
