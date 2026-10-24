// Checks a regular expression against Power Fx's rules and translates it to an equivalent
// JavaScript RegExp, so it can be tested in the browser the way IsMatch, Match and MatchAll run it.
// Rules: https://learn.microsoft.com/power-platform/power-fx/regular-expressions

export type Host = 'classic' | 'v1';
export type Anchor = 'Complete' | 'Contains' | 'BeginsWith' | 'EndsWith';

export interface RegexOptions {
  host: Host;
  anchor: Anchor;
  ignoreCase: boolean;
  multiline: boolean;
  dotAll: boolean;
  freeSpacing: boolean;
  numbered: boolean;
}

export interface RegexIssue {
  message: string;
  start: number;
  end: number;
}

export type Compiled =
  | { ok: true; source: string; flags: string; numbered: boolean; inline: string }
  | { ok: false; issues: RegexIssue[] };

/** The Match enum, from Microsoft's Power Fx source (BuiltInEnums.cs). Power Apps without Power Fx 1.0 differs in two. */
export const MATCH_ENUM: Record<string, string> = {
  Any: '.',
  Comma: ',',
  Digit: '\\d',
  Email:
    '(?:(?:[\\{\\}]|[^\\s@<>,;:\\\\"\\p{Pi}\\p{Ps}\\p{Pe}\\p{Pf}])+@(?:(?:[\\-_\\xb7\\u05f3\\u05f4\\u0f0b\\u30fb]|[^\\s\\p{P}<=>+\\|])+\\.)+(?:[\\-_\\xb7\\u05f3\\u05f4\\u0f0b\\u30fb]|[^\\s\\p{P}<=>+\\|])+)',
  Hyphen: '-',
  LeftParen: '\\(',
  Letter: '\\p{L}',
  MultipleDigits: '\\d+',
  MultipleLetters: '\\p{L}+',
  MultipleNonSpaces: '\\S+',
  MultipleSpaces: '\\s+',
  NonSpace: '\\S',
  OptionalDigits: '\\d*',
  OptionalLetters: '\\p{L}*',
  OptionalNonSpaces: '\\S*',
  OptionalSpaces: '\\s*',
  Period: '\\.',
  RightParen: '\\)',
  Space: '\\s',
  Tab: '\\t',
};
export const MATCH_ENUM_CLASSIC: Record<string, string> = { ...MATCH_ENUM, Email: '.+@.+\\.[^.]{2,}', Hyphen: '\\-' };
export const matchEnum = (host: Host) => (host === 'v1' ? MATCH_ENUM : MATCH_ENUM_CLASSIC);

const WORD = '\\p{Ll}\\p{Lu}\\p{Lt}\\p{Lo}\\p{Nd}\\p{Pc}\\p{Lm}';
const SPACE = ' \\t\\n\\x0b\\f\\r\\x85\\u2028\\u2029\\p{Z}';
const DOT = '[^\\n\\x0b\\f\\r\\x85\\u2028\\u2029]';
const CATEGORIES = new Set('L Lu Ll Lt Lm Lo M Mn Mc Me N Nd Nl No P Pc Pd Ps Pe Pi Pf Po S Sm Sc Sk So Z Zs Zl Zp Cc Cf'.split(' '));
const SPECIAL = '\\[]^$.|?*+(){}';
const DOUBLES = '&!#$%*+,.:;<=>?@^`~';

type Node =
  | { t: 'seq'; items: Node[]; start: number; end: number }
  | { t: 'alt'; options: Node[]; start: number; end: number }
  | { t: 'atom'; js: string; start: number; end: number }
  | { t: 'assert'; js: string; start: number; end: number }
  | { t: 'backref'; name?: string; num?: number; start: number; end: number }
  | { t: 'quant'; body: Node; min: number; max: number; lazy: boolean; start: number; end: number }
  | { t: 'group'; kind: 'cap' | 'named' | 'non' | 'look'; name?: string; num?: number; look?: string; body: Node; start: number; end: number };

