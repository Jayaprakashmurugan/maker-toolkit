// One UI Kit item: tree view, live preview, options, and the code to paste, as controls or as a canvas component.
// Everything runs in the browser.

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { kitItem } from '../../uikit/items';
import { defaults, type KitOption, type KitValues } from '../../uikit/types';
import { componentize, hasComponent } from '../../uikit/component';
import { THEMES, defaultTheme } from '../../uikit/theme';
import { THEME_EVENT, loadStored, resolveTheme, saveStored, type StoredTheme } from '../../uikit/themeStore';
import { PREFIXES } from '../../uikit/validate';
import { flatten, toControl, toYaml, type YamlControl } from '../../uikit/yaml';
import KitPreview from './KitPreview';
import YamlCode from './YamlCode';

function typeOf(c: YamlControl) {
  const dir = c.props.LayoutDirection?.endsWith('Horizontal') ? 'Horizontal' : 'Vertical';
  return PREFIXES.find((p) => p.control === c.control && (!p.variant || p.variant === c.variant) && (!p.direction || p.direction === dir));
}

function Field({ opt, value, onChange }: { opt: KitOption; value: KitValues[string]; onChange: (v: KitValues[string]) => void }) {
  const id = `kopt-${opt.id}`;
  switch (opt.type) {
    case 'toggle':
      return (
        <label className="kit-opt kit-opt--toggle" htmlFor={id}>
          <input id={id} type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
          <span>{opt.label}</span>
        </label>
      );
    case 'select':
      return (
        <label className="kit-opt" htmlFor={id}>
          <span>{opt.label}</span>
          <select id={id} value={String(value)} onChange={(e) => onChange(e.target.value)}>
            {opt.choices.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
      );
    case 'number':
      return (
        <label className="kit-opt" htmlFor={id}>
          <span>
            {opt.label} <b>{String(value)}</b>
          </span>
          <input id={id} type="range" min={opt.min} max={opt.max} step={opt.step ?? 1} value={Number(value)} onChange={(e) => onChange(Number(e.target.value))} />
        </label>
      );
    case 'lines':
      return (
        <label className="kit-opt" htmlFor={id}>
          <span>{opt.label}</span>
          <textarea
            id={id}
            rows={Math.min(8, Math.max(3, (value as string[]).length + 1))}
            value={(value as string[]).join('\n')}
            onChange={(e) => onChange(e.target.value.split('\n'))}
            spellCheck={false}
          />
          {opt.hint && <small>{opt.hint}</small>}
        </label>
      );
    default:
      return (
        <label className="kit-opt" htmlFor={id}>
          <span>{opt.label}</span>
          <input id={id} type="text" value={String(value)} onChange={(e) => onChange(e.target.value)} spellCheck={false} />
        </label>
      );
  }
}

type Mode = 'controls' | 'component';
type Tab = 'yaml' | 'formulas' | 'onvisible' | 'definition' | 'instance' | 'screen';
const MODE_KEY = 'mt-uikit-mode';

/** Saves the component file locally; nothing is uploaded. */
function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/yaml' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="kit-copy"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1600);
        } catch {
          /* clipboard blocked: the code is still selectable */
        }
      }}
    >
      {done ? 'Copied' : label}
    </button>
  );
}

