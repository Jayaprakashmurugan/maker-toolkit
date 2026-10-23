import type { Reference } from './types';
import * as powerApps from './power-apps-formulas';
import * as powerAutomate from './power-automate-expressions';

export const powerAppsReference: Reference = {
  slug: 'formula-reference',
  title: 'Power Apps Formula Reference',
  product: 'Power Apps',
  kicker: 'Power Fx · Canvas apps',
  description:
    'Every common Power Fx formula with syntax, parameters, copy-ready examples and maker tips. Search by name or by task.',
  noun: 'formulas',
  singular: 'formula',
  language: 'powerfx',
  searchPlaceholder: 'Search formulas or tasks, like "remove duplicates"',
  items: powerApps.formulas,
  categories: powerApps.categories,
  docsBase: powerApps.docsBase,
  faqs: [
    {
      q: 'Which apps do these formulas work in?',
      a: 'Canvas apps in Power Apps. Many also work in other Power Fx hosts such as Copilot Studio and Dataverse formula columns, but check the official page for each host.',
    },
    {
      q: 'What does "delegable" mean?',
      a: 'A delegable formula is run by the data source itself, so it can work across all of your records. A non-delegable one only sees the first 500 records by default (up to 2,000 if you raise the limit in settings).',
    },
    {
      q: 'Why do some examples use names like txtSearch or colCart?',
      a: 'They follow a common naming convention: txt for text inputs, dd for dropdowns, col for collections and var for variables. Swap in your own control and data names.',
    },
  ],
};

export const powerAutomateReference: Reference = {
  slug: 'expression-reference',
  title: 'Power Automate Expression Reference',
  product: 'Power Automate',
  kicker: 'Workflow expressions · Cloud flows',
  description:
    'All the expression functions you can use in Power Automate cloud flows, with syntax, examples and the gotchas that break flows. Search by name or by task.',
  noun: 'expressions',
  singular: 'expression',
  language: 'wdl',
  searchPlaceholder: 'Search expressions or tasks, like "format date"',
  items: powerAutomate.expressions,
  categories: powerAutomate.categories,
  docsBase: powerAutomate.docsBase,
  faqs: [
    {
      q: 'What are expression functions?',
      a: 'Small formulas that transform data inside a flow: format a date, join text, pick a field from a previous step, count items and more. The same functions also work in Azure Logic Apps.',
    },
    {
      q: 'How do I add an expression to a flow?',
      a: 'Click into any input, open the dynamic content panel (or the fx button), choose Expression, type the expression without a leading @, and select Add. In code view, expressions appear wrapped as @{...}.',
    },
    {
      q: 'How do I format a date?',
      a: "Use formatDateTime with a .NET pattern, for example formatDateTime(utcNow(), 'dd/MM/yyyy'). Remember that utcNow() is in UTC; wrap it in convertTimeZone() to show local time.",
    },
    {
      q: 'How do I stop errors when a field is missing?',
      a: "Use ?['field'] instead of ['field'] so a missing property returns null instead of failing, and coalesce() to supply a default value.",
    },
    {
      q: 'Why does my comparison never match?',
      a: 'Usually a type or case difference. Convert both sides first: int() or float() for numbers, toLower() for text. A number stored as text is not equal to the number itself.',
    },
  ],
};

export const references = [powerAppsReference, powerAutomateReference];
