// Reads a SharePoint list's REST output (XML or JSON) and generates code that recreates
// the list and its custom columns on another site. Runs in the browser (uses DOMParser).

export interface ListInfo {
  Title: string;
  Description: string;
  BaseTemplate: number;
  EnableVersioning: boolean;
  EnableAttachments: boolean;
  ItemCount: number;
}

export interface FieldInfo {
  internalName: string;
  title: string;
  type: string;
  typeName: string;
  schemaXml: string;
  /** Selected by default (lookups and managed metadata are not). */
  recommended: boolean;
  note?: string;
}

export interface ParsedList {
  list: ListInfo;
  fields: FieldInfo[];
  /** The source renamed the built-in Title column (e.g. to "Request"). */
  titleRename?: string;
}

const M_NS = 'http://schemas.microsoft.com/ado/2007/08/dataservices/metadata';

// Built-in columns that are never worth copying even if they look custom.
const SKIP = new Set(['ContentType', 'Attachments', '_ComplianceTag', '_ComplianceTagWrittenTime', '_ComplianceTagUserId', '_IsRecord', 'ComplianceAssetId', '_ColorTag']);

/** Turns pasted XML (Atom) or JSON from the REST API into plain property records. */
function records(text: string): Record<string, unknown>[] {
  const t = text.trim();
  if (!t) throw new Error('Nothing pasted yet.');
  if (t.startsWith('{')) {
    const j = JSON.parse(t);
    if (j.error || j['odata.error']) throw new Error((j.error?.message?.value ?? j.error?.message ?? 'SharePoint returned an error.') as string);
    const root = j.d ?? j;
    const arr = root.results ?? root.value;
    return Array.isArray(arr) ? arr : [root];
  }
  const doc = new DOMParser().parseFromString(t, 'application/xml');
  if (doc.getElementsByTagName('parsererror').length) throw new Error('This isn’t valid XML. Copy the whole page the URL shows (Ctrl+A, Ctrl+C).');
  const err = doc.getElementsByTagNameNS(M_NS, 'message')[0];
  if (err) throw new Error(`SharePoint said: ${err.textContent}`);
  const props = [...doc.getElementsByTagNameNS(M_NS, 'properties')];
  if (!props.length) throw new Error('No list data found in this XML. Check that you copied the right URL’s response.');
  return props.map((p) => Object.fromEntries([...p.children].map((c) => [c.localName, c.textContent ?? ''])));
}

const bool = (v: unknown) => v === true || v === 'true';
const str = (v: unknown) => (v === undefined || v === null ? '' : String(v));

/** Strips attributes that tie a column to its source site, so it can be created elsewhere. */
function cleanSchema(xml: string): string {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  const f = doc.documentElement;
  for (const a of ['ID', 'SourceID', 'Version', 'ColName', 'RowOrdinal', 'WebId', 'Customization']) f.removeAttribute(a);
  return new XMLSerializer().serializeToString(f);
}

export function parseList(listText: string, fieldsText: string): ParsedList {
  const l = records(listText)[0];
  const list: ListInfo = {
    Title: str(l.Title),
    Description: str(l.Description),
    BaseTemplate: Number(l.BaseTemplate) || 100,
    EnableVersioning: bool(l.EnableVersioning),
    EnableAttachments: l.EnableAttachments === undefined ? true : bool(l.EnableAttachments),
    ItemCount: Number(l.ItemCount) || 0,
  };

  const all = records(fieldsText);
  const titleField = all.find((f) => f.InternalName === 'Title');
  const titleRename = titleField && str(titleField.Title) && str(titleField.Title) !== 'Title' ? str(titleField.Title) : undefined;

  const fields: FieldInfo[] = all
    .filter(
      (f) =>
        !bool(f.FromBaseType) && !bool(f.Hidden) && !bool(f.ReadOnlyField) && !bool(f.Sealed) && !SKIP.has(str(f.InternalName)) && str(f.SchemaXml),
    )
    .map((f) => {
      const type = str(f.TypeAsString);
      const base: FieldInfo = {
        internalName: str(f.InternalName),
        title: str(f.Title),
        type,
        typeName: str(f.TypeDisplayName) || type,
        schemaXml: cleanSchema(str(f.SchemaXml)),
        recommended: true,
      };
      if (type.startsWith('Lookup'))
        return { ...base, recommended: false, note: 'Points to another list. Create that list on the target first, then add this column by hand.' };
      if (type.startsWith('Taxonomy'))
        return { ...base, recommended: false, note: 'Managed metadata needs a term set on the target. Add this column by hand.' };
      if (type === 'Calculated') return { ...base, note: 'Created last, because its formula uses the other columns.' };
      return base;
    })
    // Calculated columns go last so the columns they reference already exist.
    .sort((a, b) => Number(a.type === 'Calculated') - Number(b.type === 'Calculated'));

  return { list, fields, titleRename };
}