export default function KitItemView({ slug }: { slug: string }) {
  const item = kitItem(slug)!;
  const [values, setValues] = useState<KitValues>(() => defaults(item));
  const [stored, setStored] = useState<StoredTheme | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const canComponent = hasComponent(item);
  const [mode, setModeState] = useState<Mode>('controls');
  const [tab, setTab] = useState<Tab>('yaml');
  const [scale, setScale] = useState(1);
  const stage = useRef<HTMLDivElement>(null);

  const setMode = (m: Mode) => {
    setModeState(m);
    setTab(m === 'component' ? 'definition' : 'yaml');
    try {
      localStorage.setItem(MODE_KEY, m);
    } catch {
      /* storage blocked: the choice just isn't remembered */
    }
  };

  useEffect(() => {
    try {
      if (canComponent && localStorage.getItem(MODE_KEY) === 'component') setMode('component');
    } catch {
      /* storage blocked */
    }
  }, [canComponent]);

  useEffect(() => {
    setStored(loadStored());
    const on = (e: Event) => setStored((e as CustomEvent<StoredTheme | null>).detail);
    window.addEventListener(THEME_EVENT, on);
    return () => window.removeEventListener(THEME_EVENT, on);
  }, []);

  useLayoutEffect(() => {
    const el = stage.current;
    if (!el) return;
    const fit = () => setScale(Math.min(item.canvas.zoom ?? 1, (el.clientWidth - 32) / item.canvas.w));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [item.canvas.w, item.canvas.zoom]);

  const theme = useMemo(() => (stored ? resolveTheme(stored) : defaultTheme), [stored]);
  const snippet = useMemo(() => item.build(values), [item, values]);
  const comp = useMemo(() => (canComponent ? componentize(item, values, theme) : null), [canComponent, item, values, theme]);
  const control = useMemo(() => toControl(snippet.root), [snippet]);
  const yaml = useMemo(() => toYaml([control]), [control]);
  const tree = useMemo(() => flatten(control), [control]);

  useEffect(() => {
    if (!snippet.formulas && tab === 'formulas') setTab('yaml');
    if (!snippet.onVisible && tab === 'onvisible') setTab('yaml');
    if (!comp?.screen && tab === 'screen') setTab('definition');
  }, [snippet, comp, tab]);

  const codes: Record<Tab, string | undefined> = {
    yaml,
    formulas: snippet.formulas,
    onvisible: snippet.onVisible,
    definition: comp?.definition,
    instance: comp?.instance,
    screen: comp?.screen,
  };
  const code = codes[tab] ?? yaml;
  const isFormula = tab === 'formulas' || tab === 'onvisible' || tab === 'screen';
  const copyLabel = tab === 'yaml' ? 'Copy YAML' : tab === 'definition' ? 'Copy component' : tab === 'instance' ? 'Copy instance' : 'Copy formula';
  const tabButton = (id: Tab, label: ReactNode) => (
    <button type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>
      {label}
    </button>
  );

  return (
    <div className="kit">
      <div className="kit-studio">
        <aside className="kit-tree" aria-label="Tree view">
          <p className="kit-panel-title">Tree view</p>
          <ul>
            {tree.map(({ c, depth }) => {
              const type = typeOf(c);
              const prefix = type?.prefix ?? '';
              return (
                <li
                  key={c.name}
                  style={{ paddingLeft: `${0.5 + depth * 0.85}rem` }}
                  onMouseEnter={() => setHover(c.name)}
                  onMouseLeave={() => setHover(null)}
                  title={type?.what}
                  className={hover === c.name ? 'is-on' : undefined}
                >
                  <i className={`kit-glyph kit-glyph--${prefix}`} aria-hidden="true" />
                  <span>
                    <b>{c.name.slice(0, prefix.length)}</b>
                    {c.name.slice(prefix.length)}
                  </span>
                </li>
              );
            })}
          </ul>
        </aside>

        <div className={`kit-canvas kit-canvas--${item.canvas.bg ?? 'white'}`} ref={stage}>
          {hover && <style>{`.kit-canvas [data-k="${hover}"]{outline:2px dashed #4c8dff;outline-offset:-2px}`}</style>}
          <div className="kit-fit" style={{ width: item.canvas.w * scale, height: item.canvas.h * scale }}>
            <div className="kit-frame" style={{ width: item.canvas.w, height: item.canvas.h, transform: `scale(${scale})` }}>
              <KitPreview root={snippet.root} theme={theme} />
            </div>
          </div>
        </div>

        <aside className="kit-props" aria-label="Options">
          <p className="kit-panel-title">Options</p>
          {item.options.map((opt) => (
            <Field key={opt.id} opt={opt} value={values[opt.id]} onChange={(v) => setValues((prev) => ({ ...prev, [opt.id]: v }))} />
          ))}
          <div className="kit-opt">
            <span>Theme</span>
            <div className="kit-swatches">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={theme.id === t.id ? 'is-on' : undefined}
                  onClick={() => saveStored(t.id === 'slate' ? null : { base: t.id })}
                  title={t.name}
                  aria-label={`${t.name} theme`}
                  style={{ background: `linear-gradient(135deg, ${t.colors.Primary1} 50%, ${t.colors.Secondary1} 50%)` }}
                />
              ))}
            </div>
            <a className="kit-link" href="/ui-kit/design-system/">
              {theme.id === 'custom' ? 'Your custom colors' : 'Use your own colors'} →
            </a>
          </div>
          <button type="button" className="kit-reset" onClick={() => setValues(defaults(item))}>
            Reset options
          </button>
        </aside>
      </div>

      {comp && (
        <div className="kit-mode" role="radiogroup" aria-label="Paste as">
          <span className="kit-mode__label">Paste as</span>
          <button type="button" role="radio" aria-checked={mode === 'controls'} onClick={() => setMode('controls')}>
            <b>Controls</b>
            <small>Paste straight onto a screen.</small>
          </button>
          <button type="button" role="radio" aria-checked={mode === 'component'} onClick={() => setMode('component')}>
            <b>Component</b>
            <small>
              A reusable <code>{comp.name}</code> with inputs, outputs and events.
            </small>
          </button>
        </div>
      )}

      <section className="kit-codebox" aria-label="Code">
        <div className="kit-tabs" role="tablist">
          {mode === 'component' && comp ? (
            <>
              {tabButton(
                'definition',
                <>
                  Component <small>{comp.name}.pa.yaml</small>
                </>,
              )}
              {tabButton('instance', 'On a screen')}
              {comp.screen && tabButton('screen', 'OnVisible')}
            </>
          ) : (
            <>
              {tabButton(
                'yaml',
                <>
                  Controls <small>YAML</small>
                </>,
              )}
              {snippet.formulas && tabButton('formulas', 'App.Formulas')}
              {snippet.onVisible && tabButton('onvisible', 'OnVisible')}
            </>
          )}
          <span className="kit-tabs__fill" />
          {tab === 'definition' && comp && (
            <button type="button" className="kit-save" onClick={() => download(`${comp.name}.pa.yaml`, comp.definition)}>
              Save file
            </button>
          )}
          <CopyButton text={code} label={copyLabel} />
        </div>
        <YamlCode code={code} lang={isFormula ? 'fx' : 'yaml'} />
      </section>

      {mode === 'component' && comp ? (
        <div className="kit-help">
          <section>
            <h2 className="kit-h">Add it to your app as a component</h2>
            <ol className="kit-steps">
              <li>
                Once per app, paste <a href="/ui-kit/design-system/">fxConfig</a> into <b>App.Formulas</b>. Each instance hands it over with{' '}
                <code>ConfigProperties: =fxConfig</code>.
              </li>
              <li>
                Save the <b>Component</b> tab as <code>Src/Components/{comp.name}.pa.yaml</code> in your app’s source files (the format Power Apps Git integration keeps
                canvas apps in), then open the app in Studio.
              </li>
              <li>
                Put it on a screen: insert <b>{comp.name}</b> from the Insert pane, or copy the <b>On a screen</b> tab and use <b>Paste code</b> on the screen. It comes
                with its inputs filled in and the actions in its events.
              </li>
              {comp.screen && (
                <li>
                  Add the <b>OnVisible</b> tab to the screen’s OnVisible.
                </li>
              )}
            </ol>
            <p className="kit-fine">
              Microsoft documents Paste code for controls; a component definition goes in through its source file. If you just want it on a screen now, use{' '}
              <b>Controls</b>.
            </p>
          </section>
          <section>
            <h2 className="kit-h">Its properties</h2>
            <table className="kit-uses kit-props-table">
              <tbody>
                {comp.props.map((p) => (
                  <tr key={p.name}>
                    <td>
                      <code>{p.name}</code>
                    </td>
                    <td>
                      <span className={`kit-kind kit-kind--${p.kind.toLowerCase()}`}>
                        {p.kind}
                        {p.type ? ` · ${p.type}` : ''}
                      </span>{' '}
                      {p.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {comp.notes.length > 0 && (
              <ul className="kit-notes">
                {comp.notes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : (
        <div className="kit-help">
          <section>
            <h2 className="kit-h">Paste it into your app</h2>
            <ol className="kit-steps">
              <li>
                Once per app, paste <a href="/ui-kit/design-system/">fxConfig</a> into <b>App.Formulas</b>.
              </li>
              {snippet.formulas && (
                <li>
                  Add the <b>App.Formulas</b> tab above to App.Formulas too.
                </li>
              )}
              {snippet.onVisible && (
                <li>
                  Add the <b>OnVisible</b> tab to the screen’s OnVisible.
                </li>
              )}
              <li>
                Copy the YAML. In Power Apps Studio, right-click the screen in the Tree view and choose <b>Paste code</b>, or select the screen and press Ctrl+V.
              </li>
            </ol>
          </section>
          <section>
            {snippet.uses && snippet.uses.length > 0 && (
              <>
                <h2 className="kit-h">Names it uses</h2>
                <table className="kit-uses">
                  <tbody>
                    {snippet.uses.map((u) => (
                      <tr key={u.name}>
                        <td>
                          <code>{u.name}</code>
                        </td>
                        <td>{u.what}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
            {snippet.notes && (
              <ul className="kit-notes">
                {snippet.notes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
