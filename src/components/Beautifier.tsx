import { useMemo, useRef, useState, type ReactNode } from 'react';
import type { Lang } from '../data/types';
import { beautify, detectLang, tokenize, type Mode } from '../lib/beautify';
import AnimatedLines, { toLines } from './AnimatedLines';
import { CopyButton } from './FormulaDetail';

const SAMPLES: Record<Lang, string> = {
  wdl: `if(empty(triggerBody()?['email']),concat('Hello ',triggerBody()?['name'],', welcome!'),formatDateTime(convertTimeZone(utcNow(),'UTC','India Standard Time'),'dd MMM yyyy HH:mm'))`,
  powerfx: `If(IsBlank(txtEmail.Text),Notify("Email is required",NotificationType.Error),Patch(Contacts,Defaults(Contacts),{FullName:txtName.Text,Email:Lower(Trim(txtEmail.Text)),Created:Now()});Navigate(DoneScreen,ScreenTransition.Fade))`,
};

const LANG_NAME: Record<Lang, string> = { wdl: 'Power Automate', powerfx: 'Power Fx' };
const KEYWORDS = new Set(['true', 'false', 'null', 'ThisItem', 'ThisRecord', 'Self', 'Parent', 'And', 'Or', 'Not', 'in', 'exactin', 'As']);

/** Colours strings, numbers, function names and brackets (one colour per nesting level). */
function render(code: string, lang: Lang): ReactNode[] {
  const toks = tokenize(code, lang);
  const out: ReactNode[] = [];
  let last = 0;
  let depth = 0;
  toks.forEach((t, k) => {
    if (t.pos > last) out.push(code.slice(last, t.pos));
    let cls = '';
    if (t.t === 'str') cls = 'tk-str';
    else if (t.t === 'num') cls = 'tk-num';
    else if (t.t === 'cmt') cls = 'tk-cmt';
    else if (t.t === 'word') cls = toks[k + 1]?.v === '(' ? 'tk-fn' : KEYWORDS.has(t.v) ? 'tk-kw' : '';
    else if (t.t === 'open') cls = `rb rb${depth++ % 6}`;
    else if (t.t === 'close') cls = `rb rb${(depth = Math.max(0, depth - 1)) % 6}`;
    else if (t.t === 'op' || t.t === 'q' || t.t === 'at') cls = 'tk-op';
    else cls = 'tk-punc';
    out.push(
      cls ? (
        <span key={k} className={cls}>
          {t.v}
        </span>
      ) : (
        t.v
      ),
    );
    last = t.pos + t.v.length;
  });
  if (last < code.length) out.push(code.slice(last));
  return out;
}

