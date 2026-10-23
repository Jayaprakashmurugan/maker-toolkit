// A simple model for common Teams cards, and the Adaptive Card JSON it produces.
// Version 1.4 keeps cards compatible with Power Automate's Teams actions.

export type Tone = 'default' | 'emphasis' | 'accent' | 'good' | 'attention' | 'warning';
export type InputKind = 'text' | 'multiline' | 'choice' | 'date' | 'toggle';

export interface Fact {
  label: string;
  value: string;
}
export interface CardInput {
  kind: InputKind;
  id: string;
  label: string;
  options: string;
  required: boolean;
}
export interface CardButton {
  kind: 'submit' | 'url';
  title: string;
  /** Submit: an id you can test in the flow. URL: the address to open. */
  value: string;
}

export interface CardModel {
  title: string;
  subtitle: string;
  tone: Tone;
  status: string;
  statusColor: 'default' | 'good' | 'warning' | 'attention' | 'accent';
  message: string;
  facts: Fact[];
  inputs: CardInput[];
  buttons: CardButton[];
}

const blank = (m: Partial<CardModel>): CardModel => ({
  title: '',
  subtitle: '',
  tone: 'emphasis',
  status: '',
  statusColor: 'default',
  message: '',
  facts: [],
  inputs: [],
  buttons: [],
  ...m,
});

export const TEMPLATES: Record<string, CardModel> = {
  Approval: blank({
    title: 'Purchase request',
    subtitle: 'Needs your approval',
    tone: 'accent',
    message: 'Alex Morgan has asked for approval to buy new laptops for the design team.',
    facts: [
      { label: 'Requested by', value: 'Alex Morgan' },
      { label: 'Amount', value: '$1,250.00' },
      { label: 'Needed by', value: '30 October 2026' },
    ],
    inputs: [{ kind: 'multiline', id: 'comment', label: 'Comment (optional)', options: '', required: false }],
    buttons: [
      { kind: 'submit', title: 'Approve', value: 'approve' },
      { kind: 'submit', title: 'Reject', value: 'reject' },
    ],
  }),
  Notification: blank({
    title: 'New support ticket',
    subtitle: 'Priority: High',
    tone: 'attention',
    message: 'A customer reported that invoices fail to send. The ticket has been assigned to your team.',
    facts: [
      { label: 'Ticket', value: '#4821' },
      { label: 'Customer', value: 'Contoso Ltd' },
      { label: 'Opened', value: '23 October 2026, 09:15' },
    ],
    buttons: [{ kind: 'url', title: 'Open ticket', value: 'https://contoso.sharepoint.com/sites/support' }],
  }),
  'Feedback form': blank({
    title: 'How did we do?',
    subtitle: 'Takes 20 seconds',
    tone: 'good',
    message: 'Your request has been completed. Please rate the service you received.',
    inputs: [
      { kind: 'choice', id: 'rating', label: 'Rating', options: 'Excellent, Good, Okay, Poor', required: true },
      { kind: 'multiline', id: 'feedback', label: 'Anything we could do better?', options: '', required: false },
    ],
    buttons: [{ kind: 'submit', title: 'Send feedback', value: 'submit' }],
  }),
  'Status update': blank({
    title: 'Nightly data sync',
    subtitle: 'Finance data warehouse',
    tone: 'emphasis',
    status: '● Completed with warnings',
    statusColor: 'warning',
    message: '3 records were skipped because they had no cost centre.',
    facts: [
      { label: 'Started', value: '02:00' },
      { label: 'Duration', value: '14 min' },
      { label: 'Records', value: '12,480 synced · 3 skipped' },
    ],
    buttons: [{ kind: 'url', title: 'View run history', value: 'https://make.powerautomate.com' }],
  }),
};

const idSafe = (s: string, i: number) => s.trim().replace(/[^A-Za-z0-9_]/g, '_') || `input${i + 1}`;

export function cardJson(m: CardModel): Record<string, unknown> {
  const body: Record<string, unknown>[] = [
    {
      type: 'Container',
      style: m.tone,
      bleed: true,
      items: [
        { type: 'TextBlock', text: m.title || 'Card title', weight: 'Bolder', size: 'Large', wrap: true },
        ...(m.subtitle ? [{ type: 'TextBlock', text: m.subtitle, isSubtle: true, spacing: 'None', wrap: true }] : []),
      ],
    },
  ];
  if (m.status) body.push({ type: 'TextBlock', text: m.status, color: m.statusColor, weight: 'Bolder', wrap: true });
  if (m.message) body.push({ type: 'TextBlock', text: m.message, wrap: true });
  const facts = m.facts.filter((f) => f.label || f.value);
  if (facts.length) body.push({ type: 'FactSet', facts: facts.map((f) => ({ title: f.label, value: f.value })) });

  m.inputs.forEach((inp, i) => {
    const id = idSafe(inp.id, i);
    const common = { id, label: inp.label, isRequired: inp.required, ...(inp.required ? { errorMessage: `${inp.label || 'This field'} is required` } : {}) };
    if (inp.kind === 'choice') {
      const choices = inp.options
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean)
        .map((o) => ({ title: o, value: o }));
      body.push({ type: 'Input.ChoiceSet', ...common, style: choices.length <= 4 ? 'expanded' : 'compact', choices });
    } else if (inp.kind === 'date') body.push({ type: 'Input.Date', ...common });
    else if (inp.kind === 'toggle') body.push({ type: 'Input.Toggle', id, title: inp.label || 'Yes', valueOn: 'true', valueOff: 'false' });
    else body.push({ type: 'Input.Text', ...common, isMultiline: inp.kind === 'multiline' });
  });

  const actions = m.buttons
    .filter((b) => b.title)
    .map((b, i) =>
      b.kind === 'url'
        ? { type: 'Action.OpenUrl', title: b.title, url: b.value || 'https://example.com' }
        : { type: 'Action.Submit', id: idSafe(b.value, i), title: b.title, data: { action: idSafe(b.value, i) } },
    );

  return {
    type: 'AdaptiveCard',
    $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
    version: '1.4',
    body,
    ...(actions.length ? { actions } : {}),
  };
}

export interface ResponseExpr {
  label: string;
  expression: string;
}

/** Expressions to read a reply from "Post adaptive card and wait for a response". */
export function responseExpressions(m: CardModel, actionName: string): ResponseExpr[] {
  const a = `body('${(actionName.trim() || 'Post adaptive card and wait for a response').replace(/\s+/g, '_').replace(/'/g, "''")}')`;
  const rows: ResponseExpr[] = [];
  if (m.buttons.some((b) => b.kind === 'submit')) rows.push({ label: 'Which button was pressed', expression: `${a}?['data']?['action']` });
  m.inputs.forEach((inp, i) => rows.push({ label: inp.label || `Input ${i + 1}`, expression: `${a}?['data']?['${idSafe(inp.id, i)}']` }));
  rows.push({ label: 'Who responded (email)', expression: `${a}?['responder']?['userPrincipalName']` });
  return rows;
}
