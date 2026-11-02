// Data display: status pills, KPI cards, lists and tables.

import { btn, fx, gal, hCon, lbl, rect, vCon, type Color, type Row, type Text } from '../model';
import { reader, type KitItem } from '../types';
import { icon, STATUSES, statusPairs } from './shared';

const statusLines = STATUSES.map(([n, i]) => `${n}=${i}`);

/** Status fill and text colors for a status value, from the design system's status slots. */
function statusColors(source: string, pairs: [string, number][], pick?: string): { fill: Color; color: Color } {
  return {
    fill: { switch: source, cases: pairs.map(([n, i]) => [n, { status: i as 1 }]), else: { status: 1 }, pick },
    color: { switch: source, cases: pairs.map(([n, i]) => [n, { statusFont: i as 1 }]), else: { statusFont: 1 }, pick },
  };
}

/** A clear button over a gallery row, so clicks anywhere in the row select it. */
export const rowOverlay = (name: string) =>
  btn(name, { x: 0, y: 0, w: 'fill', h: 'fill', text: '', fill: 'Transparent', color: 'Transparent', hoverFill: { rgba: [0, 0, 0, 0.03] }, pressedFill: 'Transparent', onSelect: 'Select(Parent)' });

function pill(name: string, source: string, text: Text, pairs: [string, number][], pick: string, w: number | 'fill' = 110) {
  const c = statusColors(source, pairs, pick);
  return hCon(`hCon${name}`, { w, h: 26, radius: 13, fill: c.fill, justify: 'Center', alignItems: 'Center', pad: { x: 'Small' } }, [
    lbl(`lbl${name}`, { text, w: 'fill', h: 'fill', size: 'Tiny', weight: 'Semibold', color: c.color, textAlign: 'Center', pad: 0, wrap: false }),
  ]);
}

export const statusPill: KitItem = {
  slug: 'status-pill',
  name: 'Status pill',
  category: 'Data display',
  summary: 'A colored pill for a record’s status. Each status maps to one of the design system’s seven status colors.',
  keywords: ['status', 'pill', 'badge', 'tag', 'chip', 'state'],
  canvas: { w: 360, h: 110 },
  options: [
    { id: 'source', label: 'Status value (formula)', type: 'text', default: 'ThisItem.Status' },
    { id: 'statuses', label: 'Statuses: name=slot (1 to 7)', type: 'lines', default: statusLines, hint: '1 neutral, 2 rejected, 3 waiting, 4 draft, 5 approved, 6 in review, 7 cancelled' },
    { id: 'preview', label: 'Status in the preview', type: 'text', default: 'Approved' },
  ],
  build(o) {
    const r = reader(o);
    const pairs = statusPairs(r.lines('statuses'));
    const source = r.s('source') || 'ThisItem.Status';
    return {
      root: pill('StatusPill', source, { fx: source, v: r.s('preview') }, pairs, r.s('preview')),
      notes: [
        'Paste it into a gallery row; it reads ThisItem.Status. For a SharePoint choice column use ThisItem.Status.Value instead.',
        'The colors live in fxConfig (StatusColors and StatusFontColors), so every pill in the app changes together.',
      ],
    };
  },
};

export const kpiCard: KitItem = {
  slug: 'kpi-card',
  name: 'KPI card',
  category: 'Data display',
  summary: 'A number that matters, with a caption, an icon and the change since last period.',
  keywords: ['kpi', 'metric', 'stat', 'card', 'dashboard', 'number', 'tile'],
  canvas: { w: 320, h: 180 },
  options: [
    { id: 'caption', label: 'Caption', type: 'text', default: 'Open requests' },
    { id: 'value', label: 'Value formula', type: 'text', default: 'CountRows(Filter(colRequests, Status <> "Approved"))' },
    { id: 'preview', label: 'Value in the preview', type: 'text', default: '128' },
    { id: 'delta', label: 'Change text', type: 'text', default: '+12% vs last month' },
    { id: 'up', label: 'Change is good', type: 'toggle', default: true },
  ],
  build(o) {
    const r = reader(o);
    const good = r.b('up');
    return {
      root: vCon(
        'vConKpi',
        { w: 260, h: 132, fill: 'Fill', border: { color: 'BorderColor', thickness: 'Thin' }, radius: 'Medium', pad: 'Regular', gap: 'Tiny', alignItems: 'Stretch' },
        [
          hCon('hConKpiTop', { w: 'fill', h: 28, gap: 'Small', alignItems: 'Center' }, [
            lbl('lblKpiCaption', { text: r.s('caption'), w: 'fill', h: 'fill', size: 'Small', color: 'Primary3', pad: 0, wrap: false }),
            icon('imgKpiIcon', 'chart', 'Primary1', { w: 28, h: 28, pad: 5, fill: 'Primary2', radius: 'Small' }),
          ]),
          lbl('lblKpiValue', { text: { fx: `Text(${r.s('value') || '0'})`, v: r.s('preview') }, w: 'fill', h: 44, size: 'Headline', weight: 'Bold', pad: 0 }),
          lbl('lblKpiDelta', { text: r.s('delta'), w: 'fill', h: 20, size: 'Tiny', weight: 'Semibold', color: good ? 'SuccessColor' : 'ErrorColor', pad: 0, wrap: false }),
        ],
      ),
      notes: ['Put several in an hCon with LayoutGap for a dashboard row. Give each card FillPortions 1 so they share the width.'],
    };
  },
};