export const restUrls = (siteUrl: string, listName: string) => {
  const site = siteUrl.trim().replace(/\/+$/, '') || 'https://contoso.sharepoint.com/sites/source';
  const list = `getbytitle('${(listName.trim() || 'List name').replace(/'/g, "''")}')`;
  return { list: `${site}/_api/web/lists/${list}`, fields: `${site}/_api/web/lists/${list}/fields` };
};

// ── Code generators ──────────────────────────────────────────

export interface CopyPlan {
  targetSite: string;
  list: ListInfo;
  fields: FieldInfo[];
  /** New display name for the built-in Title column, if any. */
  titleRename?: string;
  addToView: boolean;
}

const listBody = (p: CopyPlan) => ({
  __metadata: { type: 'SP.List' },
  Title: p.list.Title,
  Description: p.list.Description,
  BaseTemplate: p.list.BaseTemplate === 101 ? 101 : 100,
  EnableVersioning: p.list.EnableVersioning,
  ...(p.list.BaseTemplate === 101 ? {} : { EnableAttachments: p.list.EnableAttachments }),
  OnQuickLaunch: true,
});

// AddFieldInternalNameHint (8) keeps internal names; AddFieldToDefaultView (16) shows the column.
const fieldOptions = (p: CopyPlan) => (p.addToView ? 24 : 8);
const fieldBody = (p: CopyPlan, f: FieldInfo) => ({
  parameters: { __metadata: { type: 'SP.XmlSchemaFieldCreationInformation' }, SchemaXml: f.schemaXml, Options: fieldOptions(p) },
});
const site = (p: CopyPlan) => p.targetSite.trim().replace(/\/+$/, '') || 'https://contoso.sharepoint.com/sites/target';

export function consoleScript(p: CopyPlan): string {
  const fields = p.fields.map((f) => ({ title: f.title, body: fieldBody(p, f) }));
  return `// Maker Toolkit · List Copier
// Run this on the TARGET site: open ${site(p)} in your browser,
// press F12, choose Console, paste everything and press Enter.
(async () => {
  const site = ${JSON.stringify(site(p))};
  const list = ${JSON.stringify(listBody(p))};
  const fields = ${JSON.stringify(fields, null, 2).replace(/\n/g, '\n  ')};
  const titleRename = ${JSON.stringify(p.titleRename ?? null)};

  if (location.origin !== new URL(site).origin) {
    return console.error('Open ' + site + ' first, then run this script from that tab.');
  }
  const json = 'application/json;odata=verbose';
  const call = async (url, body, extra = {}) => {
    const res = await fetch(site + url, {
      method: 'POST',
      headers: { Accept: json, 'Content-Type': json, 'X-RequestDigest': digest, ...extra },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(res.status + ' ' + (await res.text()).slice(0, 300));
    return res.status === 204 ? null : res.json();
  };
  let digest = '';
  digest = (await call('/_api/contextinfo')).d.GetContextWebInformation.FormDigestValue;

  console.log('Creating list "' + list.Title + '"…');
  const created = await call('/_api/web/lists', list);
  const listApi = "/_api/web/lists(guid'" + created.d.Id + "')";

  let ok = 0;
  for (const f of fields) {
    try {
      await call(listApi + '/fields/createfieldasxml', f.body);
      ok++;
      console.log('  ✓ ' + f.title);
    } catch (e) {
      console.error('  ✗ ' + f.title + ': ' + e.message);
    }
  }
  if (titleRename) {
    await call(listApi + "/fields/getbyinternalnameortitle('Title')", { __metadata: { type: 'SP.Field' }, Title: titleRename }, { 'X-HTTP-Method': 'MERGE', 'IF-MATCH': '*' });
    console.log('  ✓ Title column renamed to "' + titleRename + '"');
  }
  console.log('Done: ' + ok + ' of ' + fields.length + ' columns created. Refresh the page to see "' + list.Title + '".');
})().catch((e) => console.error('List Copier stopped: ' + e.message));
`;
}

export interface FlowSteps {
  createList: { uri: string; headers: string; body: string };
  fieldsCompose: string;
  createField: { uri: string; body: string };
  renameTitle?: { uri: string; headers: string; body: string };
}

