// Layouts: screen skeletons made from containers and the kit's own components.
// Each one fills the screen (Parent.Width x Parent.Height); paste it into an empty screen.

import { merge, part, suffixed } from '../compose';
import { btn, fx, hCon, lbl, vCon, type Node } from '../model';
import { reader, type KitItem } from '../types';
import { kpiCard, listRow } from './data';
import { textField, searchBox } from './inputs';
import { barChart, bottomNav, detailsPanel } from './more';
import { appHeader, sidebar, stepper } from './navigation';

/** A dashed area that says what goes there. */
export function placeholder(name: string, text: string, o: Partial<Parameters<typeof vCon>[1]> = {}): Node {
  return vCon(name, { w: 'fill', h: 'fill', minH: 80, border: { color: 'BorderColor', thickness: 'Thin', dashed: true }, radius: 'Medium', justify: 'Center', alignItems: 'Center', ...o }, [
    lbl(`lbl${name.replace(/^vCon/, '')}Hint`, { text, w: 260, h: 24, size: 'Small', color: 'Primary3', textAlign: 'Center', pad: 0 }),
  ]);
}

const screen = { w: fx('Parent.Width', 1000), h: fx('Parent.Height', 600) } as const;

export const layoutAppShell: KitItem = {
  slug: 'layout-app-shell',
  name: 'App shell',
  category: 'Layouts',
  summary: 'Sidebar on the left, header and a scrolling content area on the right. The frame most business apps start from.',
  keywords: ['layout', 'app shell', 'sidebar', 'frame', 'template', 'screen'],
  canvas: { w: 1000, h: 600, bg: 'page' },
  options: [
    { id: 'app', label: 'App name', type: 'text', default: 'Requests' },
    { id: 'title', label: 'Page title', type: 'text', default: 'Overview' },
  ],
  build(o) {
    const r = reader(o);
    const side = part(sidebar, { app: r.s('app') });
    const head = part(appHeader, { title: r.s('title'), subtitle: '', back: false });
    const root = hCon('hConAppShell', { ...screen, fill: 'BackgroundFill', alignItems: 'Stretch' }, [
      { ...side.root, h: 'fill' },
      vCon('vConAppMain', { w: 'fill', h: 'fill', alignItems: 'Stretch' }, [
        { ...head.root, w: 'fill' },
        vCon('vConAppContent', { w: 'fill', h: 'fill', pad: 'Large', gap: 'Regular', scrollY: true, alignItems: 'Stretch' }, [placeholder('vConAppContentArea', 'Your screen content goes here')]),
      ]),
    ]);
    return merge(root, [side, head], [
      'Paste it into an empty screen. Everything sizes from Parent.Width and Parent.Height, so it fills any screen size.',
      'Put the screen’s controls into vConAppContent and delete the dashed placeholder.',
    ]);
  },
};

/** Three KPI cards in a row, a chart and a list: the dashboard content, shared with the dashboard screen. */
export function dashboardContent(prefix: string) {
  const kpis = [
    part(kpiCard, { caption: 'Open requests', preview: '128', delta: '+12% vs last month', up: true }),
    part(kpiCard, { caption: 'Approved this month', value: 'CountRows(Filter(colRequests, Status = "Approved"))', preview: '42', delta: '+8 vs last month', up: true }),
    part(kpiCard, { caption: 'Waiting on you', value: 'CountRows(Filter(colRequests, Status = "Waiting"))', preview: '7', delta: '3 more than last week', up: false }),
  ];
  const chart = part(barChart);
  const list = part(listRow);
  const node = vCon(`vCon${prefix}Content`, { w: 'fill', h: 'fill', pad: 'Large', gap: 'Regular', scrollY: true, alignItems: 'Stretch' }, [
    hCon(`hCon${prefix}Kpis`, { w: 'fill', h: 132, gap: 'Regular', alignItems: 'Stretch' }, kpis.map((k, i) => ({ ...suffixed(k.root, String(i + 1)), w: 'fill' as const, h: 'fill' as const }))),
    hCon(`hCon${prefix}Panels`, { w: 'fill', h: 'fill', minH: 260, gap: 'Regular', alignItems: 'Stretch' }, [
      { ...chart.root, w: 'fill', h: 'fill' },
      { ...list.root, w: 'fill', h: 'fill' },
    ]),
  ]);
  return { node, parts: [...kpis, chart, list] };
}