type ClassItem = { kind: 'char'; cp: number; js: string } | { kind: 'set'; js: string; negative: boolean; pulled?: boolean };

const jsChar = (ch: string) => (SPECIAL.includes(ch) || ch === '/' ? `\\${ch}` : ch);
const jsClassChar = (ch: string) => ('\\]^-['.includes(ch) ? `\\${ch}` : ch);

class Parser {
  i = 0;
  issues: RegexIssue[] = [];
  groups: Extract<Node, { t: 'group' }>[] = [];
  free: boolean;
  src: string;
  o: RegexOptions;

  constructor(src: string, o: RegexOptions) {
    this.src = src;
    this.o = o;
    this.free = o.freeSpacing;
  }

  err(message: string, start: number, end = start + 1) {
    this.issues.push({ message, start, end: Math.max(end, start + 1) });
  }

  skipFree() {
    if (!this.free) return;
    while (this.i < this.src.length) {
      const c = this.src[this.i];
      if (/\s/.test(c)) this.i++;
      else if (c === '#') {
        while (this.i < this.src.length && !/[\n\x0b\f\r\x85\u2028\u2029]/.test(this.src[this.i])) this.i++;
      } else break;
    }
  }

  parseAlt(): Node {
    const start = this.i;
    const options = [this.parseSeq()];
    while (this.src[this.i] === '|') {
      this.i++;
      options.push(this.parseSeq());
    }
    return options.length === 1 ? options[0] : { t: 'alt', options, start, end: this.i };
  }

  parseSeq(): Node {
    const start = this.i;
    const items: Node[] = [];
    for (;;) {
      this.skipFree();
      const c = this.src[this.i];
      if (c === undefined || c === '|' || c === ')') break;
      const atom = this.parseAtom();
      if (atom) items.push(this.parseQuant(atom));
    }
    return { t: 'seq', items, start, end: this.i };
  }

  readQuant(): { min: number; max: number } | null {
    const c = this.src[this.i];
    if (c === '*') return (this.i++, { min: 0, max: Infinity });
    if (c === '+') return (this.i++, { min: 1, max: Infinity });
    if (c === '?') return (this.i++, { min: 0, max: 1 });
    const m = c === '{' ? /^\{(\d+)(,(\d*))?\}/.exec(this.src.slice(this.i)) : null;
    if (!m) return null;
    this.i += m[0].length;
    const min = Number(m[1]);
    return { min, max: m[2] ? (m[3] ? Number(m[3]) : Infinity) : min };
  }

  parseQuant(atom: Node): Node {
    this.skipFree();
    const qs = this.i;
    const q = this.readQuant();
    if (!q) return atom;
    if (q.max < q.min) this.err('In {n,m}, n can’t be larger than m.', qs, this.i);
    let lazy = false;
    if (this.src[this.i] === '?') (lazy = true), this.i++;
    else if (this.src[this.i] === '+') {
      this.err('Possessive quantifiers such as *+ or ++ aren’t supported.', qs, this.i + 1);
      this.i++;
    }
    if (atom.t === 'assert' || (atom.t === 'group' && atom.kind === 'look'))
      this.err('An anchor, lookahead or lookbehind can’t be repeated.', qs, this.i);
    const node: Node = { t: 'quant', body: atom, ...q, lazy, start: atom.start, end: this.i };
    this.skipFree();
    const again = this.i;
    if (this.readQuant()) this.err('Two quantifiers in a row. Wrap the first part in (?: ) to repeat it again.', again, this.i);
    return node;
  }

  parseAtom(): Node | null {
    const s = this.i;
    const c = this.src[s];
    if (c === '(') return this.parseGroup();
    if (c === '[') return this.parseClass();
    if (c === '\\') return this.parseEscape();
    this.i++;
    if (c === '.') return { t: 'atom', js: this.o.dotAll ? '[^]' : DOT, start: s, end: this.i };
    if (c === '^' || c === '$') return { t: 'assert', js: c, start: s, end: this.i };
    if ('*+?'.includes(c)) {
      this.err(`There’s nothing before ${c} to repeat. To match ${c} itself, write \\${c}.`, s);
      return null;
    }
    if ('{}]'.includes(c)) {
      this.err(`To match ${c}, escape it as \\${c}.`, s);
      return null;
    }
    const cp = this.src.codePointAt(s)!;
    const ch = String.fromCodePoint(cp);
    this.i = s + ch.length;
    return { t: 'atom', js: jsChar(ch), start: s, end: this.i };
  }

