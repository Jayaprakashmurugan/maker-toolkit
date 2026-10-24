import { desktopReference, powerAppsReference, powerAutomateReference } from './references';

export type CategoryId = 'power-apps' | 'power-automate' | 'dataverse' | 'developer-utilities';

export interface ToolCategory {
  id: CategoryId;
  name: string;
  /** Short label for tight spaces, like the header. */
  short: string;
  /** One line under the category name. */
  summary: string;
  /** A longer introduction for the category page. */
  intro: string;
  /** Marker color for cards and search results. */
  color: string;
}

/** The four parts of the site, in display order. Each has a page at /<id>/. */
export const categories: ToolCategory[] = [
  {
    id: 'power-apps',
    name: 'Power Apps',
    short: 'Power Apps',
    summary: 'Formulas, patterns and assets for canvas apps.',
    intro: 'Look up any Power Fx formula, test the patterns you validate input with, and turn icons into formulas you can theme.',
    color: '#9b4dca',
  },
  {
    id: 'power-automate',
    name: 'Power Automate',
    short: 'Power Automate',
    summary: 'Expressions, triggers, emails and cards for cloud and desktop flows.',
    intro: 'Every expression function, plus builders for the parts of a flow that usually take trial and error: trigger conditions, Parse JSON schemas, HTML emails and Teams cards.',
    color: '#2f6fde',
  },
  {
    id: 'dataverse',
    name: 'Dataverse',
    short: 'Dataverse',
    summary: 'Query, filter and move data in Dataverse and SharePoint.',
    intro: 'Tools for the data layer: filter queries that return the right rows, and copying list structures between sites and tenants.',
    color: '#0d8a6a',
  },
  {
    id: 'developer-utilities',
    name: 'Developer Utilities',
    short: 'Utilities',
    summary: 'Format, read and debug formulas and JSON from any product.',
    intro: 'General-purpose helpers for the middle of a build: make a long expression readable, or turn a step’s JSON output into the exact expression you need.',
    color: '#e8461a',
  },
];

export const categoryById = (id: CategoryId) => categories.find((c) => c.id === id)!;

export interface Tool {
  title: string;
  description: string;
  href: string;
  /** A reference library, or a tool that does one job. */
  kind: 'reference' | 'tool';
  /** Where the tool lives: its card, page and footer column. */
  category: CategoryId;
  /** Other categories it's also useful for, listed on those category pages. */
  also?: CategoryId[];
  meta: string;
  /** Extra words people might search for. */
  keywords?: string;
}

export const tools: Tool[] = [
  {
    title: powerAppsReference.title,
    description: 'Search Power Fx formulas by name or by task. Copy syntax and examples in one click.',
    href: `/${powerAppsReference.slug}/`,
    kind: 'reference',
    category: 'power-apps',
    meta: `${powerAppsReference.items.length} formulas · ${powerAppsReference.categories.length} categories`,
    keywords: 'power fx functions canvas app',
  },
  {
    title: 'Regex Tester for Power Fx',
    description: 'Test patterns for IsMatch, Match and MatchAll, check them against Power Fx’s rules, and copy the formula.',
    href: '/regex-tester/',
    kind: 'tool',
    category: 'power-apps',
    also: ['dataverse'],
    meta: 'IsMatch · Match · MatchAll',
    keywords: 'regular expression validate input email phone pattern',
  },
  {
    title: 'SVG to Power Apps',
    description: 'Turn an SVG icon into an Image formula you can paste, with colors you can drive from Power Fx.',
    href: '/svg-to-power-apps/',
    kind: 'tool',
    category: 'power-apps',
    meta: 'Image control · Icons',
    keywords: 'svg icon image data uri encodeurl base64 color',
  },
  {
    title: powerAutomateReference.title,
    description: 'Every workflow expression function: strings, dates, collections, conversions and more.',
    href: `/${powerAutomateReference.slug}/`,
    kind: 'reference',
    category: 'power-automate',
    meta: `${powerAutomateReference.items.length} expressions · ${powerAutomateReference.categories.length} categories`,
    keywords: 'workflow definition language functions logic apps',
  },
  {
    title: desktopReference.title,
    description: 'The Power Fx functions for desktop flows, with desktop-style examples and the rules that differ from Power Apps.',
    href: `/${desktopReference.slug}/`,
    kind: 'reference',
    category: 'power-automate',
    meta: `${desktopReference.items.length} formulas · ${desktopReference.categories.length} categories`,
    keywords: 'power automate desktop pad rpa power fx',
  },
  {
    title: 'Trigger Condition Builder',
    description: 'Make a flow start only when it should: build trigger conditions for SharePoint, Dataverse and Outlook.',
    href: '/trigger-condition-builder/',
    kind: 'tool',
    category: 'power-automate',
    also: ['dataverse'],
    meta: 'Triggers · Settings',
    keywords: 'trigger condition loop stop flow running filter',
  },
  {
    title: 'JSON Schema Helper',
    description: 'Paste sample JSON and get a Parse JSON schema that won’t fail on nulls, plus an expression for every field.',
    href: '/json-schema-helper/',
    kind: 'tool',
    category: 'power-automate',
    also: ['developer-utilities'],
    meta: 'Parse JSON',
    keywords: 'parse json schema null error',
  },
  {
    title: 'HTML Table Styler',
    description: 'Make Create HTML table look good in Outlook and Gmail. Pick a style, preview it, copy one Compose step.',
    href: '/html-table-styler/',
    kind: 'tool',
    category: 'power-automate',
    meta: 'Emails · Create HTML table',
    keywords: 'html table email css outlook style',
  },
  {
    title: 'Adaptive Card Builder',
    description: 'Teams cards for approvals, alerts and forms: start from a template, preview it like Teams, copy the JSON.',
    href: '/adaptive-card-builder/',
    kind: 'tool',
    category: 'power-automate',
    meta: 'Teams · Approvals',
    keywords: 'adaptive card teams approval json',
  },
  {
    title: 'OData Filter Builder',
    description: 'Build the Filter Query for SharePoint Get items or Dataverse List rows, with the right quotes and dates.',
    href: '/odata-filter-builder/',
    kind: 'tool',
    category: 'dataverse',
    also: ['power-automate'],
    meta: 'List rows · Get items',
    keywords: 'odata filter query list rows get items sharepoint',
  },
  {
    title: 'List Copier',
    description: 'Copy a SharePoint list and its columns to another site or tenant, with no app registration needed.',
    href: '/list-copier/',
    kind: 'tool',
    category: 'dataverse',
    meta: 'SharePoint · Microsoft Lists',
    keywords: 'sharepoint list copy columns migrate tenant pnp',
  },
  {
    title: 'Expression Beautifier',
    description: 'Paste a long one-line expression and get it back indented, color-coded and checked.',
    href: '/expression-beautifier/',
    kind: 'tool',
    category: 'developer-utilities',
    also: ['power-automate', 'power-apps'],
    meta: 'Power Automate + Power Fx',
    keywords: 'format indent prettify brackets',
  },
  {
    title: 'Expression Picker',
    description: 'Paste a step’s JSON, click the value you need, and copy its Power Automate expression and Power Apps formula.',
    href: '/json-expression-picker/',
    kind: 'tool',
    category: 'developer-utilities',
    also: ['power-automate', 'power-apps'],
    meta: 'JSON to expression',
    keywords: 'json path expression parsejson body outputs',
  },
];

export const toolsIn = (id: CategoryId) => tools.filter((t) => t.category === id);
export const alsoIn = (id: CategoryId) => tools.filter((t) => t.also?.includes(id));
