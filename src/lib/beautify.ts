// Formats Power Automate (Workflow Definition Language) and Power Fx expressions.
// Only whitespace and line breaks change; the tokens themselves are kept as typed.
import type { Lang } from '../data/types';

export type Mode = 'smart' | 'expanded' | 'oneline';

export type IssueKind = 'brackets' | 'strings' | 'args';

export interface Issue {
  kind: IssueKind;
  message: string;
  pos: number;
  line: number;
  col: number;
}

export interface BeautifyResult {
  output: string;
  issues: Issue[];
  depth: number;
  functions: number;
}

type TokType = 'str' | 'num' | 'word' | 'open' | 'close' | 'comma' | 'semi' | 'colon' | 'op' | 'dot' | 'q' | 'at' | 'cmt';

export interface Tok {
  t: TokType;
  v: string;
  pos: number;
  unary?: boolean;
}

interface Group {
  kind: 'g';
  open: Tok | null;
  close: Tok | null;
  items: Part[][];
  seps: Tok[];
}

type Part = Tok | Group;

const WIDTH = 72;
const PAIRS: Record<string, string> = { '(': ')', '[': ']', '{': '}' };
const isGroup = (p: Part): p is Group => (p as Group).kind === 'g';

/** Guess the language from quote style and function-name casing. */
export function detectLang(src: string): Lang {
  const s = src.trim();
  if (s.startsWith('@')) return 'wdl';
  const sq = (s.match(/'/g) ?? []).length;
  const dq = (s.match(/"/g) ?? []).length;
  if (dq > sq) return 'powerfx';
  if (sq > dq) return 'wdl';
  const calls = [...s.matchAll(/\b([A-Za-z]\w*)\s*\(/g)].map((m) => m[1]);
  const upper = calls.filter((c) => c[0] === c[0].toUpperCase()).length;
  return upper > calls.length - upper ? 'powerfx' : 'wdl';
}

function lineCol(src: string, pos: number) {
  const before = src.slice(0, pos);
  const line = before.split('\n').length;
  return { line, col: pos - before.lastIndexOf('\n') };
}

export function tokenize(src: string, lang: Lang, report?: (message: string, pos: number, kind: IssueKind) => void): Tok[] {
  const toks: Tok[] = [];
  const quote = lang === 'wdl' ? "'" : '"';
  let i = 0;

  const readQuoted = (q: string, what: string) => {
    let j = i + 1;
    for (;;) {
      if (j >= src.length) {
        report?.(`This ${what} is never closed.`, i, 'strings');
        return src.length;
      }
      if (src[j] === q) {
        if (src[j + 1] === q) {
          j += 2;
          continue;
        }
        return j + 1;
      }
      j++;
    }
  };

  while (i < src.length) {
    const c = src[i];
    const rest = src.slice(i);
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    if (c === quote) {
      const end = readQuoted(quote, 'string');
      toks.push({ t: 'str', v: src.slice(i, end), pos: i });
      i = end;
      continue;
    }
    if (lang === 'powerfx' && c === "'") {
      // Quoted names in Power Fx, like 'Due Date'.
      const end = readQuoted("'", 'quoted name');
      toks.push({ t: 'word', v: src.slice(i, end), pos: i });
      i = end;
      continue;
    }
    if (lang === 'wdl' && c === '"') {
      const m = /^"(?:[^"\\]|\\.)*"?/.exec(rest)!;
      toks.push({ t: 'str', v: m[0], pos: i });
      i += m[0].length;
      continue;
    }
    if (rest.startsWith('//')) {
      const end = src.indexOf('\n', i);
      const v = src.slice(i, end < 0 ? src.length : end).trimEnd();
      toks.push({ t: 'cmt', v, pos: i });
      i += v.length;
      continue;
    }
    if (rest.startsWith('/*')) {
      const end = src.indexOf('*/', i + 2);
      if (end < 0) report?.('This comment is never closed.', i, 'strings');
      const v = src.slice(i, end < 0 ? src.length : end + 2);
      toks.push({ t: 'cmt', v, pos: i });
      i += v.length;
      continue;
    }
    const num = /^(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?%?/.exec(rest);
    if (num) {
      toks.push({ t: 'num', v: num[0], pos: i });
      i += num[0].length;
      continue;
    }
    const word = /^[A-Za-z_$][\w$]*/.exec(rest);
    if (word) {
      toks.push({ t: 'word', v: word[0], pos: i });
      i += word[0].length;
      continue;
    }
    const single: Record<string, TokType> = {
      '(': 'open',
      '[': 'open',
      '{': 'open',
      ')': 'close',
      ']': 'close',
      '}': 'close',
      ',': 'comma',
      ';': 'semi',
      ':': 'colon',
      '.': 'dot',
      '?': 'q',
      '@': 'at',
    };
    if (single[c]) {
      toks.push({ t: single[c], v: c, pos: i });
      i++;
      continue;
    }
    const op = /^(?:<>|<=|>=|&&|\|\||[=<>&!+\-*/^%|])/.exec(rest);
    const v = op ? op[0] : c;
    const prev = toks[toks.length - 1];
    const unary =
      (v === '-' || v === '+' || v === '!') &&
      (!prev || ['op', 'open', 'comma', 'semi', 'colon'].includes(prev.t));
    toks.push({ t: 'op', v, pos: i, unary });
    i += v.length;
  }
  return toks;
}

function parse(toks: Tok[], report: (message: string, pos: number, kind: IssueKind) => void, src: string): Group {
  const root: Group = { kind: 'g', open: null, close: null, items: [[]], seps: [] };
  const stack: Group[] = [root];
  const top = () => stack[stack.length - 1];
  const where = (t: Tok) => {
    const { line, col } = lineCol(src, t.pos);
    return `line ${line}, col ${col}`;
  };

  for (const tok of toks) {
    const g = top();
    const item = g.items[g.items.length - 1];
    if (tok.t === 'open') {
      const child: Group = { kind: 'g', open: tok, close: null, items: [[]], seps: [] };
      item.push(child);
      stack.push(child);
    } else if (tok.t === 'close') {
      if (!g.open) {
        report(`Unexpected '${tok.v}': there is no bracket for it to close.`, tok.pos, 'brackets');
        continue;
      }
      if (PAIRS[g.open.v] !== tok.v) {
        report(`Expected '${PAIRS[g.open.v]}' to close '${g.open.v}' from ${where(g.open)}, but found '${tok.v}'.`, tok.pos, 'brackets');
      }
      if (g.items.length > 1 && item.length === 0) report('Trailing comma before the closing bracket.', tok.pos, 'args');
      g.close = tok;
      stack.pop();
    } else if (tok.t === 'comma' || tok.t === 'semi') {
      if (item.length === 0 && !(tok.t === 'semi' && !g.open)) report('Empty argument before this separator.', tok.pos, 'args');
      if (tok.t === 'comma' && !g.open) report('Comma outside of any brackets.', tok.pos, 'args');
      g.seps.push(tok);
      g.items.push([]);
    } else {
      item.push(tok);
    }
  }
  for (const g of stack.slice(1)) report(`'${g.open!.v}' opened at ${where(g.open!)} is never closed.`, g.open!.pos, 'brackets');
  return root;
}

// ── Printing ─────────────────────────────────────────────────

const firstTok = (p: Part): Tok => (isGroup(p) ? p.open! : p);
const lastTok = (p: Part): Tok => (isGroup(p) ? (p.close ?? p.open!) : p);

function space(prev: Part | null, next: Part): string {
  if (!prev) return '';
  const a = lastTok(prev);
  const b = firstTok(next);
  if (b.t === 'cmt' || a.t === 'cmt') return ' ';
  if (b.t === 'open') return ['word', 'close', 'q', 'at', 'dot', 'str'].includes(a.t) ? '' : ' ';
  if (a.t === 'at' || a.t === 'dot' || b.t === 'dot' || a.t === 'q' || b.t === 'q') return '';
  if (b.t === 'colon') return '';
  if (a.t === 'colon') return ' ';
  if (a.t === 'op' && a.unary) return '';
  if (a.t === 'op' || b.t === 'op') return ' ';
  if (a.t === 'open' || b.t === 'close') return '';
  return ' ';
}

const hasLineComment = (parts: Part[]): boolean =>
  parts.some((p) => (isGroup(p) ? p.items.some(hasLineComment) : p.t === 'cmt' && p.v.startsWith('//')));

const isSimple = (g: Group): boolean => g.items.length <= 1 && g.items.every((it) => it.every((p) => !isGroup(p) || isSimple(p)));

export function beautify(src: string, opts: { lang: Lang; mode: Mode; indent: number }): BeautifyResult {
  const issues: Issue[] = [];
  const report = (message: string, pos: number, kind: IssueKind) => issues.push({ kind, message, pos, ...lineCol(src, pos) });
  const toks = tokenize(src, opts.lang, report);
  const root = parse(toks, report, src);
  const { mode, indent: step, lang } = opts;
  const oneLine = mode === 'oneline';

  const tokText = (t: Tok) => (oneLine && t.t === 'cmt' && t.v.startsWith('//') ? `/* ${t.v.slice(2).trim()} */` : t.v);

  const flatItem = (item: Part[]): string => {
    let s = '';
    item.forEach((p, k) => {
      s += space(k ? item[k - 1] : null, p) + (isGroup(p) ? flatGroup(p) : tokText(p));
    });
    return s;
  };

  const flatGroup = (g: Group): string => {
    const empty = g.items.length === 1 && g.items[0].length === 0;
    const pad = lang === 'powerfx' && g.open?.v === '{' && !empty ? ' ' : '';
    let inner = '';
    g.items.forEach((it, k) => {
      inner += flatItem(it);
      if (k < g.seps.length) inner += g.seps[k].v + (k < g.items.length - 1 && g.items[k + 1].length ? ' ' : '');
    });
    return (g.open?.v ?? '') + pad + inner + pad + (g.close?.v ?? '');
  };

  const lines: string[] = [''];
  const col = () => lines[lines.length - 1].length;
  const write = (s: string) => (lines[lines.length - 1] += s);
  const newline = (ind: number) => lines.push(' '.repeat(ind));
  let pendingBreak = -1;

  const printItem = (item: Part[], ind: number) => {
    item.forEach((p, k) => {
      if (pendingBreak >= 0) {
        newline(pendingBreak);
        pendingBreak = -1;
      } else {
        write(space(k ? item[k - 1] : null, p));
      }
      if (isGroup(p)) printGroup(p, ind);
      else {
        write(tokText(p));
        if (!oneLine && p.t === 'cmt' && p.v.startsWith('//')) pendingBreak = ind;
      }
    });
  };

  const printGroup = (g: Group, ind: number) => {
    const flat = flatGroup(g);
    const empty = g.items.length === 1 && g.items[0].length === 0;
    const fits = col() + flat.length <= WIDTH && !g.items.some(hasLineComment);
    const inline = empty || oneLine || (mode === 'smart' ? fits : fits && isSimple(g));
    if (inline) {
      write(flat);
      return;
    }
    write(g.open!.v);
    g.items.forEach((it, k) => {
      pendingBreak = -1;
      newline(ind + step);
      printItem(it, ind + step);
      if (k < g.seps.length) write(g.seps[k].v);
    });
    pendingBreak = -1;
    newline(ind);
    write(g.close?.v ?? '');
  };

  // Top level: Power Fx statements separated by ';' go on their own lines.
  root.items.forEach((it, k) => {
    if (k > 0) {
      if (oneLine) write(' ');
      else newline(0);
    }
    pendingBreak = -1;
    printItem(it, 0);
    if (k < root.seps.length) write(root.seps[k].v);
  });

  let depth = 0;
  let cur = 0;
  let functions = 0;
  toks.forEach((t, k) => {
    if (t.t === 'open') depth = Math.max(depth, ++cur);
    if (t.t === 'close') cur = Math.max(0, cur - 1);
    if (t.t === 'word' && toks[k + 1]?.v === '(') functions++;
  });

  const output = lines.map((l) => l.trimEnd()).join('\n').trim();
  issues.sort((a, b) => a.pos - b.pos);
  return { output, issues, depth, functions };
}