  parseGroup(): Node | null {
    const s = this.i;
    const rest = this.src.slice(s + 1);
    if (rest.startsWith('?#')) {
      const close = this.src.indexOf(')', s);
      if (close < 0) {
        this.err('This (?# comment isn’t closed with ).', s, s + 3);
        this.i = this.src.length;
      } else this.i = close + 1;
      return null;
    }
    let kind: 'cap' | 'named' | 'non' | 'look' = 'cap';
    let name: string | undefined;
    let look: string | undefined;
    this.i = s + 1;
    if (rest.startsWith('?')) {
      let m: RegExpExecArray | null;
      if (rest.startsWith('?:')) (kind = 'non'), (this.i += 2);
      else if (/^\?[=!]/.test(rest)) (kind = 'look'), (look = rest[1]), (this.i += 2);
      else if (/^\?<[=!]/.test(rest)) (kind = 'look'), (look = rest.slice(1, 3)), (this.i += 3);
      else if ((m = /^\?<([^>]*)>/.exec(rest))) {
        kind = 'named';
        name = m[1];
        this.i += m[0].length;
        if (!/^[\p{L}_][\p{L}_\p{Nd}]*$/u.test(name) || name.length > 62)
          this.err('A submatch name must start with a letter or _, then use only letters, digits and _ (62 at most).', s, this.i);
        if (this.o.numbered) this.err('Named submatches can’t be used with NumberedSubMatches. Turn it off, or use plain ( ) groups.', s, this.i);
        if (this.groups.some((g) => g.name === name)) this.err(`Two submatches are both named “${name}”. Names must be unique.`, s, this.i);
      } else {
        m = /^\?[a-zA-Z-]*[:)]?/.exec(rest)!;
        const what = /^\?[imsxn-]+[:)]/.test(rest)
          ? 'Inline options such as (?i) must be at the very start of the pattern, and can’t be turned off or used for part of it.'
          : rest.startsWith('?>')
            ? 'Atomic groups (?> ) aren’t supported.'
            : rest.startsWith('?(')
              ? 'Conditionals (?( ) aren’t supported.'
              : /^\?(P<|')/.test(rest)
                ? 'Write a named submatch as (?<name> ).'
                : 'This kind of group isn’t supported. Use (?: ), (?<name> ), (?= ), (?! ), (?<= ) or (?<! ).';
        this.err(what, s, s + 1 + Math.max(m[0].length, 2));
        if (m[0].endsWith(')')) {
          this.i += m[0].length;
          return null;
        }
        kind = 'non';
        this.i += Math.max(m[0].length, 2);
      }
    }
    const node = { t: 'group', kind, name, look, start: s, end: s, body: undefined as unknown as Node } as Extract<Node, { t: 'group' }>;
    if (kind === 'named' || (kind === 'cap' && this.o.numbered)) {
      this.groups.push(node);
      node.num = this.groups.length;
    }
    node.body = this.parseAlt();
    if (this.src[this.i] === ')') this.i++;
    else this.err('This ( is never closed.', s);
    node.end = this.i;
    return node;
  }

  parseEscape(): Node | null {
    const s = this.i;
    const item = this.escape(false);
    if (!item) return null;
    if ('assert' in item) return { t: 'assert', js: item.assert, start: s, end: this.i };
    if ('backref' in item) return { t: 'backref', ...item.backref, start: s, end: this.i };
    return { t: 'atom', js: item.js, start: s, end: this.i };
  }

  /** Reads one escape. Inside [ ] it returns class items; outside, also anchors and back references. */
  escape(inClass: boolean): ClassItem | { assert: string } | { backref: { name?: string; num?: number } } | null {
    const s = this.i;
    const c = this.src[s + 1];
    this.i = s + 2;
    if (c === undefined) {
      this.err('The pattern ends with a lone \\.', s);
      return null;
    }
    const set = (js: string, negative = false, pulled = false): ClassItem => ({ kind: 'set', js, negative, pulled });
    const char = (ch: string): ClassItem => ({ kind: 'char', cp: ch.codePointAt(0)!, js: inClass ? jsClassChar(ch) : jsChar(ch) });
    switch (c) {
      case 'd':
        return set('\\p{Nd}');
      case 'D':
        return set('\\P{Nd}', true);
      case 'w':
        return set(inClass ? WORD : `[${WORD}]`);
      case 'W':
        return set(`[^${WORD}]`, true, inClass);
      case 's':
        return set(inClass ? SPACE : `[${SPACE}]`);
      case 'S':
        return set(`[^${SPACE}]`, true, inClass);
      case 'b':
      case 'B': {
        if (inClass) {
          this.err(`\\${c} can’t be used inside [ ].`, s, this.i);
          return null;
        }
        const W = `[${WORD}]`;
        return { assert: c === 'b' ? `(?:(?<=${W})(?!${W})|(?<!${W})(?=${W}))` : `(?:(?<=${W})(?=${W})|(?<!${W})(?!${W}))` };
      }
      case 'p':
      case 'P': {
        const m = /^\{([A-Za-z]+)\}/.exec(this.src.slice(this.i));
        if (!m) {
          this.err(`Write a Unicode category as \\${c}{L}, with braces.`, s, this.i);
          return null;
        }
        this.i += m[0].length;
        if (!CATEGORIES.has(m[1])) this.err(`\\${c}{${m[1]}} isn’t a supported Unicode category. Try L, Lu, Ll, N, Nd, P, S or Z.`, s, this.i);
        return set(`\\${c}{${m[1]}}`, c === 'P');
      }
      case 'x': {
        const m = /^[0-9a-fA-F]{2}/.exec(this.src.slice(this.i));
        if (!m) {
          this.err('\\x needs exactly two hex digits, such as \\x20.', s, this.i);
          return null;
        }
        this.i += 2;
        return { kind: 'char', cp: parseInt(m[0], 16), js: `\\x${m[0]}` };
      }
      case 'u': {
        const rest = this.src.slice(this.i);
        let m = /^\{([0-9a-fA-F]{1,8})\}/.exec(rest);
        if (m) {
          this.i += m[0].length;
          const cp = parseInt(m[1], 16);
          if (cp > 0x10ffff || (cp >= 0xd800 && cp <= 0xdfff)) this.err('\\u{…} must be a code point from 0 to 10FFFF, and not a surrogate.', s, this.i);
          else if (inClass && cp > 0xffff) this.err('Characters beyond U+FFFF, such as emoji, can’t be used inside [ ].', s, this.i);
          return { kind: 'char', cp, js: `\\u{${m[1]}}` };
        }
        m = /^[0-9a-fA-F]{4}/.exec(rest);
        if (!m) {
          this.err('\\u needs exactly four hex digits, such as \\u00e9, or braces, such as \\u{1F47B}.', s, this.i);
          return null;
        }
        this.i += 4;
        return { kind: 'char', cp: parseInt(m[0], 16), js: `\\u${m[0]}` };
      }
      case 'r':
      case 'n':
      case 'f':
      case 't':
        return { kind: 'char', cp: { r: 13, n: 10, f: 12, t: 9 }[c], js: `\\${c}` };
      case 'v':
        this.err('\\v isn’t supported. Use \\x0b for a vertical tab.', s, this.i);
        return null;
      case 'k': {
        const m = /^<([^>]+)>/.exec(this.src.slice(this.i));
        if (inClass || !m) {
          this.err(inClass ? 'A back reference can’t be used inside [ ].' : 'Write a named back reference as \\k<name>.', s, this.i);
          return null;
        }
        this.i += m[0].length;
        if (this.o.numbered) this.err('\\k<name> can’t be used with NumberedSubMatches. Use \\1 instead.', s, this.i);
        return { backref: { name: m[1] } };
      }
      case 'A':
      case 'Z':
      case 'z':
      case 'G':
        this.err(`\\${c} isn’t supported.${c === 'G' ? '' : ` Use ${c === 'A' ? '^' : '$'} instead.`}`, s, this.i);
        return null;
    }
    if (/\d/.test(c)) {
      if (c === '0' || inClass) {
        this.err('Octal codes aren’t supported. Use \\x or \\u, such as \\x00.', s, this.i);
        return null;
      }
      const m = /^\d*/.exec(this.src.slice(this.i))!;
      this.i += m[0].length;
      if (!this.o.numbered) this.err('Numbered back references such as \\1 need NumberedSubMatches. Or name the submatch and use \\k<name>.', s, this.i);
      return { backref: { num: Number(c + m[0]) } };
    }
    if (SPECIAL.includes(c) || c === '#' || c === ' ' || (inClass && c === '-')) return char(c);
    if (c === '-') this.err('A hyphen only needs escaping inside [ ]. Write - on its own.', s, this.i);
    else if (/[\p{L}\p{N}]/u.test(c)) this.err(`\\${c} isn’t a supported escape.`, s, this.i);
    else this.err(`\\${c} isn’t needed. Write ${c} without the backslash.`, s, this.i);
    return null;
  }

  parseClass(): Node | null {
    const s = this.i;
    this.i++;
    const negated = this.src[this.i] === '^';
    if (negated) this.i++;
    if (this.src[this.i] === ']') {
      this.err('Empty [ ] isn’t supported. To match ], escape it as \\].', s, this.i + 1);
      this.i++;
      return null;
    }
    const items: ClassItem[] = [];
    const readItem = (): ClassItem | null => {
      const p = this.i;
      const c = this.src[p];
      if (c === '\\') {
        const it = this.escape(true);
        return it && 'kind' in it ? it : null;
      }
      const cp = this.src.codePointAt(p)!;
      const ch = String.fromCodePoint(cp);
      this.i = p + ch.length;
      if (cp > 0xffff) this.err('Characters beyond U+FFFF, such as emoji, can’t be used inside [ ].', p, this.i);
      else if (c === '[') this.err('Inside [ ], escape [ as \\[.', p);
      else if (c === '^') this.err('Inside [ ], escape ^ as \\^ unless it comes first.', p);
      else if (c === '{' || c === '}') this.err(`Inside [ ], escape ${c} as \\${c}.`, p);
      else if (DOUBLES.includes(c) && this.src[this.i] === c) this.err(`Inside [ ], ${c}${c} can’t appear twice in a row. Escape one of them.`, p, p + 2);
      return { kind: 'char', cp, js: jsClassChar(ch) };
    };
    const parts: string[] = [];
    for (;;) {
      const c = this.src[this.i];
      if (c === undefined) {
        this.err('This [ is never closed with ].', s);
        break;
      }
      if (c === ']') {
        this.i++;
        break;
      }
      if (c === '-') {
        const p = this.i;
        this.i++;
        const prev = items[items.length - 1];
        if (prev?.kind === 'char' && this.src[this.i] !== ']' && this.src[this.i] !== undefined) {
          const next = readItem();
          if (next?.kind === 'char') {
            if (next.cp < prev.cp) this.err('This range is backwards. Put the smaller character first, as in a-z.', p - 1, this.i);
            parts.push('-');
            items.push(next);
            parts.push(next.js);
            continue;
          }
          this.err('A range must go between two characters, as in a-z.', p, this.i);
          if (next) items.push(next), parts.push(next.js);
          continue;
        }
        this.err('Inside [ ], escape a literal hyphen as \\-.', p);
        items.push({ kind: 'char', cp: 45, js: '\\-' });
        parts.push('\\-');
        continue;
      }
      const p = this.i;
      const it = readItem();
      if (!it) continue;
      if (it.kind === 'set' && it.negative && negated) this.err('\\W, \\D, \\S and \\P{ } can’t be used inside [^ ].', p, this.i);
      items.push(it);
      parts.push(it.kind === 'set' && it.pulled ? '' : it.js);
    }
    const pulled = items.filter((it): it is Extract<ClassItem, { kind: 'set' }> => it.kind === 'set' && !!it.pulled);
    const body = parts.join('');
    const own = body ? `[${negated ? '^' : ''}${body}]` : '';
    // \W and \S stand for negated sets, which can't nest inside [ ] here, so they become alternatives.
    const js = pulled.length && !negated ? `(?:${[own, ...pulled.map((p) => p.js)].filter(Boolean).join('|')})` : own || '[^]';
    return { t: 'atom', js, start: s, end: this.i };
  }
}

