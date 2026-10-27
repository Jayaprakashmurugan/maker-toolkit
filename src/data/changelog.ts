// What's new: new tools, tool improvements and blog posts only, newest first.
// Changes to the site's look, the profile or the About page don't go here.
export interface Release {
  kind: 'tool' | 'blog';
  date: string; // YYYY-MM-DD
  title: string;
  changes: string[];
}

export const changelog: Release[] = [
  {
    kind: 'tool',
    date: '2026-10-26',
    title: 'See what each tool works with',
    changes: [
      'Every tool and reference now shows which products it works with, using Microsoft’s official Power Apps, Power Automate and Dataverse icons next to each product’s name.',
      'Tool pages have a “Works with” row, and the tool tabs and group pages show their product’s icon.',
      'The Dataverse tools are now grouped as Dataverse/SharePoint, at /dataverse-sharepoint/. The old address redirects.',
    ],
  },
  {
    kind: 'blog',
    date: '2026-10-26',
    title: 'Eleven articles on the blog',
    changes: [
      'All seven articles from Medium and four from LinkedIn now live on the blog, with their images and code, from role-based security and deep links to Dataverse vs. SharePoint and the new modern Attachments control.',
      'Power Fx code in posts is now color-coded.',
      'Blog posts appear in site-wide search.',
    ],
  },
  {
    kind: 'tool',
    date: '2026-10-26',
    title: 'Every tool in one place',
    changes: [
      'The homepage and a new Tools page show every tool together, with tabs to narrow them to Power Apps, Power Automate, Dataverse/SharePoint or Utilities.',
    ],
  },
  {
    kind: 'tool',
    date: '2026-10-24',
    title: 'One toolbox, four groups, one search',
    changes: [
      'The tools are now organized into Power Apps, Power Automate, Dataverse/SharePoint and Developer Utilities, each with its own page that also lists tools from other groups that help there.',
      'The homepage shows every tool and reference as an equal card, grouped by product.',
      'New site-wide search: press Ctrl K (⌘K on a Mac) or / on any page to search every tool, formula and expression at once, by name or by task.',
    ],
  },
  {
    kind: 'tool',
    date: '2026-10-24',
    title: 'Regex Tester for Power Fx',
    changes: [
      'New: Regex Tester for IsMatch, Match and MatchAll, with results for each line of your test text or for a whole block.',
      'Checks a pattern against the Power Fx 1.0 rules and explains each problem in plain words, or tests it the way canvas apps run it today.',
      'Shows named and numbered submatches and StartMatch, and writes the three formulas with the right MatchOptions.',
      'Common patterns to start from, including email, Indian mobile numbers, PIN codes and PAN.',
    ],
  },
  {
    kind: 'tool',
    date: '2026-10-24',
    title: 'SVG to Power Apps',
    changes: [
      'New: SVG to Power Apps turns any SVG into an Image formula, as editable text with EncodeUrl or as base64.',
      'Cleans out scripts, design-tool leftovers and comments, adds a missing viewBox, and can round numbers to make the formula shorter.',
      'Finds every color in the SVG so you can change it or drive it from Power Fx, including currentColor icons that would otherwise show black.',
    ],
  },
  {
    kind: 'tool',
    date: '2026-10-24',
    title: 'Trigger Condition Builder',
    changes: [
      'New: Trigger Condition Builder, so a flow only starts when it should, for SharePoint, Dataverse, Outlook and other triggers.',
      'Reads choice, person and lookup columns the right way, and guards text checks against empty values so the condition never errors.',
      'Presets for common cases, such as new items only and ignoring the flow’s own edits to stop loops, plus “any is true” as one @or line.',
    ],
  },
  {
    kind: 'tool',
    date: '2026-10-23',
    title: 'Desktop flows, and every Power Apps formula',
    changes: [
      'New: Power Automate Desktop Formula Reference with all 130 Power Fx functions for desktop flows, each with its own page and desktop-style examples.',
      'The Power Apps Formula Reference now covers all 215 formulas in Microsoft’s canvas-app list, adding Color, HashTags, ReadNFC, ShowHostInfo, Dataverse.Unmask, Type and RecordOf.',
    ],
  },
  {
    kind: 'tool',
    date: '2026-10-23',
    title: 'OData Filter Builder',
    changes: [
      'New: OData Filter Builder for the Filter Query of SharePoint Get items and Dataverse List rows.',
      'Formats each condition the way that data source expects: quoted or unquoted dates, 1/0 or true/false, choice text or numbers, person and lookup columns.',
      'Date shortcuts (7 days ago, start of month), apostrophe escaping, and a display-name to internal-name converter for SharePoint.',
    ],
  },
  {
    kind: 'tool',
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
    kind: 'tool',
    date: '2026-10-23',
    title: 'HTML Table Styler',
    changes: [
      'New: HTML Table Styler makes the output of Create HTML table look good in emails, with six presets and full customization.',
      'Live email preview with your own data, and one Compose step to copy.',
      'Inline styles that work in every email app, including classic Outlook, or a style block with zebra stripes.',
    ],
  },
  {
    kind: 'tool',
    date: '2026-10-23',
    title: 'List Copier',
    changes: [
      'New: List Copier recreates a SharePoint list and its custom columns on another site, including across tenants.',
      'No sign-in on this site and no app registration: run the generated script in the browser console, as Power Automate steps, or with PnP PowerShell.',
      'Keeps internal names, choices, defaults and formulas. Creates calculated columns last, and flags lookup and managed metadata columns.',
    ],
  },
  {
    kind: 'tool',
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
    kind: 'tool',
    date: '2026-10-23',
    title: 'JSON Schema Helper',
    changes: [
      'New: JSON Schema Helper builds a Parse JSON schema from sample JSON that allows nulls and missing fields, so runs stop failing on empty values.',
      'It merges every item in an array, not just the first, and lists a ready-to-use expression for every field.',
      'Plain-English JSON error messages with the exact line and column.',
    ],
  },
  {
    kind: 'tool',
    date: '2026-10-23',
    title: 'Power Automate, a beautifier and nearly 100 more formulas',
    changes: [
      'New: Power Automate Expression Reference covering every workflow expression function, each with its own page.',
      'New: Expression Beautifier for Power Automate and Power Fx, with rainbow brackets and syntax checks.',
      'The Power Apps Formula Reference grows to about 200 formulas, adding trigonometry, signals, AI, testing and operators.',
    ],
  },
  {
    kind: 'tool',
    date: '2026-10-23',
    title: 'Power Apps Formula Reference',
    changes: [
      'New: Power Apps Formula Reference with search by name or task, A–Z, categories, cards and tree views.',
      'A page for every formula, with copy-ready syntax and examples.',
    ],
  },
];
