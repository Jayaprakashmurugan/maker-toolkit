import { useState } from 'react';
import { OP_LABELS, OUTLOOK_FIELDS, PRESETS, TYPE_LABELS, buildConditions, opsFor, type FieldType, type Op, type Rule, type Source } from '../lib/triggerCondition';
import { CodeLine } from './FormulaDetail';

const SOURCES: [Source, string][] = [
  ['sharepoint', 'SharePoint item'],
  ['dataverse', 'Dataverse row'],
  ['outlook', 'Outlook email'],
  ['other', 'Other trigger'],
];

const blankRule = (source: Source): Rule =>
  source === 'outlook'
    ? { field: 'subject', type: 'text', op: 'contains', value: '', dynamic: false, ignoreCase: true }
    : { field: '', type: 'text', op: 'eq', value: '', dynamic: false, ignoreCase: false };

const fieldPlaceholder: Record<Source, string> = {
  sharepoint: 'Internal name, e.g. Status',
  dataverse: 'Logical name, e.g. statuscode',
  outlook: '',
  other: "Path in the trigger body, e.g. status or order/total",
};

export default function TriggerBuilder() {
  const [source, setSource] = useState<Source>('sharepoint');
  const [join, setJoin] = useState<'and' | 'or'>('and');
  const [rules, setRules] = useState<Rule[]>(PRESETS[0].rules);
  const [preset, setPreset] = useState(PRESETS[0].label);

  const update = (i: number, patch: Partial<Rule>) =>
    setRules((rs) =>
      rs.map((r, k) => {
        if (k !== i) return r;
        const next = { ...r, ...patch };
        if (patch.type && patch.type !== r.type) Object.assign(next, { value: patch.type === 'bool' ? 'Yes' : '', dynamic: false });
        if (!opsFor(next.type).includes(next.op)) next.op = opsFor(next.type)[0];
        return next;
      }),
    );

  const switchSource = (s: Source) => {
    setSource(s);
    setRules([blankRule(s)]);
    setPreset('');
  };

  const { lines } = buildConditions(source, join, rules);
  const types = Object.entries(TYPE_LABELS[source]) as [FieldType, string][];

  return (
    <div className="tc">
      <div className="ts-presets" role="group" aria-label="Common conditions">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            className="chip"
            aria-pressed={preset === p.label}
            onClick={() => {
              setPreset(p.label);
              setSource(p.source);
              setJoin(p.join);
              setRules(p.rules);
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="bf-toolbar">
        <div className="bf-control">
          <span className="bf-control__label">Trigger</span>
          <div className="segmented" role="group" aria-label="Trigger">
            {SOURCES.map(([s, label]) => (
              <button key={s} type="button" aria-pressed={source === s} onClick={() => switchSource(s)}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="bf-control">
          <span className="bf-control__label">Run when</span>
          <div className="segmented" role="group" aria-label="Run when">
            <button type="button" aria-pressed={join === 'and'} onClick={() => setJoin('and')}>
              All are true
            </button>
            <button type="button" aria-pressed={join === 'or'} onClick={() => setJoin('or')}>
              Any is true
            </button>
          </div>
        </div>
      </div>

      <section className="bf-checks od-conds" aria-labelledby="tc-c">
        <div className="bf-checks__head">
          <h2 id="tc-c">Conditions</h2>
        </div>
        <div className="od-head" aria-hidden="true">
          <span>{source === 'outlook' ? 'Email field' : 'Column'}</span>
          <span>Type</span>
          <span>Condition</span>
          <span>Value</span>
        </div>
        {rules.map((r, i) => (
          <div className="od-row" key={i}>
            {i > 0 && <span className="od-join">{join}</span>}
            {source === 'outlook' ? (
              <select
                className="cb-input od-field"
                value={r.field}
                onChange={(e) => {
                  const f = OUTLOOK_FIELDS.find(([id]) => id === e.target.value)!;
                  update(i, { field: f[0], type: f[2] });
                }}
                aria-label="Email field"
              >
                {OUTLOOK_FIELDS.map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
            ) : (
              <input className="cb-input od-field" value={r.field} onChange={(e) => update(i, { field: e.target.value })} placeholder={fieldPlaceholder[source]} aria-label="Column" spellCheck={false} />
            )}
            <select className="cb-input" value={r.type} onChange={(e) => update(i, { type: e.target.value as FieldType })} aria-label="Type" disabled={source === 'outlook'}>
              {types.map(([t, label]) => (
                <option key={t} value={t}>
                  {label}
                </option>
              ))}
            </select>
            <select className="cb-input" value={r.op} onChange={(e) => update(i, { op: e.target.value as Op })} aria-label="Condition">
              {opsFor(r.type).map((op) => (
                <option key={op} value={op}>
                  {OP_LABELS[op]}
                </option>
              ))}
            </select>
            <div className="od-value">
              {r.op !== 'empty' && r.op !== 'notempty' && (
                <>
                  {r.type === 'bool' && !r.dynamic ? (
                    <select className="cb-input" value={/^(true|yes|1)$/i.test(r.value) ? 'Yes' : 'No'} onChange={(e) => update(i, { value: e.target.value })} aria-label="Value">
                      <option>Yes</option>
                      <option>No</option>
                    </select>
                  ) : (
                    <input
                      className="cb-input"
                      type={r.type === 'date' && !r.dynamic ? 'date' : 'text'}
                      value={r.value}
                      onChange={(e) => update(i, { value: e.target.value })}
                      placeholder={r.dynamic ? 'Expression, e.g. utcNow()' : 'Value'}
                      aria-label="Value"
                      spellCheck={false}
                    />
                  )}
                  <label className="ts-check od-dyn" title="Compare with an expression instead of fixed text">
                    <input type="checkbox" checked={r.dynamic} onChange={(e) => update(i, { dynamic: e.target.checked, value: '' })} /> fx
                  </label>
                  {(r.type === 'text' || r.type === 'choice' || r.type === 'person') && (
                    <label className="ts-check od-dyn" title="Ignore upper and lower case">
                      <input type="checkbox" checked={r.ignoreCase} onChange={(e) => update(i, { ignoreCase: e.target.checked })} /> Aa
                    </label>
                  )}
                </>
              )}
              <button type="button" className="icon-btn cb-x" aria-label="Remove condition" onClick={() => setRules((rs) => rs.filter((_, k) => k !== i))}>
                ×
              </button>
            </div>
          </div>
        ))}
        <button type="button" className="link-btn" onClick={() => setRules((rs) => [...rs, blankRule(source)])}>
          + Add condition
        </button>
      </section>

      <section className="bf-checks" aria-labelledby="tc-out">
        <div className="bf-checks__head">
          <h2 id="tc-out">{lines.length > 1 ? `Trigger conditions (${lines.length} boxes)` : 'Trigger condition'}</h2>
        </div>
        <ol className="lc-howto">
          <li>
            On the trigger, open <b>Settings</b> and find <b>Trigger conditions</b>.
          </li>
          <li>{lines.length > 1 ? 'Add one condition box per line below and paste each line into its own box.' : 'Add a condition and paste this line.'}</li>
        </ol>
        {lines.length ? (
          lines.map((l, i) => <CodeLine key={i} code={l} label={`trigger condition ${i + 1}`} lang="wdl" />)
        ) : (
          <p className="sh-intro">{rules.length ? 'Type a column name to see the condition here.' : 'Add a condition to see it here.'}</p>
        )}
        <ul className="notes od-tips">
          <li>When a condition is false, the flow doesn’t start at all, so it uses no runs and doesn’t appear in run history.</li>
          {source === 'sharepoint' && <li>Use internal column names. Choice and lookup columns are read through /Value, people through /Email.</li>}
          {source === 'dataverse' && <li>Dataverse triggers also have a “Filter rows” setting that takes an OData filter, which can be simpler for basic checks.</li>}
          {join === 'or' && <li>Separate boxes always mean AND, so “any is true” is written as one @or(...) line.</li>}
        </ul>
      </section>
    </div>
  );
}
