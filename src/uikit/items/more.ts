// More components: accordion, timeline, progress, toggle, segmented control, bottom navigation,
// bar chart, progress ring, card grid, details panel, side drawer and a floating action button.

import { iconSvg, type IconName } from '../icons';
import { btn, circle, fx, gal, hCon, img, lbl, nCon, rect, str, vCon, type Row } from '../model';
import { reader, type KitItem } from '../types';
import { rowOverlay } from './data';
import { STATUSES, icon } from './shared';

const svgInner = (shape: IconName) => iconSvg(shape, '#000').replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');

export const accordion: KitItem = {
  slug: 'accordion',
  name: 'Accordion',
  category: 'Data display',
  summary: 'Questions or sections that open and close. Rows grow with their text, and several can be open at once.',
  keywords: ['accordion', 'expand', 'collapse', 'faq', 'disclosure', 'sections'],
  canvas: { w: 560, h: 380, bg: 'page' },
  options: [
    {
      id: 'items',
      label: 'Sections: title | text (one per line)',
      type: 'lines',
      default: [
        'Who approves my request? | Your team lead first, then finance for anything over 1,000.',
        'How long does approval take? | Most requests are decided within two working days.',
        'Can I change a submitted request? | Yes, until someone has approved it. Open it and choose Edit.',
      ],
    },
    { id: 'open', label: 'Open in the preview (row number)', type: 'number', default: 1, min: 0, max: 6 },
  ],
  build(o) {
    const r = reader(o);
    const rows = r.lines('items').map((l) => {
      const [Title, Body = ''] = l.split('|').map((p) => p.trim());
      return { Title, Body };
    });
    const open = r.n('open') - 1;
    const sample = rows.map((row, i) => ({ ...row, Open: i === open }));
    const W = 500;
    return {
      root: gal('galAccordion', {
        dir: 'VariableHeight',
        w: W,
        h: 340,
        items: 'fxSections',
        fill: 'Fill',
        sample,
        templateSize: 52,
        template: (row: Row) => {
          const isOpen = fx('ThisItem.Title in colOpenSections.Title', row.sample.Open as boolean);
          return [
            lbl('lblSectionTitle', { text: row.f('Title'), x: 16, y: 0, w: fx('Parent.TemplateWidth - 64', W - 64), h: 52, size: 'Small', weight: 'Semibold', pad: 0, wrap: false }),
            img('imgSectionChevron', {
              x: fx('Parent.TemplateWidth - 40', W - 40),
              y: 16,
              w: 20,
              h: 20,
              svg: (hex, mode) =>
                `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='${hex('IconFill')}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='${
                  mode === 'preview' ? (row.sample.Open ? 'M5.5 14.5L12 8l6.5 6.5' : 'M5.5 9.5L12 16l6.5-6.5') : `" & If(ThisItem.Title in colOpenSections.Title, "M5.5 14.5L12 8l6.5 6.5", "M5.5 9.5L12 16l6.5-6.5") & "`
                }'/></svg>`,
            }),
            btn('btnSectionToggle', {
              x: 0,
              y: 0,
              w: 'fill',
              h: 52,
              text: '',
              fill: 'Transparent',
              color: 'Transparent',
              hoverFill: { rgba: [0, 0, 0, 0.03] },
              pressedFill: 'Transparent',
              onSelect:
                'If(\n    ThisItem.Title in colOpenSections.Title,\n    Remove(colOpenSections, LookUp(colOpenSections, Title = ThisItem.Title)),\n    Collect(colOpenSections, { Title: ThisItem.Title })\n)',
            }),
            lbl('lblSectionBody', {
              text: row.f('Body'),
              x: 16,
              y: 48,
              w: fx('Parent.TemplateWidth - 32', W - 32),
              h: 40,
              size: 'Small',
              color: 'Primary3',
              vAlign: 'Top',
              pad: { t: 0, b: 'Regular', x: 0 },
              autoHeight: true,
              visible: isOpen,
            }),
            rect('shpSectionDivider', {
              x: 0,
              y: fx('If(lblSectionBody.Visible, lblSectionBody.Y + lblSectionBody.Height, 52) - 1', 0),
              w: 'fill',
              h: 1,
              fill: 'BorderColor',
            }),
          ];
        },
      }),
      formulas: `fxSections =\n[\n${rows.map((s) => `    { Title: ${str(s.Title)}, Body: ${str(s.Body)} }`).join(',\n')}\n];`,
      onVisible: 'Clear(colOpenSections)',
      notes: [
        'It’s a flexible-height gallery: each row is as tall as what’s visible in it, so an open section pushes the next one down.',
        'Only one open at a time instead: ClearCollect(colOpenSections, { Title: ThisItem.Title }) in the toggle’s OnSelect.',
      ],
      uses: [
        { name: 'fxSections', what: 'Named formula: the sections' },
        { name: 'colOpenSections', what: 'Collection: the open sections' },
      ],
    };
  },
};

