// Styles the output of Power Automate's "Create HTML table" action for emails.
// Two methods: inline styles via replace() (works in every client, including Outlook for
// Windows) or a <style> block (allows zebra stripes, which classic Outlook ignores).

export type Borders = 'grid' | 'rows' | 'none';
export type Method = 'inline' | 'block';

export interface TableStyle {
  headerBg: string;
  headerText: string;
  text: string;
  border: string;
  borders: Borders;
  font: string;
  fontSize: number;
  padding: number;
  zebra: boolean;
  zebraBg: string;
  fullWidth: boolean;
  align: 'left' | 'center';
}

export const PRESETS: Record<string, TableStyle> = {
  Clean: { headerBg: '#f3f4f6', headerText: '#111827', text: '#1f2937', border: '#d1d5db', borders: 'grid', font: 'Segoe UI, Arial, sans-serif', fontSize: 14, padding: 8, zebra: false, zebraBg: '#f9fafb', fullWidth: true, align: 'left' },
  Corporate: { headerBg: '#1f4e79', headerText: '#ffffff', text: '#1f2937', border: '#c7d3e0', borders: 'grid', font: 'Segoe UI, Arial, sans-serif', fontSize: 14, padding: 8, zebra: false, zebraBg: '#eef3f8', fullWidth: true, align: 'left' },
  'Dark header': { headerBg: '#1b1a17', headerText: '#f3efe6', text: '#1b1a17', border: '#d8d0bf', borders: 'rows', font: 'Arial, sans-serif', fontSize: 14, padding: 9, zebra: false, zebraBg: '#f6f3ec', fullWidth: true, align: 'left' },
  Minimal: { headerBg: '#ffffff', headerText: '#111827', text: '#374151', border: '#e5e7eb', borders: 'rows', font: 'Calibri, Arial, sans-serif', fontSize: 14, padding: 7, zebra: false, zebraBg: '#f9fafb', fullWidth: false, align: 'left' },
  Warm: { headerBg: '#e8461a', headerText: '#ffffff', text: '#1b1a17', border: '#f1c8b8', borders: 'grid', font: 'Verdana, Arial, sans-serif', fontSize: 13, padding: 8, zebra: false, zebraBg: '#fdf1ec', fullWidth: true, align: 'left' },
  Striped: { headerBg: '#334155', headerText: '#ffffff', text: '#1f2937', border: '#e2e8f0', borders: 'rows', font: 'Segoe UI, Arial, sans-serif', fontSize: 14, padding: 8, zebra: true, zebraBg: '#f1f5f9', fullWidth: true, align: 'left' },
  Compact: { headerBg: '#e5e7eb', headerText: '#111827', text: '#111827', border: '#cbd5e1', borders: 'grid', font: 'Arial, sans-serif', fontSize: 12, padding: 4, zebra: false, zebraBg: '#f8fafc', fullWidth: false, align: 'left' },
};

const cssOf = (s: TableStyle) => {
  const line = `1px solid ${s.border}`;
  const cell = [
    `padding:${s.padding}px ${Math.round(s.padding * 1.5)}px`,
    `text-align:${s.align}`,
    s.borders === 'grid' ? `border:${line}` : s.borders === 'rows' ? `border-bottom:${line}` : '',
  ].filter(Boolean);
  return {
    table: [`border-collapse:collapse`, s.fullWidth ? 'width:100%' : '', `font-family:${s.font}`, `font-size:${s.fontSize}px`, `color:${s.text}`]
      .filter(Boolean)
      .join(';'),
    th: [...cell, `background-color:${s.headerBg}`, `color:${s.headerText}`, 'font-weight:bold'].join(';'),
    td: cell.join(';'),
  };
};

/** Turns a JSON array (what you give Create HTML table) into the same HTML the action produces. */
export function tableFromRows(rows: Record<string, unknown>[]): string {
  const cols = [...new Set(rows.flatMap((r) => Object.keys(r)))];
  const esc = (v: unknown) =>
    String(v ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  return `<table><thead><tr>${cols.map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${rows
    .map((r) => `<tr>${cols.map((c) => `<td>${esc(r[c])}</td>`).join('')}</tr>`)
    .join('')}</tbody></table>`;
}

const SAMPLE_ROWS = [
  { Order: 'A-1042', Customer: 'Contoso Ltd', Region: 'North America', Status: 'Shipped', Total: '$12,450' },
  { Order: 'A-1043', Customer: 'Fabrikam', Region: 'Europe West', Status: 'Pending', Total: '$8,920' },
  { Order: 'A-1044', Customer: 'Northwind', Region: 'Asia Pacific', Status: 'Shipped', Total: '$15,100' },
  { Order: 'A-1045', Customer: 'Tailspin Toys', Region: 'Europe West', Status: 'On hold', Total: '$2,310' },
];
export const SAMPLE_JSON = JSON.stringify(SAMPLE_ROWS, null, 2);

export interface StyledOutput {
  /** The Power Automate expression or Compose content to copy. */
  code: string;
  /** Same thing wrapped in @{ } where relevant, for pasting into a Compose. */
  pasteReady: string;
  /** HTML that shows what the email will look like (for the preview). */
  previewHtml: string;
}

const q = (s: string) => `'${s.replace(/'/g, "''")}'`;

export function styleTable(tableHtml: string, s: TableStyle, method: Method, actionName: string, decodeHtml: boolean): StyledOutput {
  const css = cssOf(s);
  const name = (actionName.trim() || 'Create HTML table').replace(/\s+/g, '_');
  const source = `body(${q(name)})`;
  const decode = (expr: string) =>
    decodeHtml ? `replace(replace(replace(replace(${expr}, '&lt;', '<'), '&gt;', '>'), '&quot;', '"'), '&amp;', '&')` : expr;
  const decodeJs = (html: string) =>
    decodeHtml ? html.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&') : html;

  if (method === 'inline') {
    const pairs: [string, string][] = [
      ['<table>', `<table style="${css.table}">`],
      ['<th>', `<th style="${css.th}">`],
      ['<td>', `<td style="${css.td}">`],
    ];
    const code = pairs.reduce((expr, [from, to]) => `replace(${expr}, ${q(from)}, ${q(to)})`, decode(source));
    const previewHtml = pairs.reduce((html, [from, to]) => html.split(from).join(to), decodeJs(tableHtml));
    return { code, pasteReady: `@{${code}}`, previewHtml };
  }

  const block = [
    `table { ${css.table.replace(/;/g, '; ')}; }`,
    `th { ${css.th.replace(/;/g, '; ')}; }`,
    `td { ${css.td.replace(/;/g, '; ')}; }`,
    s.zebra ? `tbody tr:nth-child(even) td { background-color: ${s.zebraBg}; }` : '',
  ]
    .filter(Boolean)
    .join('\n');
  const style = `<style>\n${block}\n</style>`;
  const code = `${style}\n@{${decode(source)}}`;
  return { code, pasteReady: code, previewHtml: `${style}${decodeJs(tableHtml)}` };
}
