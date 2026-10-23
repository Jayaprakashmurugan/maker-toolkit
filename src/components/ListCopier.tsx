import { useMemo, useState } from 'react';
import { consoleScript, parseList, pnpScript, powerAutomateSteps, restUrls, sampleXml, type CopyPlan, type ParsedList } from '../lib/spList';
import { CopyButton } from './FormulaDetail';

type Method = 'console' | 'flow' | 'pnp';

function Code({ code, label }: { code: string; label: string }) {
  return (
    <div className="code lc-code">
      <pre>
        <code>{code}</code>
      </pre>
      <CopyButton text={code} label={label} />
    </div>
  );
}

function Url({ label, url }: { label: string; url: string }) {
  return (
    <div className="lc-url">
      <span className="bf-control__label">{label}</span>
      <code>{url}</code>
      <a className="related__item" href={url} target="_blank" rel="noopener noreferrer">
        Open ↗
      </a>
      <CopyButton text={url} label={`${label} URL`} />
    </div>
  );
}

export default function ListCopier() {
  const [sourceSite, setSourceSite] = useState('');
  const [listName, setListName] = useState('');
  const [listXml, setListXml] = useState('');
  const [fieldsXml, setFieldsXml] = useState('');
  const [targetSite, setTargetSite] = useState('');
  const [method, setMethod] = useState<Method>('console');
  const [addToView, setAddToView] = useState(true);
  const [renameTitle, setRenameTitle] = useState(true);
  const [title, setTitle] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const [picked, setPicked] = useState<Record<string, boolean>>({});

  const urls = restUrls(sourceSite, listName);
  const ready = listXml.trim() && fieldsXml.trim();

  const parsed = useMemo((): { ok: true; data: ParsedList } | { ok: false; message: string } | null => {
    if (!ready) return null;
    try {
      return { ok: true, data: parseList(listXml, fieldsXml) };
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : String(e) };
    }
  }, [listXml, fieldsXml, ready]);

  const data = parsed?.ok ? parsed.data : null;
  const isPicked = (name: string, recommended: boolean) => picked[name] ?? recommended;
  const chosen = data ? data.fields.filter((f) => isPicked(f.internalName, f.recommended)) : [];

  const plan: CopyPlan | null = data
    ? {
        targetSite,
        list: { ...data.list, Title: title ?? data.list.Title, Description: description ?? data.list.Description },
        fields: chosen,
        titleRename: renameTitle ? data.titleRename : undefined,
        addToView,
      }
    : null;

  const loadSample = () => {
    const s = sampleXml();
    setSourceSite('https://contoso.sharepoint.com/sites/finance');
    setListName('Purchase Requests');
    setListXml(s.list);
    setFieldsXml(s.fields);
    setTitle(null);
    setDescription(null);
    setPicked({});
  };

  const flow = plan ? powerAutomateSteps(plan) : null;

  return (
    <div className="lc">
      {/* ── 1. Source ─────────────────────────────────────── */}
      <section className="bf-checks lc-step" aria-labelledby="lc-1">
        <div className="bf-checks__head">
          <h2 id="lc-1">
            <span className="lc-num">1</span> Get the source list
          </h2>
          <button type="button" className="link-btn" onClick={loadSample}>
            Try it with a sample list
          </button>
        </div>
        <p className="sh-intro">
          Enter the site and list name. Open both links in a browser where you’re signed in to that site, and paste what each page
          shows (Ctrl+A, Ctrl+C) into the boxes below.
        </p>
        <div className="lc-inputs">
          <label className="bf-control sh-action lc-wide">
            <span className="bf-control__label">Source site URL</span>
            <input value={sourceSite} onChange={(e) => setSourceSite(e.target.value)} placeholder="https://contoso.sharepoint.com/sites/finance" spellCheck={false} />
          </label>
          <label className="bf-control sh-action">
            <span className="bf-control__label">List name</span>
            <input value={listName} onChange={(e) => setListName(e.target.value)} placeholder="Purchase Requests" spellCheck={false} />
          </label>
        </div>
        <Url label="List" url={urls.list} />
        <Url label="Columns" url={urls.fields} />
        <div className="bf-panes lc-pastes">
          <label className="bf-pane">
            <span className="bf-pane__head">
              <span className="lc-pane-title">List response</span>
            </span>
            <textarea className="bf-input" value={listXml} onChange={(e) => setListXml(e.target.value)} placeholder="Paste the List page here (XML)" spellCheck={false} />
          </label>
          <label className="bf-pane">
            <span className="bf-pane__head">
              <span className="lc-pane-title">Columns response</span>
            </span>
            <textarea className="bf-input" value={fieldsXml} onChange={(e) => setFieldsXml(e.target.value)} placeholder="Paste the Columns page here (XML)" spellCheck={false} />
          </label>
        </div>
        {parsed && !parsed.ok && <p className="lc-warn">{parsed.message}</p>}
      </section>

      {data && plan && (
        <>
          {/* ── 2. Review ─────────────────────────────────── */}
          <section className="bf-checks lc-step" aria-labelledby="lc-2">
            <div className="bf-checks__head">
              <h2 id="lc-2">
                <span className="lc-num">2</span> Choose what to copy
              </h2>
              <p className="bf-stats">
                <span>
                  <b>{data.list.BaseTemplate === 101 ? 'Document library' : 'List'}</b>
                </span>
                <span>
                  <b>{chosen.length}</b> of {data.fields.length} custom columns
                </span>
                <span>
                  <b>{data.list.ItemCount}</b> items (not copied)
                </span>
              </p>
            </div>
            <div className="lc-inputs">
              <label className="bf-control sh-action">
                <span className="bf-control__label">New list name</span>
                <input value={plan.list.Title} onChange={(e) => setTitle(e.target.value)} />
              </label>
              <label className="bf-control sh-action lc-wide">
                <span className="bf-control__label">Description</span>
                <input value={plan.list.Description} onChange={(e) => setDescription(e.target.value)} />
              </label>
            </div>
            {data.list.BaseTemplate !== 100 && data.list.BaseTemplate !== 101 && (
              <p className="lc-warn">This list uses a special template ({data.list.BaseTemplate}). It will be created as a standard list.</p>
            )}

            <div className="sh-table-wrap">
              <table className="sh-table lc-table">
                <thead>
                  <tr>
                    <th scope="col">Copy</th>
                    <th scope="col">Column</th>
                    <th scope="col">Type</th>
                    <th scope="col">Internal name</th>
                  </tr>
                </thead>
                <tbody>
                  {data.fields.map((f) => (
                    <tr key={f.internalName}>
                      <td>
                        <input
                          type="checkbox"
                          checked={isPicked(f.internalName, f.recommended)}
                          onChange={(e) => setPicked((p) => ({ ...p, [f.internalName]: e.target.checked }))}
                          aria-label={`Copy ${f.title}`}
                        />
                      </td>
                      <td>
                        <b>{f.title}</b>
                        {f.note && <p className="sh-loop">{f.note}</p>}
                      </td>
                      <td className="sh-type">{f.typeName}</td>
                      <td>
                        <code className="sh-path">{f.internalName}</code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data.fields.length === 0 && <p className="sh-intro">This list has no custom columns, so only the list itself will be created.</p>}

            <div className="lc-options">
              <label>
                <input type="checkbox" checked={addToView} onChange={(e) => setAddToView(e.target.checked)} /> Show the new columns in the
                default view
              </label>
              {data.titleRename && (
                <label>
                  <input type="checkbox" checked={renameTitle} onChange={(e) => setRenameTitle(e.target.checked)} /> Rename the Title column to “
                  {data.titleRename}”, like the source
                </label>
              )}
            </div>
          </section>

          {/* ── 3. Target ─────────────────────────────────── */}
          <section className="bf-checks lc-step" aria-labelledby="lc-3">
            <div className="bf-checks__head">
              <h2 id="lc-3">
                <span className="lc-num">3</span> Target site
              </h2>
            </div>
            <label className="bf-control sh-action lc-wide lc-target">
              <span className="bf-control__label">Target site URL</span>
              <input value={targetSite} onChange={(e) => setTargetSite(e.target.value)} placeholder="https://fabrikam.sharepoint.com/sites/projects" spellCheck={false} />
            </label>
            <p className="sh-intro">It can be in the same tenant or a different one. You need permission to create lists there.</p>
          </section>

          {/* ── 4. Run ────────────────────────────────────── */}
          <section className="bf-checks lc-step" aria-labelledby="lc-4">
            <div className="bf-checks__head">
              <h2 id="lc-4">
                <span className="lc-num">4</span> Create it
              </h2>
              <div className="segmented" role="group" aria-label="How to create the list">
                {(
                  [
                    ['console', 'Browser console'],
                    ['flow', 'Power Automate'],
                    ['pnp', 'PnP PowerShell'],
                  ] as const
                ).map(([m, label]) => (
                  <button key={m} type="button" aria-pressed={method === m} onClick={() => setMethod(m)}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {method === 'console' && (
              <div className="lc-method" key="console">
                <ol className="lc-howto">
                  <li>Open the target site in your browser and sign in.</li>
                  <li>
                    Press <kbd>F12</kbd> (or right-click → Inspect) and open the <b>Console</b> tab.
                  </li>
                  <li>
                    Paste the script and press <kbd>Enter</kbd>. If the browser blocks pasting, type <code>allow pasting</code> first.
                  </li>
                </ol>
                <Code code={consoleScript(plan)} label="browser console script" />
                <p className="bf-checks__note">
                  The script only talks to the SharePoint site you have open, using your own sign-in. Read it before you run it: it
                  creates one list and its columns, and nothing else.
                </p>
              </div>
            )}

            {method === 'flow' && flow && (
              <div className="lc-method" key="flow">
                <ol className="lc-howto">
                  <li>
                    Add <b>Send an HTTP request to SharePoint</b>. Site address: your target site. Method: <b>POST</b>. Use this Uri,
                    headers and body:
                  </li>
                </ol>
                <div className="lc-flow">
                  <Code code={flow.createList.uri} label="Uri" />
                  <Code code={flow.createList.headers} label="headers" />
                  <Code code={flow.createList.body} label="body" />
                </div>
                <ol className="lc-howto" start={2}>
                  <li>
                    Add a <b>Compose</b> named <b>Fields</b> and paste this array of column definitions as its input:
                  </li>
                </ol>
                <Code code={flow.fieldsCompose} label="column definitions" />
                <ol className="lc-howto" start={3}>
                  <li>
                    Add <b>Apply to each</b> over <code>outputs('Fields')</code>. Inside it, add another <b>Send an HTTP request to SharePoint</b>{' '}
                    (POST, same headers) with:
                  </li>
                </ol>
                <div className="lc-flow">
                  <Code code={flow.createField.uri} label="Uri" />
                  <Code code={flow.createField.body} label="body" />
                </div>
                {flow.renameTitle && (
                  <>
                    <ol className="lc-howto" start={4}>
                      <li>
                        After the loop, rename the Title column with one more request (POST):
                      </li>
                    </ol>
                    <div className="lc-flow">
                      <Code code={flow.renameTitle.uri} label="Uri" />
                      <Code code={flow.renameTitle.headers} label="headers" />
                      <Code code={flow.renameTitle.body} label="body" />
                    </div>
                  </>
                )}
                <p className="bf-checks__note">The connector signs in for you, so no app registration or request digest is needed.</p>
              </div>
            )}

            {method === 'pnp' && (
              <div className="lc-method" key="pnp">
                <ol className="lc-howto">
                  <li>
                    Install <code>PnP.PowerShell</code> and register your own Entra ID app for it (PnP no longer provides a shared one).
                  </li>
                  <li>
                    Replace <code>YOUR-CLIENT-ID</code> with your app’s Client ID, then run the script.
                  </li>
                </ol>
                <Code code={pnpScript(plan)} label="PnP PowerShell script" />
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