const EVENTS = [
  { Title: 'Approved by finance', Who: 'Ravi Kumar', When: 'Today, 10:42', Kind: 'Approved' },
  { Title: 'Approved by team lead', Who: 'Lea Martin', When: 'Yesterday, 16:05', Kind: 'Approved' },
  { Title: 'Comment added', Who: 'Anna Weber', When: '2 Nov, 09:30', Kind: 'Submitted' },
  { Title: 'Request submitted', Who: 'Anna Weber', When: '1 Nov, 14:12', Kind: 'Draft' },
];

export const timeline: KitItem = {
  slug: 'activity-timeline',
  name: 'Activity timeline',
  category: 'Data display',
  summary: 'What happened to a record, newest first: a colored dot per event, a connecting line, who and when.',
  keywords: ['timeline', 'history', 'activity', 'audit', 'log', 'events'],
  canvas: { w: 520, h: 330 },
  options: [{ id: 'items', label: 'Items', type: 'text', default: 'colHistory' }],
  build(o) {
    const r = reader(o);
    const pairs = STATUSES.map(([n, i]) => [n, i] as [string, number]);
    return {
      root: gal('galTimeline', {
        dir: 'Vertical',
        w: 440,
        h: 288,
        items: r.s('items') || 'colHistory',
        sample: EVENTS,
        templateSize: 72,
        template: (row: Row) => {
          const kind = String(row.sample.Kind);
          const dot = { switch: 'ThisItem.Kind', cases: pairs.map(([n, i]) => [n, { statusFont: i as 1 }] as [string, { statusFont: 1 }]), else: 'Primary1' as const, pick: kind };
          return [
            rect('shpTimelineLine', { x: 11, y: 22, w: 2, h: fx('Parent.TemplateHeight - 16', 56), fill: 'BorderColor', visible: fx('ThisItem.Title <> Last(galTimeline.AllItems).Title', row.index < EVENTS.length - 1) }),
            circle('shpTimelineDot', { x: 4, y: 6, w: 16, h: 16, fill: dot, border: { color: 'Fill', thickness: 'Thick' } }),
            lbl('lblTimelineTitle', { text: row.f('Title'), x: 32, y: 0, w: fx('Parent.TemplateWidth - 32', 408), h: 26, size: 'Small', weight: 'Semibold', pad: 0, wrap: false }),
            lbl('lblTimelineMeta', {
              text: fx('ThisItem.Who & " · " & ThisItem.When', `${row.sample.Who} · ${row.sample.When}`),
              x: 32,
              y: 26,
              w: fx('Parent.TemplateWidth - 32', 408),
              h: 20,
              size: 'Tiny',
              color: 'Primary3',
              pad: 0,
              wrap: false,
            }),
          ];
        },
      }),
      notes: [
        'Each row needs Title, Who, When and Kind. Kind picks the dot color from the status colors (Approved, Rejected, …).',
        'The line hides on the last row (Last(galTimeline.AllItems)), so it stops at the oldest event.',
      ],
      uses: [{ name: 'colHistory', what: 'Collection: the events, newest first (rename to yours)' }],
    };
  },
};

export const progressBar: KitItem = {
  slug: 'progress-bar',
  name: 'Progress bar',
  category: 'Feedback',
  summary: 'A rounded bar with a caption and a percentage, filled from a number between 0 and 1.',
  keywords: ['progress', 'bar', 'percentage', 'completion', 'meter', 'budget'],
  canvas: { w: 420, h: 110 },
  options: [
    { id: 'caption', label: 'Caption', type: 'text', default: 'Budget used' },
    { id: 'value', label: 'Value formula (0 to 1)', type: 'text', default: 'lclProgress' },
    { id: 'preview', label: 'Value in the preview (%)', type: 'number', default: 68, min: 0, max: 100 },
  ],
  build(o) {
    const r = reader(o);
    const v = r.s('value') || 'lclProgress';
    const pct = r.n('preview');
    const W = 340;
    return {
      root: vCon('vConProgress', { w: W, h: 44, gap: 'Tiny', alignItems: 'Stretch' }, [
        hCon('hConProgressText', { w: 'fill', h: 22, alignItems: 'Center' }, [
          lbl('lblProgressCaption', { text: r.s('caption'), w: 'fill', h: 'fill', size: 'Small', pad: 0, wrap: false }),
          lbl('lblProgressValue', { text: fx(`Text(${v}, "0%")`, `${pct}%`), w: 60, h: 'fill', size: 'Small', weight: 'Semibold', textAlign: 'Right', pad: 0 }),
        ]),
        hCon('hConProgressTrack', { w: 'fill', h: 8, radius: 4, fill: 'Secondary3', alignItems: 'Stretch' }, [
          hCon('hConProgressFill', {
            w: fx(`Parent.Width * Max(0, Min(1, ${v}))`, Math.round((W * pct) / 100)),
            h: 'fill',
            radius: 4,
            fill: { if: fx(`${v} > 0.9`, pct > 90), then: 'ErrorColor', else: 'Primary1' },
          }, []),
        ]),
      ]),
      notes: ['The bar turns ErrorColor above 90%. Change the 0.9 or remove the If to keep one color.'],
      uses: [{ name: 'lclProgress', what: 'Local variable: a number from 0 to 1 (or use your own formula)' }],
    };
  },
};

