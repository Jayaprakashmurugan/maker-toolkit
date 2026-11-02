// The Naming Checker: reads canvas app YAML (from Copy code or a .pa.yaml file), checks every control and
// variable name against our conventions, suggests better names, and rewrites the YAML with them.
// Everything runs in the browser.

import { parse } from 'yaml';

export interface Rule {
  prefix: string;
  what: string;
}

/** Control type → prefix. Matched on the type without its version, e.g. "Classic/Button". */
const CONTROL_RULES: [RegExp, Rule][] = [
  [/^(Classic\/)?Label$|^Text$|^ModernText$/, { prefix: 'lbl', what: 'Label' }],
  [/^(Classic\/)?Button$|^ModernButton$/, { prefix: 'btn', what: 'Button' }],
  [/^(Classic\/)?TextInput$|^ModernTextInput$/, { prefix: 'txt', what: 'Text input' }],
  [/^(Classic\/)?DropDown$|^ModernDropdown$/, { prefix: 'drp', what: 'Drop down' }],
  [/^(Classic\/)?ComboBox$|^ModernCombobox$/, { prefix: 'cmb', what: 'Combo box' }],
  [/^(Classic\/)?DatePicker$|^ModernDatePicker$/, { prefix: 'dte', what: 'Date picker' }],
  [/^(Classic\/)?CheckBox$|^Checkbox$|^ModernCheckbox$/, { prefix: 'chk', what: 'Check box' }],
  [/^(Classic\/)?Toggle$|^ModernToggle$/, { prefix: 'tgl', what: 'Toggle' }],
  [/^(Classic\/)?Radio$|^ModernRadio$/, { prefix: 'rdo', what: 'Radio' }],
  [/^(Classic\/)?Slider$|^ModernSlider$/, { prefix: 'sld', what: 'Slider' }],
  [/^(Classic\/)?Rating$/, { prefix: 'rtg', what: 'Rating' }],
  [/^(Classic\/)?Icon$/, { prefix: 'ico', what: 'Icon' }],
  [/^Image$|^ModernImage$/, { prefix: 'img', what: 'Image' }],
  [/^(Rectangle|Circle|Triangle|Pentagon|Hexagon|Octagon|Star|Arrow\w*|Chevron\w*|Line\w*|Parallelogram|Trapezoid|Diamond)$/, { prefix: 'shp', what: 'Shape' }],
  [/^Gallery$/, { prefix: 'gal', what: 'Gallery' }],
  [/^Form$/, { prefix: 'frm', what: 'Form' }],
  [/^TypedDataCard$|^DataCard$/, { prefix: 'crd', what: 'Data card' }],
  [/^HtmlViewer$/, { prefix: 'html', what: 'HTML text' }],
  [/^Timer$/, { prefix: 'tmr', what: 'Timer' }],
  [/^(Classic\/)?PenInput$/, { prefix: 'pen', what: 'Pen input' }],
  [/^Attachments$/, { prefix: 'att', what: 'Attachments' }],
  [/^DataTable$|^ModernTable$/, { prefix: 'tbl', what: 'Data table' }],
  [/^Spinner$|^ModernSpinner$/, { prefix: 'spn', what: 'Spinner' }],
  [/^(Classic\/)?Video$|^Audio$/, { prefix: 'med', what: 'Media' }],
  [/^AddMedia$/, { prefix: 'btn', what: 'Add picture' }],
  [/^CanvasComponent$|^Component$/, { prefix: 'cmp', what: 'Component' }],
  [/^CodeComponent$/, { prefix: 'pcf', what: 'Code component' }],
];

export interface ControlReport {
  name: string;
  type: string;
  rule?: Rule;
  ok: boolean;
  suggestion: string;
  why?: string;
}

export interface VariableReport {
  name: string;
  kind: 'global' | 'local' | 'collection';
  prefix: 'gbl' | 'lcl' | 'col';
  ok: boolean;
  suggestion: string;
}

export interface Report {
  error?: string;
  controls: ControlReport[];
  variables: VariableReport[];
}

const STRING = /("(?:[^"]|"")*")/;

/** Runs `fn` on the parts of a formula outside "string literals". */
const outsideStrings = (formula: string, fn: (code: string) => string) =>
  formula
    .split(STRING)
    .map((part, i) => (i % 2 === 1 ? part : fn(part)))
    .join('');

function ruleFor(control: string, variant: string | undefined, props: Record<string, unknown>): Rule | undefined {
  const type = control.replace(/@[\d.]+$/, '');
  if (type === 'GroupContainer') {
    if (variant === 'AutoLayout' || String(props.LayoutMode ?? '').includes('Auto')) {
      const dir = String(props.LayoutDirection ?? '');
      return dir.includes('Vertical') ? { prefix: 'vCon', what: 'Vertical container' } : { prefix: 'hCon', what: 'Horizontal container' };
    }
    return { prefix: 'nCon', what: 'Container' };
  }
  return CONTROL_RULES.find(([re]) => re.test(type))?.[1];
}

