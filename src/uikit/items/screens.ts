// Screens: complete screens made from the kit's components, wired together. Paste one into an empty screen.

import { merge, part, suffixed, tweak } from '../compose';
import { btn, fx, hCon, lbl, nCon, txt, vCon } from '../model';
import { reader, type KitItem } from '../types';
import { dataTable, statusPill } from './data';
import { banner, confirmDialog } from './feedback';
import { button, filterChips, searchBox } from './inputs';
import { dashboardContent } from './layouts';
import { detailsPanel, segmented, timeline, toggleSwitch } from './more';
import { appHeader, pagination, sidebar } from './navigation';

const screen = { w: fx('Parent.Width', 1000), h: fx('Parent.Height', 640) } as const;

export const screenRequests: KitItem = {
  slug: 'screen-requests',
  name: 'Requests overview',
  category: 'Screens',
  summary: 'A full list screen: search, filter chips, a New button, a table that filters as you type, and paging.',
  keywords: ['screen', 'list screen', 'overview', 'browse', 'table', 'search', 'filters', 'template'],
  canvas: { w: 1000, h: 640, bg: 'page' },
  options: [{ id: 'title', label: 'Title', type: 'text', default: 'Purchase requests' }],
  build(o) {
    const head = part(appHeader, { title: reader(o).s('title'), subtitle: 'Everything you’ve requested, newest first', back: false });
    const search = part(searchBox);
    const chips = part(filterChips, { chips: ['Waiting', 'In review', 'Approved', 'Rejected'], selected: ['Waiting'] });
    const add = part(button, { text: 'New request', width: 160 });
    const filter = 'Filter(colRequests, StartsWith(Title, txtSearch.Text) && (IsEmpty(colSelectedChips) || Status in colSelectedChips.Name))';
    const table = part(dataTable, { items: filter, selected: 0 });
    const pages = part(pagination);
    const root = vCon('vConRequestsScreen', { ...screen, fill: 'BackgroundFill', alignItems: 'Stretch' }, [
      { ...head.root, w: 'fill' },
      vCon('vConRequestsBody', { w: 'fill', h: 'fill', pad: 'Large', gap: 'Regular', alignItems: 'Stretch' }, [
        hCon('hConRequestsToolbar', { w: 'fill', h: 42, gap: 'Regular', alignItems: 'Center' }, [
          { ...search.root, w: 300 },
          { ...chips.root, w: 'fill', h: 40 },
          add.root,
        ]),
        { ...table.root, w: 'fill', h: 'fill' },
        { ...pages.root, align: 'Center' },
      ]),
    ]);
    return merge(root, [head, search, chips, add, table, pages], [
      'The table reads colRequests and filters by the search text and the selected chips. Load colRequests in the screen’s OnVisible, e.g. ClearCollect(colRequests, Requests).',
      'Picking a row sets gblSelectedItem; navigate to your details screen from the table’s OnSelect.',
    ]);
  },
};