export const toggleSwitch: KitItem = {
  slug: 'toggle-switch',
  name: 'Toggle switch',
  category: 'Inputs',
  summary: 'An on/off switch with a label, built from a container and a circle, so it matches the design system exactly.',
  keywords: ['toggle', 'switch', 'on off', 'setting', 'boolean'],
  canvas: { w: 380, h: 100 },
  options: [
    { id: 'label', label: 'Label', type: 'text', default: 'Email me when it’s approved' },
    { id: 'on', label: 'On in the preview', type: 'toggle', default: true },
  ],
  build(o) {
    const r = reader(o);
    const on = fx('lclNotifyOn', r.b('on'));
    return {
      root: hCon('hConToggle', { w: 320, h: 32, gap: 'Small', alignItems: 'Center' }, [
        lbl('lblToggle', { text: r.s('label'), w: 'fill', h: 'fill', size: 'Small', pad: 0, wrap: false }),
        nCon('nConToggleTrack', { w: 44, h: 24, radius: 12, fill: { if: on, then: 'Primary1', else: 'BorderColor' } }, [
          circle('shpToggleKnob', { x: fx('If(lclNotifyOn, 23, 3)', r.b('on') ? 23 : 3), y: 3, w: 18, h: 18, fill: 'Fill' }),
          btn('btnToggle', {
            x: 0,
            y: 0,
            w: 'fill',
            h: 'fill',
            text: '',
            fill: 'Transparent',
            color: 'Transparent',
            hoverFill: 'Transparent',
            pressedFill: 'Transparent',
            tooltip: r.s('label'),
            onSelect: 'UpdateContext({ lclNotifyOn: !lclNotifyOn })',
          }),
        ]),
      ]),
      notes: ['Save it with the record, for example Patch(colSettings, …, { NotifyOnApproval: lclNotifyOn }), and load it in OnVisible.'],
      uses: [{ name: 'lclNotifyOn', what: 'Local variable: true when the switch is on' }],
    };
  },
};

export const segmented: KitItem = {
  slug: 'segmented-control',
  name: 'Segmented control',
  category: 'Inputs',
  summary: 'Two to five options in one pill, for switching views or picking one value. The gallery remembers the choice.',
  keywords: ['segmented', 'toggle group', 'switch view', 'radio', 'options'],
  canvas: { w: 460, h: 100 },
  options: [
    { id: 'options', label: 'Options (one per line)', type: 'lines', default: ['List', 'Board', 'Calendar'] },
    { id: 'selected', label: 'Selected in the preview', type: 'number', default: 1, min: 1, max: 5 },
  ],
  build(o) {
    const r = reader(o);
    const options = r.lines('options').slice(0, 5);
    const seg = 110;
    return {
      root: hCon('hConSegmented', { w: options.length * seg + 8, h: 38, radius: 19, fill: 'Secondary3', pad: 4, alignItems: 'Stretch' }, [
        gal('galSegments', {
          dir: 'Horizontal',
          w: 'fill',
          h: 'fill',
          items: 'fxViewOptions',
          sample: options.map((Name) => ({ Name })),
          selectedIndex: r.n('selected') - 1,
          templateSize: seg,
          template: (row: Row) => [
            btn('btnSegment', {
              x: 0,
              y: 0,
              w: 'fill',
              h: 'fill',
              text: row.f('Name'),
              size: 'Small',
              radius: 15,
              fill: { if: row.selected, then: 'Fill', else: 'Transparent' },
              color: { if: row.selected, then: 'Primary1', else: 'Primary3' },
              hoverFill: { if: row.selected, then: 'Fill', else: 'HoverFill' },
              hoverColor: { if: row.selected, then: 'Primary1', else: 'TextColor' },
              onSelect: 'Select(Parent)',
            }),
          ],
        }),
      ]),
      formulas: `fxViewOptions =\n[\n${options.map((n) => `    { Name: ${str(n)} }`).join(',\n')}\n];`,
      notes: ['Read the choice with galSegments.Selected.Name, for example Visible: galSegments.Selected.Name = "Board".'],
      uses: [{ name: 'fxViewOptions', what: 'Named formula: the options' }],
    };
  },
};