export const layoutDashboard: KitItem = {
  slug: 'layout-dashboard',
  name: 'Dashboard',
  category: 'Layouts',
  summary: 'A header, a row of KPI cards, then a chart and a list side by side. The cards share the width evenly.',
  keywords: ['layout', 'dashboard', 'kpi', 'overview', 'home', 'screen'],
  canvas: { w: 1000, h: 640, bg: 'page' },
  options: [{ id: 'title', label: 'Title', type: 'text', default: 'Dashboard' }],
  build(o) {
    const head = part(appHeader, { title: reader(o).s('title'), subtitle: 'This month at a glance', back: false });
    const { node, parts } = dashboardContent('Dash');
    const root = vCon('vConDashboard', { ...screen, h: fx('Parent.Height', 640), fill: 'BackgroundFill', alignItems: 'Stretch' }, [{ ...head.root, w: 'fill' }, node]);
    return merge(root, [head, ...parts], [
      'The KPI cards have FillPortions 1, so they share the width on any screen. Add a fourth by copying one.',
      'The chart and the list read colChartData and colRequests. Fill them in the screen’s OnVisible.',
    ]);
  },
};

export const layoutMasterDetail: KitItem = {
  slug: 'layout-master-detail',
  name: 'Master-detail',
  category: 'Layouts',
  summary: 'A searchable list on the left and the selected record’s details on the right, wired together with gblSelectedItem.',
  keywords: ['layout', 'master detail', 'list detail', 'split view', 'browse', 'screen'],
  canvas: { w: 1000, h: 600, bg: 'page' },
  options: [{ id: 'title', label: 'Title', type: 'text', default: 'Requests' }],
  build(o) {
    const head = part(appHeader, { title: reader(o).s('title'), subtitle: '', back: false });
    const search = part(searchBox);
    const list = part(listRow, { selected: 2 });
    const details = part(detailsPanel);
    const root = vCon('vConMasterDetail', { ...screen, fill: 'BackgroundFill', alignItems: 'Stretch' }, [
      { ...head.root, w: 'fill' },
      hCon('hConMasterDetailBody', { w: 'fill', h: 'fill', pad: 'Large', gap: 'Large', alignItems: 'Stretch' }, [
        vCon('vConMasterList', { w: 400, h: 'fill', gap: 'Small', alignItems: 'Stretch' }, [
          { ...search.root, w: 'fill' },
          { ...list.root, w: 'fill', h: 'fill', extra: { Items: 'Filter(colRequests, StartsWith(Title, txtSearch.Text))', OnSelect: 'Set(gblSelectedItem, ThisItem)' } },
        ]),
        vCon('vConDetailColumn', { w: 'fill', h: 'fill', alignItems: 'Stretch' }, [{ ...details.root, w: 'fill' }]),
      ]),
    ]);
    return merge(root, [head, search, list, details], [
      'Picking a row sets gblSelectedItem, and the details panel reads it, so the right side follows the list.',
      'The list filters as you type in the search box (StartsWith works with SharePoint and Dataverse).',
    ]);
  },
};

