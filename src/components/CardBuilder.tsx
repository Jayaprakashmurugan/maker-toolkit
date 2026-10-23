import { useEffect, useMemo, useRef, useState } from 'react';
import { TEMPLATES, cardJson, responseExpressions, type CardButton, type CardInput, type CardModel, type Fact, type InputKind, type Tone } from '../lib/adaptiveCard';
import { CodeLine, CopyButton } from './FormulaDetail';

const TONES: [Tone, string][] = [
  ['default', 'Plain'],
  ['emphasis', 'Grey'],
  ['accent', 'Accent'],
  ['good', 'Green'],
  ['warning', 'Amber'],
  ['attention', 'Red'],
];

// Colors close to Microsoft Teams, so the preview looks like the real thing.
const fg = (base: string) => ({
  default: { default: base, subtle: '#616161' },
  accent: { default: '#5b5fc7', subtle: '#7f85f5' },
  good: { default: '#107c10', subtle: '#107c10' },
  warning: { default: '#986f0b', subtle: '#986f0b' },
  attention: { default: '#c4314b', subtle: '#c4314b' },
  dark: { default: '#242424', subtle: '#616161' },
  light: { default: '#ffffff', subtle: '#d6d6d6' },
});
const hostConfig = (dark: boolean) => {
  const text = dark ? '#ffffff' : '#242424';
  const bg = (light: string, darkBg: string) => ({ backgroundColor: dark ? darkBg : light, foregroundColors: fg(text) });
  return {
    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    supportsInteractivity: true,
    spacing: { small: 4, default: 8, medium: 16, large: 24, extraLarge: 32, padding: 16 },
    separator: { lineThickness: 1, lineColor: dark ? '#3d3d3d' : '#e1e1e1' },
    fontSizes: { small: 12, default: 14, medium: 14, large: 18, extraLarge: 24 },
    fontWeights: { lighter: 300, default: 400, bolder: 600 },
    containerStyles: {
      default: bg('#ffffff', '#292929'),
      emphasis: bg('#f5f5f5', '#1f1f1f'),
      accent: bg('#e8ebfa', '#2f2f4a'),
      good: bg('#e7f2da', '#1f2f1a'),
      warning: bg('#fbf6d9', '#3a3317'),
      attention: bg('#fcf4f6', '#3e1f25'),
    },
    actions: { maxActions: 6, buttonSpacing: 8, actionsOrientation: 'horizontal', actionAlignment: 'left', spacing: 'default' },
    factSet: { title: { weight: 'bolder', wrap: true, maxWidth: 160 }, value: { wrap: true }, spacing: 8 },
  };
};

