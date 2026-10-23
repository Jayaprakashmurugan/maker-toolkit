import type { Reference } from './types';
import * as powerApps from './power-apps-formulas';
import * as powerAutomate from './power-automate-expressions';
import * as desktop from './desktop-formulas';

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

export const desktopReference: Reference = {
  slug: 'desktop-flow-reference',
  title: 'Power Automate Desktop Formula Reference',
  product: 'Power Automate Desktop',
  kicker: 'Power Fx · Desktop flows',
  description:
    'All 130 Power Fx functions you can use in Power Automate desktop flows, with desktop-style examples and the rules that differ from Power Apps.',
  noun: 'formulas',
  singular: 'formula',
  language: 'powerfx',
  searchPlaceholder: 'Search desktop formulas or tasks, like "sort a list"',
  items: desktop.desktopFormulas,
  categories: desktop.categories,
  docsBase: desktop.docsBase,
  faqs: [
    {
      q: 'How do I use Power Fx in a desktop flow?',
      a: 'Turn on the Power Fx option when you create a new desktop flow in Power Automate for desktop. Then type expressions in action inputs, starting with an equals sign.',
    },
    {
      q: 'Why does every formula start with "="?',
      a: 'In Power Fx–enabled desktop flows, an input that starts with = is a formula. Anything else is treated as plain text, so numbers and true/false also need the =.',
    },
    {
      q: 'How do I put a formula inside text?',
      a: 'Use string interpolation without the equals sign: The total is ${Sum(10, 20)}. To write a literal ${, type $${.',
    },
    {
      q: 'Why is the first item number 1?',
      a: 'Like Excel, Power Fx counts from 1, so Index(List, 1) is the first item. Classic desktop flows without Power Fx count from 0.',
    },
    {
      q: 'Why does my variable say it doesn’t exist?',
      a: 'Variable names are case-sensitive in Power Fx–enabled flows (NewVar and newVar are different), and a variable must be set before a formula uses it.',
    },
  ],
};

export const references = [powerAppsReference, powerAutomateReference, desktopReference];
