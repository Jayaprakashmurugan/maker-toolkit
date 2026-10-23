import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { parseSample } from '../lib/jsonSchema';
import { buildExpression, looksRaw, pathLabel, typeOf, type ArrayMode, type Seg, type Source } from '../lib/jsonExpression';
import { sendJson, takeJson } from '../lib/handoff';
import { CodeLine } from './FormulaDetail';

const SAMPLES: Record<string, string> = {
  'HTTP raw outputs': JSON.stringify(
    {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'x-request-id': '5f2c9a' },
      body: {
        orderId: 'A-1042',
        customer: { id: 981, name: 'Contoso Ltd', 'billing email': 'ap@contoso.com' },
        lines: [
          { sku: 'PEN-01', qty: 10, price: 1.2 },
          { sku: 'PAD-02', qty: 2, price: 3 },
        ],
        paid: false,
      },
    },
    null,
    2,
  ),
  'SharePoint Get items': JSON.stringify(
    {
      value: [
        { ID: 1, Title: 'Laptop request', Status: { Value: 'Approved' }, Approver: { Email: 'ben@contoso.com' } },
        { ID: 2, Title: 'Monitor', Status: { Value: 'Pending' }, Approver: null },
      ],
    },
    null,
    2,
  ),
};

const SOURCES: { id: Source; label: string; nameLabel: string; placeholder: string }[] = [
  { id: 'action', label: 'Action', nameLabel: 'Action name', placeholder: 'e.g. Get items' },
  { id: 'compose', label: 'Compose', nameLabel: 'Compose name', placeholder: 'e.g. Compose' },
  { id: 'trigger', label: 'Trigger', nameLabel: '', placeholder: '' },
  { id: 'variable', label: 'Variable', nameLabel: 'Variable name', placeholder: 'e.g. varPayload' },
  { id: 'loop', label: 'Loop item', nameLabel: 'Loop name (optional)', placeholder: 'e.g. Apply to each' },
];

interface Row {
  id: string;
  path: Seg[];
  label: string;
  type: string;
  preview: string;
  depth: number;
  children: number;
  search: string;
}

const idOf = (path: Seg[]) => JSON.stringify(path);
const MAX_ROWS = 2000;

function preview(v: unknown, type: string): string {
  if (type === 'object') return `{ ${Object.keys(v as object).length} }`;
  if (type === 'array') return `[ ${(v as unknown[]).length} ]`;
  if (type === 'string') {
    const s = v as string;
    return JSON.stringify(s.length > 60 ? `${s.slice(0, 59)}…` : s);
  }
  return String(v);
}

/** Flattens the JSON into rows, depth-first, honouring which nodes are open. */
function flatten(value: unknown, open: Set<string>, all: boolean): Row[] {
  const rows: Row[] = [];
  const walk = (v: unknown, path: Seg[], label: string, depth: number) => {
    if (rows.length >= MAX_ROWS) return;
    const type = typeOf(v);
    const entries: [Seg, string, unknown][] =
      type === 'object'
        ? Object.entries(v as object).map(([k, x]) => [{ key: k }, k, x])
        : type === 'array'
          ? (v as unknown[]).map((x, i) => [{ index: i }, `[${i}]`, x])
          : [];
    const id = idOf(path);
    rows.push({
      id,
      path,
      label,
      type,
      preview: preview(v, type),
      depth,
      children: entries.length,
      search: `${label} ${type === 'string' || type === 'number' || type === 'boolean' ? String(v) : ''}`.toLowerCase(),
    });
    if (entries.length && (all || open.has(id))) for (const [seg, l, x] of entries) walk(x, [...path, seg], l, depth + 1);
  };
  walk(value, [], 'root', 0);
  return rows;
}

function defaultOpen(value: unknown): Set<string> {
  const open = new Set<string>();
  const walk = (v: unknown, path: Seg[], depth: number) => {
    const type = typeOf(v);
    if ((type !== 'object' && type !== 'array') || depth > 3) return;
    open.add(idOf(path));
    if (type === 'object') for (const [k, x] of Object.entries(v as object)) walk(x, [...path, { key: k }], depth + 1);
    else (v as unknown[]).slice(0, 3).forEach((x, i) => walk(x, [...path, { index: i }], depth + 1));
  };
  walk(value, [], 0);
  return open;
}

