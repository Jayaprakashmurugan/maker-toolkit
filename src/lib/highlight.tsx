import type { ReactNode } from 'react';

// A small Power Fx tokenizer: just enough to colour strings, numbers,
// function calls, enums (Color.Red), keywords, operators and punctuation.
const ENUMS = 'Color|TimeUnit|SortOrder|NotificationType|ScreenTransition|DateTimeFormat|StartOfWeek|JSONFormat|Match|RemoveFlags|LaunchTarget';
const TOKEN = new RegExp(
  [
    /("(?:[^"\\]|\\.)*")/.source,
    /(\b\d+(?:\.\d+)?%?)/.source,
    /([A-Za-z_][A-Za-z0-9_]*(?=\s*\())/.source,
    `(\\b(?:${ENUMS})\\.[A-Za-z]+)`,
    /(\b(?:true|false|ThisItem|ThisRecord|Self|Parent|FirstError)\b)/.source,
    /(&&|\|\||<>|<=|>=|[=<>&!+\-*/^])/.source,
    /([()[\]{},;:|])/.source,
  ].join('|'),
  'g',
);
const CLASSES = ['str', 'num', 'fn', 'enum', 'kw', 'op', 'punc'];

export function highlight(code: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (const m of code.matchAll(TOKEN)) {
    const start = m.index ?? 0;
    if (start > last) out.push(code.slice(last, start));
    const cls = CLASSES[m.slice(1).findIndex((g) => g !== undefined)];
    out.push(
      <span key={i++} className={`tk-${cls}`}>
        {m[0]}
      </span>,
    );
    last = start + m[0].length;
  }
  if (last < code.length) out.push(code.slice(last));
  return out;
}
