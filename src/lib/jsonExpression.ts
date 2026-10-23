// Turns a path inside sample JSON into a Power Automate expression (and the matching Power Fx).

export type Seg = { key: string } | { index: number };

export type Source = 'action' | 'compose' | 'trigger' | 'variable' | 'loop';

/** How to treat the innermost array on the path. */
export type ArrayMode = 'index' | 'first' | 'loop';

export interface ExpressionOptions {
  source: Source;
  /** Action, variable or loop name as shown in the designer. */
  name: string;
  /** True when the pasted JSON is an action's raw outputs ({ statusCode, headers, body }). */
  raw: boolean;
  arrayMode: ArrayMode;
  /** Power Apps variable that holds the JSON text. */
  fxVar: string;
}

export interface BuiltExpression {
  expression: string;
  pasteReady: string;
  /** When arrayMode is "loop": the array to put in Apply to each. */
  loopOver?: string;
  powerFx: string;
}

const q = (s: string) => `'${s.replace(/'/g, "''")}'`;
const designerName = (name: string, fallback: string) => (name.trim() || fallback).replace(/\s+/g, '_');

/** Raw outputs from a run look like { statusCode, headers, body }. */
export function looksRaw(value: unknown): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const keys = Object.keys(value);
  return keys.includes('body') && (keys.includes('statusCode') || keys.includes('headers'));
}

function root(o: ExpressionOptions, path: Seg[]): { start: string; rest: Seg[] } {
  const first = path[0];
  const underBody = o.raw && first && 'key' in first && first.key === 'body';
  const rest = underBody ? path.slice(1) : path;
  switch (o.source) {
    case 'action': {
      const n = q(designerName(o.name, 'Action_name'));
      return o.raw && !underBody ? { start: `outputs(${n})`, rest } : { start: `body(${n})`, rest };
    }
    case 'compose':
      return { start: `outputs(${q(designerName(o.name, 'Compose'))})`, rest: path };
    case 'trigger':
      return o.raw && !underBody ? { start: 'triggerOutputs()', rest } : { start: 'triggerBody()', rest };
    case 'variable':
      return { start: `variables(${q(o.name.trim() || 'MyVariable')})`, rest: path };
    case 'loop':
      return { start: o.name.trim() ? `items(${q(designerName(o.name, 'Apply_to_each'))})` : 'item()', rest: path };
  }
}

const access = (s: Seg) => ('key' in s ? `?[${q(s.key)}]` : `[${s.index}]`);
const join = (start: string, segs: Seg[]) => segs.reduce((e, s) => e + access(s), start);

// Power Fx: ParseJSON returns a dynamic value; arrays become tables via Table(), fields are read with dots.
function fxPath(o: ExpressionOptions, path: Seg[], leafType: string): string {
  const step = (e: string, s: Seg) =>
    'key' in s
      ? e + (/^[A-Za-z_][A-Za-z0-9_]*$/.test(s.key) ? `.${s.key}` : `.'${s.key.replace(/'/g, "''")}'`)
      : `Index(Table(${e}), ${s.index + 1}).Value`;
  const fn = ({ string: 'Text', number: 'Value', boolean: 'Boolean' } as Record<string, string>)[leafType];
  const wrap = (x: string) => (fn ? `${fn}(${x})` : x);
  const start = `ParseJSON(${o.fxVar.trim() || 'varJson'})`;
  const lastArray = path.map((s) => 'index' in s).lastIndexOf(true);
  if (lastArray < 0 || o.arrayMode === 'index') return wrap(path.reduce(step, start));
  const table = `Table(${path.slice(0, lastArray).reduce(step, start)})`;
  const after = path.slice(lastArray + 1);
  if (o.arrayMode === 'first') return wrap(after.reduce(step, `First(${table}).Value`));
  return `ForAll(${table}, ${wrap(after.reduce(step, 'ThisRecord.Value'))})`;
}

export function buildExpression(path: Seg[], leafType: string, o: ExpressionOptions): BuiltExpression {
  const { start, rest } = root(o, path);
  const lastArray = rest.map((s) => 'index' in s).lastIndexOf(true);
  let expression: string;
  let loopOver: string | undefined;

  if (lastArray < 0 || o.arrayMode === 'index') {
    expression = join(start, rest);
  } else {
    const before = rest.slice(0, lastArray);
    const after = rest.slice(lastArray + 1);
    const arrayExpr = join(start, before);
    if (o.arrayMode === 'first') {
      expression = join(`first(${arrayExpr})`, after);
    } else {
      loopOver = arrayExpr;
      expression = join('item()', after);
    }
  }
  // An app usually receives just the body, so skip "body" in the Power Fx path too.
  const fxSegs = o.raw && path[0] && 'key' in path[0] && path[0].key === 'body' ? path.slice(1) : path;
  return { expression, pasteReady: `@{${expression}}`, loopOver, powerFx: fxPath(o, fxSegs, leafType) };
}

export const typeOf = (v: unknown): string =>
  v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v === 'object' ? 'object' : typeof v;

export const pathLabel = (path: Seg[]) =>
  path.map((s, i) => ('key' in s ? `${i ? '.' : ''}${s.key}` : `[${s.index}]`)).join('') || '(root)';