function canBeEmpty(n: Node): boolean {
  switch (n.t) {
    case 'atom':
      return false;
    case 'assert':
    case 'backref':
      return true;
    case 'seq':
      return n.items.every(canBeEmpty);
    case 'alt':
      return n.options.some(canBeEmpty);
    case 'group':
      return n.kind === 'look' || canBeEmpty(n.body);
    case 'quant':
      return n.min === 0 || canBeEmpty(n.body);
  }
}

interface Ctx {
  inLook: boolean;
  inRepeat: boolean;
  optional: boolean;
  open: Extract<Node, { t: 'group' }>[];
}

function validate(p: Parser, n: Node, ctx: Ctx, lookGroups: Set<Node>) {
  const rec = (c: Node, patch: Partial<Ctx> = {}) => validate(p, c, { ...ctx, ...patch }, lookGroups);
  switch (n.t) {
    case 'seq':
      return n.items.forEach((c) => rec(c));
    case 'alt':
      return n.options.forEach((c) => rec(c, { optional: true }));
    case 'quant':
      if (ctx.inLook && n.max === Infinity)
        p.err('Lookahead and lookbehind can’t contain unlimited quantifiers such as * or +. Use a limit, such as {0,50}.', n.body.end, n.end);
      if (n.max > 1) return rec(n.body, { inRepeat: true, optional: false });
      return rec(n.body, n.min === 0 ? { optional: true } : {});
    case 'group': {
      const captures = n.num !== undefined;
      if (captures && ctx.inLook) p.err('Lookahead and lookbehind can’t contain submatches. Use (?: ) instead.', n.start, n.start + 1);
      if (captures && ctx.inRepeat && (ctx.optional || canBeEmpty(n.body)))
        p.err('This submatch could be empty, so it can’t be repeated. Make it always match at least one character.', n.start, n.end);
      if (captures && ctx.inLook) lookGroups.add(n);
      return rec(n.body, { inLook: ctx.inLook || n.kind === 'look', open: captures ? [...ctx.open, n] : ctx.open });
    }
    case 'backref': {
      const g = n.name !== undefined ? p.groups.find((x) => x.name === n.name) : p.groups[(n.num ?? 0) - 1];
      if (!g) p.err(n.name !== undefined ? `There’s no submatch named “${n.name}”.` : `There’s no submatch number ${n.num}.`, n.start, n.end);
      else if (ctx.open.includes(g)) p.err('A submatch can’t refer to itself.', n.start, n.end);
      else if (lookGroups.has(g)) p.err('Back references to a submatch inside a lookahead or lookbehind aren’t supported.', n.start, n.end);
      else if (canBeEmpty(g.body)) p.err('Back references to a submatch that could be empty aren’t supported.', n.start, n.end);
    }
  }
}