function Segmented<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: [T, string][];
  onChange: (v: T) => void;
}) {
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

export default function Beautifier() {
  const [src, setSrc] = useState('');
  const [langPref, setLangPref] = useState<'auto' | Lang>('auto');
  const [mode, setMode] = useState<Mode>('smart');
  const [indent, setIndent] = useState(2);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  // Bumped on deliberate changes (sample, paste, settings) to replay the unfold animation.
  const [version, setVersion] = useState(0);
  const bump = () => setVersion((v) => v + 1);

  const lang: Lang = langPref === 'auto' ? detectLang(src) : langPref;
  const hasInput = src.trim().length > 0;
  const result = useMemo(() => beautify(src, { lang, mode, indent }), [src, lang, mode, indent]);
  const oneLine = useMemo(() => beautify(src, { lang, mode: 'oneline', indent }).output, [src, lang, indent]);
  const lines = result.output ? result.output.split('\n') : [];

  const issueKinds = {
    brackets: result.issues.some((i) => i.kind === 'brackets'),
    strings: result.issues.some((i) => i.kind === 'strings'),
    args: result.issues.some((i) => i.kind === 'args'),
  };

  const jumpTo = (pos: number) => {
    const el = inputRef.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(pos, pos + 1);
  };

  const loadSample = (l: Lang) => {
    setSrc(SAMPLES[l]);
    setLangPref('auto');
    bump();
  };

  return (
    <div className="bf">
      <div className="bf-toolbar">
        <Segmented
          label="Language"
          value={langPref}
          onChange={(v) => {
            setLangPref(v);
            bump();
          }}
          options={[
            ['auto', hasInput && langPref === 'auto' ? `Auto · ${LANG_NAME[lang]}` : 'Auto-detect'],
            ['wdl', 'Power Automate'],
            ['powerfx', 'Power Fx'],
          ]}
        />
        <Segmented
          label="Layout"
          value={mode}
          onChange={(v) => {
            setMode(v);
            bump();
          }}
          options={[
            ['smart', 'Smart'],
            ['expanded', 'Expanded'],
            ['oneline', 'One line'],
          ]}
        />
        <Segmented
          label="Indent"
          value={indent}
          onChange={(v) => {
            setIndent(v);
            bump();
          }}
          options={[
            [2, '2'],
            [4, '4'],
          ]}
        />
      </div>

      <div className="bf-panes">
        <section className="bf-pane" aria-labelledby="bf-in-title">
          <div className="bf-pane__head">
            <h2 id="bf-in-title">Expression</h2>
            <div className="bf-pane__actions">
              <button type="button" className="link-btn" onClick={() => loadSample('wdl')}>
                Power Automate sample
              </button>
              <button type="button" className="link-btn" onClick={() => loadSample('powerfx')}>
                Power Fx sample
              </button>
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
            placeholder={`Paste an expression, for example:\n${SAMPLES.wdl.slice(0, 64)}…`}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            aria-label="Expression to format"
          />
        </section>

        <section className="bf-pane bf-pane--out" aria-labelledby="bf-out-title">
          <div className="bf-pane__head">
            <h2 id="bf-out-title">Formatted</h2>
            {hasInput && (
              <div className="bf-pane__actions">
                <CopyButton text={result.output} label="formatted expression" />
                <button type="button" className="copy-btn" data-copy={oneLine} aria-label="Copy as one line">
                  <span className="copy-btn__idle">One line</span>
                  <span className="copy-btn__done" aria-hidden="true">
                    Copied
                  </span>
                </button>
              </div>
            )}
          </div>
          <div className="bf-output" aria-live="polite">
            {hasInput ? (
              <>
                <ol className="bf-gutter" aria-hidden="true">
                  {lines.map((_, i) => (
                    <li key={i}>{i + 1}</li>
                  ))}
                </ol>
                <pre>
                  <code key={version}>
                    <AnimatedLines lines={toLines(render(result.output, lang))} />
                  </code>
                </pre>
              </>
            ) : (
              <p className="bf-output__empty">Your formatted expression appears here, color-coded by nesting level.</p>
            )}
          </div>
        </section>
      </div>

      {hasInput && (
        <section className="bf-checks" aria-labelledby="bf-checks-title">
          <div className="bf-checks__head">
            <h2 id="bf-checks-title">Syntax checks</h2>
            <p className="bf-stats">
              <span>
                <b>{lines.length}</b> lines
              </span>
              <span>
                <b>{src.length}</b> characters
              </span>
              <span>
                <b>{result.depth}</b> levels deep
              </span>
              <span>
                <b>{result.functions}</b> function calls
              </span>
            </p>
          </div>
          <ul className="bf-checklist">
            <li key={`b${issueKinds.brackets}`} className={issueKinds.brackets ? 'is-bad' : 'is-ok'}>Brackets are balanced</li>
            <li key={`s${issueKinds.strings}`} className={issueKinds.strings ? 'is-bad' : 'is-ok'}>Strings and quoted names are closed</li>
            <li key={`a${issueKinds.args}`} className={issueKinds.args ? 'is-bad' : 'is-ok'}>Arguments are separated correctly</li>
          </ul>
          {result.issues.length > 0 && (
            <ol className="bf-issues">
              {result.issues.map((i, k) => (
                <li key={k}>
                  <button type="button" onClick={() => jumpTo(i.pos)}>
                    <span className="bf-issues__pos">
                      Line {i.line}, col {i.col}
                    </span>
                    {i.message}
                  </button>
                </li>
              ))}
            </ol>
          )}
          <p className="bf-checks__note">
            These checks run in your browser and catch structural mistakes only. They can’t confirm that an expression
            will run in {LANG_NAME[lang]}.
          </p>
        </section>
      )}
    </div>
  );
}
