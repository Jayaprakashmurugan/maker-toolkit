// Newest first. Add an entry whenever you ship something visitors would notice.
export interface Release {
  version: string;
  date: string; // YYYY-MM-DD
  title: string;
  changes: string[];
}

export const changelog: Release[] = [
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