function emit(n: Node): string {
  switch (n.t) {
    case 'seq':
      return n.items.map(emit).join('');
    case 'alt':
      return n.options.map(emit).join('|');
    case 'atom':
    case 'assert':
      return n.js;
    case 'backref':
      return n.name !== undefined ? `\\k<${n.name}>` : `\\${n.num}`;
    case 'quant': {
      const q = n.min === 0 && n.max === Infinity ? '*' : n.min === 1 && n.max === Infinity ? '+' : n.min === 0 && n.max === 1 ? '?' : n.max === Infinity ? `{${n.min},}` : n.min === n.max ? `{${n.min}}` : `{${n.min},${n.max}}`;
      const body = emit(n.body);
      return `${n.body.t === 'seq' || n.body.t === 'alt' ? `(?:${body})` : body}${q}${n.lazy ? '?' : ''}`;
    }
    case 'group': {
      const open = n.kind === 'look' ? `(?${n.look}` : n.kind === 'named' ? `(?<${n.name}>` : n.num !== undefined ? '(' : '(?:';
      return `${open}${emit(n.body)})`;
    }
  }
}

const wrap = (js: string, anchor: Anchor) =>
  anchor === 'Complete' ? `^(?:${js})$` : anchor === 'BeginsWith' ? `^(?:${js})` : anchor === 'EndsWith' ? `(?:${js})$` : js;

