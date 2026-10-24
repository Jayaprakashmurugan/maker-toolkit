// Builds trigger conditions (trigger Settings → Trigger conditions) for Power Automate.
// Each line must be one expression starting with @; separate lines combine with AND.

export type Source = 'sharepoint' | 'dataverse' | 'outlook' | 'other';
export type FieldType = 'text' | 'number' | 'date' | 'bool' | 'choice' | 'person' | 'lookup';
export type Op = 'eq' | 'ne' | 'gt' | 'ge' | 'lt' | 'le' | 'contains' | 'startswith' | 'endswith' | 'empty' | 'notempty';

export interface Rule {
  field: string;
  type: FieldType;
  op: Op;
  value: string;
  /** The value is an expression, such as utcNow(), rather than fixed text. */
  dynamic: boolean;
  ignoreCase: boolean;
}

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
  empty: 'is empty',
  notempty: 'is not empty',
};

export const TYPE_LABELS: Record<Source, Partial<Record<FieldType, string>>> = {
  sharepoint: { text: 'Text', number: 'Number', date: 'Date', bool: 'Yes/No', choice: 'Choice', person: 'Person (email)', lookup: 'Lookup (value)' },
  dataverse: { text: 'Text', number: 'Number', date: 'Date', bool: 'Yes/No', choice: 'Choice (number)', lookup: 'Lookup (GUID)' },
  outlook: { text: 'Text', bool: 'Yes/No' },
  other: { text: 'Text', number: 'Number', date: 'Date', bool: 'Yes/No' },
};

export const OUTLOOK_FIELDS: [string, string, FieldType][] = [
  ['subject', 'Subject', 'text'],
  ['from', 'From (email)', 'text'],
  ['bodyPreview', 'Body preview', 'text'],
  ['importance', 'Importance', 'text'],
  ['hasAttachments', 'Has attachments', 'bool'],
];

export function opsFor(type: FieldType): Op[] {
  if (type === 'text') return ['eq', 'ne', 'contains', 'startswith', 'endswith', 'empty', 'notempty'];
  if (type === 'number' || type === 'date') return ['eq', 'ne', 'gt', 'ge', 'lt', 'le', 'empty', 'notempty'];
  if (type === 'bool') return ['eq', 'ne'];
  return ['eq', 'ne', 'empty', 'notempty'];
}

const q = (s: string) => `'${s.replace(/'/g, "''")}'`;

/** The expression that reads the field from the trigger's output. */
export function fieldExpr(source: Source, r: Rule): string {
  const f = r.field.trim().replace(/^\/+|\/+$/g, '');
  if (source === 'sharepoint') {
    const suffix = r.type === 'choice' || r.type === 'lookup' ? '/Value' : r.type === 'person' ? '/Email' : '';
    return `triggerOutputs()?['body/${f}${f.includes('/') ? '' : suffix}']`;
  }
  if (source === 'dataverse') {
    const name = f.toLowerCase();
    const logical = r.type === 'lookup' && !/^_.*_value$/.test(name) ? `_${name}_value` : name;
    return `triggerOutputs()?['body/${logical}']`;
  }
  return `triggerOutputs()?['body/${f}']`;
}

function valueExpr(source: Source, r: Rule): string {
  const v = r.value.trim();
  if (r.dynamic) return v || 'utcNow()';
  if (r.type === 'number' || (source === 'dataverse' && r.type === 'choice')) return v || '0';
  if (r.type === 'bool') return /^(true|yes|1)$/i.test(v) ? 'true' : 'false';
  if (r.type === 'date') return q(/^\d{4}-\d{2}-\d{2}$/.test(v) ? `${v}T00:00:00Z` : v);
  return q(v);
}

/** One condition, without the leading @. */
export function ruleExpr(source: Source, r: Rule): string {
  let a = fieldExpr(source, r);
  if (r.op === 'empty') return `empty(${a})`;
  if (r.op === 'notempty') return `not(empty(${a}))`;
  let b = valueExpr(source, r);
  const text = (r.type === 'text' || r.type === 'choice' || r.type === 'person') && !(source === 'dataverse' && r.type === 'choice');
  const textOp = ['contains', 'startswith', 'endswith'].includes(r.op);
  // Text functions fail on null, so treat a missing value as empty text first.
  if (text && (textOp || r.ignoreCase)) a = `coalesce(${a}, '')`;
  if (text && r.ignoreCase) {
    a = `toLower(${a})`;
    b = r.dynamic ? `toLower(${b})` : b.toLowerCase();
  }
  const fn: Record<Op, string> = {
    eq: 'equals',
    ne: 'equals',
    gt: 'greater',
    ge: 'greaterOrEquals',
    lt: 'less',
    le: 'lessOrEquals',
    contains: 'contains',
    startswith: 'startsWith',
    endswith: 'endsWith',
    empty: '',
    notempty: '',
  };
  const call = `${fn[r.op]}(${a}, ${b})`;
  return r.op === 'ne' ? `not(${call})` : call;
}

export interface BuiltConditions {
  /** One entry per box in Trigger conditions. */
  lines: string[];
}

/** Rules without a field name are left out until one is typed. */
export function buildConditions(source: Source, join: 'and' | 'or', rules: Rule[]): BuiltConditions {
  const parts = rules.filter((r) => r.field.trim()).map((r) => ruleExpr(source, r));
  if (!parts.length) return { lines: [] };
  if (join === 'or' && parts.length > 1) return { lines: [`@or(${parts.join(', ')})`] };
  return { lines: parts.map((p) => `@${p}`) };
}

export interface Preset {
  label: string;
  source: Source;
  join: 'and' | 'or';
  rules: Rule[];
}

const rule = (field: string, type: FieldType, op: Op, value = '', dynamic = false): Rule => ({ field, type, op, value, dynamic, ignoreCase: false });

export const PRESETS: Preset[] = [
  { label: 'Only when Status is Approved', source: 'sharepoint', join: 'and', rules: [rule('Status', 'choice', 'eq', 'Approved')] },
  { label: 'Only new items, not edits', source: 'sharepoint', join: 'and', rules: [rule('Created', 'date', 'eq', "triggerOutputs()?['body/Modified']", true)] },
  { label: 'Ignore edits made by the flow’s account', source: 'sharepoint', join: 'and', rules: [{ ...rule('Editor', 'person', 'ne', 'flow-account@contoso.com'), ignoreCase: true }] },
  { label: 'Emails whose subject contains “invoice”', source: 'outlook', join: 'and', rules: [{ ...rule('subject', 'text', 'contains', 'invoice'), ignoreCase: true }] },
  { label: 'Dataverse rows that are active', source: 'dataverse', join: 'and', rules: [rule('statecode', 'choice', 'eq', '0')] },
];