export function powerAutomateSteps(p: CopyPlan): FlowSteps {
  const headers = JSON.stringify({ Accept: 'application/json;odata=verbose', 'Content-Type': 'application/json;odata=verbose' }, null, 2);
  const listTitle = p.list.Title.replace(/'/g, "''");
  return {
    createList: { uri: '_api/web/lists', headers, body: JSON.stringify(listBody(p), null, 2) },
    fieldsCompose: JSON.stringify(
      p.fields.map((f) => fieldBody(p, f)),
      null,
      2,
    ),
    createField: { uri: `_api/web/lists/getbytitle('${listTitle}')/fields/createfieldasxml`, body: "@{items('Apply_to_each')}" },
    renameTitle: p.titleRename
      ? {
          uri: `_api/web/lists/getbytitle('${listTitle}')/fields/getbyinternalnameortitle('Title')`,
          headers: JSON.stringify(
            { Accept: 'application/json;odata=verbose', 'Content-Type': 'application/json;odata=verbose', 'X-HTTP-Method': 'MERGE', 'IF-MATCH': '*' },
            null,
            2,
          ),
          body: JSON.stringify({ __metadata: { type: 'SP.Field' }, Title: p.titleRename }, null, 2),
        }
      : undefined,
  };
}

const ps = (s: string) => `'${s.replace(/'/g, "''")}'`;

export function pnpScript(p: CopyPlan): string {
  const t = ps(p.list.Title);
  const lines = [
    '# Maker Toolkit · List Copier (PnP PowerShell)',
    '# Needs the PnP.PowerShell module and your own Entra ID app registration (its Client ID).',
    `Connect-PnPOnline -Url ${ps(site(p))} -Interactive -ClientId 'YOUR-CLIENT-ID'`,
    '',
    `New-PnPList -Title ${t} -Template ${p.list.BaseTemplate === 101 ? 'DocumentLibrary' : 'GenericList'} -OnQuickLaunch | Out-Null`,
    `Set-PnPList -Identity ${t} -Description ${ps(p.list.Description)} -EnableVersioning $${p.list.EnableVersioning} | Out-Null`,
    '',
    ...p.fields.map((f) => `Add-PnPFieldFromXml -List ${t} -FieldXml ${ps(f.schemaXml)} | Out-Null  # ${f.title}`),
  ];
  if (p.titleRename) lines.push('', `Set-PnPField -List ${t} -Identity 'Title' -Values @{ Title = ${ps(p.titleRename)} }`);
  if (p.addToView && p.fields.length) {
    lines.push(
      '',
      '# Show the new columns in the default view',
      `$view = Get-PnPView -List ${t} | Where-Object DefaultView`,
      `Set-PnPView -List ${t} -Identity $view.Id -Fields @(${['LinkTitle', ...p.fields.map((f) => f.internalName)].map(ps).join(', ')}) | Out-Null`,
    );
  }
  lines.push('', `Write-Host "Done: ${p.fields.length} columns added to ${p.list.Title.replace(/"/g, '`"')}."`);
  return lines.join('\n');
}

// ── Sample data (looks like real REST output) ────────────────

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const entry = (props: Record<string, string | number | boolean>, term = 'SP.Field') =>
  `<entry><category term="${term}" scheme="http://schemas.microsoft.com/ado/2007/08/dataservices/scheme" /><content type="application/xml"><m:properties>${Object.entries(
    props,
  )
    .map(([k, v]) => `<d:${k}${typeof v === 'boolean' ? ' m:type="Edm.Boolean"' : typeof v === 'number' ? ' m:type="Edm.Int32"' : ''}>${esc(String(v))}</d:${k}>`)
    .join('')}</m:properties></content></entry>`;
const NS = `xmlns="http://www.w3.org/2005/Atom" xmlns:d="http://schemas.microsoft.com/ado/2007/08/dataservices" xmlns:m="${M_NS}"`;

export function sampleXml(): { list: string; fields: string } {
  const list = `<?xml version="1.0" encoding="utf-8"?>${entry(
    { Title: 'Purchase Requests', Description: 'Requests waiting for approval', BaseTemplate: 100, EnableVersioning: true, EnableAttachments: true, ItemCount: 128 },
    'SP.List',
  ).replace('<entry>', `<entry ${NS}>`)}`;
  const f = (InternalName: string, Title: string, TypeAsString: string, TypeDisplayName: string, schema: string, base = false, hidden = false, ro = false) =>
    entry({ InternalName, StaticName: InternalName, Title, TypeAsString, TypeDisplayName, FromBaseType: base, Hidden: hidden, ReadOnlyField: ro, Sealed: false, SchemaXml: schema });
  const fields = [
    f('Title', 'Request', 'Text', 'Single line of text', '<Field ID="{fa564e0f-0c70-4ab9-b863-0177e6ddd247}" Type="Text" Name="Title" DisplayName="Request" Required="TRUE" SourceID="http://schemas.microsoft.com/sharepoint/v3" StaticName="Title" FromBaseType="TRUE" />', true),
    f('Department', 'Department', 'Choice', 'Choice', '<Field Type="Choice" DisplayName="Department" Format="Dropdown" ID="{6a1e2f61-1f1f-4c2b-9a61-0a1a1c1d0001}" SourceID="{0a1b2c3d-0000-4000-8000-000000000001}" StaticName="Department" Name="Department" ColName="nvarchar4" RowOrdinal="0" Version="2"><Default>Finance</Default><CHOICES><CHOICE>Finance</CHOICE><CHOICE>HR</CHOICE><CHOICE>IT</CHOICE></CHOICES></Field>'),
    f('Amount', 'Amount', 'Currency', 'Currency', '<Field Type="Currency" DisplayName="Amount" Required="TRUE" LCID="1033" ID="{6a1e2f61-1f1f-4c2b-9a61-0a1a1c1d0002}" SourceID="{0a1b2c3d-0000-4000-8000-000000000001}" StaticName="Amount" Name="Amount" ColName="float1" RowOrdinal="0" />'),
    f('DueDate', 'Due date', 'DateTime', 'Date and Time', '<Field Type="DateTime" DisplayName="Due date" Format="DateOnly" ID="{6a1e2f61-1f1f-4c2b-9a61-0a1a1c1d0003}" SourceID="{0a1b2c3d-0000-4000-8000-000000000001}" StaticName="DueDate" Name="DueDate" ColName="datetime1" RowOrdinal="0" />'),
    f('Approver', 'Approver', 'User', 'Person or Group', '<Field Type="User" DisplayName="Approver" List="UserInfo" ShowField="ImnName" UserSelectionMode="PeopleOnly" UserSelectionScope="0" ID="{6a1e2f61-1f1f-4c2b-9a61-0a1a1c1d0004}" SourceID="{0a1b2c3d-0000-4000-8000-000000000001}" StaticName="Approver" Name="Approver" ColName="int1" RowOrdinal="0" />'),
    f('Notes', 'Notes', 'Note', 'Multiple lines of text', '<Field Type="Note" DisplayName="Notes" NumLines="6" RichText="FALSE" ID="{6a1e2f61-1f1f-4c2b-9a61-0a1a1c1d0005}" SourceID="{0a1b2c3d-0000-4000-8000-000000000001}" StaticName="Notes" Name="Notes" ColName="ntext2" RowOrdinal="0" />'),
    f('TotalWithTax', 'Total with tax', 'Calculated', 'Calculated', '<Field Type="Calculated" DisplayName="Total with tax" ResultType="Currency" ReadOnly="TRUE" ID="{6a1e2f61-1f1f-4c2b-9a61-0a1a1c1d0006}" SourceID="{0a1b2c3d-0000-4000-8000-000000000001}" StaticName="TotalWithTax" Name="TotalWithTax" ColName="sql_variant1" RowOrdinal="0"><Formula>=Amount*1.18</Formula><FieldRefs><FieldRef Name="Amount" /></FieldRefs></Field>'),
    f('Project', 'Project', 'Lookup', 'Lookup', '<Field Type="Lookup" DisplayName="Project" List="{11111111-2222-3333-4444-555555555555}" ShowField="Title" ID="{6a1e2f61-1f1f-4c2b-9a61-0a1a1c1d0007}" SourceID="{0a1b2c3d-0000-4000-8000-000000000001}" StaticName="Project" Name="Project" ColName="int2" RowOrdinal="0" />'),
    f('Modified', 'Modified', 'DateTime', 'Date and Time', '<Field Type="DateTime" Name="Modified" ReadOnly="TRUE" />', true, false, true),
    f('Author', 'Created By', 'User', 'Person or Group', '<Field Type="User" Name="Author" ReadOnly="TRUE" />', true, false, true),
    f('ContentType', 'Content Type', 'Computed', 'Computed', '<Field Type="Computed" Name="ContentType" />', true),
    f('Attachments', 'Attachments', 'Attachments', 'Attachments', '<Field Type="Attachments" Name="Attachments" />', true),
  ];
  return { list, fields: `<?xml version="1.0" encoding="utf-8"?><feed ${NS}>${fields.join('')}</feed>` };
}
