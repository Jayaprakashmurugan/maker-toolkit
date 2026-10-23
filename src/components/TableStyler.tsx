import { useEffect, useMemo, useRef, useState } from 'react';
import { PRESETS, SAMPLE_JSON, styleTable, tableFromRows, type Borders, type Method, type TableStyle } from '../lib/htmlTable';
import { CodeLine } from './FormulaDetail';

const FONTS = ['Segoe UI, Arial, sans-serif', 'Arial, sans-serif', 'Calibri, Arial, sans-serif', 'Verdana, Arial, sans-serif', 'Georgia, serif', 'Tahoma, Arial, sans-serif'];

function parseData(text: string): { html: string } | { error: string } {
  const t = text.trim();
  if (!t) return { html: tableFromRows(JSON.parse(SAMPLE_JSON)) };
  if (t.startsWith('<')) return t.toLowerCase().includes('<table') ? { html: t } : { error: 'Paste the HTML that starts with <table>, or a JSON array.' };
  try {
    const v = JSON.parse(t);
    const rows = Array.isArray(v) ? v : Array.isArray(v?.body) ? v.body : null;
    if (!rows || !rows.length || typeof rows[0] !== 'object') return { error: 'Paste a JSON array of objects, like the input you give Create HTML table.' };
    return { html: tableFromRows(rows) };
  } catch {
    return { error: 'That isn’t valid JSON. Paste a JSON array or the table HTML.' };
  }
}

function Color({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="ts-color">
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} />
      <span>{label}</span>
    </label>
  );
}

