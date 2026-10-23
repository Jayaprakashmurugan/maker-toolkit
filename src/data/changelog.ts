// Newest first. Add an entry whenever you ship something visitors would notice.
export interface Release {
  version: string;
  date: string; // YYYY-MM-DD
  title: string;
  changes: string[];
}

export const changelog: Release[] = [
  {
    version: '1.8',
    date: '2026-10-23',
    title: 'Adaptive Card Builder',
    changes: [
      'New: Adaptive Card Builder with templates for approvals, notifications, feedback forms and status updates.',
      'Live Teams-style preview in light and dark, using Microsoft’s official Adaptive Cards renderer.',
      'Copy-ready JSON for the Teams actions, plus the expressions that read the reply: the button pressed, each input and who responded.',
      'Paste any card JSON to preview it.',
    ],
  },
  {
    version: '1.7',
    date: '2026-10-23',
    title: 'HTML Table Styler',
    changes: [
      'New: HTML Table Styler makes the output of Create HTML table look good in emails, with six presets and full customization.',
      'Live email preview with your own data, and one Compose step to copy.',
      'Inline styles that work in every email app, including classic Outlook, or a style block with zebra stripes.',
    ],
  },
  {
    version: '1.6',
    date: '2026-10-23',
    title: 'List Copier',
    changes: [
      'New: List Copier recreates a SharePoint list and its custom columns on another site, including across tenants.',
      'No sign-in on this site and no app registration: run the generated script in the browser console, as Power Automate steps, or with PnP PowerShell.',
      'Keeps internal names, choices, defaults and formulas. Creates calculated columns last, and flags lookup and managed metadata columns.',
    ],
  },
  {
    version: '1.5',
    date: '2026-10-23',
    title: 'Expression Picker',
    changes: [
      'New: Expression Picker. Paste a step’s JSON, click any value, and copy a paste-ready Power Automate expression.',
      'Works for actions, Compose, the trigger, variables and loop items, and detects raw outputs automatically.',
      'For values in a list, choose one item, the first item safely with first(), or every item with the exact list to loop over.',
      'Also gives the matching Power Apps ParseJSON formula, and hands your JSON to the JSON Schema Helper in one click.',
    ],
  },
  {
    version: '1.4',
    date: '2026-10-23',
    title: 'A proper logo',
    changes: [
      'New logo: formula brackets cut by the orange slash from Maker/Toolkit, used everywhere from the header to share images.',
      'Home-screen icons for iPhone and Android, a favicon that adapts to dark browser tabs, and a web app manifest.',
      'Brand kit for anyone writing about the site: /brand/logo.svg, /brand/logo-512.png, /brand/lockup-light.png and /brand/lockup-dark.png.',
    ],
  },
  {
    version: '1.3',
    date: '2026-10-23',
    title: 'Motion',
    changes: [
      'Titles decode from code symbols, and the homepage types its formulas as you watch.',
      'Beautifier and schema output unfold line by line; sections slide in as you scroll.',
      'Smooth page-to-page transitions in supporting browsers.',
      'All motion turns off automatically if your device is set to reduce motion.',
    ],
  },
  {
    version: '1.2',
    date: '2026-10-23',
    title: 'JSON Schema Helper',
    changes: [
      'New: JSON Schema Helper builds a Parse JSON schema from sample JSON that allows nulls and missing fields, so runs stop failing on empty values.',
      'It merges every item in an array, not just the first, and lists a ready-to-use expression for every field.',
      'Plain-English JSON error messages with the exact line and column.',
    ],
  },
  {
    version: '1.1',
    date: '2026-10-23',
    title: 'Power Automate, a beautifier and nearly 100 more formulas',
    changes: [
      'New: Power Automate Expression Reference covering every workflow expression function, each with its own page.',
      'New: Expression Beautifier for Power Automate and Power Fx, with rainbow brackets and syntax checks.',
      'The Power Apps Formula Reference grows to about 200 formulas, adding trigonometry, signals, AI, testing and operators.',
      'Every page now has a share image, so links look good on LinkedIn, Teams and WhatsApp.',
      'New: this What’s new page.',
    ],
  },
  {
    version: '1.0',
    date: '2026-10-23',
    title: 'Launch',
    changes: [
      'Power Apps Formula Reference with search by name or task, A–Z, categories, cards and tree views.',
      'A page for every formula, with copy-ready syntax and examples.',
      'Light and dark themes, no cookies, no sign-up.',
    ],
  },
];