const BOTTOM_ICONS: Record<string, IconName> = { Home: 'home', Requests: 'file', Approvals: 'success', Alerts: 'bell', Profile: 'user', Search: 'search' };

export const bottomNav: KitItem = {
  slug: 'bottom-navigation',
  name: 'Bottom navigation',
  category: 'Navigation',
  summary: 'A phone-style tab bar with an icon and label for each place, and the current one highlighted.',
  keywords: ['bottom navigation', 'tab bar', 'mobile', 'phone', 'footer nav'],
  canvas: { w: 420, h: 120, bg: 'page' },
  options: [
    { id: 'items', label: 'Items (one per line)', type: 'lines', default: ['Home', 'Requests', 'Approvals', 'Profile'] },
    { id: 'current', label: 'Current in the preview', type: 'number', default: 2, min: 1, max: 5 },
  ],
  build(o) {
    const r = reader(o);
    const items = r.lines('items').slice(0, 5);
    const W = 390;
    const sample = items.map((Title, i) => ({ Title, Icon: svgInner(BOTTOM_ICONS[Title] ?? 'grid'), Current: i === r.n('current') - 1 }));
    return {
      root: vCon('vConBottomNav', { w: fx('Parent.Width', W), h: 64, fill: 'Fill', alignItems: 'Stretch' }, [
        rect('shpBottomNavTop', { w: 'fill', h: 1, fill: 'BorderColor' }),
        gal('galBottomNav', {
          dir: 'Horizontal',
          w: 'fill',
          h: 'fill',
          items: 'fxBottomNav',
          sample,
          templateSize: Math.floor(W / items.length),
          extra: { TemplateSize: 'Self.Width / CountRows(fxBottomNav)', OnSelect: 'Set(gblBottomNavSelected, ThisItem.Title)' },
          template: (row: Row) => {
            const cur = fx('ThisItem.Title = gblBottomNavSelected', row.sample.Current as boolean);
            return [
              img('imgBottomNavIcon', {
                x: fx('(Parent.TemplateWidth - 24) / 2', Math.floor(W / items.length / 2) - 12),
                y: 10,
                w: 24,
                h: 24,
                svg: (hex, mode) =>
                  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='${
                    mode === 'preview' ? hex(row.sample.Current ? 'Primary1' : 'Primary3') : `" & If(ThisItem.Title = gblBottomNavSelected, fxColorConfigs.HexColors.Primary1, fxColorConfigs.HexColors.Primary3) & "`
                  }' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>${mode === 'preview' ? row.sample.Icon : '" & ThisItem.Icon & "'}</svg>`,
              }),
              lbl('lblBottomNavTitle', {
                text: row.f('Title'),
                x: 0,
                y: 36,
                w: 'fill',
                h: 18,
                size: 'Tiny',
                weight: 'Semibold',
                textAlign: 'Center',
                pad: 0,
                color: { if: cur, then: 'Primary1', else: 'Primary3' },
              }),
              rowOverlay('btnBottomNavOverlay'),
            ];
          },
        }),
      ]),
      formulas: `fxBottomNav =\n[\n${sample.map((s) => `    { Title: ${str(s.Title)}, Icon: "${s.Icon}" }`).join(',\n')}\n];`,
      onVisible: `Set(gblBottomNavSelected, ${str(items[0] ?? 'Home')})`,
      notes: ['Put it at the bottom of a phone-layout screen. Add a Screen column to fxBottomNav and Navigate(ThisItem.Screen) in the gallery’s OnSelect to switch screens.'],
      uses: [
        { name: 'fxBottomNav', what: 'Named formula: the tabs (Title and SVG Icon)' },
        { name: 'gblBottomNavSelected', what: 'Global variable: the current tab' },
      ],
    };
  },
};

const BARS = [
  { Label: 'Approved', Value: 42 },
  { Label: 'In review', Value: 27 },
  { Label: 'Waiting', Value: 18 },
  { Label: 'Rejected', Value: 9 },
  { Label: 'Draft', Value: 6 },
];