function valueAt(root: unknown, path: Seg[]): unknown {
  return path.reduce<unknown>((v, s) => ('key' in s ? (v as Record<string, unknown>)?.[s.key] : (v as unknown[])?.[s.index]), root);
}

export default function ExpressionPicker() {
  const [src, setSrc] = useState('');
  const [source, setSource] = useState<Source>('action');
  const [name, setName] = useState('');
  const [rawPref, setRawPref] = useState<'auto' | 'raw' | 'body'>('auto');
  const [arrayMode, setArrayMode] = useState<ArrayMode>('index');
  const [useFormat, setUseFormat] = useState<'paste' | 'clean'>('paste');
  const [fxVar, setFxVar] = useState('varJson');
  const [filter, setFilter] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [open, setOpen] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const detailRef = useRef<HTMLElement>(null);

  // JSON handed over from the JSON Schema Helper.
  useEffect(() => {
    const handed = takeJson();
    if (handed) setSrc(handed);
  }, []);

  const hasInput = src.trim().length > 0;
  const parsed = useMemo(() => (hasInput ? parseSample(src) : null), [src, hasInput]);
  const value = parsed?.ok ? parsed.value : undefined;

  // Reset the tree when new JSON arrives.
  useEffect(() => {
    if (value === undefined) return;
    setOpen(defaultOpen(value));
    setSelectedId(null);
  }, [value]);

  const rawDetected = value !== undefined && looksRaw(value);
  const sourceInfo = SOURCES.find((s) => s.id === source)!;
  const rawApplies = source === 'action' || source === 'trigger';
  const raw = rawApplies && (rawPref === 'auto' ? rawDetected : rawPref === 'raw');
  const opts = { source, name, raw, arrayMode, fxVar };

  const q = filter.trim().toLowerCase();
  const rows = useMemo(() => {
    if (value === undefined) return [];
    if (!q) return flatten(value, open, false);
    // Searching: show matches and the parents that lead to them.
    const all = flatten(value, open, true);
    const keep = new Set<string>();
    for (const r of all) {
      if (!r.search.includes(q)) continue;
      for (let i = 0; i <= r.path.length; i++) keep.add(idOf(r.path.slice(0, i)));
    }
    return all.filter((r) => keep.has(r.id));
  }, [value, open, q]);

  const selectedRow = useMemo(() => {
    if (!selectedId || value === undefined) return null;
    const path = JSON.parse(selectedId) as Seg[];
    const v = valueAt(value, path);
    return { path, value: v, type: typeOf(v) };
  }, [selectedId, value]);

  const built = selectedRow ? buildExpression(selectedRow.path, selectedRow.type, opts) : null;
  const hasArray = selectedRow?.path.some((s) => 'index' in s);
  const lastIndex = selectedRow ? [...selectedRow.path].reverse().find((s) => 'index' in s) : undefined;

  const toggle = (id: string) =>
    setOpen((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const select = (id: string) => {
    setSelectedId(id);
    if (window.matchMedia('(max-width: 999px)').matches) {
      requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    }
  };

  const handToSchema = () => sendJson(src, '/json-schema-helper/');

  return (
    <div className="bf pk">
      <div className="bf-toolbar">
        <div className="bf-control">
          <span className="bf-control__label">Comes from</span>
          <div className="segmented" role="group" aria-label="Where the JSON comes from">
            {SOURCES.map((s) => (
              <button key={s.id} type="button" aria-pressed={source === s.id} onClick={() => setSource(s.id)}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
        {sourceInfo.nameLabel && (
          <label className="bf-control sh-action">
            <span className="bf-control__label">{sourceInfo.nameLabel}</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder={sourceInfo.placeholder} spellCheck={false} />
          </label>
        )}
        {rawApplies && (
          <div className="bf-control">
            <span className="bf-control__label">Pasted</span>
            <div className="segmented" role="group" aria-label="What was pasted">
              {(
                [
                  ['auto', hasInput && rawPref === 'auto' ? `Auto · ${rawDetected ? 'raw outputs' : 'body'}` : 'Auto-detect'],
                  ['raw', 'Raw outputs'],
                  ['body', 'Body only'],
                ] as const
              ).map(([v, label]) => (
                <button key={v} type="button" aria-pressed={rawPref === v} onClick={() => setRawPref(v)}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bf-panes">
        <section className="bf-pane" aria-labelledby="pk-in-title">
          <div className="bf-pane__head">
            <h2 id="pk-in-title">Sample JSON</h2>
            <div className="bf-pane__actions">
              {Object.keys(SAMPLES).map((n) => (
                <button key={n} type="button" className="link-btn" onClick={() => setSrc(SAMPLES[n])}>
                  {n}
                </button>
              ))}
              {hasInput && (
                <button type="button" className="link-btn" onClick={() => setSrc('')}>
                  Clear
                </button>
              )}
            </div>
          </div>
          <textarea
            ref={inputRef}
            className="bf-input"
            value={src}
            onChange={(e) => setSrc(e.target.value)}
            placeholder={'Run your flow once, open the run, and paste a step’s\nraw outputs or body here.'}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            aria-label="Sample JSON"
          />
        </section>

        <section className="bf-pane pk-tree-pane" aria-labelledby="pk-tree-title">
          <div className="bf-pane__head">
            <h2 id="pk-tree-title">Pick a value</h2>
            {value !== undefined && (
              <div className="bf-pane__actions">
                <button type="button" className="link-btn" onClick={() => setOpen(new Set(flatten(value, open, true).map((r) => r.id)))}>
                  Expand all
                </button>
                <button type="button" className="link-btn" onClick={() => setOpen(new Set([idOf([])]))}>
                  Collapse all
                </button>
              </div>
            )}
          </div>
          {value !== undefined ? (
            <>
              <div className="pk-search">
                <input
                  type="search"
                  placeholder="Find a key or value"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  aria-label="Find a key or value"
                />
              </div>
              <ul className="pk-tree" aria-label="JSON values">
                {rows.map((r) => {
                  const expr = buildExpression(r.path, r.type, opts);
                  return (
                    <li
                      key={r.id}
                      className={`pk-row${r.id === selectedId ? ' is-selected' : ''}`}
                      style={{ '--depth': r.depth } as CSSProperties}
                    >
                      {r.children > 0 ? (
                        <button
                          type="button"
                          className="pk-caret"
                          aria-expanded={q ? true : open.has(r.id)}
                          aria-label={`${open.has(r.id) ? 'Collapse' : 'Expand'} ${r.label}`}
                          onClick={() => toggle(r.id)}
                          disabled={Boolean(q)}
                        />
                      ) : (
                        <span className="pk-caret pk-caret--leaf" aria-hidden="true" />
                      )}
                      <button type="button" className="pk-pick" onClick={() => select(r.id)} aria-pressed={r.id === selectedId}>
                        <span className="pk-key">{r.label}</span>
                        <span className={`pk-val pk-val--${r.type}`}>{r.preview}</span>
                      </button>
                      {r.path.length > 0 && (
                        <button
                          type="button"
                          className="copy-btn pk-use"
                          data-copy={useFormat === 'paste' ? expr.pasteReady : expr.expression}
                          aria-label={`Copy expression for ${pathLabel(r.path)}`}
                          onClick={() => setSelectedId(r.id)}
                        >
                          <span className="copy-btn__idle">Use</span>
                          <span className="copy-btn__done" aria-hidden="true">
                            Copied
                          </span>
                        </button>
                      )}
                    </li>
                  );
                })}
                {rows.length >= MAX_ROWS && <li className="pk-more">Showing the first {MAX_ROWS} rows. Use Find to narrow it down.</li>}
                {q && rows.length === 0 && <li className="pk-more">Nothing matches “{filter.trim()}”.</li>}
              </ul>
            </>
          ) : (
            <div className="bf-output">
              <p className="bf-output__empty">
                {parsed && !parsed.ok ? 'Fix the JSON on the left to see its values.' : 'Paste JSON or load a sample, then pick any value.'}
              </p>
            </div>
          )}
        </section>
      </div>

      {parsed && !parsed.ok && (
        <section className="bf-checks">
          <div className="bf-checks__head">
            <h2>That isn’t valid JSON yet</h2>
          </div>
          <ol className="bf-issues">
            <li>
              <button
                type="button"
                onClick={() => {
                  const el = inputRef.current;
                  if (el && parsed.pos !== undefined) {
                    el.focus();
                    el.setSelectionRange(parsed.pos, parsed.pos + 1);
                  }
                }}
              >
                {parsed.line !== undefined && (
                  <span className="bf-issues__pos">
                    Line {parsed.line}, col {parsed.col}
                  </span>
                )}
                {parsed.message}
              </button>
            </li>
          </ol>
        </section>
      )}

      {value !== undefined && (
        <section className="bf-checks pk-detail" aria-labelledby="pk-detail-title" ref={detailRef}>
          <div className="bf-checks__head">
            <h2 id="pk-detail-title">{selectedRow ? <code>{pathLabel(selectedRow.path)}</code> : 'Expression'}</h2>
            <div className="pk-detail__actions">
              <div className="segmented" role="group" aria-label="What the Use buttons copy">
                <button type="button" aria-pressed={useFormat === 'paste'} onClick={() => setUseFormat('paste')}>
                  Use copies: paste-ready
                </button>
                <button type="button" aria-pressed={useFormat === 'clean'} onClick={() => setUseFormat('clean')}>
                  expression only
                </button>
              </div>
              <button type="button" className="link-btn" onClick={handToSchema}>
                Get a Parse JSON schema for this →
              </button>
            </div>
          </div>

          {selectedRow && built ? (
            <div className="pk-detail__body" key={selectedId}>
              <p className="pk-meta">
                <span className="tag">{selectedRow.type}</span>
                {selectedRow.type !== 'object' && selectedRow.type !== 'array' && (
                  <span className="pk-meta__value">{preview(selectedRow.value, selectedRow.type)}</span>
                )}
              </p>

              {hasArray && (
                <div className="bf-control pk-arraymode">
                  <span className="bf-control__label">Inside a list</span>
                  <div className="segmented" role="group" aria-label="How to read a value inside a list">
                    <button type="button" aria-pressed={arrayMode === 'index'} onClick={() => setArrayMode('index')}>
                      Item {lastIndex && 'index' in lastIndex ? lastIndex.index : 0} only
                    </button>
                    {lastIndex && 'index' in lastIndex && lastIndex.index === 0 && (
                      <button type="button" aria-pressed={arrayMode === 'first'} onClick={() => setArrayMode('first')}>
                        First item, safely
                      </button>
                    )}
                    <button type="button" aria-pressed={arrayMode === 'loop'} onClick={() => setArrayMode('loop')}>
                      Every item (loop)
                    </button>
                  </div>
                </div>
              )}

              {built.loopOver && (
                <div className="pk-loop">
                  <p>
                    Add an <b>Apply to each</b> over this list, then use the expressions below inside it.
                  </p>
                  <CodeLine code={built.loopOver} label="list to loop over" lang="wdl" />
                </div>
              )}

              <div className="pk-outputs">
                <div>
                  <h3 className="detail__label">Paste-ready · for any input field</h3>
                  <CodeLine code={built.pasteReady} label="paste-ready expression" lang="wdl" />
                </div>
                <div>
                  <h3 className="detail__label">Expression · for the expression editor</h3>
                  <CodeLine code={built.expression} label="expression" lang="wdl" />
                </div>
                <div>
                  <h3 className="detail__label">
                    Power Apps · after ParseJSON of
                    <input className="pk-fxvar" value={fxVar} onChange={(e) => setFxVar(e.target.value)} aria-label="Power Apps variable name" />
                  </h3>
                  <CodeLine code={built.powerFx} label="Power Fx formula" />
                </div>
              </div>
            </div>
          ) : (
            <p className="sh-intro">
              Pick any value in the tree, or press <b>Use</b> next to it to copy its expression straight away.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