export function compile(pattern: string, opts: RegexOptions): Compiled {
  if (opts.host === 'classic') return compileClassic(pattern, opts);
  const o = { ...opts };
  const inline = /^\(\?([imsxn]+)\)/.exec(pattern);
  if (inline) {
    if (inline[1].includes('i')) o.ignoreCase = true;
    if (inline[1].includes('m')) o.multiline = true;
    if (inline[1].includes('s')) o.dotAll = true;
    if (inline[1].includes('x')) o.freeSpacing = true;
    if (inline[1].includes('n') && o.numbered) return { ok: false, issues: [{ message: '(?n) can’t be used with NumberedSubMatches.', start: 0, end: inline[0].length }] };
  }
  const p = new Parser(pattern, o);
  p.i = inline ? inline[0].length : 0;
  const parts: Node[] = [p.parseAlt()];
  while (p.i < pattern.length) {
    p.err('This ) has no matching (.', p.i);
    p.i++;
    parts.push(p.parseAlt());
  }
  const root: Node = parts.length === 1 ? parts[0] : { t: 'seq', items: parts, start: 0, end: pattern.length };
  if (!p.issues.length) validate(p, root, { inLook: false, inRepeat: false, optional: false, open: [] }, new Set());
  if (p.issues.length) return { ok: false, issues: p.issues.sort((a, b) => a.start - b.start) };
  const source = wrap(emit(root), o.anchor);
  const flags = `u${o.ignoreCase ? 'i' : ''}${o.multiline ? 'm' : ''}`;
  try {
    new RegExp(source, flags);
  } catch (e) {
    return { ok: false, issues: [{ message: `The browser couldn’t run this pattern: ${(e as Error).message}`, start: 0, end: pattern.length }] };
  }
  return { ok: true, source, flags, numbered: o.numbered, inline: inline?.[1] ?? '' };
}

