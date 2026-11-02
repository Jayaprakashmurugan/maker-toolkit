// Naming Checker: paste canvas YAML, see which names break the conventions, accept or edit the suggestions,
// and copy the YAML back with every name fixed. Runs in the browser.

import { useMemo, useState } from 'react';
import { analyze, applyRenames, SAMPLE } from '../lib/naming';
import YamlCode from './uikit/YamlCode';

export default function NamingChecker() {
  const [text, setText] = useState('');
  const [vars, setVars] = useState(true);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [skip, setSkip] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);

  const report = useMemo(() => analyze(text), [text]);
  const toFix = report.controls.filter((c) => !c.ok);
  const varFix = report.variables.filter((v) => !v.ok);
  const renames = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of toFix) if (!skip[c.name]) m.set(c.name, edits[c.name] ?? c.suggestion);
    if (vars) for (const v of varFix) if (!skip[v.name]) m.set(v.name, edits[v.name] ?? v.suggestion);
    return m;
  }, [toFix, varFix, vars, edits, skip]);
  const fixed = useMemo(() => applyRenames(text, renames), [text, renames]);
  const checked = report.controls.length;

  const row = (name: string, type: string, suggestion: string, why?: string) => (
    <tr key={name} className={skip[name] ? 'is-skipped' : undefined}>
      <td>
        <input type="checkbox" checked={!skip[name]} onChange={(e) => setSkip((s) => ({ ...s, [name]: !e.target.checked }))} aria-label={`Rename ${name}`} />
      </td>
      <td>
        <code>{name}</code>
      </td>
      <td className="nc-arrow" aria-hidden="true">
        →
      </td>
      <td>
        <input
          className="nc-new"
          value={edits[name] ?? suggestion}
          onChange={(e) => setEdits((s) => ({ ...s, [name]: e.target.value.replace(/[^\w]/g, '') }))}
          spellCheck={false}
          aria-label={`New name for ${name}`}
        />
      </td>
      <td className="nc-type">
        {type}
        {why && <small>{why}</small>}
      </td>
    </tr>
  );

  return (
    <div className="nc">
      <div className="nc-input">
        <div className="kit-tabs">
          <span className="kit-tabs__title">
            Your YAML <small>from Copy code or a .pa.yaml file</small>
          </span>
          <span className="kit-tabs__fill" />
          <button type="button" className="kit-reset" onClick={() => setText(SAMPLE)}>
            Try an example
          </button>
          {text && (
            <button type="button" className="kit-reset" onClick={() => setText('')}>
              Clear
            </button>
          )}
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
          placeholder={'- Label1:\n    Control: Label@2.5.1\n    Properties:\n      Text: ="Hello"'}
          aria-label="Canvas app YAML"
        />
      </div>

      {report.error && <p className="nc-error">This doesn’t read as YAML yet: {report.error}</p>}

      {checked > 0 && (
        <>
          <p className="nc-summary">
            <b>{checked}</b> controls checked · <b className={toFix.length ? 'is-bad' : 'is-good'}>{toFix.length}</b> to rename ·{' '}
            <b className={varFix.length ? 'is-bad' : 'is-good'}>{varFix.length}</b> variables to rename
          </p>

          {toFix.length + varFix.length === 0 ? (
            <p className="nc-allgood">Every name follows the conventions. Nothing to change.</p>
          ) : (
            <div className="nc-tables">
              {toFix.length > 0 && (
                <table className="nc-table">
                  <caption>Controls</caption>
                  <tbody>{toFix.map((c) => row(c.name, c.type, c.suggestion, c.why))}</tbody>
                </table>
              )}
              {varFix.length > 0 && (
                <table className="nc-table">
                  <caption>
                    Variables and collections
                    <label className="nc-vars">
                      <input type="checkbox" checked={vars} onChange={(e) => setVars(e.target.checked)} /> rename these too
                    </label>
                  </caption>
                  <tbody>
                    {varFix.map((v) =>
                      row(v.name, v.kind === 'global' ? 'Global variable (Set)' : v.kind === 'local' ? 'Local variable (UpdateContext)' : 'Collection (ClearCollect)', v.suggestion),
                    )}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {renames.size > 0 && (
            <div className="kit-codebox">
              <div className="kit-tabs">
                <span className="kit-tabs__title">
                  Renamed YAML <small>{renames.size} names changed, in formulas too</small>
                </span>
                <span className="kit-tabs__fill" />
                <button
                  type="button"
                  className="kit-copy"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(fixed);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1600);
                    } catch {
                      /* clipboard blocked */
                    }
                  }}
                >
                  {copied ? 'Copied' : 'Copy YAML'}
                </button>
              </div>
              <YamlCode code={fixed} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