const pascal = (s: string) =>
  s
    .normalize('NFKD')
    .replace(/[^A-Za-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join('')
    .slice(0, 28);

/** Words Studio puts in default names, which say nothing once the prefix is there. */
const GENERIC = /^(Label|Button|Text\s?Input|TextBox|Dropdown|DropDown|ComboBox|Combobox|DatePicker|Checkbox|CheckBox|Toggle|Radio|Slider|Rating|Icon|Image|Rectangle|Circle|Gallery|Form|DataCard(Value|Key)?|Card|HtmlText|HtmlViewer|Html|Timer|Container|GroupContainer|Group|Attachments?|Spinner|Shape|Component|Screen|Vertical|Horizontal)/i;

function suggest(name: string, rule: Rule, props: Record<string, unknown>): string {
  let rest: string;
  if (GENERIC.test(name)) {
    // Studio's default name ("Label3", "Gallery1"): the type word says nothing once the prefix is there.
    rest = name.replace(GENERIC, '');
    // A label's or button's own text is usually the best name; a gallery is named after its data.
    const text = String(props.Text ?? '').match(/^="([^"]{2,40})"$/)?.[1];
    const items = String(props.Items ?? '').match(/^=([A-Za-z_]\w*)$/)?.[1];
    if ((rule.prefix === 'lbl' || rule.prefix === 'btn') && /^\d*$/.test(rest) && text) rest = text;
    else if (rule.prefix === 'gal' && /^\d*$/.test(rest) && items) rest = items.replace(VAR_PREFIX, '');
  } else if (name.toLowerCase().startsWith(rule.prefix.toLowerCase())) {
    // The right prefix in the wrong case ("lbltitle", "VconMain").
    rest = name.slice(rule.prefix.length);
  } else {
    // Drop a different control prefix the name may already have ("lblSave" on a button).
    rest = name.replace(/^(lbl|btn|txt|drp|cmb|dte|chk|tgl|rdo|ico|img|shp|gal|frm|crd|tmr|con|vcon|hcon|ncon|ctn|grp|cnt)(?=[A-Z0-9_])/i, '');
  }
  const body = pascal(rest.replace(/^[_\s]+/, ''));
  return rule.prefix + (body || '1');
}

const prefixOk = (name: string, prefix: string) => new RegExp(`^${prefix}[A-Z0-9]`).test(name);

/** Every control in a parsed YAML document, from Copy code (a list) or a .pa.yaml file (Screens, ComponentDefinitions). */
function collect(doc: unknown) {
  const out: { name: string; control: string; variant?: string; props: Record<string, unknown> }[] = [];
  const walkList = (seq: unknown) => {
    if (!Array.isArray(seq)) return;
    for (const item of seq) {
      if (!item || typeof item !== 'object') continue;
      for (const [name, ctl] of Object.entries(item as Record<string, unknown>)) {
        if (!ctl || typeof ctl !== 'object') continue;
        const c = ctl as { Control?: string; Variant?: string; Properties?: Record<string, unknown>; Children?: unknown };
        if (typeof c.Control === 'string') out.push({ name, control: c.Control, variant: c.Variant, props: c.Properties ?? {} });
        walkList(c.Children);
      }
    }
  };
  if (Array.isArray(doc)) walkList(doc);
  else if (doc && typeof doc === 'object') {
    const d = doc as Record<string, Record<string, { Children?: unknown }>>;
    for (const group of ['Screens', 'ComponentDefinitions'] as const) for (const screen of Object.values(d[group] ?? {})) walkList(screen?.Children);
  }
  return out;
}

/** All formula text in a document, for finding variables. */
function formulas(doc: unknown, out: string[] = []): string[] {
  if (typeof doc === 'string') {
    if (doc.startsWith('=')) out.push(doc.slice(1));
  } else if (Array.isArray(doc)) doc.forEach((d) => formulas(d, out));
  else if (doc && typeof doc === 'object') Object.values(doc).forEach((d) => formulas(d, out));
  return out;
}

const VAR_PREFIX = /^(gbl|lcl|col|var|gv|lv|loc|ctx|context|glb|global|local|coll|cl|tbl|v|g|l|c)(?=[A-Z0-9_])/;

function variableSuggestion(name: string, prefix: 'gbl' | 'lcl' | 'col') {
  const rest = name.replace(VAR_PREFIX, '').replace(/^_+/, '');
  return prefix + (pascal(rest) || 'Value');
}

export function analyze(text: string): Report {
  if (!text.trim()) return { controls: [], variables: [] };
  let doc: unknown;
  try {
    doc = parse(text);
  } catch (e) {
    return { error: (e as Error).message.split('\n')[0], controls: [], variables: [] };
  }
  const controls: ControlReport[] = [];
  const taken = new Set<string>();
  const all = collect(doc);
  all.forEach((c) => taken.add(c.name));
  for (const c of all) {
    const rule = ruleFor(c.control, c.variant, c.props);
    const type = c.control.replace(/@[\d.]+$/, '') + (c.variant ? ` (${c.variant})` : '');
    if (!rule) {
      controls.push({ name: c.name, type, ok: true, suggestion: c.name, why: 'No rule for this control type' });
      continue;
    }
    if (prefixOk(c.name, rule.prefix)) {
      controls.push({ name: c.name, type, rule, ok: true, suggestion: c.name });
      continue;
    }
    let s = suggest(c.name, rule, c.props);
    for (let i = 2; taken.has(s); i++) s = suggest(c.name, rule, c.props) + i;
    taken.add(s);
    const wrongCase = !GENERIC.test(c.name) && c.name.toLowerCase().startsWith(rule.prefix.toLowerCase());
    controls.push({ name: c.name, type, rule, ok: false, suggestion: s, why: wrongCase ? `Starts with ${rule.prefix}, but needs a capital letter after it` : `${rule.what} names start with ${rule.prefix}` });
  }

  const code = formulas(doc).map((f) => outsideStrings(f, (x) => x)).join('\n');
  const found = new Map<string, VariableReport>();
  const add = (name: string, kind: VariableReport['kind'], prefix: VariableReport['prefix']) => {
    if (found.has(name)) return;
    found.set(name, { name, kind, prefix, ok: prefixOk(name, prefix), suggestion: prefixOk(name, prefix) ? name : variableSuggestion(name, prefix) });
  };
  for (const m of code.matchAll(/\bSet\(\s*([A-Za-z_]\w*)\s*,/g)) add(m[1], 'global', 'gbl');
  for (const m of code.matchAll(/\bUpdateContext\(\s*\{([^{}]*)\}/g)) for (const k of m[1].matchAll(/(?:^|,)\s*([A-Za-z_]\w*)\s*:/g)) add(k[1], 'local', 'lcl');
  for (const m of code.matchAll(/\bClearCollect\(\s*([A-Za-z_]\w*)\s*,/g)) add(m[1], 'collection', 'col');
  return { controls, variables: [...found.values()] };
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * The YAML with names replaced: the control's own "- Name:" line and every whole-word use in formulas,
 * outside string literals. The rest of the text is left exactly as it was.
 */
export function applyRenames(text: string, renames: Map<string, string>): string {
  const pairs = [...renames].filter(([a, b]) => a !== b && b);
  if (!pairs.length) return text;
  const byName = new Map(pairs);
  const re = new RegExp(`(?<![\\w.'])(${pairs.map(([a]) => escape(a)).sort((a, b) => b.length - a.length).join('|')})(?![\\w'])`, 'g');
  const fix = (formula: string) => outsideStrings(formula, (part) => part.replace(re, (m) => byName.get(m) ?? m));
  let block = -1;
  return text
    .split('\n')
    .map((line) => {
      const indent = line.length - line.trimStart().length;
      if (block >= 0 && (line.trim() === '' || indent > block)) return fix(line);
      block = -1;
      const item = line.match(/^(\s*- )([A-Za-z_][\w]*)(:\s*)$/);
      if (item) return item[1] + (byName.get(item[2]) ?? item[2]) + item[3];
      const prop = line.match(/^(\s*[A-Za-z][\w.]*: )(.*)$/);
      if (prop) {
        if (/^[|>][-+]?\s*$/.test(prop[2])) {
          block = indent;
          return line;
        }
        if (prop[2].startsWith('=')) return prop[1] + fix(prop[2]);
        if (/^"=/.test(prop[2])) return prop[1] + fix(prop[2]);
      }
      // Screen and component names as keys (Screens: / ComponentDefinitions:).
      const key = line.match(/^(\s*)([A-Za-z_]\w*)(:\s*)$/);
      if (key && byName.has(key[2])) return key[1] + byName.get(key[2]) + key[3];
      return line;
    })
    .join('\n');
}

/** An example with typical default names, for trying the tool. */
export const SAMPLE = `- Container1:
    Control: GroupContainer@1.5.0
    Variant: AutoLayout
    Properties:
      LayoutDirection: =LayoutDirection.Vertical
      Height: =400
      Width: =360
    Children:
      - Label1:
          Control: Label@2.5.1
          Properties:
            Text: ="Request title"
      - TextInput1:
          Control: Classic/TextInput@2.3.2
          Properties:
            HintText: ="Give it a short title"
      - ErrorMessage:
          Control: Label@2.5.1
          Properties:
            Text: ="Please enter a title"
            Visible: =varShowErrors && IsBlank(TextInput1.Text)
      - Button1:
          Control: Classic/Button@2.2.0
          Properties:
            Text: ="Save request"
            OnSelect: |-
              =If(
                  IsBlank(TextInput1.Text),
                  Set(varShowErrors, true),
                  Patch(Requests, Defaults(Requests), { Title: TextInput1.Text });
                  UpdateContext({ ShowSaved: true });
                  ClearCollect(Items, Requests)
              )
      - Gallery1:
          Control: Gallery@2.15.0
          Variant: Vertical
          Properties:
            Items: =Items
          Children:
            - Title1:
                Control: Label@2.5.1
                Properties:
                  Text: =ThisItem.Title
`;