export const barChart: KitItem = {
  slug: 'bar-chart',
  name: 'Bar chart',
  category: 'Data display',
  summary: 'Horizontal bars from any table with a label and a value, scaled to the largest value. No chart control needed.',
  keywords: ['chart', 'bar chart', 'graph', 'dashboard', 'visualization', 'ranking'],
  canvas: { w: 520, h: 300 },
  options: [
    { id: 'title', label: 'Title', type: 'text', default: 'Requests by status' },
    { id: 'items', label: 'Items', type: 'text', default: 'colChartData' },
  ],
  build(o) {
    const r = reader(o);
    const items = r.s('items') || 'colChartData';
    const max = Math.max(...BARS.map((b) => b.Value));
    const W = 460;
    const barArea = W - 110 - 56;
    return {
      root: vCon('vConBarChart', { w: W, h: 250, fill: 'Fill', radius: 'Medium', border: { color: 'BorderColor', thickness: 'Thin' }, pad: 'Regular', gap: 'Small', alignItems: 'Stretch' }, [
        lbl('lblBarChartTitle', { text: r.s('title'), w: 'fill', h: 26, size: 'Subtitle', weight: 'Semibold', pad: 0 }),
        gal('galBarChart', {
          dir: 'Vertical',
          w: 'fill',
          h: 'fill',
          items,
          sample: BARS,
          templateSize: 34,
          template: (row: Row) => [
            lbl('lblBarLabel', { text: row.f('Label'), x: 0, y: 0, w: 104, h: 'fill', size: 'Small', color: 'Primary3', pad: 0, wrap: false }),
            hCon('hConBarTrack', { x: 110, y: 9, w: fx('Parent.TemplateWidth - 166', barArea - 32), h: 16, radius: 'Small', fill: 'Secondary3', alignItems: 'Stretch' }, [
              hCon('hConBar', {
                w: fx(`Parent.Width * ThisItem.Value / Max(${items}, Value)`, Math.round(((barArea - 32) * (row.sample.Value as number)) / max)),
                h: 'fill',
                radius: 'Small',
                fill: { if: fx(`ThisItem.Value = Max(${items}, Value)`, row.sample.Value === max), then: 'Primary1', else: { fade: 'Primary1', by: 45 } },
              }, []),
            ]),
            lbl('lblBarValue', { text: fx('Text(ThisItem.Value)', String(row.sample.Value)), x: fx('Parent.TemplateWidth - 48', barArea + 54), y: 0, w: 48, h: 'fill', size: 'Small', weight: 'Semibold', textAlign: 'Right', pad: 0 }),
          ],
        }),
      ]),
      formulas: `// Sample data. Replace with your own, e.g. AddColumns(GroupBy(colRequests, Status, Rows), Label, Status, Value, CountRows(Rows)).\nfxChartData =\n[\n${BARS.map((b) => `    { Label: ${str(b.Label)}, Value: ${b.Value} }`).join(',\n')}\n];`,
      onVisible: 'ClearCollect(colChartData, fxChartData)',
      notes: ['The largest bar is full width and dark; the rest are lighter. Sort the data first: SortByColumns(colChartData, "Value", SortOrder.Descending).'],
      uses: [{ name: 'colChartData', what: 'Collection: rows with Label and Value' }],
    };
  },
};