const PEOPLE = [
  { Title: 'New laptop for onboarding', Subtitle: 'Anna Weber · 3 Nov', Status: 'Waiting', Initials: 'AW' },
  { Title: 'Conference tickets', Subtitle: 'Ravi Kumar · 2 Nov', Status: 'Approved', Initials: 'RK' },
  { Title: 'Office chairs (4)', Subtitle: 'Lea Martin · 31 Oct', Status: 'In review', Initials: 'LM' },
  { Title: 'Software licence renewal', Subtitle: 'Tom Fischer · 29 Oct', Status: 'Rejected', Initials: 'TF' },
];

export const listRow: KitItem = {
  slug: 'list-row',
  name: 'List with status',
  category: 'Data display',
  summary: 'A vertical gallery of records: initials, title, subtitle, a status pill and a chevron, with a selected state.',
  keywords: ['list', 'gallery', 'rows', 'avatar', 'records', 'master'],
  canvas: { w: 520, h: 330, bg: 'page' },
  options: [
    { id: 'items', label: 'Items', type: 'text', default: 'colRequests' },
    { id: 'selected', label: 'Selected row in the preview', type: 'number', default: 2, min: 0, max: 4 },
  ],
  build(o) {
    const r = reader(o);
    const pairs = STATUSES as [string, number][];
    return {
      root: gal('galRequests', {
        dir: 'Vertical',
        w: 460,
        h: 288,
        items: r.s('items') || 'colRequests',
        fill: 'Fill',
        sample: PEOPLE,
        selectedIndex: r.n('selected') - 1,
        templateSize: 72,
        scrollbar: false,
        template: (row: Row) => [
          hCon(
            'hConRequestRow',
            { x: 0, y: 0, w: 'fill', h: 'fill', pad: { x: 'Regular' }, gap: 'Small', alignItems: 'Center', fill: { if: row.selected, then: 'Primary2', else: 'Transparent' } },
            [
              hCon('hConRequestAvatar', { w: 40, h: 40, radius: 20, fill: 'Accent1', justify: 'Center', alignItems: 'Center' }, [
                lbl('lblRequestInitials', { text: row.f('Initials'), w: 'fill', h: 'fill', size: 'Small', weight: 'Semibold', color: 'Primary1', textAlign: 'Center', pad: 0 }),
              ]),
              vCon('vConRequestText', { w: 'fill', h: 'fill', justify: 'Center', alignItems: 'Stretch' }, [
                lbl('lblRequestTitle', { text: row.f('Title'), w: 'fill', h: 22, size: 'Small', weight: 'Semibold', pad: 0, wrap: false }),
                lbl('lblRequestSubtitle', { text: row.f('Subtitle'), w: 'fill', h: 18, size: 'Tiny', color: 'Primary3', pad: 0, wrap: false }),
              ]),
              pill('RequestStatus', 'ThisItem.Status', row.f('Status'), pairs, String(row.sample.Status), 96),
              icon('imgRequestChevron', 'chevronRight', 'IconFill', { w: 18, h: 18 }),
            ],
          ),
          rect('shpRequestDivider', { x: fx('fxTextConfigs.Padding.Regular', 16), y: fx('Parent.TemplateHeight - 1', 71), w: fx('Parent.TemplateWidth - 32', 428), h: 1, fill: 'BorderColor' }),
          rowOverlay('btnRequestOverlay'),
        ],
        extra: { OnSelect: 'Set(gblSelectedItem, ThisItem)' },
      }),
      notes: [
        'The fields are Title, Subtitle, Status and Initials. Rename them to your columns, or shape your data with AddColumns in Items.',
        'A clear button on top of each row makes the whole row clickable. The gallery’s OnSelect keeps the record in gblSelectedItem.',
      ],
      uses: [
        { name: 'colRequests', what: 'Collection: your records (rename to yours)' },
        { name: 'gblSelectedItem', what: 'Global variable: the record the user picked' },
      ],
    };
  },
};

const ROWS = [
  { ID: 'REQ-1042', Title: 'New laptop for onboarding', Owner: 'Anna Weber', Amount: '1,240.00', Status: 'Waiting' },
  { ID: 'REQ-1041', Title: 'Conference tickets', Owner: 'Ravi Kumar', Amount: '890.00', Status: 'Approved' },
  { ID: 'REQ-1039', Title: 'Office chairs (4)', Owner: 'Lea Martin', Amount: '1,960.00', Status: 'In review' },
  { ID: 'REQ-1036', Title: 'Software licence renewal', Owner: 'Tom Fischer', Amount: '4,300.00', Status: 'Rejected' },
  { ID: 'REQ-1035', Title: 'Team offsite catering', Owner: 'Mia Schulz', Amount: '620.00', Status: 'Draft' },
];