function Seg<T extends string | number | boolean>({ label, value, options, onChange }: { label: string; value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="bf-control">
      <span className="bf-control__label">{label}</span>
      <div className="segmented" role="group" aria-label={label}>
        {options.map(([v, text]) => (
          <button key={String(v)} type="button" aria-pressed={value === v} onClick={() => onChange(v)}>
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function TableStyler() {
  const [preset, setPreset] = useState('Corporate');
  const [style, setStyle] = useState<TableStyle>(PRESETS.Corporate);
  const [method, setMethod] = useState<Method>('inline');
  const [actionName, setActionName] = useState('Create HTML table');
  const [decode, setDecode] = useState(false);
  const [data, setData] = useState('');
  const [frameHeight, setFrameHeight] = useState(320);
  const frameRef = useRef<HTMLIFrameElement>(null);

  const set = <K extends keyof TableStyle>(k: K, v: TableStyle[K]) => {
    setStyle((s) => ({ ...s, [k]: v }));
    setPreset('');
    // Stripes only work with a style block, so switch to it when they're turned on.
    if (k === 'zebra' && v) setMethod('block');
  };

  const parsed = useMemo(() => parseData(data), [data]);
  const out = 'html' in parsed ? styleTable(parsed.html, style, method, actionName, decode) : null;
  // Zebra stripes need CSS selectors, which only the style block supports.
  const zebraOff = method === 'inline' && style.zebra;

  // Size the preview to its content whenever it changes (the first load can happen before hydration).
  const measure = () => {
    const h = frameRef.current?.contentDocument?.body?.scrollHeight;
    if (h) setFrameHeight(h + 24);
  };
  useEffect(() => {
    const f = frameRef.current;
    if (!f) return;
    f.addEventListener('load', measure);
    measure();
    return () => f.removeEventListener('load', measure);
  });

  const email = out
    ? `<!doctype html><html><body style="margin:0;padding:18px;background:#ffffff;font-family:${style.font};font-size:${style.fontSize}px;color:#1f2937">
<p style="margin:0 0 14px">Hi team,</p><p style="margin:0 0 14px">Here is today’s order summary:</p>${out.previewHtml}<p style="margin:14px 0 0">Thanks,<br>Your flow</p></body></html>`
    : '';

  return (
    <div className="ts">
      <div className="ts-presets" role="group" aria-label="Style presets">
        {Object.entries(PRESETS).map(([name, p]) => (
          <button
            key={name}
            type="button"
            className="chip"
            aria-pressed={preset === name}
            onClick={() => {
              setPreset(name);
              setStyle(p);
              if (p.zebra) setMethod('block');
            }}
          >
            <span className="ts-swatch" style={{ background: p.headerBg, borderColor: p.border }} aria-hidden="true" />
            {name}
          </button>
        ))}
      </div>

      <div className="ts-layout">
        <section className="bf-checks ts-controls" aria-labelledby="ts-custom">
          <div className="bf-checks__head">
            <h2 id="ts-custom">Customize</h2>
          </div>
          <div className="ts-colors">
            <Color label="Header" value={style.headerBg} onChange={(v) => set('headerBg', v)} />
            <Color label="Header text" value={style.headerText} onChange={(v) => set('headerText', v)} />
            <Color label="Text" value={style.text} onChange={(v) => set('text', v)} />
            <Color label="Borders" value={style.border} onChange={(v) => set('border', v)} />
          </div>
          <div className="ts-grid">
            <Seg<Borders>
              label="Lines"
              value={style.borders}
              onChange={(v) => set('borders', v)}
              options={[
                ['grid', 'Grid'],
                ['rows', 'Rows'],
                ['none', 'None'],
              ]}
            />
            <Seg<number>
              label="Spacing"
              value={style.padding}
              onChange={(v) => set('padding', v)}
              options={[
                [4, 'Tight'],
                [8, 'Normal'],
                [12, 'Roomy'],
              ]}
            />
            <Seg<boolean>
              label="Width"
              value={style.fullWidth}
              onChange={(v) => set('fullWidth', v)}
              options={[
                [true, 'Full'],
                [false, 'Fit'],
              ]}
            />
            <Seg<'left' | 'center'>
              label="Align"
              value={style.align}
              onChange={(v) => set('align', v)}
              options={[
                ['left', 'Left'],
                ['center', 'Center'],
              ]}
            />
            <label className="bf-control">
              <span className="bf-control__label">Font</span>
              <select className="ts-select" value={style.font} onChange={(e) => set('font', e.target.value)}>
                {FONTS.map((f) => (
                  <option key={f} value={f}>
                    {f.split(',')[0]}
                  </option>
                ))}
              </select>
              <select className="ts-select" value={style.fontSize} onChange={(e) => set('fontSize', Number(e.target.value))} aria-label="Font size">
                {[12, 13, 14, 15, 16].map((n) => (
                  <option key={n} value={n}>
                    {n}px
                  </option>
                ))}
              </select>
            </label>
            <div className="ts-zebra">
              <label>
                <input type="checkbox" checked={style.zebra} onChange={(e) => set('zebra', e.target.checked)} /> Zebra stripes
              </label>
              {style.zebra && <Color label="Stripe" value={style.zebraBg} onChange={(v) => set('zebraBg', v)} />}
            </div>
          </div>
          {zebraOff && <p className="lc-warn">Zebra stripes need the Style block method. Switch below, or they won’t appear.</p>}

          <details className="ts-data">
            <summary>Preview with your own data</summary>
            <textarea
              className="bf-input"
              value={data}
              onChange={(e) => setData(e.target.value)}
              placeholder="Paste the JSON array you give Create HTML table (for example the output of a Select), or the table HTML from a run."
              spellCheck={false}
            />
            {'error' in parsed && <p className="lc-warn">{parsed.error}</p>}
          </details>
        </section>

        <section className="bf-pane bf-pane--out ts-preview" aria-labelledby="ts-prev">
          <div className="bf-pane__head">
            <h2 id="ts-prev">Email preview</h2>
          </div>
          {out && (
            <iframe
              ref={frameRef}
              title="Email preview"
              sandbox="allow-same-origin"
              srcDoc={email}
              style={{ height: frameHeight }}
            />
          )}
        </section>
      </div>

      {out && (
        <section className="bf-checks" aria-labelledby="ts-out">
          <div className="bf-checks__head">
            <h2 id="ts-out">Add it to your flow</h2>
            <Seg<Method>
              label="Method"
              value={method}
              onChange={setMethod}
              options={[
                ['inline', 'Inline styles (all email apps)'],
                ['block', 'Style block (zebra stripes)'],
              ]}
            />
          </div>
          <div className="lc-inputs">
            <label className="bf-control sh-action">
              <span className="bf-control__label">Table action name</span>
              <input value={actionName} onChange={(e) => setActionName(e.target.value)} spellCheck={false} />
            </label>
            <label className="ts-check">
              <input type="checkbox" checked={decode} onChange={(e) => setDecode(e.target.checked)} /> Allow HTML inside cells (links, bold)
            </label>
          </div>

          <ol className="lc-howto">
            <li>
              After <b>Create HTML table</b>, add a <b>Compose</b>.
            </li>
            {method === 'inline' ? (
              <li>Paste this into the Compose inputs. It already includes the @{'{ }'} wrapper, so it becomes an expression:</li>
            ) : (
              <li>Paste this into the Compose inputs exactly as it is:</li>
            )}
          </ol>
          <CodeLine code={out.pasteReady} label="Compose input" lang="wdl" />
          {method === 'inline' && (
            <details className="ts-data">
              <summary>Prefer the expression editor? Use this instead</summary>
              <CodeLine code={out.code} label="expression" lang="wdl" />
            </details>
          )}
          <ol className="lc-howto" start={3}>
            <li>
              In <b>Send an email (V2)</b>, put the Compose’s <b>Outputs</b> in the body where the table should go.
            </li>
          </ol>
          <p className="bf-checks__note">
            {method === 'inline'
              ? 'Inline styles are copied into every cell, so the table looks the same in Outlook for Windows, new Outlook, Outlook on the web, Gmail and mobile apps.'
              : 'Style blocks work in new Outlook, Outlook on the web, Gmail and Apple Mail. Classic Outlook for Windows ignores zebra stripes, so choose Inline styles if most readers use it.'}
          </p>
        </section>
      )}
    </div>
  );
}