export const progressRing: KitItem = {
  slug: 'progress-ring',
  name: 'Progress ring',
  category: 'Data display',
  summary: 'A donut that fills to a percentage, drawn as an SVG from a formula, with the number in the middle.',
  keywords: ['donut', 'ring', 'gauge', 'progress', 'percentage', 'chart', 'kpi'],
  canvas: { w: 360, h: 220 },
  options: [
    { id: 'caption', label: 'Caption', type: 'text', default: 'Approved this month' },
    { id: 'value', label: 'Value formula (0 to 1)', type: 'text', default: 'lclApprovedShare' },
    { id: 'preview', label: 'Value in the preview (%)', type: 'number', default: 72, min: 0, max: 100 },
  ],
  build(o) {
    const r = reader(o);
    const v = r.s('value') || 'lclApprovedShare';
    const pct = r.n('preview');
    const C = 251.33;
    return {
      root: vCon('vConRing', { w: 200, h: 190, alignItems: 'Center', gap: 'Tiny' }, [
        nCon('nConRing', { w: 140, h: 140 }, [
          img('imgRing', {
            x: 0,
            y: 0,
            w: 140,
            h: 140,
            label: r.s('caption'),
            svg: (hex, mode) => {
              const dash = mode === 'preview' ? ((pct / 100) * C).toFixed(1) : `" & Text(Max(0, Min(1, ${v})) * ${C}, "0.0") & "`;
              return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='40' fill='none' stroke='${hex('Secondary3')}' stroke-width='11'/><circle cx='50' cy='50' r='40' fill='none' stroke='${hex('Primary1')}' stroke-width='11' stroke-linecap='round' stroke-dasharray='${dash} ${C}' transform='rotate(-90 50 50)'/></svg>`;
            },
          }),
          lbl('lblRingValue', { text: fx(`Text(${v}, "0%")`, `${pct}%`), x: 0, y: 0, w: 140, h: 140, size: 'Headline', weight: 'Bold', textAlign: 'Center', pad: 0 }),
        ]),
        lbl('lblRingCaption', { text: r.s('caption'), w: 'fill', h: 24, size: 'Small', color: 'Primary3', textAlign: 'Center', pad: 0 }),
      ]),
      notes: [`The ring is an SVG circle whose dash length is the value times its circumference (${C}). Any formula that gives 0 to 1 works.`],
      uses: [{ name: 'lclApprovedShare', what: 'Local variable: a number from 0 to 1 (or use your own formula)' }],
    };
  },
};

const CARDS = [
  { Title: 'New laptop for onboarding', Owner: 'Anna Weber', Amount: '1,240.00', Status: 'Waiting', When: '3 Nov' },
  { Title: 'Conference tickets', Owner: 'Ravi Kumar', Amount: '890.00', Status: 'Approved', When: '2 Nov' },
  { Title: 'Office chairs (4)', Owner: 'Lea Martin', Amount: '1,960.00', Status: 'In review', When: '31 Oct' },
  { Title: 'Software licence renewal', Owner: 'Tom Fischer', Amount: '4,300.00', Status: 'Rejected', When: '29 Oct' },
  { Title: 'Team offsite catering', Owner: 'Mia Schulz', Amount: '620.00', Status: 'Draft', When: '28 Oct' },
  { Title: 'Monitor arms (6)', Owner: 'Jonas Becker', Amount: '540.00', Status: 'Approved', When: '27 Oct' },
];

export const cardGrid: KitItem = {
  slug: 'card-grid',
  name: 'Card grid',
  category: 'Data display',
  summary: 'Records as cards in a wrapping grid: status, title, owner and amount. Three across by default.',
  keywords: ['cards', 'grid', 'tiles', 'gallery', 'wrap', 'kanban'],
  canvas: { w: 760, h: 360, bg: 'page' },
  options: [
    { id: 'items', label: 'Items', type: 'text', default: 'colRequests' },
    { id: 'cols', label: 'Cards per row', type: 'number', default: 3, min: 2, max: 4 },
  ],
  build(o) {
    const r = reader(o);
    const cols = r.n('cols');
    const W = 720;
    const pairs = STATUSES.map(([n, i]) => [n, i] as [string, number]);
    const cardW = Math.floor((W - 12 * (cols + 1)) / cols);
    return {
      root: gal('galCards', {
        dir: 'Vertical',
        w: W,
        h: 320,
        items: r.s('items') || 'colRequests',
        sample: CARDS.slice(0, cols * 2),
        wrapCount: cols,
        templateSize: 140,
        templatePad: 12,
        template: (row: Row) => {
          const status = String(row.sample.Status);
          return [
            vCon('vConCard', { x: 0, y: 0, w: 'fill', h: 'fill', fill: 'Fill', radius: 'Medium', border: { color: 'BorderColor', thickness: 'Thin' }, pad: 'Regular', gap: 'Tiny', alignItems: 'Stretch' }, [
              hCon('hConCardTop', { w: 'fill', h: 24, alignItems: 'Center', justify: 'SpaceBetween' }, [
                hCon('hConCardStatus', {
                  w: 92,
                  h: 22,
                  radius: 11,
                  justify: 'Center',
                  alignItems: 'Center',
                  fill: { switch: 'ThisItem.Status', cases: pairs.map(([n, i]) => [n, { status: i as 1 }] as [string, { status: 1 }]), else: { status: 1 }, pick: status },
                }, [
                  lbl('lblCardStatus', {
                    text: row.f('Status'),
                    w: 'fill',
                    h: 'fill',
                    size: 'Tiny',
                    weight: 'Semibold',
                    textAlign: 'Center',
                    pad: 0,
                    color: { switch: 'ThisItem.Status', cases: pairs.map(([n, i]) => [n, { statusFont: i as 1 }] as [string, { statusFont: 1 }]), else: { statusFont: 1 }, pick: status },
                  }),
                ]),
                lbl('lblCardDate', { text: row.f('When'), w: 70, h: 'fill', size: 'Tiny', color: 'Primary3', textAlign: 'Right', pad: 0 }),
              ]),
              lbl('lblCardTitle', { text: row.f('Title'), w: 'fill', h: 44, size: 'Small', weight: 'Semibold', vAlign: 'Top', pad: { t: 'Tiny', x: 0, b: 0 } }),
              hCon('hConCardFoot', { w: 'fill', h: 'fill', alignItems: 'End', justify: 'SpaceBetween' }, [
                lbl('lblCardOwner', { text: row.f('Owner'), w: 'fill', h: 22, size: 'Tiny', color: 'Primary3', pad: 0, wrap: false }),
                lbl('lblCardAmount', { text: row.f('Amount'), w: 90, h: 22, size: 'Small', weight: 'Semibold', textAlign: 'Right', pad: 0 }),
              ]),
            ]),
            rowOverlay('btnCardOverlay'),
          ];
        },
        extra: { OnSelect: 'Set(gblSelectedItem, ThisItem)' },
      }),
      notes: [
        `WrapCount sets the cards per row (${cols} here). Each card is ${cardW}px wide at this gallery width; make the gallery wider for bigger cards.`,
        'The fields are Title, Owner, Amount, Status and When. Rename them to your columns.',
      ],
      uses: [
        { name: 'colRequests', what: 'Collection: your records (rename to yours)' },
        { name: 'gblSelectedItem', what: 'Global variable: the card the user picked' },
      ],
    };
  },
};

export const detailsPanel: KitItem = {
  slug: 'details-panel',
  name: 'Details panel',
  category: 'Data display',
  summary: 'A record’s fields as label and value pairs in a card, read from the selected item.',
  keywords: ['details', 'key value', 'properties', 'summary', 'record', 'view form'],
  canvas: { w: 460, h: 340, bg: 'page' },
  options: [
    { id: 'title', label: 'Title', type: 'text', default: 'Request details' },
    {
      id: 'rows',
      label: 'Rows: label | formula | preview value',
      type: 'lines',
      default: [
        'Request ID | gblSelectedItem.ID | REQ-1042',
        'Requested by | gblSelectedItem.Owner | Anna Weber',
        'Amount | Text(gblSelectedItem.Amount, "#,##0.00") | 1,240.00',
        'Cost center | gblSelectedItem.CostCenter | IT-2040',
        'Needed by | Text(gblSelectedItem.NeededBy, "dd mmm yyyy") | 15 Nov 2026',
      ],
    },
  ],
  build(o) {
    const r = reader(o);
    const rows = r
      .lines('rows')
      .map((l) => l.split('|').map((p) => p.trim()))
      .filter((p) => p[0] && p[1])
      .slice(0, 10);
    return {
      root: vCon('vConDetails', { w: 400, h: 56 + rows.length * 40, fill: 'Fill', radius: 'Medium', border: { color: 'BorderColor', thickness: 'Thin' }, pad: { x: 'Regular', y: 'Small' }, alignItems: 'Stretch' }, [
        lbl('lblDetailsTitle', { text: r.s('title'), w: 'fill', h: 36, size: 'Subtitle', weight: 'Semibold', pad: 0 }),
        ...rows.map(([label, formula, preview = ''], i) =>
          hCon(`hConDetailRow${i + 1}`, { w: 'fill', h: 40, gap: 'Small', alignItems: 'Center' }, [
            lbl(`lblDetailKey${i + 1}`, { text: label, w: 130, h: 'fill', size: 'Small', color: 'Primary3', pad: 0, wrap: false }),
            lbl(`lblDetailValue${i + 1}`, { text: fx(formula, preview), w: 'fill', h: 'fill', size: 'Small', weight: 'Semibold', pad: 0, wrap: false }),
          ]),
        ),
      ]),
      notes: ['Each value is a formula, so it can format numbers and dates. gblSelectedItem is set when the user picks a row in a list.'],
      uses: [{ name: 'gblSelectedItem', what: 'Global variable: the record being shown' }],
    };
  },
};

export const sideDrawer: KitItem = {
  slug: 'side-drawer',
  name: 'Side drawer',
  category: 'Feedback',
  summary: 'A panel that slides over the right side of the screen for filters or quick edits, with a dimmed backdrop.',
  keywords: ['drawer', 'side panel', 'sheet', 'filters panel', 'flyout', 'overlay'],
  canvas: { w: 720, h: 420, bg: 'page' },
  options: [
    { id: 'title', label: 'Title', type: 'text', default: 'Filters' },
    { id: 'apply', label: 'Main button', type: 'text', default: 'Apply filters' },
  ],
  build(o) {
    const r = reader(o);
    const W = 720;
    const H = 420;
    return {
      root: nCon('nConDrawer', { w: fx('App.Width', W), h: fx('App.Height', H), visible: fx('lclShowDrawer', true) }, [
        btn('btnDrawerBackdrop', {
          x: 0,
          y: 0,
          w: 'fill',
          h: 'fill',
          text: '',
          fill: { rgba: [20, 28, 38, 0.4] },
          color: 'Transparent',
          hoverFill: { rgba: [20, 28, 38, 0.4] },
          pressedFill: { rgba: [20, 28, 38, 0.4] },
          tooltip: 'Close',
          onSelect: 'UpdateContext({ lclShowDrawer: false })',
        }),
        vCon('vConDrawerPanel', { x: fx('Parent.Width - Self.Width', W - 360), y: 0, w: 360, h: 'fill', fill: 'Fill', shadow: 'Semilight', alignItems: 'Stretch' }, [
          hCon('hConDrawerHead', { w: 'fill', h: 60, pad: { l: 'Large', r: 'Regular' }, alignItems: 'Center' }, [
            lbl('lblDrawerTitle', { text: r.s('title'), w: 'fill', h: 'fill', size: 'Subtitle', weight: 'Semibold', pad: 0 }),
            icon('imgDrawerClose', 'close', 'TextColor', { w: 28, h: 28, pad: 4, tooltip: 'Close', onSelect: 'UpdateContext({ lclShowDrawer: false })' }),
          ]),
          rect('shpDrawerHeadLine', { w: 'fill', h: 1, fill: 'BorderColor' }),
          vCon('vConDrawerBody', { w: 'fill', h: 'fill', pad: 'Large', gap: 'Regular', scrollY: true, alignItems: 'Stretch' }, [
            lbl('lblDrawerHint', { text: 'Put your fields and filters here.', w: 'fill', h: 40, size: 'Small', color: 'Primary3', pad: 0 }),
          ]),
          hCon('hConDrawerFoot', { w: 'fill', h: 68, pad: { x: 'Large' }, gap: 'Small', alignItems: 'Center', justify: 'End', fill: 'Secondary3' }, [
            btn('btnDrawerCancel', { text: 'Cancel', w: 100, h: 36, fill: 'Fill', color: 'TextColor', border: { color: 'BorderColor', thickness: 'Thin' }, hoverFill: 'HoverFill', radius: 'Medium', size: 'Small', onSelect: 'UpdateContext({ lclShowDrawer: false })' }),
            btn('btnDrawerApply', { text: r.s('apply'), w: 130, h: 36, fill: 'Primary1', hoverFill: { fade: 'Primary1', by: -15 }, radius: 'Medium', size: 'Small', onSelect: '// apply your filters\nUpdateContext({ lclShowDrawer: false })' }),
          ]),
        ]),
      ]),
      onVisible: 'UpdateContext({ lclShowDrawer: false })',
      notes: [
        'Open it with UpdateContext({ lclShowDrawer: true }). Clicking the dimmed area closes it.',
        'Drop your inputs into vConDrawerBody; it scrolls when they don’t fit.',
      ],
      uses: [{ name: 'lclShowDrawer', what: 'Local variable: true while the drawer is open' }],
    };
  },
};

export const fab: KitItem = {
  slug: 'floating-action-button',
  name: 'Floating action button',
  category: 'Inputs',
  summary: 'A round button for the main action on a screen, pinned to the bottom right corner.',
  keywords: ['fab', 'floating action button', 'add', 'plus', 'mobile', 'primary action'],
  canvas: { w: 420, h: 260, bg: 'page' },
  options: [{ id: 'tip', label: 'Tooltip', type: 'text', default: 'New request' }],
  build(o) {
    const r = reader(o);
    return {
      root: nCon('nConFab', { w: 56, h: 56, x: fx('App.Width - 80', 340), y: fx('App.Height - 80', 180) }, [
        btn('btnFab', {
          x: 0,
          y: 0,
          w: 'fill',
          h: 'fill',
          text: '',
          radius: 28,
          fill: 'Primary1',
          hoverFill: { fade: 'Primary1', by: -15 },
          tooltip: r.s('tip'),
          onSelect: '// Navigate(scrNewRequest)',
        }),
        icon('imgFabIcon', 'plus', 'White', { x: 16, y: 16, w: 24, h: 24, onSelect: 'Select(btnFab)' }),
      ]),
      notes: ['Its X and Y follow App.Width and App.Height, so it stays in the corner on any screen size. Paste it last so it sits on top.'],
    };
  },
};
