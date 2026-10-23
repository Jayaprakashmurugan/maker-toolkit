import { useState } from 'react';
import { DATE_SHORTCUTS, OP_LABELS, TYPE_LABELS, buildFilter, opsFor, spInternalName, tips, type ColType, type Condition, type Op, type Target } from '../lib/odata';
import { CodeLine } from './FormulaDetail';

const START: Record<Target, Condition[]> = {
  sharepoint: [
    { column: 'Status', type: 'choice', op: 'eq', value: 'Open', dynamic: false },
    { column: 'Created', type: 'date', op: 'ge', value: 'addDays(utcNow(), -7)', dynamic: true },
  ],
  dataverse: [
    { column: 'statecode', type: 'choice', op: 'eq', value: '0', dynamic: false },
    { column: 'createdon', type: 'date', op: 'ge', value: 'addDays(utcNow(), -7)', dynamic: true },
  ],
};

const placeholderFor = (target: Target, c: Condition) => {
  if (c.dynamic) return "Expression, e.g. triggerBody()?['email']";
  if (c.type === 'date') return '2026-01-31';
  if (c.type === 'bool') return 'Yes or No';
  if (c.type === 'person') return 'name@contoso.com';
  if (c.type === 'lookup') return target === 'dataverse' ? 'GUID of the related row' : 'ID of the related item, e.g. 5';
  if (c.type === 'choice') return target === 'dataverse' ? 'Option number, e.g. 1' : 'Option text, e.g. Open';
  return 'Value';
};

export default function ODataBuilder() {
  const [target, setTarget] = useState<Target>('sharepoint');
  const [join, setJoin] = useState<'and' | 'or'>('and');
  const [conds, setConds] = useState<Condition[]>(START.sharepoint);
  const [display, setDisplay] = useState('Due Date');

  const switchTarget = (t: Target) => {
    setTarget(t);
    setConds(START[t]);
  };
  const update = (i: number, patch: Partial<Condition>) =>
    setConds((cs) =>
      cs.map((c, k) => {
        if (k !== i) return c;
        const next = { ...c, ...patch };
        // Keep the operator valid for the column type.
        if (!opsFor(target, next.type).includes(next.op)) next.op = opsFor(target, next.type)[0];
        return next;
      }),
    );

  const filter = buildFilter(target, join, conds);
  const typeOptions = Object.entries(TYPE_LABELS[target]) as [ColType, string][];

  return (
    <div className="od">
      <div className="bf-toolbar">
        <div className="bf-control">
          <span className="bf-control__label">Data source</span>
          <div className="segmented" role="group" aria-label="Data source">
            <button type="button" aria-pressed={target === 'sharepoint'} onClick={() => switchTarget('sharepoint')}>
              SharePoint · Get items
            </button>
            <button type="button" aria-pressed={target === 'dataverse'} onClick={() => switchTarget('dataverse')}>
              Dataverse · List rows
            </button>
          </div>
        </div>
        <div className="bf-control">
          <span className="bf-control__label">Match</span>
          <div className="segmented" role="group" aria-label="Match">
            <button type="button" aria-pressed={join === 'and'} onClick={() => setJoin('and')}>
              All conditions (and)
            </button>
            <button type="button" aria-pressed={join === 'or'} onClick={() => setJoin('or')}>
              Any condition (or)
            </button>
          </div>
        </div>
      </div>

      <section className="bf-checks od-conds" aria-labelledby="od-c">
        <div className="bf-checks__head">
          <h2 id="od-c">Conditions</h2>
        </div>
        <div className="od-head" aria-hidden="true">
          <span>{target === 'sharepoint' ? 'Internal name' : 'Logical name'}</span>
          <span>Type</span>
          <span>Condition</span>
          <span>Value</span>
        </div>
        {conds.map((c, i) => (
          <div className="od-row" key={i}>
            {i > 0 && <span className="od-join">{join}</span>}
            <input className="cb-input" value={c.column} onChange={(e) => update(i, { column: e.target.value })} placeholder="Column" aria-label="Column name" spellCheck={false} />
            <select className="cb-input" value={c.type} onChange={(e) => update(i, { type: e.target.value as ColType })} aria-label="Column type">
              {typeOptions.map(([t, label]) => (
                <option key={t} value={t}>
                  {label}
                </option>
              ))}
            </select>
            <select className="cb-input" value={c.op} onChange={(e) => update(i, { op: e.target.value as Op })} aria-label="Condition">
              {opsFor(target, c.type).map((op) => (
                <option key={op} value={op}>
                  {OP_LABELS[op]}
                </option>
              ))}
            </select>
            <div className="od-value">
              {c.op !== 'null' && c.op !== 'notnull' && (
                <>
                  {c.type === 'bool' && !c.dynamic ? (
                    <select className="cb-input" value={/^(true|yes|1)$/i.test(c.value) ? 'Yes' : 'No'} onChange={(e) => update(i, { value: e.target.value })} aria-label="Value">
                      <option>Yes</option>
                      <option>No</option>
                    </select>
                  ) : (
                    <input
                      className="cb-input"
                      type={c.type === 'date' && !c.dynamic ? 'date' : 'text'}
                      value={c.value}
                      onChange={(e) => update(i, { value: e.target.value })}
                      placeholder={placeholderFor(target, c)}
                      aria-label="Value"
                      spellCheck={false}
                    />
                  )}
                  <label className="ts-check od-dyn" title="Use a Power Automate expression or dynamic content as the value">
                    <input type="checkbox" checked={c.dynamic} onChange={(e) => update(i, { dynamic: e.target.checked, value: '' })} /> fx
                  </label>
                </>
              )}
              <button type="button" className="icon-btn cb-x" aria-label="Remove condition" onClick={() => setConds((cs) => cs.filter((_, k) => k !== i))}>
                ×
              </button>
            </div>
            {c.type === 'date' && c.dynamic && (
              <div className="od-shortcuts">
                {DATE_SHORTCUTS.map(([label, expr]) => (
                  <button key={label} type="button" className="related__item" aria-pressed={c.value === expr} onClick={() => update(i, { value: expr })}>
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        <button
          type="button"
          className="link-btn"
          onClick={() => setConds((cs) => [...cs, { column: '', type: 'text', op: 'eq', value: '', dynamic: false }])}
        >
          + Add condition
        </button>
      </section>

      <section className="bf-checks" aria-labelledby="od-out">
        <div className="bf-checks__head">
          <h2 id="od-out">Filter query</h2>
        </div>
        <p className="sh-intro">
          Paste into <b>{target === 'sharepoint' ? 'Get items → Advanced parameters → Filter Query' : 'List rows → Advanced parameters → Filter rows'}</b>.
        </p>
        <CodeLine code={filter || '(add a condition)'} label="filter query" lang="wdl" />
        <ul className="notes od-tips">
          {tips(target, conds).map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </section>

      {target === 'sharepoint' && (
        <section className="bf-checks" aria-labelledby="od-name">
          <div className="bf-checks__head">
            <h2 id="od-name">Display name → internal name</h2>
          </div>
          <p className="sh-intro">
            SharePoint encodes spaces and symbols when a column is created. This shows the name it most likely got. If the column was
            renamed later, its internal name is still the original one.
          </p>
          <div className="lc-inputs">
            <label className="bf-control sh-action">
              <span className="bf-control__label">Display name</span>
              <input value={display} onChange={(e) => setDisplay(e.target.value)} spellCheck={false} />
            </label>
          </div>
          <CodeLine code={spInternalName(display) || '(type a name)'} label="internal name" />
        </section>
      )}
    </div>
  );
}