// The subset of Markdown that Teams supports in TextBlocks. Text is escaped first,
// so only these tags can appear in the output.
function markdown(text: string): string {
  const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const inline = (s: string) =>
    s
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*(?!\s)(.+?)\*/g, '$1<em>$2</em>')
      .replace(/(^|\s)_(.+?)_(?=\s|$)/g, '$1<em>$2</em>')
      .replace(/\[([^\]]+)\]\(((?:https?:|mailto:)[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  const lines = escaped.split(/\r?\n/);
  let html = '';
  let list: 'ul' | 'ol' | null = null;
  for (const line of lines) {
    const bullet = /^\s*[-*]\s+(.*)$/.exec(line);
    const numbered = /^\s*\d+\.\s+(.*)$/.exec(line);
    const kind = bullet ? 'ul' : numbered ? 'ol' : null;
    if (list && kind !== list) {
      html += `</${list}>`;
      list = null;
    }
    if (kind) {
      if (!list) html += `<${kind}>`;
      list = kind;
      html += `<li>${inline((bullet ?? numbered)![1])}</li>`;
    } else html += `${html && !html.endsWith('>') ? '<br>' : ''}${inline(line)}`;
  }
  if (list) html += `</${list}>`;
  return html;
}

function Preview({ json, dark }: { json: unknown; dark: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setMessage('');
    import('adaptivecards').then((AC) => {
      if (cancelled || !ref.current) return;
      try {
        AC.AdaptiveCard.onProcessMarkdown = (text, result) => {
          result.outputHtml = markdown(text);
          result.didProcess = true;
        };
        const card = new AC.AdaptiveCard();
        card.hostConfig = new AC.HostConfig(hostConfig(dark));
        card.onExecuteAction = (action) => {
          if (action instanceof AC.OpenUrlAction) setMessage(`Opens ${action.url}`);
          else if (action instanceof AC.SubmitAction) setMessage(`Sends to your flow: ${JSON.stringify(action.data)}`);
        };
        card.parse(json);
        const el = card.render();
        ref.current.replaceChildren(...(el ? [el] : []));
        setError(el ? '' : 'This card could not be rendered.');
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [json, dark]);

  return (
    <>
      <div className={`acp${dark ? ' acp--dark' : ''}`}>
        <div className="acp__card" ref={ref} />
      </div>
      {error && <p className="lc-warn">{error}</p>}
      {message && <p className="acp__msg">{message}</p>}
    </>
  );
}

const field = (v: string, on: (v: string) => void, placeholder = '', cls = '') => (
  <input className={`cb-input ${cls}`} value={v} placeholder={placeholder} onChange={(e) => on(e.target.value)} spellCheck={false} />
);

export default function CardBuilder() {
  const [template, setTemplate] = useState('Approval');
  const [m, setM] = useState<CardModel>(TEMPLATES.Approval);
  const [mode, setMode] = useState<'build' | 'paste'>('build');
  const [pasted, setPasted] = useState('');
  const [dark, setDark] = useState(false);
  const [waitAction, setWaitAction] = useState('Post adaptive card and wait for a response');

  const up = (patch: Partial<CardModel>) => setM((x) => ({ ...x, ...patch }));
  const setFact = (i: number, patch: Partial<Fact>) => up({ facts: m.facts.map((f, k) => (k === i ? { ...f, ...patch } : f)) });
  const setInput = (i: number, patch: Partial<CardInput>) => up({ inputs: m.inputs.map((f, k) => (k === i ? { ...f, ...patch } : f)) });
  const setButton = (i: number, patch: Partial<CardButton>) => up({ buttons: m.buttons.map((f, k) => (k === i ? { ...f, ...patch } : f)) });

  const built = useMemo(() => cardJson(m), [m]);
  const builtText = useMemo(() => JSON.stringify(built, null, 2), [built]);
  const pastedJson = useMemo((): { ok: true; value: unknown } | { ok: false; message: string } | null => {
    if (!pasted.trim()) return null;
    try {
      return { ok: true, value: JSON.parse(pasted) };
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : String(e) };
    }
  }, [pasted]);

  const previewJson = mode === 'build' ? built : pastedJson?.ok ? pastedJson.value : null;
  const waits = m.buttons.some((b) => b.kind === 'submit') || m.inputs.length > 0;

  return (
    <div className="cb">
      <div className="cb-top">
        <div className="segmented" role="group" aria-label="Mode">
          <button type="button" aria-pressed={mode === 'build'} onClick={() => setMode('build')}>
            Build from a template
          </button>
          <button type="button" aria-pressed={mode === 'paste'} onClick={() => setMode('paste')}>
            Preview my own JSON
          </button>
        </div>
        {mode === 'build' && (
          <div className="ts-presets" role="group" aria-label="Templates">
            {Object.keys(TEMPLATES).map((t) => (
              <button
                key={t}
                type="button"
                className="chip"
                aria-pressed={template === t}
                onClick={() => {
                  setTemplate(t);
                  setM(TEMPLATES[t]);
                }}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="ts-layout">
        {mode === 'build' ? (
          <section className="bf-checks cb-editor" aria-label="Card content">
            <h2 className="detail__label">Header</h2>
            <div className="cb-grid2">
              {field(m.title, (v) => up({ title: v }), 'Title')}
              {field(m.subtitle, (v) => up({ subtitle: v }), 'Subtitle (optional)')}
            </div>
            <div className="cb-tones" role="group" aria-label="Header color">
              {TONES.map(([t, label]) => (
                <button key={t} type="button" className={`chip cb-tone cb-tone--${t}`} aria-pressed={m.tone === t} onClick={() => up({ tone: t })}>
                  {label}
                </button>
              ))}
            </div>
            <div className="cb-grid2">
              {field(m.status, (v) => up({ status: v }), 'Status line (optional)')}
              <select className="cb-input" value={m.statusColor} onChange={(e) => up({ statusColor: e.target.value as CardModel['statusColor'] })} aria-label="Status color">
                <option value="default">Status color: normal</option>
                <option value="good">Green</option>
                <option value="warning">Amber</option>
                <option value="attention">Red</option>
                <option value="accent">Accent</option>
              </select>
            </div>
            <textarea className="cb-input cb-text" value={m.message} placeholder="Message (optional)" onChange={(e) => up({ message: e.target.value })} />

            <h2 className="detail__label">Facts</h2>
            {m.facts.map((f, i) => (
              <div className="cb-row" key={i}>
                {field(f.label, (v) => setFact(i, { label: v }), 'Label')}
                {field(f.value, (v) => setFact(i, { value: v }), "Value, e.g. @{triggerBody()?['name']}")}
                <button type="button" className="icon-btn cb-x" aria-label="Remove fact" onClick={() => up({ facts: m.facts.filter((_, k) => k !== i) })}>
                  ×
                </button>
              </div>
            ))}
            <button type="button" className="link-btn" onClick={() => up({ facts: [...m.facts, { label: '', value: '' }] })}>
              + Add fact
            </button>

            <h2 className="detail__label">Inputs</h2>
            {m.inputs.map((inp, i) => (
              <div className="cb-row cb-row--input" key={i}>
                <select className="cb-input" value={inp.kind} onChange={(e) => setInput(i, { kind: e.target.value as InputKind })} aria-label="Input type">
                  <option value="text">Text</option>
                  <option value="multiline">Long text</option>
                  <option value="choice">Choice</option>
                  <option value="date">Date</option>
                  <option value="toggle">Yes/No</option>
                </select>
                {field(inp.label, (v) => setInput(i, { label: v }), 'Label')}
                {field(inp.id, (v) => setInput(i, { id: v }), 'id')}
                <button type="button" className="icon-btn cb-x" aria-label="Remove input" onClick={() => up({ inputs: m.inputs.filter((_, k) => k !== i) })}>
                  ×
                </button>
                {inp.kind === 'choice' && field(inp.options, (v) => setInput(i, { options: v }), 'Options, separated by commas', 'cb-span')}
                {inp.kind !== 'toggle' && (
                  <label className="ts-check cb-span">
                    <input type="checkbox" checked={inp.required} onChange={(e) => setInput(i, { required: e.target.checked })} /> Required
                  </label>
                )}
              </div>
            ))}
            <button
              type="button"
              className="link-btn"
              onClick={() => up({ inputs: [...m.inputs, { kind: 'text', id: `field${m.inputs.length + 1}`, label: '', options: '', required: false }] })}
            >
              + Add input
            </button>

            <h2 className="detail__label">Buttons</h2>
            {m.buttons.map((b, i) => (
              <div className="cb-row cb-row--input" key={i}>
                <select className="cb-input" value={b.kind} onChange={(e) => setButton(i, { kind: e.target.value as CardButton['kind'] })} aria-label="Button type">
                  <option value="submit">Reply</option>
                  <option value="url">Open link</option>
                </select>
                {field(b.title, (v) => setButton(i, { title: v }), 'Button text')}
                {field(b.value, (v) => setButton(i, { value: v }), b.kind === 'url' ? 'https://…' : 'id, e.g. approve')}
                <button type="button" className="icon-btn cb-x" aria-label="Remove button" onClick={() => up({ buttons: m.buttons.filter((_, k) => k !== i) })}>
                  ×
                </button>
              </div>
            ))}
            {m.buttons.length < 6 && (
              <button type="button" className="link-btn" onClick={() => up({ buttons: [...m.buttons, { kind: 'submit', title: '', value: `option${m.buttons.length + 1}` }] })}>
                + Add button
              </button>
            )}
          </section>
        ) : (
          <section className="bf-pane" aria-labelledby="cb-paste">
            <div className="bf-pane__head">
              <h2 id="cb-paste">Card JSON</h2>
            </div>
            <textarea
              className="bf-input"
              value={pasted}
              onChange={(e) => setPasted(e.target.value)}
              placeholder="Paste any Adaptive Card JSON to preview it, for example one from your flow."
              spellCheck={false}
            />
            {pastedJson && !pastedJson.ok && <p className="lc-warn">That isn’t valid JSON: {pastedJson.message}</p>}
          </section>
        )}

        <section className="bf-pane bf-pane--out ts-preview" aria-labelledby="cb-prev">
          <div className="bf-pane__head">
            <h2 id="cb-prev">Teams preview</h2>
            <div className="segmented" role="group" aria-label="Preview theme">
              <button type="button" aria-pressed={!dark} onClick={() => setDark(false)}>
                Light
              </button>
              <button type="button" aria-pressed={dark} onClick={() => setDark(true)}>
                Dark
              </button>
            </div>
          </div>
          {previewJson ? <Preview json={previewJson} dark={dark} /> : <p className="bf-output__empty cb-empty">Paste card JSON to see it here.</p>}
        </section>
      </div>

      {mode === 'build' && (
        <section className="bf-checks" aria-labelledby="cb-use">
          <div className="bf-checks__head">
            <h2 id="cb-use">Use it in Power Automate</h2>
            <CopyButton text={builtText} label="card JSON" />
          </div>
          <ol className="lc-howto">
            <li>
              Add the Teams action <b>{waits ? 'Post adaptive card and wait for a response' : 'Post card in a chat or channel'}</b>
              {waits ? ' (people reply with the buttons or inputs).' : '.'}
            </li>
            <li>
              Choose who it goes to, then paste this JSON into the <b>Message</b> / <b>Adaptive Card</b> box. Swap sample text for dynamic
              content where you need it.
            </li>
          </ol>
          <div className="code lc-code">
            <pre>
              <code>{builtText}</code>
            </pre>
            <CopyButton text={builtText} label="card JSON" />
          </div>

          {waits && (
            <>
              <h3 className="detail__label cb-gap">Read the reply in later steps</h3>
              <label className="bf-control sh-action">
                <span className="bf-control__label">Action name</span>
                <input value={waitAction} onChange={(e) => setWaitAction(e.target.value)} spellCheck={false} />
              </label>
              <div className="cb-exprs">
                {responseExpressions(m, waitAction).map((r) => (
                  <div key={r.label}>
                    <p className="sh-loop">{r.label}</p>
                    <CodeLine code={r.expression} label={r.label} lang="wdl" />
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}
