import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { MATCH_ENUM, MATCH_ENUM_CLASSIC, PRESETS, compile, formula, matchEnum, type Anchor, type Host, type RegexOptions } from '../lib/powerFxRegex';
import { CodeLine } from './FormulaDetail';

interface Hit {
  full: string;
  index: number;
  subs: (string | null)[];
  groups: Record<string, string | null> | null;
}
interface LineResult {
  first: Hit | null;
  all: Hit[];
}
type Results = { id: number; lines: LineResult[] } | { id: number; timeout: true };

// Matching runs in a worker so a runaway pattern can be stopped instead of freezing the page.
const WORKER = `onmessage = (e) => {
  const { id, source, flags, texts, all } = e.data;
  const re = new RegExp(source, flags), reG = new RegExp(source, flags + 'g');
  const hit = (m) => m && { full: m[0], index: m.index, subs: m.slice(1).map((s) => s ?? null), groups: m.groups ? Object.fromEntries(Object.entries(m.groups).map(([k, v]) => [k, v ?? null])) : null };
  postMessage({ id, lines: texts.map((t) => ({ first: hit(re.exec(t)), all: all ? [...t.matchAll(reG)].slice(0, 500).map(hit) : [] })) });
};`;
const TIMEOUT = 1500;

const ANCHORS: [Anchor, string][] = [
  ['Complete', 'Whole text'],
  ['Contains', 'Anywhere'],
  ['BeginsWith', 'Starts with'],
  ['EndsWith', 'Ends with'],
];

function marked(text: string, hits: Hit[]): ReactNode[] {
  const out: ReactNode[] = [];
  let at = 0;
  hits.forEach((h, k) => {
    if (h.index < at) return;
    out.push(text.slice(at, h.index));
    out.push(<mark key={k}>{h.full || '\u200b'}</mark>);
    at = h.index + h.full.length;
  });
  out.push(text.slice(at));
  return out;
}

function Parts({ hit, opts }: { hit: Hit; opts: RegexOptions }) {
  const named = Object.entries(hit.groups ?? {});
  const numbered = opts.host === 'classic' || opts.numbered;
  if (!named.length && !(numbered && hit.subs.length)) return null;
  const show = (v: string | null) => (v == null ? <i>blank</i> : `"${v}"`);
  return (
    <span className="rx-parts">
      {named.map(([k, v]) => (
        <span key={k}>
          <b>{k}</b> {show(v)}
        </span>
      ))}
      {numbered &&
        hit.subs.map((v, k) => (
          <span key={`n${k}`}>
            <b>SubMatches {k + 1}</b> {show(v)}
          </span>
        ))}
    </span>
  );
}