export const screenApproval: KitItem = {
  slug: 'screen-approval',
  name: 'Approve request',
  category: 'Screens',
  summary: 'A record screen with details, history and a decision panel. Approve or reject asks for confirmation, then saves.',
  keywords: ['screen', 'approval', 'approve', 'reject', 'details', 'workflow', 'template'],
  canvas: { w: 1000, h: 640, bg: 'page' },
  options: [{ id: 'title', label: 'Title', type: 'text', default: 'REQ-1042' }],
  build(o) {
    const head = part(appHeader, { title: reader(o).s('title'), subtitle: 'New laptop for onboarding', back: true });
    const details = part(detailsPanel);
    const history = part(timeline, { items: 'Filter(colHistory, RequestID = gblSelectedItem.ID)' });
    const pill = part(statusPill, { source: 'gblSelectedItem.Status', preview: 'Waiting' });
    const confirm = part(confirmDialog, { title: 'Approve this request?', message: 'The requester gets an email, and the request moves to finance.', confirm: 'Approve', danger: false });
    let dialog = tweak(confirm.root, 'lblConfirmTitle', { text: fx('If(lclDecision = "Approved", "Approve this request?", "Reject this request?")', 'Approve this request?') });
    dialog = tweak(dialog, 'btnConfirmOk', {
      text: fx('If(lclDecision = "Approved", "Approve", "Reject")', 'Approve'),
      fill: { if: fx('lclDecision = "Approved"', true), then: 'Primary1', else: 'ErrorColor' },
      onSelect: [
        'Patch(colRequests, gblSelectedItem, { Status: lclDecision, DecisionComment: txtDecisionComment.Text });',
        'UpdateContext({ lclShowConfirm: false });',
        'Back()',
      ].join('\n'),
    });
    const decide = (decision: string) => `UpdateContext({ lclDecision: "${decision}", lclShowConfirm: true })`;
    const page = vCon('vConApprovalPage', { x: 0, y: 0, w: 'fill', h: 'fill', fill: 'BackgroundFill', alignItems: 'Stretch' }, [
      { ...head.root, w: 'fill' },
      hCon('hConApprovalBody', { w: 'fill', h: 'fill', pad: 'Large', gap: 'Large', alignItems: 'Stretch' }, [
        vCon('vConApprovalMain', { w: 'fill', h: 'fill', gap: 'Regular', alignItems: 'Stretch' }, [
          { ...details.root, w: 'fill' },
          vCon('vConApprovalHistory', { w: 'fill', h: 'fill', fill: 'Fill', radius: 'Medium', border: { color: 'BorderColor', thickness: 'Thin' }, pad: 'Regular', gap: 'Small', alignItems: 'Stretch' }, [
            lbl('lblApprovalHistory', { text: 'History', w: 'fill', h: 28, size: 'Subtitle', weight: 'Semibold', pad: 0 }),
            { ...history.root, w: 'fill', h: 'fill' },
          ]),
        ]),
        vCon('vConDecision', { w: 320, h: 330, fill: 'Fill', radius: 'Medium', border: { color: 'BorderColor', thickness: 'Thin' }, pad: 'Regular', gap: 'Small', alignItems: 'Stretch' }, [
          lbl('lblDecisionTitle', { text: 'Your decision', w: 'fill', h: 28, size: 'Subtitle', weight: 'Semibold', pad: 0 }),
          hCon('hConDecisionStatus', { w: 'fill', h: 30, gap: 'Small', alignItems: 'Center' }, [
            lbl('lblDecisionStatus', { text: 'Current status', w: 'fill', h: 'fill', size: 'Small', color: 'Primary3', pad: 0 }),
            pill.root,
          ]),
          lbl('lblDecisionComment', { text: 'Comment (optional)', w: 'fill', h: 22, size: 'Small', weight: 'Semibold', pad: 0 }),
          txt('txtDecisionComment', { w: 'fill', h: 'fill', mode: 'MultiLine', hint: 'Anything the requester should know', size: 'Small', radius: 'Small', border: { color: 'BorderColor', thickness: 'Thin' }, pad: 'Small' }),
          hCon('hConDecisionButtons', { w: 'fill', h: 40, gap: 'Small', alignItems: 'Stretch' }, [
            btn('btnDecisionReject', {
              text: 'Reject',
              w: 'fill',
              h: 'fill',
              fill: 'Fill',
              color: 'ErrorColor',
              border: { color: 'ErrorColor', thickness: 'Thin' },
              hoverFill: { status: 2 },
              radius: 'Medium',
              size: 'Small',
              onSelect: decide('Rejected'),
            }),
            btn('btnDecisionApprove', { text: 'Approve', w: 'fill', h: 'fill', fill: 'Primary1', hoverFill: { fade: 'Primary1', by: -15 }, radius: 'Medium', size: 'Small', onSelect: decide('Approved') }),
          ]),
        ]),
      ]),
    ]);
    const root = nCon('nConApprovalScreen', { ...screen }, [page, { ...dialog, w: 'fill', h: 'fill', visible: fx('lclShowConfirm', false) }]);
    return merge(root, [head, details, history, pill, confirm], [
      'The screen reads gblSelectedItem (set it in the list screen before you navigate here) and colHistory for the timeline.',
      'Approve and Reject only open the dialog; the dialog’s button saves the decision with Patch, then goes Back().',
    ]);
  },
};