/** Power Apps without Power Fx 1.0 hands the pattern to JavaScript with far fewer checks. */
function compileClassic(pattern: string, opts: RegexOptions): Compiled {
  const source = wrap(pattern, opts.anchor);
  const base = `${opts.ignoreCase ? 'i' : ''}${opts.multiline ? 'm' : ''}`;
  for (const flags of [`u${base}`, base]) {
    try {
      new RegExp(source, flags);
      return { ok: true, source, flags, numbered: true, inline: '' };
    } catch {
      /* try without the u flag */
    }
  }
  try {
    new RegExp(pattern, `u${base}`);
  } catch (e) {
    const msg = (e as Error).message.replace(/^Invalid regular expression: \/.*\/[a-z]*: /s, '');
    return { ok: false, issues: [{ message: `This pattern isn’t valid: ${msg}.`, start: 0, end: pattern.length }] };
  }
  return { ok: false, issues: [{ message: 'This pattern isn’t valid.', start: 0, end: pattern.length }] };
}

/** A Power Fx text literal for the pattern, or the Match enum member it equals. */
export function patternLiteral(pattern: string, host: Host): string {
  const hit = Object.entries(matchEnum(host)).find(([, v]) => v === pattern);
  return hit ? `Match.${hit[0]}` : `"${pattern.replace(/"/g, '""')}"`;
}

