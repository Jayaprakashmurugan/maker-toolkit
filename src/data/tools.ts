import { desktopReference, powerAppsReference, powerAutomateReference } from './references';

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
    title: desktopReference.title,
    description: 'The Power Fx functions for desktop flows, with desktop-style examples and the rules that differ from Power Apps.',
    href: `/${desktopReference.slug}/`,
    status: 'live',
    meta: `${desktopReference.items.length} formulas · ${desktopReference.categories.length} categories`,
  },
  {
    title: 'Expression Beautifier',
    description: 'Paste a long one-line expression and get it back indented, color-coded and checked.',
    href: '/expression-beautifier/',
    status: 'live',
    meta: 'Power Automate + Power Fx',
  },
  {
    title: 'HTML Table Styler',
    description: 'Make Create HTML table look good in Outlook and Gmail. Pick a style, preview it, copy one Compose step.',
    href: '/html-table-styler/',
    status: 'live',
    meta: 'Power Automate · Emails',
  },
  {
    title: 'Adaptive Card Builder',
    description: 'Teams cards for approvals, alerts and forms: start from a template, preview it like Teams, copy the JSON.',
    href: '/adaptive-card-builder/',
    status: 'live',
    meta: 'Power Automate · Teams',
  },
  {
    title: 'OData Filter Builder',
    description: 'Build the Filter Query for SharePoint Get items or Dataverse List rows, with the right quotes and dates.',
    href: '/odata-filter-builder/',
    status: 'live',
    meta: 'SharePoint + Dataverse',
  },
  {
    title: 'Trigger Condition Builder',
    description: 'Make a flow start only when it should: build trigger conditions for SharePoint, Dataverse and Outlook.',
    href: '/trigger-condition-builder/',
    status: 'live',
    meta: 'Power Automate · Triggers',
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