export const layoutForm: KitItem = {
  slug: 'layout-form',
  name: 'Form with steps',
  category: 'Layouts',
  summary: 'A multi-step form: header, stepper, a two-column card of fields, and a footer with Back and Next.',
  keywords: ['layout', 'form', 'wizard', 'steps', 'two columns', 'edit', 'screen'],
  canvas: { w: 1000, h: 640, bg: 'page' },
  options: [{ id: 'title', label: 'Title', type: 'text', default: 'New request' }],
  build(o) {
    const head = part(appHeader, { title: reader(o).s('title'), subtitle: 'Fill in the details and continue', back: true });
    const steps = part(stepper, { current: 1 });
    const fields = [
      part(textField, { label: 'Request title', hint: 'e.g. New laptop for onboarding' }),
      part(textField, { label: 'Cost center', hint: 'e.g. IT-2040' }),
      part(textField, { label: 'Amount', hint: '0.00' }),
      part(textField, { label: 'Needed by', hint: 'dd.mm.yyyy', required: false }),
    ];
    const f = (i: number) => ({ ...suffixed(fields[i].root, String(i + 1)), w: 'fill' as const });
    const root = vCon('vConForm', { ...screen, h: fx('Parent.Height', 640), fill: 'BackgroundFill', alignItems: 'Stretch' }, [
      { ...head.root, w: 'fill' },
      vCon('vConFormBody', { w: 'fill', h: 'fill', pad: 'Large', gap: 'Large', scrollY: true, alignItems: 'Center' }, [
        steps.root,
        vCon('vConFormCard', { w: 760, h: 260, fill: 'Fill', radius: 'Medium', border: { color: 'BorderColor', thickness: 'Thin' }, pad: 'Large', gap: 'Regular', alignItems: 'Stretch' }, [
          hCon('hConFormRow1', { w: 'fill', h: 92, gap: 'Large', alignItems: 'Start' }, [f(0), f(1)]),
          hCon('hConFormRow2', { w: 'fill', h: 92, gap: 'Large', alignItems: 'Start' }, [f(2), f(3)]),
        ]),
      ]),
      hCon('hConFormFooter', { w: 'fill', h: 72, fill: 'Fill', pad: { x: 'Large' }, gap: 'Small', alignItems: 'Center', justify: 'End' }, [
        btn('btnFormBack', {
          text: 'Back',
          w: 110,
          h: 38,
          fill: 'Fill',
          color: 'TextColor',
          border: { color: 'BorderColor', thickness: 'Thin' },
          hoverFill: 'HoverFill',
          radius: 'Medium',
          size: 'Small',
          disabled: fx('gblCurrentStep <= 1', true),
          onSelect: 'Set(gblCurrentStep, gblCurrentStep - 1)',
        }),
        btn('btnFormNext', {
          text: 'Next',
          w: 130,
          h: 38,
          fill: 'Primary1',
          hoverFill: { fade: 'Primary1', by: -15 },
          radius: 'Medium',
          size: 'Small',
          onSelect:
            'If(\n    IsBlank(txtField1.Text) || IsBlank(txtField2.Text) || IsBlank(txtField3.Text),\n    UpdateContext({ lclShowErrors: true }),\n    UpdateContext({ lclShowErrors: false });\n    Set(gblCurrentStep, gblCurrentStep + 1)\n)',
        }),
      ]),
    ]);
    return merge(root, [head, steps, ...fields], [
      'Next checks the required fields first and shows their messages if any are empty, then moves to the next step.',
      'For a real multi-screen form, Navigate to the next screen in Next instead, and set gblCurrentStep in each screen’s OnVisible.',
    ]);
  },
};

export const layoutMobile: KitItem = {
  slug: 'layout-mobile',
  name: 'Phone layout',
  category: 'Layouts',
  summary: 'A phone screen: a compact header, search, a scrolling list and a bottom navigation bar.',
  keywords: ['layout', 'mobile', 'phone', 'portrait', 'bottom navigation', 'screen'],
  canvas: { w: 400, h: 760, bg: 'page' },
  options: [{ id: 'title', label: 'Title', type: 'text', default: 'My requests' }],
  build(o) {
    const head = part(appHeader, { title: reader(o).s('title'), subtitle: '', back: false });
    const search = part(searchBox);
    const list = part(listRow, { selected: 0 });
    const nav = part(bottomNav, { current: 2 });
    const root = vCon('vConPhone', { w: fx('Parent.Width', 390), h: fx('Parent.Height', 740), fill: 'BackgroundFill', alignItems: 'Stretch' }, [
      { ...head.root, w: 'fill', h: 56 },
      vCon('vConPhoneBody', { w: 'fill', h: 'fill', pad: 'Regular', gap: 'Small', alignItems: 'Stretch' }, [
        { ...search.root, w: 'fill' },
        { ...list.root, w: 'fill', h: 'fill' },
      ]),
      { ...nav.root, w: 'fill' },
    ]);
    return merge(root, [head, search, list, nav], ['Use it in a phone-layout app (portrait, 640 x 1136 or similar). The list takes whatever height is left between the header and the bottom bar.']);
  },
};