export function optionsLiteral(opts: RegexOptions, fn: 'IsMatch' | 'Match' | 'MatchAll'): string {
  const list: string[] = [];
  // IsMatch checks the whole text in Power Apps but anywhere elsewhere, so always say which.
  if (fn === 'IsMatch' || opts.anchor !== 'Contains') list.push(opts.anchor);
  if (opts.ignoreCase) list.push('IgnoreCase');
  if (opts.multiline) list.push('Multiline');
  if (opts.host === 'v1') {
    if (opts.dotAll) list.push('DotAll');
    if (opts.freeSpacing) list.push('FreeSpacing');
    if (opts.numbered) list.push('NumberedSubMatches');
  }
  return list.map((x) => `MatchOptions.${x}`).join(' & ');
}

export function formula(fn: 'IsMatch' | 'Match' | 'MatchAll', text: string, pattern: string, opts: RegexOptions): string {
  const o = optionsLiteral(opts, fn);
  return `${fn}(${text || 'TextInput1.Text'}, ${patternLiteral(pattern, opts.host)}${o ? `, ${o}` : ''})`;
}

export interface Preset {
  label: string;
  pattern: string;
  anchor: Anchor;
  sample: string;
}

export const PRESETS: Preset[] = [
  { label: 'Email', pattern: MATCH_ENUM.Email, anchor: 'Complete', sample: 'joan@contoso.com\nbob.jones@sub.contoso.co.uk\nnot-an-email\nname@localhost' },
  { label: 'Indian mobile', pattern: '(?:\\+91[\\-\\s]?)?[6-9]\\d{9}', anchor: 'Complete', sample: '9876543210\n+91 9876543210\n+91-6123456789\n5876543210\n98765 43210' },
  { label: 'US phone', pattern: '\\(?\\d{3}\\)?[\\s.\\-]?\\d{3}[\\s.\\-]?\\d{4}', anchor: 'Complete', sample: '(425) 555-0100\n425.555.0100\n4255550100\n555-0100' },
  { label: 'PIN code', pattern: '[1-9]\\d{5}', anchor: 'Complete', sample: '600001\n110011\n012345\n60000' },
  { label: 'PAN', pattern: '[A-Z]{5}\\d{4}[A-Z]', anchor: 'Complete', sample: 'ABCDE1234F\nabcde1234f\nABCD1234F' },
  { label: 'ZIP code', pattern: '\\d{5}(?:-\\d{4})?', anchor: 'Complete', sample: '98052\n98052-6399\n9805' },
  { label: 'Date yyyy-mm-dd', pattern: '\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])', anchor: 'Complete', sample: '2026-10-24\n2026-13-01\n2026-02-30\n24-10-2026' },
  { label: 'Time HH:mm', pattern: '(?:[01]\\d|2[0-3]):[0-5]\\d', anchor: 'Complete', sample: '09:30\n23:59\n24:00\n9:30' },
  { label: 'Decimal number', pattern: '-?\\d+(?:\\.\\d+)?', anchor: 'Complete', sample: '42\n-3.14\n1.\n.5\n1,000' },
  { label: 'Password rule', pattern: '(?=.{0,63}\\p{Lu})(?=.{0,63}\\p{Ll})(?=.{0,63}\\d).{8,64}', anchor: 'Complete', sample: 'Summer2026\nsummer2026\nShort1\nNoDigitsHere' },
  { label: 'GUID', pattern: '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}', anchor: 'Complete', sample: '3f2504e0-4f89-11d3-9a0c-0305e82c3301\n3f2504e0-4f89-11d3-9a0c' },
  { label: 'Ticket IDs in text', pattern: '(?<project>[A-Z]{2,5})-(?<number>\\d+)', anchor: 'Contains', sample: 'Fixed in INC-1042 and PRJ-77, see also inc-5.' },
];
