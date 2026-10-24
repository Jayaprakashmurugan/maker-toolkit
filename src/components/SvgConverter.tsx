import { useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_FILL, SAMPLE_SVG, analyzeSvg, pickerValue, previewUri, renderSvg, type Replacement } from '../lib/svgPowerApps';
import { CodeLine, CopyButton } from './FormulaDetail';

type Digits = 'exact' | '2' | '1';
type Format = 'text' | 'base64';

const kb = (n: number) => (n < 1024 ? `${n} B` : `${(n / 1024).toFixed(1)} KB`);
const BIG = 30000;

export default function SvgConverter() {
  const [src, setSrc] = useState(SAMPLE_SVG);
  const [digits, setDigits] = useState<Digits>('exact');
  const [format, setFormat] = useState<Format>('text');
  const [reps, setReps] = useState<Record<string, Replacement>>({});
  const [ready, setReady] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // DOMParser exists only in the browser, so the work starts after hydration.
  useEffect(() => setReady(true), []);

  const analysis = useMemo(() => (ready ? analyzeSvg(src) : null), [ready, src]);
  const result = useMemo(
    () => (analysis?.ok ? renderSvg(analysis, reps, digits === 'exact' ? null : Number(digits)) : null),
    [analysis, reps, digits],
  );

  const load = (file: File | undefined) => {
    if (!file) return;
    file.text().then((t) => {
      setSrc(t);
      setReps({});
    });
  };
  const setRep = (key: string, r: Replacement) => setReps((m) => ({ ...m, [key]: r }));

  const output = format === 'base64' && result?.base64 ? result.base64 : result?.formula;
  const colors = analysis?.ok ? analysis.colors : [];

  return (
    <div className="sv">
      <div className="bf-toolbar">
        <div className="bf-control">
          <span className="bf-control__label">Formula</span>
          <div className="segmented" role="group" aria-label="Formula">
            <button type="button" aria-pressed={format === 'text'} onClick={() => setFormat('text')}>
              Editable text
            </button>
            <button type="button" aria-pressed={format === 'base64'} onClick={() => setFormat('base64')}>
              Base64
            </button>
          </div>
        </div>
        <div className="bf-control">
          <span className="bf-control__label">Numbers</span>
          <div className="segmented" role="group" aria-label="Numbers">
            {(
              [
                ['exact', 'Exact'],
                ['2', '2 decimals'],
                ['1', '1 decimal'],
              ] as [Digits, string][]
            ).map(([d, label]) => (
              <button key={d} type="button" aria-pressed={digits === d} onClick={() => setDigits(d)}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bf-panes">
        <section className="bf-pane" aria-labelledby="sv-in">
          <div className="bf-pane__head">
            <h2 id="sv-in">Your SVG</h2>
            <div className="bf-pane__actions">
              <button type="button" className="link-btn" onClick={() => fileRef.current?.click()}>
                Open file
              </button>
              <button type="button" className="link-btn" onClick={() => (setSrc(SAMPLE_SVG), setReps({}))}>
                Sample
              </button>
              {src && (
                <button type="button" className="link-btn" onClick={() => (setSrc(''), setReps({}))}>
                  Clear
                </button>
              )}
              <input ref={fileRef} type="file" accept=".svg,image/svg+xml" hidden onChange={(e) => (load(e.target.files?.[0]), (e.target.value = ''))} />
            </div>
          </div>
          <textarea
            className="bf-input"
            value={src}
            onChange={(e) => setSrc(e.target.value)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              const f = e.dataTransfer.files?.[0];
              if (f) {
                e.preventDefault();
                load(f);
              }
            }}
            placeholder={'Paste SVG code here, or drop an .svg file.\nIn Figma: right-click → Copy as → Copy as SVG.'}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            aria-label="SVG code"
          />
        </section>

        <section className="bf-pane bf-pane--out" aria-labelledby="sv-prev">
          <div className="bf-pane__head">
            <h2 id="sv-prev">Preview</h2>
            {result && analysis?.ok && (
              <p className="sv-stats">
                {kb(analysis.inputBytes)} → <b>{kb(result.svgBytes)}</b>
                {result.svgBytes < analysis.inputBytes && <> · {Math.round((1 - result.svgBytes / analysis.inputBytes) * 100)}% smaller</>}
              </p>
            )}
          </div>
          <div className="sv-stage" aria-live="polite">
            {result ? (
              <img src={previewUri(result.previewSvg)} alt="Preview of the converted SVG" />
            ) : (
              <p className="bf-output__empty">{analysis && !analysis.ok ? analysis.error : 'Paste an SVG to see it here.'}</p>
            )}
          </div>
        </section>
      </div>

      {colors.length > 0 && (
        <section className="bf-checks" aria-labelledby="sv-colors">
          <div className="bf-checks__head">
            <h2 id="sv-colors">Colors</h2>
            <p className="bf-checks__note">Change a color, or drive it from Power Fx so it follows a variable, theme or state.</p>
          </div>
          <ul className="sv-colors">
            {colors.map((c) => {
              const r = reps[c.key] ?? { kind: 'keep' };
              const shown = c.key === 'currentcolor' ? '#000000' : c.value;
              return (
                <li key={c.key} className="sv-color">
                  <span className="sv-swatch" style={{ background: r.kind === 'color' ? r.value : shown }} aria-hidden="true" />
                  <span className="sv-color__name">
                    <code>{c.key === DEFAULT_FILL ? 'No fill set (black)' : c.value}</code>
                    {c.key === 'currentcolor' && <small>Draws black in an image</small>}
                    {c.count > 1 && <small>Used {c.count} times</small>}
                  </span>
                  <select
                    className="cb-input"
                    value={r.kind}
                    aria-label={`What to do with ${c.value}`}
                    onChange={(e) => {
                      const k = e.target.value as Replacement['kind'];
                      setRep(c.key, k === 'color' ? { kind: 'color', value: pickerValue(shown) } : k === 'fx' ? { kind: 'fx', expr: '' } : { kind: 'keep' });
                    }}
                  >
                    <option value="keep">Keep</option>
                    <option value="color">New color</option>
                    <option value="fx">From Power Fx</option>
                  </select>
                  {r.kind === 'color' && (
                    <input type="color" className="sv-picker" value={r.value} onChange={(e) => setRep(c.key, { kind: 'color', value: e.target.value })} aria-label={`New color for ${c.value}`} />
                  )}
                  {r.kind === 'fx' && (
                    <input
                      className="cb-input sv-fx"
                      value={r.expr}
                      onChange={(e) => setRep(c.key, { kind: 'fx', expr: e.target.value })}
                      placeholder="varIconColor"
                      aria-label={`Power Fx for ${c.value}`}
                      spellCheck={false}
                    />
                  )}
                </li>
              );
            })}
          </ul>
          {Object.values(reps).some((r) => r.kind === 'fx') && (
            <p className="sv-hint">
              The expression must give text such as <code>"#0F6CBD"</code>. For a color value, use <code>Mid(JSON(Color.Red), 2, 7)</code>, which turns it into its #RRGGBB text.
            </p>
          )}
        </section>
      )}

      {result && output && (
        <section className="bf-checks" aria-labelledby="sv-out">
          <div className="bf-checks__head">
            <h2 id="sv-out">Image formula</h2>
            <p className="bf-checks__note">{output.length.toLocaleString('en')} characters</p>
          </div>
          <ol className="lc-howto">
            <li>
              Add an <b>Image</b> control and select its <b>Image</b> property.
            </li>
            <li>Paste this formula into the formula bar.</li>
          </ol>
          <div className="sv-out">
            <CodeLine code={output} label="Image formula" />
          </div>
          {format === 'base64' && !result.base64 && <p className="lc-warn">Base64 can’t include Power Fx colors, so this is the editable text version.</p>}
          {output.length > BIG && (
            <p className="lc-warn">This is a big formula and can slow down Power Apps Studio. Try fewer decimals, or for large illustrations upload the file under Media instead.</p>
          )}
          <ul className="notes od-tips">
            {analysis?.ok && analysis.report.map((r) => <li key={r}>{r}</li>)}
            <li>{format === 'text' ? 'Editable text keeps the SVG readable, so you can tweak it or add Power Fx later.' : 'Base64 is opaque but works anywhere a data URI does, and is handy when you won’t edit it.'}</li>
          </ul>
          <p className="sv-svgcopy">
            Need the cleaned SVG itself? <CopyButton text={result.previewSvg} label="cleaned SVG" />
          </p>
        </section>
      )}
    </div>
  );
}
