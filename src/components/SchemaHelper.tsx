import { useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { fieldRows, inferShape, parseSample, shapeStats, toSchema } from '../lib/jsonSchema';
import AnimatedLines, { toLines } from './AnimatedLines';
import { CopyButton } from './FormulaDetail';

const SAMPLES: Record<string, string> = {
  'SharePoint items': JSON.stringify(
    {
      value: [
        { ID: 1, Title: 'Laptop request', Status: { Value: 'Approved' }, Amount: 1250.5, Approver: { Email: 'ben@contoso.com', DisplayName: 'Ben Ortiz' } },
        { ID: 2, Title: 'Monitor', Status: { Value: 'Pending' }, Amount: 180, Approver: null, Notes: 'Urgent' },
      ],
    },
    null,
    2,
  ),
  'Forms response': JSON.stringify(
    { responder: 'ada@contoso.com', submitDate: '2026-10-23T09:15:00Z', rating: 4, comments: null, topics: ['Billing', 'Support'] },
    null,
    2,
  ),
  'HTTP API': JSON.stringify(
    {
      orderId: 'A-1042',
      customer: { id: 981, name: 'Contoso Ltd', vatNumber: null },
      lines: [
        { sku: 'PEN-01', qty: 10, price: 1.2 },
        { sku: 'PAD-02', qty: 2, price: 3, discount: 0.1 },
      ],
      paid: false,
    },
    null,
    2,
  ),
};

/** Pretty-prints JSON but keeps arrays of plain values, like ["string", "null"], on one line. */
const prettyJson = (value: unknown) =>
  JSON.stringify(value, null, 2).replace(/\[([^[\]{}]*)\]/g, (_, inner: string) => `[${inner.trim().replace(/\s*\n\s*/g, ' ')}]`);

/** Colours JSON: keys, strings, numbers, true/false/null and punctuation. */
function highlightJson(json: string): ReactNode[] {
  const re = /("(?:[^"\\]|\\.)*")(\s*:)?|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|\b(true|false|null)\b|([{}[\],])/g;
  const out: ReactNode[] = [];
  let last = 0;
  let k = 0;
  for (const m of json.matchAll(re)) {
    const at = m.index ?? 0;
    if (at > last) out.push(json.slice(last, at));
    if (m[1]) {
      out.push(
        <span key={k++} className={m[2] ? 'tk-key' : 'tk-str'}>
          {m[1]}
        </span>,
      );
      if (m[2]) out.push(m[2]);
    } else {
      out.push(
        <span key={k++} className={m[3] ? 'tk-num' : m[4] ? 'tk-kw' : 'tk-punc'}>
          {m[0]}
        </span>,
      );
    }
    last = at + m[0].length;
  }
  if (last < json.length) out.push(json.slice(last));
  return out;
}

function Toggle({ label, value, options, onChange }: { label: string; value: boolean; options: [string, string]; onChange: (v: boolean) => void }) {
  return (
    <div className="bf-control">
      <span className="bf-control__label">{label}</span>
      <div className="segmented" role="group" aria-label={label}>
        <button type="button" aria-pressed={value} onClick={() => onChange(true)}>
          {options[0]}
        </button>
        <button type="button" aria-pressed={!value} onClick={() => onChange(false)}>
          {options[1]}
        </button>
      </div>
    </div>
  );
}