export const screenHome: KitItem = {
  slug: 'screen-home',
  name: 'Home dashboard',
  category: 'Screens',
  summary: 'The sidebar app shell with a dashboard in it: header, KPI cards, a status chart and the latest requests.',
  keywords: ['screen', 'home', 'dashboard', 'sidebar', 'kpi', 'start screen', 'template'],
  canvas: { w: 1100, h: 680, bg: 'page' },
  options: [
    { id: 'app', label: 'App name', type: 'text', default: 'Requests' },
    { id: 'title', label: 'Title', type: 'text', default: 'Good morning' },
  ],
  build(o) {
    const r = reader(o);
    const side = part(sidebar, { app: r.s('app'), current: 'Home' });
    const head = part(appHeader, { title: r.s('title'), subtitle: 'Here’s where your requests stand', back: false });
    const { node, parts } = dashboardContent('Home');
    const root = hCon('hConHomeScreen', { w: fx('Parent.Width', 1100), h: fx('Parent.Height', 680), fill: 'BackgroundFill', alignItems: 'Stretch' }, [
      { ...side.root, h: 'fill' },
      vCon('vConHomeMain', { w: 'fill', h: 'fill', alignItems: 'Stretch' }, [{ ...head.root, w: 'fill' }, node]),
    ]);
    return merge(root, [side, head, ...parts], ['Make it the app’s first screen. The sidebar collapses to icons with gblNavCollapsed, and the dashboard takes the space back.']);
  },
};

export const screenSettings: KitItem = {
  slug: 'screen-settings',
  name: 'Settings',
  category: 'Screens',
  summary: 'A settings screen: notification switches, a default view, and a save button that confirms with a banner.',
  keywords: ['screen', 'settings', 'preferences', 'profile', 'toggles', 'template'],
  canvas: { w: 1000, h: 640, bg: 'page' },
  options: [{ id: 'title', label: 'Title', type: 'text', default: 'Settings' }],
  build(o) {
    const head = part(appHeader, { title: reader(o).s('title'), subtitle: 'Choose how the app works for you', back: true });
    const toggles = [
      part(toggleSwitch, { label: 'Email me when a request is approved', var: 'lclNotifyApproved', on: true }),
      part(toggleSwitch, { label: 'Email me about new comments', var: 'lclNotifyComments', on: false }),
      part(toggleSwitch, { label: 'Send me a weekly summary', var: 'lclWeeklySummary', on: true }),
    ];
    const view = part(segmented, { options: ['List', 'Cards', 'Table'], selected: 3 });
    const saved = part(banner, { tone: 'success', message: 'Your settings were saved.' });
    const card = (name: string, title: string, children: Parameters<typeof vCon>[2]) =>
      vCon(name, { w: 'fill', h: 56 + children.length * 44, fill: 'Fill', radius: 'Medium', border: { color: 'BorderColor', thickness: 'Thin' }, pad: 'Regular', gap: 'Small', alignItems: 'Stretch' }, [
        lbl(`lbl${name.replace(/^vCon/, '')}Title`, { text: title, w: 'fill', h: 28, size: 'Subtitle', weight: 'Semibold', pad: 0 }),
        ...children,
      ]);
    const root = vCon('vConSettingsScreen', { ...screen, fill: 'BackgroundFill', alignItems: 'Stretch' }, [
      { ...head.root, w: 'fill' },
      vCon('vConSettingsBody', { w: 'fill', h: 'fill', pad: 'Large', gap: 'Regular', scrollY: true, alignItems: 'Center' }, [
        { ...saved.root, w: 640, visible: fx('lclShowBanner', false) },
        vCon('vConSettingsColumn', { w: 640, h: 380, gap: 'Regular', alignItems: 'Stretch' }, [
          card('vConSettingsNotify', 'Notifications', toggles.map((t, i) => ({ ...suffixed(t.root, String(i + 1)), w: 'fill' as const }))),
          card('vConSettingsView', 'Default view', [view.root]),
          hCon('hConSettingsActions', { w: 'fill', h: 40, justify: 'End', alignItems: 'Center' }, [
            btn('btnSettingsSave', {
              text: 'Save settings',
              w: 150,
              h: 38,
              fill: 'Primary1',
              hoverFill: { fade: 'Primary1', by: -15 },
              radius: 'Medium',
              size: 'Small',
              onSelect: [
                '// Patch(colSettings, LookUp(colSettings, User = User().Email), { NotifyApproved: lclNotifyApproved, NotifyComments: lclNotifyComments, WeeklySummary: lclWeeklySummary, DefaultView: galSegments.Selected.Name });',
                'UpdateContext({ lclShowBanner: true })',
              ].join('\n'),
            }),
          ]),
        ]),
      ]),
    ]);
    return merge(root, [head, ...toggles, view, saved], ['Each switch has its own variable. Load them from your settings list in OnVisible, and save them in the button (the Patch is ready to uncomment).']);
  },
};
