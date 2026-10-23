// Builds OData filter queries for SharePoint "Get items" and Dataverse "List rows",
// which format the same condition differently.

export type Target = 'sharepoint' | 'dataverse';
export type ColType = 'text' | 'number' | 'date' | 'bool' | 'choice' | 'person' | 'lookup';
export type Op = 'eq' | 'ne' | 'gt' | 'ge' | 'lt' | 'le' | 'contains' | 'startswith' | 'endswith' | 'null' | 'notnull';

export interface Condition {
  column: string;
  type: ColType;
  op: Op;
  value: string;
  /** Value is a Power Automate expression (dynamic content) instead of a fixed value. */
  dynamic: boolean;
}

export const TYPE_LABELS: Record<Target, Partial<Record<ColType, string>>> = {
  sharepoint: { text: 'Text', number: 'Number', date: 'Date', bool: 'Yes/No', choice: 'Choice', person: 'Person (by email)', lookup: 'Lookup (by ID)' },
  dataverse: { text: 'Text', number: 'Number', date: 'Date', bool: 'Yes/No', choice: 'Choice (number)', lookup: 'Lookup (GUID)' },
};

export const OP_LABELS: Record<Op, string> = {
  eq: 'equals',
  ne: 'does not equal',
  gt: 'is greater than',
  ge: 'is at least',
  lt: 'is less than',
  le: 'is at most',
  contains: 'contains',
  startswith: 'starts with',
  endswith: 'ends with',
  null: 'is empty',
  notnull: 'is not empty',
};

export function opsFor(target: Target, type: ColType): Op[] {
  const empty: Op[] = ['null', 'notnull'];
  switch (type) {
    case 'text':
      return ['eq', 'ne', 'contains', 'startswith', ...(target === 'dataverse' ? (['endswith'] as Op[]) : []), ...empty];
    case 'number':
    case 'date':
      return ['eq', 'ne', 'gt', 'ge', 'lt', 'le', ...empty];
    case 'bool':
      return ['eq', 'ne'];
    default:
      return ['eq', 'ne', ...empty];
  }
}

/** Ready-made dynamic date values. */
export const DATE_SHORTCUTS: [string, string][] = [
  ['Now', 'utcNow()'],
  ['Start of today', 'startOfDay(utcNow())'],
  ['7 days ago', 'addDays(utcNow(), -7)'],
  ['30 days ago', 'addDays(utcNow(), -30)'],
  ['Start of this month', 'startOfMonth(utcNow())'],
];

const quote = (s: string) => `'${s.replace(/'/g, "''")}'`;

/** Column name as it must appear in the filter. */
function columnRef(target: Target, c: Condition): string {
  const name = c.column.trim() || (target === 'sharepoint' ? 'Title' : 'name');
  if (target === 'sharepoint') {
    if (c.type === 'person') return name.includes('/') ? name : `${name}/EMail`;
    if (c.type === 'lookup') return /Id$/.test(name) ? name : `${name}Id`;
    return name;
  }
  if (c.type === 'lookup') return /^_.*_value$/.test(name) ? name : `_${name.toLowerCase()}_value`;
  return name.toLowerCase();
}

function literal(target: Target, c: Condition): string {
  const v = c.value.trim();
  if (c.dynamic) {
    const expr = `@{${v || 'expression'}}`;
    // SharePoint wants text and dates in quotes; Dataverse only text and choices-as-text.
    const quoted = target === 'sharepoint' ? ['text', 'date', 'choice', 'person'].includes(c.type) : c.type === 'text';
    return quoted ? `'${expr}'` : expr;
  }
  switch (c.type) {
    case 'number':
    case 'lookup':
      return target === 'dataverse' && c.type === 'lookup' ? v || '00000000-0000-0000-0000-000000000000' : v || '0';
    case 'choice':
      return target === 'dataverse' ? v || '1' : quote(v);
    case 'bool': {
      const on = /^(true|yes|1)$/i.test(v);
      return target === 'sharepoint' ? (on ? '1' : '0') : on ? 'true' : 'false';
    }
    case 'date': {
      const iso = /^\d{4}-\d{2}-\d{2}$/.test(v) ? `${v}T00:00:00Z` : v || '2026-01-01T00:00:00Z';
      return target === 'sharepoint' ? quote(iso) : iso;
    }
    default:
      return quote(v);
  }
}

export function conditionText(target: Target, c: Condition): string {
  const col = columnRef(target, c);
  if (c.op === 'null') return `${col} eq null`;
  if (c.op === 'notnull') return `${col} ne null`;
  const val = literal(target, c);
  if (c.op === 'contains') return target === 'sharepoint' ? `substringof(${val}, ${col})` : `contains(${col}, ${val})`;
  if (c.op === 'startswith') return `startswith(${col}, ${val})`;
  if (c.op === 'endswith') return `endswith(${col}, ${val})`;
  return `${col} ${c.op} ${val}`;
}

export function buildFilter(target: Target, join: 'and' | 'or', conditions: Condition[]): string {
  const parts = conditions.map((c) => conditionText(target, c));
  return parts.join(` ${join} `);
}

/** Notes that apply to the current filter. */
export function tips(target: Target, conditions: Condition[]): string[] {
  const t: string[] = [];
  if (target === 'sharepoint') {
    t.push('Use internal column names, not display names. Find one in List settings → click the column → the end of the URL (Field=…).');
    if (conditions.some((c) => c.op === 'contains')) t.push('substringof() can be slow on big lists and is not supported on every column type. Prefer eq or startswith on large lists.');
    t.push('On lists over 5,000 items, the first column you filter on should be indexed (List settings → Indexed columns).');
  } else {
    t.push('Use logical names (lowercase, with the publisher prefix, such as cr123_status), not display names.');
    if (conditions.some((c) => c.type === 'choice')) t.push('Choice columns filter on the number behind each option. Find it in the column’s settings in Power Apps.');
    if (conditions.some((c) => c.type === 'lookup')) t.push('Lookups filter on the related row’s GUID through the _name_value column.');
  }
  if (conditions.some((c) => c.dynamic && c.type === 'text'))
    t.push("If dynamic text can contain an apostrophe (O'Brien), escape it: replace(your value, '''', '''''').");
  return t;
}

/** Best guess at the SharePoint internal name created for a display name. */
export function spInternalName(display: string): string {
  const encoded = [...display.trim()]
    .map((ch) => (/[A-Za-z0-9_]/.test(ch) ? ch : `_x${ch.codePointAt(0)!.toString(16).padStart(4, '0')}_`))
    .join('');
  return encoded.slice(0, 32);
}
