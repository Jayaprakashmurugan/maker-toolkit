// Builds a JSON schema for Power Automate's "Parse JSON" action from sample JSON.
// Unlike "Generate from sample", it merges every array item, can allow nulls
// everywhere and can leave properties optional, which avoids the usual run failures.

export type JsonType = 'null' | 'boolean' | 'integer' | 'number' | 'string' | 'array' | 'object';

export interface SchemaOptions {
  /** Add "null" to every type, so empty values don't fail the run. */
  nullable: boolean;
  /** List properties that appear in every sample object as required. */
  required: boolean;
  /** Keep "integer" for whole numbers instead of the safer "number". */
  integers: boolean;
}

export interface JsonSchema {
  type?: JsonType | JsonType[];
  properties?: Record<string, JsonSchema>;
  required?: string[];
  items?: JsonSchema;
}

/** Everything seen at one position in the JSON, across all samples. */
export interface Shape {
  types: Set<JsonType>;
  props: Map<string, Shape>;
  /** How many of the sample objects had each property. */
  seen: Map<string, number>;
  objects: number;
  items: Shape | null;
  arrayItems: number;
}

const newShape = (): Shape => ({ types: new Set(), props: new Map(), seen: new Map(), objects: 0, items: null, arrayItems: 0 });

const typeOf = (v: unknown): JsonType => {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  if (typeof v === 'number') return Number.isInteger(v) ? 'integer' : 'number';
  if (typeof v === 'object') return 'object';
  return typeof v as 'string' | 'boolean';
};

export function inferShape(value: unknown, shape: Shape = newShape()): Shape {
  const t = typeOf(value);
  shape.types.add(t);
  if (t === 'object') {
    shape.objects++;
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      shape.seen.set(k, (shape.seen.get(k) ?? 0) + 1);
      if (!shape.props.has(k)) shape.props.set(k, newShape());
      inferShape(v, shape.props.get(k)!);
    }
  } else if (t === 'array') {
    shape.items ??= newShape();
    for (const item of value as unknown[]) {
      shape.arrayItems++;
      inferShape(item, shape.items);
    }
  }
  return shape;
}

function typesFor(shape: Shape, o: SchemaOptions): JsonType[] {
  let types = [...shape.types];
  if (!o.integers || (types.includes('integer') && types.includes('number'))) {
    types = types.map((t) => (t === 'integer' ? 'number' : t));
  }
  return [...new Set(types)];
}

export function toSchema(shape: Shape, o: SchemaOptions, root = true): JsonSchema {
  const types = typesFor(shape, o);
  const s: JsonSchema = {};
  const onlyNull = types.length === 0 || (types.length === 1 && types[0] === 'null');
  // A value that was always null (or an empty array's items) could be anything: leave it unrestricted.
  if (!onlyNull) {
    const all = o.nullable && !root && !types.includes('null') ? [...types, 'null' as const] : types;
    const ordered = [...all.filter((t) => t !== 'null'), ...all.filter((t) => t === 'null')];
    s.type = ordered.length === 1 ? ordered[0] : ordered;
  }
  if (shape.types.has('object')) {
    s.properties = {};
    for (const [k, child] of shape.props) s.properties[k] = toSchema(child, o, false);
    if (o.required) {
      const req = [...shape.seen].filter(([, n]) => n === shape.objects).map(([k]) => k);
      if (req.length) s.required = req;
    }
  }
  if (shape.types.has('array')) s.items = shape.items ? toSchema(shape.items, o, false) : {};
  return s;
}

// ── Field list with ready-to-use expressions ─────────────────

export interface FieldRow {
  path: string;
  type: string;
  optional: boolean;
  nullable: boolean;
  expression: string;
  /** When the value lives inside an array: the array to loop over with Apply to each. */
  loop?: string;
}

const key = (k: string) => `?['${k.replace(/'/g, "''")}']`;

function describe(shape: Shape, o: SchemaOptions): string {
  const types = typesFor(shape, o).filter((t) => t !== 'null');
  if (!types.length) return 'any';
  return types
    .map((t) => {
      if (t !== 'array' || !shape.items) return t;
      const inner = typesFor(shape.items, o).filter((x) => x !== 'null');
      return inner.length === 1 ? `array of ${inner[0]}s` : 'array';
    })
    .join(' or ');
}