const COLS: { field: string; title: string; w: number | 'fill'; align?: 'Right' }[] = [
  { field: 'ID', title: 'ID', w: 90 },
  { field: 'Title', title: 'Title', w: 'fill' },
  { field: 'Owner', title: 'Owner', w: 130 },
  { field: 'Amount', title: 'Amount', w: 90, align: 'Right' },
];

export const dataTable: KitItem = {
  slug: 'data-table',
  name: 'Data table',
  category: 'Data display',
  summary: 'A table made from a gallery: a fixed header row, striped rows, a status column and a selected row.',
  keywords: ['table', 'grid', 'data table', 'columns', 'rows', 'gallery'],
  canvas: { w: 760, h: 360, bg: 'page' },
  options: [
    { id: 'items', label: 'Items', type: 'text', default: 'colRequests' },
    { id: 'stripes', label: 'Striped rows', type: 'toggle', default: true },
    { id: 'selected', label: 'Selected row in the preview', type: 'number', default: 1, min: 0, max: 5 },
  ],
  build(o) {
    const r = reader(o);
    const stripes = r.b('stripes');
    const pairs = STATUSES as [string, number][];
    const header = (c: (typeof COLS)[number]) =>
      lbl(`lblHead${c.field}`, { text: c.title, w: c.w, h: 'fill', size: 'Tiny', weight: 'Semibold', color: 'Primary3', textAlign: c.align, pad: 0, wrap: false });
    return {
      root: vCon('vConTable', { w: 700, h: 300, fill: 'Fill', border: { color: 'BorderColor', thickness: 'Thin' }, radius: 'Medium', alignItems: 'Stretch' }, [
        hCon('hConTableHead', { w: 'fill', h: 40, fill: 'Secondary3', pad: { x: 'Regular' }, gap: 'Regular', alignItems: 'Center' }, [
          ...COLS.map(header),
          lbl('lblHeadStatus', { text: 'Status', w: 110, h: 'fill', size: 'Tiny', weight: 'Semibold', color: 'Primary3', textAlign: 'Center', pad: 0 }),
        ]),
        gal('galTableRows', {
          dir: 'Vertical',
          w: 'fill',
          h: 'fill',
          // RowNo numbers the rows for the stripes (galleries have no row number of their own).
          items: stripes
            ? `With({ lclRows: ${r.s('items') || 'colRequests'} }, ForAll(Sequence(CountRows(lclRows)), Patch(Index(lclRows, Value), { RowNo: Value })))`
            : r.s('items') || 'colRequests',
          sample: ROWS,
          selectedIndex: r.n('selected') - 1,
          templateSize: 44,
          scrollbar: true,
          template: (row: Row) => {
            const even = (row.index + 1) % 2 === 0;
            const fill: Color = {
              if: row.selected,
              then: 'Primary2',
              else: stripes ? { if: fx('Mod(ThisItem.RowNo, 2) = 0', even), then: 'Secondary3', else: 'Fill' } : 'Fill',
            };
            return [
              hCon('hConTableRow', { x: 0, y: 0, w: 'fill', h: 'fill', pad: { x: 'Regular' }, gap: 'Regular', alignItems: 'Center', fill }, [
                ...COLS.map((c) =>
                  lbl(`lblCell${c.field}`, {
                    text: row.f(c.field),
                    w: c.w,
                    h: 'fill',
                    size: 'Small',
                    weight: c.field === 'ID' ? 'Semibold' : 'Normal',
                    color: c.field === 'ID' ? 'Primary1' : 'TextColor',
                    textAlign: c.align,
                    pad: 0,
                    wrap: false,
                  }),
                ),
                pill('CellStatus', 'ThisItem.Status', row.f('Status'), pairs, String(row.sample.Status), 110),
              ]),
              rowOverlay('btnTableRowOverlay'),
            ];
          },
          extra: { OnSelect: 'Set(gblSelectedItem, ThisItem)' },
        }),
      ]),
      notes: [
        'Columns are labels with fixed widths, and the Title column takes the rest (FillPortions 1). Use the same widths in the header and the rows.',
        'Sort by a column: set Items to SortByColumns(colRequests, "Title", If(lclSortAsc, SortOrder.Ascending, SortOrder.Descending)) and toggle lclSortAsc from the header label’s OnSelect.',
      ],
      uses: [
        { name: 'colRequests', what: 'Collection: your records (rename to yours)' },
        { name: 'gblSelectedItem', what: 'Global variable: the selected row' },
      ],
    };
  },
};
