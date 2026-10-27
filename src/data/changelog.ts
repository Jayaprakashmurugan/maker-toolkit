// Newest first. Add an entry whenever you ship something visitors would notice.
export interface Release {
  version: string;
  date: string; // YYYY-MM-DD
  title: string;
  changes: string[];
}

export const changelog: Release[] = [
  {
    version: '3.4',
    date: '2026-10-28',
    title: 'Cards that lean in',
    changes: [
      'Cards all over the site now tilt toward your cursor with a soft sheen, like the profile card: tools, categories, formulas, videos, certifications and more. Bigger cards tilt less, and it stays off on touch screens and when you prefer reduced motion.',
      'On the homepage the profile card now stands on its own, and the hero search no longer repeats the Ctrl K hint shown in the header.',
      'Blog posts no longer show their date, where they were first published or the “Written by” box, and the post list numbers posts instead of dating them.',
    ],
  },
  {
    version: '3.3',
    date: '2026-10-26',
    title: 'Work experience and a cleaner profile card',
    changes: [
      'The About page now has my Power Platform work experience: every role with its dates and skills, and a career bar up to today.',
      'A new profile card: the photo runs edge to edge with the name on it, followed by where I work now, where I’m based and my certifications, each with its own icon. Its gradient border slowly turns clockwise.',
    ],
  },
  {
    version: '3.2',
    date: '2026-10-26',
    title: 'Official product icons',
    changes: [
      'Every tool and reference now shows which products it works with, using Microsoft’s official Power Apps, Power Automate and Dataverse icons next to each product’s name.',
      'Tool pages have a “Works with” row, and the tool tabs and group pages show their product’s icon.',
    ],
  },
  {
    version: '3.1',
    date: '2026-10-26',
    title: 'Power Platform colors and a Maker ID',
    changes: [
      'A new color scheme taken from the Power Platform family: Power Apps magenta, Power Automate blue, Dataverse/SharePoint teal and Power BI gold, with each tool group in its own color.',
      'The profile is now a Maker ID badge that tilts toward your cursor with a holographic sheen.',
      'The data group is now called Dataverse/SharePoint everywhere, at /dataverse-sharepoint/. The old address redirects.',
    ],
  },
  {
    version: '3.0',
    date: '2026-10-26',
    title: 'A formula console of our own',
    changes: [
      'A completely new look: dark by default with signal lime and aqua, the Unbounded display font, and a warm-grey light mode.',
      'A new homepage: a live formula bar that types real Power Fx and flow expressions, a scrolling strip of function names, and a bento layout.',
      'Tool cards light up where your cursor is, buttons lean toward it, and blog posts preview their cover as you hover the list.',
      'A floating navigation bar, a reading-progress bar on posts, an About timeline and a giant animated wordmark in the footer.',
      'All motion turns off automatically if your device is set to reduce motion.',
    ],
  },
  {
    version: '2.1',
    date: '2026-10-26',
    title: 'Eleven articles on the blog',
    changes: [
      'All seven articles from Medium and four from LinkedIn now live on the blog, with their images, code and original dates, from role-based security and deep links to Dataverse vs. SharePoint and the new modern Attachments control.',
      'Power Fx code in posts is now color-coded, and each imported post links back to where it was first published.',
      'Blog posts appear in site-wide search.',
    ],
  },
  {
    version: '2.0',
    date: '2026-10-26',
    title: 'A new look, and room for guides and videos',
    changes: [
      'A brighter, cleaner design across every page, with a new typeface, rounded cards, an orange accent and a refreshed dark mode.',
      'A new homepage with every tool in one place and tabs to narrow it to Power Apps, Power Automate, Dataverse or Utilities.',
      'New Tools, About and Contact pages, and a menu that works on phones.',
      'The blog and videos are ready: guides and walkthroughs will appear here as they are published.',
    ],
  },
  {
    version: '1.14',
    date: '2026-10-24',
    title: 'One toolbox, four groups, one search',
    changes: [
      'The site is now organized into Power Apps, Power Automate, Dataverse and Developer Utilities, each with its own page that also lists tools from other groups that help there.',
      'The homepage shows every tool and reference as an equal card, grouped by product.',
      'New site-wide search: press Ctrl K (⌘K on a Mac) or / on any page to search every tool, formula and expression at once, by name or by task.',
      'The footer now lists every tool by group.',
    ],
  },
  {
    version: '1.13',
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
    version: '1.12',
    date: '2026-10-24',
    title: 'SVG to Power Apps',
    changes: [
      'New: SVG to Power Apps turns any SVG into an Image formula, as editable text with EncodeUrl or as base64.',
      'Cleans out scripts, design-tool leftovers and comments, adds a missing viewBox, and can round numbers to make the formula shorter.',
      'Finds every color in the SVG so you can change it or drive it from Power Fx, including currentColor icons that would otherwise show black.',
    ],
  },
  {
    version: '1.11',
    date: '2026-10-24',
    title: 'Trigger Condition Builder',
    changes: [
      'New: Trigger Condition Builder, so a flow only starts when it should, for SharePoint, Dataverse, Outlook and other triggers.',
      'Reads choice, person and lookup columns the right way, and guards text checks against empty values so the condition never errors.',
      'Presets for common cases, such as new items only and ignoring the flow’s own edits to stop loops, plus “any is true” as one @or line.',
    ],
  },
  {
    version: '1.10',
    date: '2026-10-23',
    title: 'Desktop flows, and every Power Apps formula',
    changes: [
      'New: Power Automate Desktop Formula Reference with all 130 Power Fx functions for desktop flows, each with its own page and desktop-style examples.',
      'The Power Apps Formula Reference now covers all 215 formulas in Microsoft’s canvas-app list, adding Color, HashTags, ReadNFC, ShowHostInfo, Dataverse.Unmask, Type and RecordOf.',
    ],
  },
  {
    version: '1.9',
    date: '2026-10-23',
    title: 'OData Filter Builder',
    changes: [
      'New: OData Filter Builder for the Filter Query of SharePoint Get items and Dataverse List rows.',
      'Formats each condition the way that data source expects: quoted or unquoted dates, 1/0 or true/false, choice text or numbers, person and lookup columns.',
      'Date shortcuts (7 days ago, start of month), apostrophe escaping, and a display-name to internal-name converter for SharePoint.',
    ],
  },
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