export function fieldRows(root: Shape, actionName: string, o: SchemaOptions, limit = 400): FieldRow[] {
  const action = actionName.trim().replace(/\s+/g, '_') || 'Parse_JSON';
  const rows: FieldRow[] = [];

  const walkObject = (shape: Shape, path: string, expr: string, loop?: string) => {
    for (const [k, child] of shape.props) {
      if (rows.length >= limit) return;
      const p = path ? `${path}.${k}` : k;
      const e = `${expr}${key(k)}`;
      rows.push({
        path: p,
        type: describe(child, o),
        optional: (shape.seen.get(k) ?? 0) < shape.objects,
        nullable: child.types.has('null'),
        expression: e,
        loop,
      });
      if (child.types.has('object')) walkObject(child, p, e, loop);
      if (child.types.has('array') && child.items?.types.has('object')) walkObject(child.items, `${p}[]`, 'item()', e);
    }
  };

  const start = `body('${action.replace(/'/g, "''")}')`;
  if (root.types.has('object')) walkObject(root, '', start);
  if (root.types.has('array') && root.items?.types.has('object')) walkObject(root.items, '[]', 'item()', start);
  return rows;
}

export interface ShapeStats {
  properties: number;
  depth: number;
  arrays: number;
  arrayItems: number;
}

export function shapeStats(shape: Shape, depth = 0): ShapeStats {
  const total: ShapeStats = { properties: shape.props.size, depth, arrays: shape.items ? 1 : 0, arrayItems: shape.arrayItems };
  const children = [...shape.props.values(), ...(shape.items ? [shape.items] : [])];
  for (const c of children) {
    const s = shapeStats(c, depth + 1);
    total.properties += s.properties;
    total.depth = Math.max(total.depth, s.depth);
    total.arrays += s.arrays;
    total.arrayItems += s.arrayItems;
  }
  return total;
}

// ── Parsing with friendly error positions ────────────────────

export type ParseResult = { ok: true; value: unknown } | { ok: false; message: string; line?: number; col?: number; pos?: number };

/** Walks invalid JSON to find where it breaks, with a plain-English reason. */
function locateError(text: string): { message: string; pos: number } | null {
  let i = 0;
  const ws = () => {
    while (i < text.length && ' \t\n\r﻿'.includes(text[i])) i++;
  };
  const fail = (message: string, at = i): never => {
    throw { message, pos: at };
  };
  const str = () => {
    const start = i++;
    while (i < text.length) {
      const ch = text[i];
      if (ch === '\\') i += 2;
      else if (ch === '"') {
        i++;
        return;
      } else if (ch === '\n') fail('This string is not closed before the end of the line.', start);
      else i++;
    }
    fail('This string is never closed.', start);
  };
  const num = () => {
    const m = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(text.slice(i));
    if (!m) fail('This is not a valid number.');
    i += m![0].length;
  };
  const list = (close: '}' | ']') => {
    i++;
    ws();
    if (text[i] === close) {
      i++;
      return;
    }
    for (;;) {
      ws();
      if (text[i] === close) fail(`Trailing comma before ${close}. Remove the last comma.`);
      if (close === '}') {
        if (text[i] !== '"')
          fail(text[i] === "'" ? 'Property names must use double quotes (") in JSON.' : 'Expected a property name in double quotes.');
        str();
        ws();
        if (text[i] !== ':') fail('Expected a colon (:) after the property name.');
        i++;
      }
      value();
      ws();
      if (text[i] === ',') {
        i++;
        continue;
      }
      if (text[i] === close) {
        i++;
        return;
      }
      fail(text[i] === undefined ? `The JSON ends before this is closed with ${close}.` : `Expected a comma (,) or ${close} here.`);
    }
  };
  const value = () => {
    ws();
    const c = text[i];
    if (c === '{') return list('}');
    if (c === '[') return list(']');
    if (c === '"') return str();
    if (c === "'") return fail('Text values must use double quotes (") in JSON, not single quotes.');
    if (c === '-' || (c >= '0' && c <= '9')) return num();
    for (const lit of ['true', 'false', 'null']) {
      if (text.startsWith(lit, i)) {
        i += lit.length;
        return;
      }
    }
    if (c === undefined) return fail('The JSON ends too early: a value is missing.');
    if (c === '}' || c === ']' || c === ',') return fail('A value is missing here.');
    if (/[A-Za-z]/.test(c)) return fail('Unexpected word. Text needs double quotes, and true, false and null must be lowercase.');
    return fail(`Unexpected character "${c}".`);
  };
  try {
    value();
    ws();
    if (i < text.length) fail('There is extra text after the end of the JSON.');
    return null;
  } catch (e) {
    return e as { message: string; pos: number };
  }
}

export function parseSample(text: string): ParseResult {
  try {
    return { ok: true, value: JSON.parse(text.replace(/^﻿/, '')) };
  } catch (e) {
    const found = locateError(text);
    if (!found) return { ok: false, message: e instanceof Error ? e.message : String(e) };
    const before = text.slice(0, found.pos);
    return {
      ok: false,
      message: found.message,
      pos: found.pos,
      line: before.split('\n').length,
      col: found.pos - before.lastIndexOf('\n'),
    };
  }
}
