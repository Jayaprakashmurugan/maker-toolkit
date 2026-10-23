import type { ReactNode } from 'react';
import type { Lang } from '../data/types';

// Small tokenizers: just enough to colour strings, numbers, function calls,
// enums (Color.Red), keywords, placeholders, operators and punctuation.

const FX_ENUMS =
  'Color|TimeUnit|SortOrder|NotificationType|ScreenTransition|DateTimeFormat|StartOfWeek|JSONFormat|Match|MatchOptions|RemoveFlags|LaunchTarget|ErrorKind|DataSourceInfo|RecordInfo|TraceSeverity';

const POWERFX = new RegExp(
  [
    /("(?:[^"]|"")*")/.source,
    /(\b\d+(?:\.\d+)?%?)/.source,
    /([A-Za-z_][A-Za-z0-9_]*(?=\s*\())/.source,
    `(\\b(?:${FX_ENUMS})\\.[A-Za-z]+)`,
    /(\b(?:true|false|ThisItem|ThisRecord|Self|Parent|FirstError|As|in|exactin)\b)/.source,
    /(&&|\|\||<>|<=|>=|[=<>&!+\-*/^])/.source,
    /([()[\]{},;:|])/.source,
  ].join('|'),
  'g',
);
const POWERFX_CLASSES = ['str', 'num', 'fn', 'enum', 'kw', 'op', 'punc'];

// Power Automate (Workflow Definition Language): single-quoted strings, '' escapes.
const WDL = new RegExp(
  [
    /('(?:[^']|'')*')/.source,
    /(-?\b\d+(?:\.\d+)?\b)/.source,
    /([A-Za-z_][A-Za-z0-9_]*(?=\s*\())/.source,
    /(<[A-Za-z][\w -]*>)/.source,
    /(\b(?:true|false|null)\b)/.source,
    /([?@])/.source,
    /([()[\]{},.:])/.source,
  ].join('|'),
  'g',
);
const WDL_CLASSES = ['str', 'num', 'fn', 'ph', 'kw', 'op', 'punc'];

export function highlight(code: string, lang: Lang = 'powerfx'): ReactNode[] {
  const re = lang === 'wdl' ? WDL : POWERFX;
  const classes = lang === 'wdl' ? WDL_CLASSES : POWERFX_CLASSES;
  re.lastIndex = 0;
  const out: ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (const m of code.matchAll(re)) {
    const start = m.index ?? 0;
    if (start > last) out.push(code.slice(last, start));
    const cls = classes[m.slice(1).findIndex((g) => g !== undefined)];
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
