import { describe, expect, it } from 'vitest';
import type { Lang } from '../data/types';
import { beautify, tokenize, type Mode } from './beautify';

const MODES: Mode[] = ['smart', 'expanded', 'oneline'];
const format = (src: string, lang: Lang, mode: Mode = 'smart') => beautify(src, { lang, mode, indent: 2 }).output;

describe('Power Fx interpolated strings', () => {
  it('keeps $"…" together', () => {
    for (const mode of MODES) {
      expect(format('Notify($"Hello {User().FullName}")', 'powerfx', mode)).toBe('Notify($"Hello {User().FullName}")');
    }
  });

  it('leaves quotes inside a {…} hole alone', () => {
    const src = 'Set(x, $"Total: {Text(Sum(Items, Price), "0.00")} done")';
    expect(format(src, 'powerfx')).toBe(src);
    expect(format(src, 'powerfx', 'expanded')).toBe(
      'Set(\n  x,\n  $"Total: {Text(Sum(Items, Price), "0.00")} done"\n)',
    );
  });

  it('reads escaped quotes, literal braces, nested records and nested strings as one string', () => {
    const str = '$"{{id}} ""{With({c: "}"}, c)}"" {If(ok, $"yes, {Concat(T, Name, ", ")}", "no")}"';
    const toks = tokenize(`Set(x, ${str})`, 'powerfx');
    expect(toks.map((t) => t.v)).toEqual(['Set', '(', 'x', ',', str, ')']);
    expect(toks[4].t).toBe('str');
  });

  it('reports one that is never closed', () => {
    const { issues } = beautify('Notify($"Hello {User().FullName")', { lang: 'powerfx', mode: 'smart', indent: 2 });
    expect(issues.filter((i) => i.kind === 'strings').map((i) => i.pos)).toEqual([7]);
  });
});

// ── Only whitespace changes ──────────────────────────────────
// A scanner of its own, so a tokenizer bug can't hide itself: it splits source into the code between literals, with
// all whitespace removed, and the literals (strings, quoted names), byte for byte. Comments keep their words only,
// because the one-line layout turns `// note` into `/* note */`.

function quotedEnd(s: string, i: number, lang: Lang): number {
  const re =
    lang === 'wdl' && s[i] === '"' ? /"(?:[^"\\]|\\.)*"?/y : s[i] === '"' ? /"(?:[^"]|"")*"?/y : /'(?:[^']|'')*'?/y;
  re.lastIndex = i;
  re.test(s);
  return re.lastIndex;
}

// $"…": "" is a quote and {{ }} are braces in the text; a {…} hole is an expression, with its own strings and braces.
function interpolatedEnd(s: string, i: number): number {
  let j = i + 2;
  while (j < s.length) {
    if (['""', '{{', '}}'].includes(s.slice(j, j + 2))) j += 2;
    else if (s[j] === '"') return j + 1;
    else if (s[j] === '{') j = holeEnd(s, j);
    else j++;
  }
  return s.length;
}

function holeEnd(s: string, i: number): number {
  let depth = 0;
  let j = i;
  do {
    if (s.startsWith('$"', j)) j = interpolatedEnd(s, j);
    else if (s[j] === '"' || s[j] === "'") j = quotedEnd(s, j, 'powerfx');
    else {
      if (s[j] === '{') depth++;
      if (s[j] === '}') depth--;
      j++;
    }
  } while (depth > 0 && j < s.length);
  return j;
}

function essence(src: string, lang: Lang): string[] {
  const out: string[] = [];
  let code = '';
  let i = 0;
  const keep = (end: number, text = src.slice(i, end)) => {
    out.push(code, text);
    code = '';
    i = end;
  };
  const comment = (from: number, to: number, end: number) => keep(end, `/*${src.slice(from, to).replace(/\s/g, '')}*/`);
  while (i < src.length) {
    if (src.startsWith('//', i)) {
      const eol = src.indexOf('\n', i);
      const end = eol < 0 ? src.length : eol;
      comment(i + 2, end, end);
    } else if (src.startsWith('/*', i)) {
      const end = src.indexOf('*/', i + 2);
      comment(i + 2, end, end + 2);
    } else if (lang === 'powerfx' && src.startsWith('$"', i)) keep(interpolatedEnd(src, i));
    else if (src[i] === '"' || src[i] === "'") keep(quotedEnd(src, i, lang));
    else {
      if (!/\s/.test(src[i])) code += src[i];
      i++;
    }
  }
  out.push(code);
  return out;
}

const SAMPLES: [Lang, string][] = [
  [
    'wdl',
    "if(empty(triggerBody()?['email']),concat('Hello ',triggerBody()?['name'],', welcome!'),formatDateTime(convertTimeZone(utcNow(),'UTC','India Standard Time'),'dd MMM yyyy HH:mm'))",
  ],
  ['wdl', '@and(equals(1,1),not(false))'],
  ['wdl', "@{if(equals(body('Get_item')?['Status']?['Value'],'Done'),'it''s done',null)}"],
  ['wdl', 'json(\'{"items": [1, 2], "note": "a, b"}\')'],
  ['wdl', "formatNumber(mul(div(variables('Total'),3),-100),'N2')"],
  ['wdl', "concat('it''s', \"x\\\"y\", '  spaced   out  ')"],
  [
    'wdl',
    "and(greater(length(variables('items')),0),not(empty(triggerOutputs()?['body/value'])),contains(toLower(triggerBody()?['subject']),'invoice'))",
  ],
  [
    'powerfx',
    'If(IsBlank(txtEmail.Text),Notify("Email is required",NotificationType.Error),Patch(Contacts,Defaults(Contacts),{FullName:txtName.Text,Email:Lower(Trim(txtEmail.Text)),Created:Now()});Navigate(DoneScreen,ScreenTransition.Fade))',
  ],
  ['powerfx', 'Notify($"Hello {User().FullName}")'],
  ['powerfx', 'Set(x, $"Total: {Text(Sum(Items, Price), "0.00")} done")'],
  ['powerfx', 'Set(msg, $"{{id}} ""{With({c: "}"}, c)}"" {If(ok, $"yes, {Concat(T, Name, ", ")}", "no")}")'],
  [
    'powerfx',
    'ClearCollect(colRows,ForAll(Sequence(10) As N,{Index:N.Value,Label:$"Row {N.Value} of {CountRows(Gallery1.AllItems)}"}))',
  ],
  ['powerfx', 'Filter(\'Due Tasks\',\'Due Date\'<Today() And Status.Value in ["Open","Late"] Or Not IsBlank(Owner))'],
  ['powerfx', 'x in [1,2]'],
  ['powerfx', 'a And (b Or c)'],
  ['powerfx', 'a And -b'],
  ['powerfx', 'Not(IsBlank(x)) And Or(a, b)'],
  ['powerfx', 'With({total:Sum(Items,Price*Qty)},If(total>100&&!IsBlank(Coupon),total*0.9,total)) /* discount */'],
  ['powerfx', 'Set(a, 1); // first\nSet(b, "  two  ")'],
  ['powerfx', 'If(x, // yes\n1, 2)'],
];

describe('formatting', () => {
  it.each(SAMPLES)('changes only whitespace outside strings and comments (%s: %s)', (lang, src) => {
    const want = essence(src, lang);
    for (const mode of MODES) {
      for (const indent of [2, 4]) {
        const { output } = beautify(src, { lang, mode, indent });
        expect(essence(output, lang), `${mode}, indent ${indent}:\n${output}`).toEqual(want);
      }
    }
  });
});