export default function SchemaHelper() {
  const [src, setSrc] = useState('');
  const [nullable, setNullable] = useState(true);
  const [optional, setOptional] = useState(true);
  const [anyNumber, setAnyNumber] = useState(true);
  const [actionName, setActionName] = useState('Parse JSON');
  const [filter, setFilter] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  // Bumped on deliberate changes (sample, paste, options) to replay the unfold animation.
  const [version, setVersion] = useState(0);
  const bump = () => setVersion((v) => v + 1);
  const withBump = (set: (v: boolean) => void) => (v: boolean) => {
    set(v);
    bump();
  };

  const hasInput = src.trim().length > 0;
  const parsed = useMemo(() => (hasInput ? parseSample(src) : null), [src, hasInput]);
  const shape = useMemo(() => (parsed?.ok ? inferShape(parsed.value) : null), [parsed]);
  const opts = { nullable, required: !optional, integers: !anyNumber };
  const schema = useMemo(() => (shape ? prettyJson(toSchema(shape, opts)) : ''), [shape, nullable, optional, anyNumber]);
  const rows = useMemo(() => (shape ? fieldRows(shape, actionName, opts) : []), [shape, actionName, nullable, optional, anyNumber]);
  const stats = useMemo(() => (shape ? shapeStats(shape) : null), [shape]);
  const q = filter.trim().toLowerCase();
  const shown = q ? rows.filter((r) => r.path.toLowerCase().includes(q)) : rows;
  const lines = schema ? schema.split('\n') : [];

  const jumpTo = (pos?: number) => {
    const el = inputRef.current;
    if (!el || pos === undefined) return;
    el.focus();
    el.setSelectionRange(pos, pos + 1);
  };

  return (
    <div className="bf sh">
      <div className="bf-toolbar">
        <Toggle label="Nulls" value={nullable} onChange={withBump(setNullable)} options={['Allow everywhere', 'Only where seen']} />
        <Toggle label="Properties" value={optional} onChange={withBump(setOptional)} options={['All optional', 'Required if in sample']} />
        <Toggle label="Numbers" value={anyNumber} onChange={withBump(setAnyNumber)} options={['number', 'integer when whole']} />
        <label className="bf-control sh-action">
          <span className="bf-control__label">Action name</span>
          <input value={actionName} onChange={(e) => setActionName(e.target.value)} spellCheck={false} />
        </label>
      </div>

      <div className="bf-panes">
        <section className="bf-pane" aria-labelledby="sh-in-title">
          <div className="bf-pane__head">
            <h2 id="sh-in-title">Sample JSON</h2>
            <div className="bf-pane__actions">
              {Object.keys(SAMPLES).map((name) => (
                <button key={name} type="button" className="link-btn" onClick={() => {
                    setSrc(SAMPLES[name]);
                    bump();
                  }}>
                  {name}
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
            onPaste={bump}
            placeholder={'Paste a sample of the JSON your flow receives:\na run’s output, an HTTP response or a Compose result.'}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            aria-label="Sample JSON"
          />
        </section>

        <section className="bf-pane bf-pane--out" aria-labelledby="sh-out-title">
          <div className="bf-pane__head">
            <h2 id="sh-out-title">Schema for Parse JSON</h2>
            {schema && (
              <div className="bf-pane__actions">
                <CopyButton text={schema} label="schema" />
              </div>
            )}
          </div>
          <div className="bf-output" aria-live="polite">
            {schema ? (
              <>
                <ol className="bf-gutter" aria-hidden="true">
                  {lines.map((_, i) => (
                    <li key={i}>{i + 1}</li>
                  ))}
                </ol>
                <pre>
                  <code key={version}>
                    <AnimatedLines lines={toLines(highlightJson(schema))} />
                  </code>
                </pre>
              </>
            ) : parsed && !parsed.ok ? (
              <p className="bf-output__empty">Fix the JSON on the left and the schema appears here.</p>
            ) : (
              <p className="bf-output__empty">Paste sample JSON, or load one of the samples, to get a schema.</p>
            )}
          </div>
        </section>
      </div>

      {parsed && !parsed.ok && (
        <section className="bf-checks" aria-labelledby="sh-err-title">
          <div className="bf-checks__head">
            <h2 id="sh-err-title">That isn’t valid JSON yet</h2>
          </div>
          <ol className="bf-issues">
            <li>
              <button type="button" onClick={() => jumpTo(parsed.pos)}>
                {parsed.line !== undefined && (
                  <span className="bf-issues__pos">
                    Line {parsed.line}, col {parsed.col}
                  </span>
                )}
                {parsed.message}
              </button>
            </li>
          </ol>
          <p className="bf-checks__note">Copy the JSON straight from a run’s outputs (Show raw outputs) to avoid typing mistakes.</p>
        </section>
      )}

      {shape && stats && (
        <section className="bf-checks" aria-labelledby="sh-fields-title">
          <div className="bf-checks__head">
            <h2 id="sh-fields-title">Fields and expressions</h2>
            <p className="bf-stats">
              <span>
                <b>{stats.properties}</b> properties
              </span>
              <span>
                <b>{stats.depth}</b> levels deep
              </span>
              <span>
                <b>{stats.arrayItems}</b> array items merged
              </span>
            </p>
          </div>
          <p className="sh-intro">
            After the Parse JSON step, read any value with these expressions. Fields inside an array need an{' '}
            <b>Apply to each</b> loop over the array shown.
          </p>
          {rows.length > 10 && (
            <input
              className="sh-filter"
              type="search"
              placeholder="Filter fields"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              aria-label="Filter fields"
            />
          )}
          {shown.length > 0 ? (
            <div className="sh-table-wrap">
              <table className="sh-table">
                <thead>
                  <tr>
                    <th scope="col">Field</th>
                    <th scope="col">Type</th>
                    <th scope="col">Expression</th>
                  </tr>
                </thead>
                <tbody key={version}>
                  {shown.map((r, i) => (
                    <tr key={r.path} style={{ '--i': i } as CSSProperties}>
                      <td>
                        <code className="sh-path">{r.path}</code>
                        {r.optional && <span className="sh-badge">sometimes missing</span>}
                        {r.nullable && <span className="sh-badge">can be null</span>}
                      </td>
                      <td className="sh-type">{r.type}</td>
                      <td>
                        <div className="sh-expr">
                          <code>{r.expression}</code>
                          <CopyButton text={r.expression} label={`expression for ${r.path}`} />
                        </div>
                        {r.loop && (
                          <p className="sh-loop">
                            In an Apply to each over <code>{r.loop}</code>
                          </p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="bf-checks__note">{rows.length ? 'No fields match that filter.' : 'This JSON has no named fields to list.'}</p>
          )}
        </section>
      )}
    </div>
  );
}
