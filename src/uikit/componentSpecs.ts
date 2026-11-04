// How each UI Kit item becomes a canvas component, beyond what component.ts works out by itself:
// the events its buttons raise, what it hands back (outputs), and screen values it reads (inputs).
// CMP stands for the component inside it and for the instance (cmpX_1) on the screen.
// Layouts and screens aren't here: they're whole screens, not pieces to reuse.

import type { ComponentSpec } from './component';
import { str } from './model';
import { pascal } from './items/shared';
import { reader, type KitValues } from './types';

const pickRecord = (gallery: string, what: string) => ({
  name: 'Selected',
  type: 'Record' as const,
  value: `${gallery}.Selected`,
  description: `The ${what} last picked.`,
});

/** A gallery of records: Items comes from the screen, and picking a row raises OnSelect. */
const recordList = (gallery: string, what: string): ComponentSpec => ({
  inputs: [{ name: 'Items', type: 'Table', option: 'items', sample: gallery, description: `The records to show. The sample rows show the columns it reads.` }],
  outputs: [pickRecord(gallery, what)],
  events: [{ name: 'OnSelect', description: `A ${what} was picked. Read Selected.`, on: [[gallery]], host: 'Set(gblSelectedItem, CMP.Selected)' }],
});

export const COMPONENT_SPECS: Record<string, ComponentSpec | ((o: KitValues) => ComponentSpec)> = {
  // ── Navigation ─────────────────────────────────────────
  'app-header': { events: [{ name: 'OnSelectBack', description: 'The back arrow was pressed.', on: [['imgHeaderBack']] }] },
  sidebar: (o) => ({
    inputs: [{ name: 'Current', type: 'Text', default: str(reader(o).lines('items')[0] ?? 'Home'), description: 'The menu item to highlight when the screen opens.' }],
    outputs: [
      pickRecord('galSidebarNav', 'menu item'),
      { name: 'Collapsed', type: 'Boolean', value: 'gblNavCollapsed', description: 'True when the menu shows icons only.' },
    ],
    events: [
      {
        name: 'OnSelect',
        description: 'A menu item was picked. Read Selected.',
        on: [['galSidebarNav']],
        keep: true,
        host: '// Add a Screen column to NavItems, then: Navigate(CMP.Selected.Screen)',
      },
    ],
    onReset: 'Set(gblNavSelected, CMP.Current)',
  }),
  'top-menu': {
    outputs: [{ name: 'SelectedLink', type: 'Text', value: 'lclSelectedLink', description: 'The link last picked.' }],
    events: [
      {
        name: 'OnSelectLink',
        description: 'A link in a dropdown was picked. Read SelectedLink.',
        on: [['btnTopMenuItem']],
        host: '// Switch(CMP.SelectedLink, "New request", Navigate(scrNewRequest), "My requests", Navigate(scrMyRequests))',
      },
    ],
    set: [['btnTopMenuItem', 'OnSelect', 'Set(lclSelectedLink, ThisItem.Title);\nSet(lclOpenMenu, Blank());\nCMP.OnSelectLink()']],
  },
  tabs: {
    inputs: [{ name: 'DefaultTab', type: 'Number', default: '1', description: 'The ID of the tab that starts selected.' }],
    outputs: [pickRecord('galTabs', 'tab (ID and Name)')],
    events: [{ name: 'OnChange', description: 'Another tab was picked. Read Selected.', on: [['galTabs']] }],
    set: [['galTabs', 'Default', 'LookUp(CMP.Tabs, ID = CMP.DefaultTab)']],
    notes: ['Show a tab’s content with Visible: CMP.Selected.ID = 1 (2, 3, …) on the container for that tab.'],
  },
  breadcrumbs: (o) => {
    const crumbs = reader(o).lines('crumbs').slice(0, 5);
    const links = crumbs.slice(0, -1);
    if (!links.length) return {};
    return {
      outputs: [{ name: 'SelectedCrumb', type: 'Text', value: 'lclSelectedCrumb', description: 'The crumb last clicked.' }],
      events: [
        {
          name: 'OnSelectCrumb',
          description: 'A crumb was clicked. Read SelectedCrumb.',
          on: links.map((_, i) => [`lblCrumb${i + 1}`] as [string]),
          host: `// Switch(CMP.SelectedCrumb, ${links.map((c) => `${str(c)}, Navigate(scr${pascal(c, 'Home')})`).join(', ')})`,
        },
      ],
      set: links.map((c, i) => [`lblCrumb${i + 1}`, 'OnSelect', `Set(lclSelectedCrumb, ${str(c)});\nCMP.OnSelectCrumb()`] as [string, string, string]),
    };
  },
  stepper: (o) => ({
    inputs: [{ name: 'CurrentStep', type: 'Number', from: 'gblCurrentStep', default: String(reader(o).n('current')), description: 'The step the user is on, from 1.' }],
    screen: true,
  }),
  pagination: (o) => {
    const size = reader(o).n('size');
    return {
      inputs: [{ name: 'TotalRows', type: 'Number', default: '80', host: 'CountRows(colRequests)', description: 'How many records there are in all.' }],
      outputs: [{ name: 'Page', type: 'Number', value: 'lclPage', description: 'The page shown, from 1.' }],
      events: [{ name: 'OnChange', description: 'The page changed. Read Page.', on: [['btnPagePrevious'], ['btnPageNext']], keep: true }],
      replace: [['CountRows(colRequests)', 'CMP.TotalRows']],
      notes: [`Show one page in your gallery: FirstN(LastN(colRequests, CountRows(colRequests) - (CMP.Page - 1) * ${size}), ${size}).`],
    };
  },
  'bottom-navigation': (o) => ({
    inputs: [{ name: 'Current', type: 'Text', default: str(reader(o).lines('items')[0] ?? 'Home'), description: 'The tab to highlight when the screen opens.' }],
    outputs: [pickRecord('galBottomNav', 'tab')],
    events: [
      {
        name: 'OnSelect',
        description: 'A tab was picked. Read Selected.',
        on: [['galBottomNav']],
        keep: true,
        host: '// Add a Screen column to BottomNav, then: Navigate(CMP.Selected.Screen)',
      },
    ],
    onReset: 'Set(gblBottomNavSelected, CMP.Current)',
  }),

  // ── Inputs ─────────────────────────────────────────────
  button: {
    names: { text: ['Text', 'The button text.'] },
    inputs: [
      {
        name: 'Busy',
        type: 'Boolean',
        from: 'lclSaving',
        default: 'false',
        description: 'True while the action runs: the button shows as disabled so it can’t be pressed twice.',
      },
    ],
    events: [{ name: 'OnSelect', description: 'The button was pressed.', on: [['btnAction']] }],
  },
  'text-field': (o) => ({
    inputs: [
      {
        name: 'ShowErrors',
        type: 'Boolean',
        from: 'lclShowErrors',
        default: 'false',
        description: 'True once the user tried to save. The error shows only then, and only when the field is empty.',
      },
      { name: 'Default', type: 'Text', default: '""', description: 'The text the field starts with.' },
    ],
    outputs: [
      { name: 'Text', type: 'Text', value: 'txtField.Text', description: 'What the user typed.' },
      { name: 'IsValid', type: 'Boolean', value: reader(o).b('required') ? '!IsBlank(txtField.Text)' : 'true', description: 'False while a required field is empty.' },
    ],
    events: [{ name: 'OnChange', description: 'The text changed.', on: [['txtField', 'OnChange']] }],
    set: [['txtField', 'Default', 'CMP.Default']],
  }),
  'search-box': {
    outputs: [{ name: 'SearchText', type: 'Text', value: 'txtSearch.Text', description: 'What the user typed, once they stop typing.' }],
    events: [{ name: 'OnChange', description: 'The search text changed.', on: [['txtSearch', 'OnChange']] }],
    notes: ['Filter a gallery with it: Filter(colRequests, StartsWith(Title, CMP.SearchText)).'],
  },
  'filter-chips': {
    outputs: [{ name: 'SelectedItems', type: 'Table', value: 'colSelectedChips', description: 'The chips that are on (Name).' }],
    events: [{ name: 'OnChange', description: 'A chip was turned on or off. Read SelectedItems.', on: [['btnChip']], keep: true }],
    onReset: 'Clear(colSelectedChips)',
    notes: ['Filter a gallery with the selection: Filter(colRequests, IsEmpty(CMP.SelectedItems) || Status in CMP.SelectedItems.Name). Reset(CMP) turns every chip off.'],
  },
  'toggle-switch': (o) => {
    const r = reader(o);
    const v = /^[A-Za-z_]\w*$/.test(r.s('var')) ? r.s('var') : 'lclNotifyOn';
    return {
      fixed: ['var'],
      inputs: [{ name: 'Default', type: 'Boolean', default: String(r.b('on')), description: 'Whether it starts on.' }],
      outputs: [{ name: 'Value', type: 'Boolean', value: v, description: 'True when the switch is on.' }],
      events: [{ name: 'OnChange', description: 'The switch was flipped. Read Value.', on: [['btnToggle']], keep: true }],
      onReset: `Set(${v}, CMP.Default)`,
    };
  },
  'segmented-control': {
    outputs: [pickRecord('galSegments', 'option (Name)')],
    events: [{ name: 'OnChange', description: 'Another option was picked. Read Selected.', on: [['galSegments']] }],
    notes: ['Switch views with it: Visible: CMP.Selected.Name = "Board".'],
  },
  calendar: {
    outputs: [{ name: 'SelectedDate', type: 'DateAndTime', value: 'lclSelectedDate', description: 'The day the user picked.' }],
    events: [{ name: 'OnSelectDate', description: 'A day was picked. Read SelectedDate.', on: [['btnCalendarDay']], keep: true }],
  },
  'date-picker': {
    outputs: [{ name: 'SelectedDate', type: 'DateAndTime', value: 'lclSelectedDate', description: 'The chosen date, blank until one is picked.' }],
    events: [{ name: 'OnChange', description: 'A date was picked. Read SelectedDate.', on: [['btnCalendarDay']], keep: true }],
    notes: ['The instance grows when the calendar opens (Height: Self.cmpHeight). Put it above the controls under it in the tree view.'],
  },
  'file-upload': {
    outputs: [{ name: 'Files', type: 'Table', value: 'colFiles', description: 'The files added, each with Name and Value.' }],
    events: [{ name: 'OnChange', description: 'A file was added or removed. Read Files.', on: [['attFileDrop', 'OnAddFile'], ['imgFileRemove']], keep: true }],
    notes: ['Send CMP.Files to a flow, or Patch them into a SharePoint item: { Attachments: CMP.Files }.'],
  },
  'photo-upload': {
    outputs: [{ name: 'Photos', type: 'Table', value: 'colPhotos', description: 'The photos added, each with Id and Image.' }],
    events: [{ name: 'OnChange', description: 'A photo was added or removed. Read Photos.', on: [['btnAddPhoto', 'OnChange'], ['imgPhotoRemove']], keep: true }],
  },
  'floating-action-button': { name: 'cmpFab', events: [{ name: 'OnSelect', description: 'The button was pressed.', on: [['btnFab']] }] },

  // ── Feedback ───────────────────────────────────────────
  'confirm-dialog': {
    events: [
      { name: 'OnCancel', description: 'Cancel was pressed.', on: [['btnConfirmCancel']] },
      { name: 'OnConfirm', description: 'The confirm button was pressed.', on: [['btnConfirmOk']] },
    ],
    screen: true,
    notes: ['The screen opens and closes it: its Visible is lclShowConfirm, and the two events set it back to false.'],
  },
  'email-dialog': {
    names: { subject: ['DefaultSubject', 'The subject the email starts with.'], title: ['Title', 'The dialog title.'] },
    inputs: [
      {
        name: 'DefaultTo',
        type: 'Text',
        default: '"anna.weber@contoso.com"',
        host: '"anna.weber@contoso.com"',
        description: "Who it goes to when it opens, e.g. gblSelectedItem.'Created By'.Email.",
      },
    ],
    outputs: [
      { name: 'To', type: 'Text', value: 'txtEmailTo.Text', description: 'The To addresses, separated by semicolons.' },
      { name: 'Cc', type: 'Text', value: 'txtEmailCc.Text', description: 'The Cc addresses.' },
      { name: 'Subject', type: 'Text', value: 'txtEmailSubject.Text', description: 'The subject.' },
      { name: 'Body', type: 'Text', value: 'txtEmailBody.Text', description: 'The message as typed.' },
    ],
    events: [
      { name: 'OnCancel', description: 'The dialog was closed without sending.', on: [['imgEmailClose'], ['btnEmailCancel']] },
      {
        name: 'OnSend',
        description: 'Send was pressed. Send the email from here: the connector stays in the app, not in the component.',
        on: [['btnEmailSend']],
        host: [
          'Office365Outlook.SendEmailV2(',
          '    CMP.To,',
          '    CMP.Subject,',
          '    Substitute(CMP.Body, Char(10), "<br>"),',
          '    { Cc: CMP.Cc }',
          ');',
          'Notify("Email sent.", NotificationType.Success);',
          'UpdateContext({ lclShowEmail: false })',
        ].join('\n'),
      },
    ],
    set: [['txtEmailTo', 'Default', 'CMP.DefaultTo']],
    onReset: 'Reset(txtEmailTo);\nReset(txtEmailCc);\nReset(txtEmailSubject);\nReset(txtEmailBody)',
    screen: true,
    notes: [
      'Components can’t hold a connector, so OnSend on the instance does the sending. Add the Office 365 Outlook connector to the app first.',
      'Reset(CMP) clears the fields, so call it before you open the dialog again.',
    ],
  },
  'notification-banner': { events: [{ name: 'OnClose', description: 'The close button was pressed.', on: [['imgBannerClose']] }] },
  'notification-badge': (o) => ({
    inputs: [{ name: 'Count', type: 'Number', option: 'count', default: String(reader(o).n('preview')), description: 'How many unread notifications there are.' }],
    events: [{ name: 'OnSelect', description: 'The bell was pressed.', on: [['imgBadgeBell']] }],
  }),
  'loading-overlay': {},
  'empty-state': { events: [{ name: 'OnSelectAction', description: 'The button was pressed.', on: [['btnEmptyAction']] }] },
  'progress-bar': (o) => ({
    inputs: [{ name: 'Value', type: 'Number', option: 'value', default: String(reader(o).n('preview') / 100), description: 'How far along, from 0 to 1.' }],
  }),
  'side-drawer': {
    events: [
      { name: 'OnClose', description: 'The backdrop, the close icon or Cancel was pressed.', on: [['btnDrawerBackdrop'], ['imgDrawerClose'], ['btnDrawerCancel']] },
      { name: 'OnApply', description: 'The main button was pressed.', on: [['btnDrawerApply']] },
    ],
    screen: true,
    notes: ['Put your filter fields inside vConDrawerBody in the component, and hand their values out through output properties.'],
  },

  // ── Data display ───────────────────────────────────────
  'status-pill': (o) => ({
    inputs: [{ name: 'Status', type: 'Text', option: 'source', default: str(reader(o).s('preview')), description: 'The status to show. Each status has its own color.' }],
  }),
  'kpi-card': (o) => ({
    inputs: [{ name: 'Value', type: 'Text', option: 'value', default: str(reader(o).s('preview')), description: 'The number to show. A number or text both work.' }],
  }),
  'list-row': recordList('galRequests', 'record'),
  'data-table': (o) => {
    const r = reader(o);
    const spec = recordList('galTableRows', 'row');
    if (r.b('selectable')) {
      spec.outputs!.push({ name: 'SelectedRows', type: 'Table', value: 'colSelectedRows', description: 'The checked rows.' });
      spec.events!.push({
        name: 'OnDeleteSelected',
        description: 'Delete selected was pressed. Read SelectedRows.',
        on: [['btnTableBulkDelete']],
        host: '// Remove(colRequests, CMP.SelectedRows);\nReset(CMP)',
      });
    }
    if (r.b('actions')) {
      spec.outputs!.push({ name: 'ActionItem', type: 'Record', value: 'lclActionItem', description: 'The row whose edit or delete icon was pressed.' });
      spec.events!.push(
        {
          name: 'OnEdit',
          description: 'A row’s edit icon was pressed. Read ActionItem.',
          on: [['imgRowEdit']],
          host: 'Set(gblSelectedItem, CMP.ActionItem);\n// Navigate(scrEditRequest)',
        },
        {
          name: 'OnDelete',
          description: 'A row’s delete icon was pressed. Read ActionItem.',
          on: [['imgRowDelete']],
          host: 'Set(gblSelectedItem, CMP.ActionItem);\nUpdateContext({ lclShowConfirm: true })',
        },
      );
      spec.set = [
        ['imgRowEdit', 'OnSelect', 'Set(lclActionItem, ThisItem);\nCMP.OnEdit()'],
        ['imgRowDelete', 'OnSelect', 'Set(lclActionItem, ThisItem);\nCMP.OnDelete()'],
      ];
    }
    return spec;
  },
  'card-grid': recordList('galCards', 'card'),
  accordion: {},
  'activity-timeline': {
    inputs: [{ name: 'Items', type: 'Table', option: 'items', sample: 'galTimeline', description: 'The events, newest first, with Title, Who, When and Kind.' }],
  },
  'details-panel': (o) => {
    const rows = reader(o)
      .lines('rows')
      .map((l) => l.split('|').map((p) => p.trim()))
      .filter((p) => p[0] && p[1])
      .slice(0, 10);
    const taken = new Set<string>();
    const named = rows.map(([label, formula, preview = ''], i) => {
      let name = pascal(label, `Value${i + 1}`);
      if (taken.has(name)) name += i + 1;
      taken.add(name);
      return { name, formula, preview, i };
    });
    return {
      inputs: named.map((n) => ({
        name: n.name,
        type: 'Text' as const,
        default: str(n.preview),
        host: n.formula,
        description: `The value shown next to ${rows[n.i][0]}.`,
      })),
      set: named.map((n) => [`lblDetailValue${n.i + 1}`, 'Text', `CMP.${n.name}`] as [string, string, string]),
    };
  },
  'bar-chart': { inputs: [{ name: 'Items', type: 'Table', option: 'items', defaultFrom: 'fxChartData', description: 'The bars: rows with Label and Value.' }] },
  'line-chart': { inputs: [{ name: 'Items', type: 'Table', option: 'items', defaultFrom: 'fxTrend', description: 'The points, in order: rows with Label and Amount.' }] },
  'pie-chart': {
    inputs: [{ name: 'Items', type: 'Table', option: 'items', defaultFrom: 'fxSlices', description: 'The slices: rows with Label and Amount.' }],
    internal: ['fxChartPalette'],
  },
  'progress-ring': (o) => ({
    inputs: [{ name: 'Value', type: 'Number', option: 'value', default: String(reader(o).n('preview') / 100), description: 'How far along, from 0 to 1.' }],
  }),
  'activity-heatmap': {
    inputs: [{ name: 'Items', type: 'Table', option: 'items', sample: 'galHeatmap', description: '35 days, Monday first, each with a Count.' }],
    screen: true,
  },
};