export default function RegexTester() {
  const [host, setHost] = useState<Host>('classic');
  const [anchor, setAnchor] = useState<Anchor>(PRESETS[0].anchor);
  const [flags, setFlags] = useState({ ignoreCase: false, multiline: false, dotAll: false, freeSpacing: false, numbered: false });
  const [pattern, setPattern] = useState(MATCH_ENUM_CLASSIC.Email);
  const [text, setText] = useState(PRESETS[0].sample);
  const [perLine, setPerLine] = useState(true);
  const [ref, setRef] = useState('TextInput1.Text');
  const [preset, setPreset] = useState(PRESETS[0].label);
  const [results, setResults] = useState<Results | null>(null);
  const worker = useRef<Worker | null>(null);
  const job = useRef(0);
  const done = useRef(0);

  const opts: RegexOptions = { host, anchor, ...flags, ...(host === 'classic' ? { dotAll: false, freeSpacing: false, numbered: true } : {}) };
  const compiled = useMemo(() => (pattern ? compile(pattern, opts) : null), [pattern, host, anchor, flags]);
  const texts = useMemo(() => (perLine ? text.split(/\r?\n/) : [text]), [text, perLine]);

  useEffect(() => {
    if (!compiled?.ok) return setResults(null);
    const id = ++job.current;
    const start = () => {
      const url = URL.createObjectURL(new Blob([WORKER], { type: 'text/javascript' }));
      const w = new Worker(url);
      URL.revokeObjectURL(url);
      w.onmessage = (e) => {
        if (e.data.id !== job.current) return;
        done.current = e.data.id;
        setResults(e.data);
      };
      return w;
    };
    worker.current ??= start();
    worker.current.postMessage({ id, source: compiled.source, flags: compiled.flags, texts, all: !perLine || anchor === 'Contains' });
    const t = setTimeout(() => {
      if (job.current !== id || done.current === id) return;
      worker.current?.terminate();
      worker.current = null;
      setResults({ id, timeout: true });
    }, TIMEOUT);
    return () => clearTimeout(t);
  }, [compiled, texts, perLine, anchor]);

  useEffect(() => () => worker.current?.terminate(), []);

  const switchHost = (h: Host) => {
    // Keep a predefined pattern pointing at the same Match enum member in the other host.
    const name = Object.entries(matchEnum(host)).find(([, v]) => v === pattern)?.[0];
    if (name) setPattern(matchEnum(h)[name]);
    setHost(h);
  };
  const toggle = (k: keyof typeof flags) => setFlags((f) => ({ ...f, [k]: !f[k] }));

  const ready = results && 'lines' in results && results.id === job.current && compiled?.ok ? results.lines : null;
  const matched = ready ? ready.filter((l) => l.first).length : 0;
  const names = [...pattern.matchAll(/\(\?<([^>=!]+)>/g)].map((m) => m[1]);
  const v1 = host === 'v1';
  const issues = compiled && !compiled.ok ? compiled.issues : [];

  return (
    <div className="rx">
      <div className="ts-presets" role="group" aria-label="Common patterns">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            className="chip"
            aria-pressed={preset === p.label}
            onClick={() => {
              setPreset(p.label);
              setPattern(p.pattern === MATCH_ENUM.Email ? matchEnum(host).Email : p.pattern);
              setAnchor(p.anchor);
              setText(p.sample);
              setPerLine(p.anchor !== 'Contains');
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="bf-toolbar">
        <div className="bf-control">
          <span className="bf-control__label">Rules</span>
          <div className="segmented" role="group" aria-label="Rules">
            <button type="button" aria-pressed={host === 'classic'} onClick={() => switchHost('classic')}>
              Power Apps
            </button>
            <button type="button" aria-pressed={v1} onClick={() => switchHost('v1')}>
              Power Fx 1.0
            </button>
          </div>
        </div>
        <div className="bf-control">
          <span className="bf-control__label">Match</span>
          <div className="segmented" role="group" aria-label="Match">
            {ANCHORS.map(([a, label]) => (
              <button key={a} type="button" aria-pressed={anchor === a} onClick={() => setAnchor(a)}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <section className="bf-checks rx-pattern" aria-labelledby="rx-p">
        <div className="bf-checks__head">
          <h2 id="rx-p">Pattern</h2>
          <div className="rx-flags">
            <label className="ts-check">
              <input type="checkbox" checked={opts.ignoreCase} onChange={() => toggle('ignoreCase')} /> IgnoreCase
            </label>
            <label className="ts-check">
              <input type="checkbox" checked={opts.multiline} onChange={() => toggle('multiline')} /> Multiline
            </label>
            <label className="ts-check" title={v1 ? '' : 'Needs Power Fx 1.0'}>
              <input type="checkbox" checked={opts.dotAll} disabled={!v1} onChange={() => toggle('dotAll')} /> DotAll
            </label>
            <label className="ts-check" title={v1 ? '' : 'Needs Power Fx 1.0'}>
              <input type="checkbox" checked={opts.freeSpacing} disabled={!v1} onChange={() => toggle('freeSpacing')} /> FreeSpacing
            </label>
            <label className="ts-check" title={v1 ? '' : 'Always on in Power Apps'}>
              <input type="checkbox" checked={opts.numbered} disabled={!v1} onChange={() => toggle('numbered')} /> NumberedSubMatches
            </label>
          </div>
        </div>
        <textarea
          className={`rx-input${issues.length ? ' is-bad' : ''}`}
          value={pattern}
          onChange={(e) => (setPattern(e.target.value), setPreset(''))}
          rows={Math.min(8, Math.max(2, pattern.split('\n').length))}
          placeholder="Type a regular expression, such as \d{3}-\d{4}"
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          aria-label="Regular expression"
          aria-invalid={issues.length > 0}
          aria-describedby="rx-issues"
        />
        <div id="rx-issues" aria-live="polite">
          {issues.length > 0 && (
            <ol className="rx-issues">
              {issues.slice(0, 8).map((x, k) => (
                <li key={k}>
                  <code className="rx-at">
                    {pattern.slice(Math.max(0, x.start - 12), x.start)}
                    <mark>{pattern.slice(x.start, x.end) || ' '}</mark>
                    {pattern.slice(x.end, x.end + 12)}
                  </code>
                  <span>{x.message}</span>
                </li>
              ))}
            </ol>
          )}
          {compiled?.ok && v1 && <p className="rx-ok">Follows the Power Fx 1.0 rules, so it won’t give an authoring error.</p>}
        </div>
      </section>

      <div className="bf-panes rx-panes">
        <section className="bf-pane" aria-labelledby="rx-t">
          <div className="bf-pane__head">
            <h2 id="rx-t">Test text</h2>
            <div className="segmented" role="group" aria-label="Test as">
              <button type="button" aria-pressed={perLine} onClick={() => setPerLine(true)}>
                Each line
              </button>
              <button type="button" aria-pressed={!perLine} onClick={() => setPerLine(false)}>
                All as one
              </button>
            </div>
          </div>
          <textarea
            className="bf-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={perLine ? 'One value per line, like entries in a text input.' : 'A block of text to search, as with MatchAll.'}
            spellCheck={false}
            aria-label="Test text"
          />
        </section>

        <section className="bf-pane bf-pane--out" aria-labelledby="rx-r">
          <div className="bf-pane__head">
            <h2 id="rx-r">Results</h2>
            {ready && (
              <p className="sv-stats">
                {perLine ? (
                  <>
                    <b>{matched}</b> of {texts.length} match
                  </>
                ) : (
                  <>
                    <b>{ready[0].all.length}</b> {ready[0].all.length === 1 ? 'match' : 'matches'}
                  </>
                )}
              </p>
            )}
          </div>
          <div className="rx-results" aria-live="polite">
            {results && 'timeout' in results ? (
              <p className="lc-warn">This pattern took too long and was stopped. Nested repeats such as (a+)+ can take forever on some text; simplify the pattern.</p>
            ) : !compiled ? (
              <p className="bf-output__empty">Type a pattern to test it.</p>
            ) : !compiled.ok ? (
              <p className="bf-output__empty">Fix the pattern above to see results.</p>
            ) : !ready ? null : perLine ? (
              <ul className="rx-lines">
                {ready.map((l, k) => (
                  <li key={k} className={l.first ? 'is-yes' : 'is-no'}>
                    <span className="rx-mark" aria-label={l.first ? 'Matches' : 'No match'}>
                      {l.first ? '✓' : '✗'}
                    </span>
                    <span className="rx-line">
                      <code>{texts[k] ? marked(texts[k], anchor === 'Contains' ? l.all : l.first ? [l.first] : []) : <i>empty</i>}</code>
                      {l.first && (
                        <span className="rx-meta">
                          StartMatch {l.first.index + 1}
                          {anchor === 'Contains' && l.all.length > 1 && <> · MatchAll finds {l.all.length}</>}
                        </span>
                      )}
                      {l.first && <Parts hit={l.first} opts={opts} />}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <>
                <pre className="rx-block">
                  <code>{marked(texts[0], ready[0].all)}</code>
                </pre>
                {ready[0].all.length > 0 && (
                  <ol className="rx-hits">
                    {ready[0].all.map((h, k) => (
                      <li key={k}>
                        <code>{h.full ? `"${h.full}"` : <i>empty</i>}</code> <span className="rx-meta">StartMatch {h.index + 1}</span>
                        <Parts hit={h} opts={opts} />
                      </li>
                    ))}
                  </ol>
                )}
              </>
            )}
          </div>
        </section>
      </div>

      {compiled?.ok && (
        <section className="bf-checks" aria-labelledby="rx-f">
          <div className="bf-checks__head">
            <h2 id="rx-f">Formulas</h2>
            <label className="rx-ref">
              Text to check
              <input className="cb-input" value={ref} onChange={(e) => setRef(e.target.value)} spellCheck={false} aria-label="Text to check, as a Power Fx expression" />
            </label>
          </div>
          <dl className="rx-formulas">
            {(
              [
                ['IsMatch', 'Validate: true or false, for example in a button’s DisplayMode or a label’s Visible.'],
                ['Match', `Extract the first match, then read .FullMatch${names.length ? ` or a named part, such as .${names[0]}` : opts.numbered ? ' or .SubMatches' : ''}.`],
                ['MatchAll', 'Extract every match as a table, for example as a gallery’s Items.'],
              ] as const
            ).map(([fn, what]) => (
              <Fragment key={fn}>
                <dt>{what}</dt>
                <dd>
                  <CodeLine code={formula(fn, ref, pattern, opts)} label={`${fn} formula`} />
                </dd>
              </Fragment>
            ))}
          </dl>
          <ul className="notes od-tips">
            <li>The pattern and options must be fixed text in the formula. Power Fx doesn’t accept them from a variable.</li>
            {host === 'classic' ? (
              <li>“Power Apps” follows today’s canvas apps. Choose Power Fx 1.0 to check the stricter rules used by Copilot Studio, Dataverse formulas and other hosts.</li>
            ) : (
              <li>Outside Power Apps, IsMatch searches anywhere by default, so the formula always states MatchOptions.{anchor}.</li>
            )}
          </ul>
        </section>
      )}

      <details className="rx-enum">
        <summary>Predefined patterns (the Match enum)</summary>
        <div className="rx-enum__table">
          <table>
            <thead>
              <tr>
                <th>Use</th>
                <th>Means</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(matchEnum(host)).map(([k, v]) => (
                <tr key={k}>
                  <td>
                    <button type="button" className="link-btn" onClick={() => (setPattern(v), setPreset(''))}>
                      Match.{k}
                    </button>
                  </td>
                  <td>
                    <code>{v}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
