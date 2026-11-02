// Navigation: the header, sidebar, tabs, breadcrumbs, stepper and pagination.

import { iconSvg, type IconName } from '../icons';
import { btn, circle, fx, gal, hCon, img, lbl, rect, str, vCon } from '../model';
import { reader, type KitItem } from '../types';
import { icon, textWidth } from './shared';

export const appHeader: KitItem = {
  slug: 'app-header',
  name: 'App header',
  category: 'Navigation',
  summary: 'A full-width header with a back button, a title and subtitle, and the signed-in user’s initials.',
  keywords: ['header', 'top bar', 'app bar', 'title', 'back', 'avatar'],
  canvas: { w: 720, h: 120 },
  options: [
    { id: 'title', label: 'Title', type: 'text', default: 'Purchase requests' },
    { id: 'subtitle', label: 'Subtitle', type: 'text', default: 'Create, track and approve' },
    { id: 'back', label: 'Back button', type: 'toggle', default: true },
    { id: 'avatar', label: 'User initials', type: 'toggle', default: true },
  ],
  build(o) {
    const r = reader(o);
    const showSub = r.s('subtitle') !== '';
    return {
      root: hCon(
        'hConHeader',
        { w: fx('Parent.Width', 720), h: 64, fill: 'Primary1', pad: { x: 'Regular' }, gap: 'Small', alignItems: 'Center' },
        [
          icon('imgHeaderBack', 'arrowLeft', 'White', { w: 28, h: 28, pad: 2, visible: fx(String(r.b('back')), r.b('back')), onSelect: 'Back()', tooltip: 'Back' }),
          vCon('vConHeaderTitles', { w: 'fill', h: 'fill', justify: 'Center', alignItems: 'Stretch' }, [
            lbl('lblHeaderTitle', { text: r.s('title'), w: 'fill', h: 28, size: 'Title', weight: 'Semibold', color: 'SelectedColor', pad: 0, wrap: false }),
            lbl('lblHeaderSubtitle', { text: r.s('subtitle'), w: 'fill', h: 20, size: 'Small', color: 'Primary2', pad: 0, wrap: false, visible: fx(String(showSub), showSub) }),
          ]),
          hCon(
            'hConHeaderAvatar',
            { w: 36, h: 36, radius: 18, fill: { rgba: [255, 255, 255, 0.2] }, justify: 'Center', alignItems: 'Center', visible: fx(String(r.b('avatar')), r.b('avatar')) },
            [
              lbl('lblHeaderInitials', {
                text: fx('With({ lclNames: Split(User().FullName, " ") }, Upper(Left(First(lclNames).Value, 1) & Left(Last(lclNames).Value, 1)))', 'JM'),
                w: 'fill',
                h: 'fill',
                size: 'Small',
                weight: 'Semibold',
                color: 'SelectedColor',
                textAlign: 'Center',
                pad: 0,
              }),
            ],
          ),
        ],
      ),
      notes: ['Width follows Parent.Width, so it fills the screen when you paste it at the top.', 'The initials come from User().FullName: the first letters of the first and last name.'],
    };
  },
};

const NAV_ICONS: Record<string, IconName> = { Home: 'home', Requests: 'file', Approvals: 'success', Reports: 'chart', Team: 'users', Settings: 'settings' };
const svgInner = (shape: IconName) => iconSvg(shape, '#000').replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');

export const sidebar: KitItem = {
  slug: 'sidebar',
  name: 'Sidebar navigation',
  category: 'Navigation',
  summary: 'A dark side menu with icons, a highlighted current item, and a button that collapses it to icons only.',
  keywords: ['sidebar', 'side menu', 'navigation', 'drawer', 'collapse', 'left nav'],
  canvas: { w: 300, h: 460, bg: 'page' },
  options: [
    { id: 'app', label: 'App name', type: 'text', default: 'Requests' },
    { id: 'items', label: 'Menu items (one per line)', type: 'lines', default: ['Home', 'Requests', 'Approvals', 'Reports', 'Settings'] },
    { id: 'current', label: 'Current item in the preview', type: 'text', default: 'Requests' },
    { id: 'collapsed', label: 'Show collapsed', type: 'toggle', default: false },
  ],
  build(o) {
    const r = reader(o);
    const collapsed = r.b('collapsed');
    const items = r.lines('items');
    const sample = items.map((Title) => ({ Title, Icon: svgInner(NAV_ICONS[Title] ?? 'grid'), Current: Title === r.s('current') }));
    const open = fx('!gblNavCollapsed', !collapsed);
    return {
      root: vCon(
        'vConSidebar',
        { w: fx('If(gblNavCollapsed, 64, 240)', collapsed ? 64 : 240), h: fx('Parent.Height', 440), fill: 'Secondary1', pad: { y: 'Regular' }, gap: 'Regular', alignItems: 'Stretch' },
        [
          hCon('hConSidebarBrand', { w: 'fill', h: 36, pad: { x: 18 }, gap: 'Small', alignItems: 'Center' }, [
            icon('imgSidebarLogo', 'grid', 'White', { w: 28, h: 28 }),
            lbl('lblSidebarApp', { text: r.s('app'), w: 'fill', h: 'fill', size: 'Subtitle', weight: 'Semibold', color: 'SelectedColor', pad: 0, wrap: false, visible: open }),
          ]),
          gal('galSidebarNav', {
            dir: 'Vertical',
            w: 'fill',
            h: 'fill',
            items: 'fxNavItems',
            sample,
            templateSize: 44,
            templatePad: 0,
            template: (row) => {
              const current = fx('ThisItem.Title = gblNavSelected', row.sample.Current as boolean);
              return [
                hCon(
                  'hConNavItem',
                  { w: 'fill', h: 'fill', pad: { x: 18 }, gap: 'Small', alignItems: 'Center', fill: { if: current, then: { rgba: [255, 255, 255, 0.12] }, else: 'Transparent' } },
                  [
                    img('imgNavIcon', {
                      w: 24,
                      h: 24,
                      svg: (hex, mode) =>
                        `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='${hex('White')}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>${
                          mode === 'preview' ? row.sample.Icon : '" & ThisItem.Icon & "'
                        }</svg>`,
                    }),
                    lbl('lblNavTitle', { text: row.f('Title'), w: 'fill', h: 'fill', size: 'Regular', color: 'SelectedColor', pad: 0, wrap: false, visible: open }),
                  ],
                ),
                rect('shpNavCurrent', { x: 0, y: 8, w: 4, h: 28, fill: 'Accent3', visible: current }),
                // A clear button on top makes the whole row clickable (labels inside containers don't select the row).
                btn('btnNavItemOverlay', {
                  x: 0,
                  y: 0,
                  w: 'fill',
                  h: 'fill',
                  text: '',
                  fill: 'Transparent',
                  hoverFill: { rgba: [255, 255, 255, 0.06] },
                  pressedFill: 'Transparent',
                  color: 'Transparent',
                  tooltip: row.f('Title'),
                  onSelect: 'Select(Parent)',
                }),
              ];
            },
            extra: { OnSelect: 'Set(gblNavSelected, ThisItem.Title)' },
          }),
          hCon('hConSidebarFooter', { w: 'fill', h: 36, pad: { x: 18 }, alignItems: 'Center' }, [
            img('imgSidebarToggle', {
              w: 24,
              h: 24,
              tooltip: fx('If(gblNavCollapsed, "Expand menu", "Collapse menu")', 'Collapse menu'),
              svg: (hex) => iconSvg(collapsed ? 'chevronRight' : 'chevronLeft', hex('White')),
              onSelect: 'Set(gblNavCollapsed, !gblNavCollapsed)',
            }),
          ]),
        ],
      ),
      formulas: `// The menu. Icon holds the inside of a 24 x 24 SVG.\nfxNavItems =\n[\n${sample
        .map((s) => `    { Title: ${str(s.Title)}, Icon: "${s.Icon}" }`)
        .join(',\n')}\n];`,
      onVisible: `Set(gblNavSelected, ${str(items[0] ?? 'Home')})`,
      notes: [
        'Navigate from the gallery: add a Screen column to fxNavItems, e.g. { Title: "Home", Icon: "…", Screen: scrHome }, and set the gallery’s OnSelect to Set(gblNavSelected, ThisItem.Title); Navigate(ThisItem.Screen).',
        'gblNavCollapsed switches between the full menu (240) and icons only (64). Put the sidebar and your content in an hCon so the content takes the space back.',
      ],
      uses: [
        { name: 'fxNavItems', what: 'Named formula: the menu items' },
        { name: 'gblNavSelected', what: 'Global variable: the current item' },
        { name: 'gblNavCollapsed', what: 'Global variable: true when the menu shows icons only' },
      ],
    };
  },
};

export const tabs: KitItem = {
  slug: 'tabs',
  name: 'Tabs',
  category: 'Navigation',
  summary: 'Tabs with an underline on the selected one. The selection comes from the gallery, so no extra variable.',
  keywords: ['tabs', 'tab bar', 'segments', 'underline', 'views'],
  canvas: { w: 560, h: 100 },
  options: [
    { id: 'tabs', label: 'Tabs (one per line)', type: 'lines', default: ['Overview', 'Details', 'Attachments', 'History'] },
    { id: 'selected', label: 'Selected tab in the preview', type: 'number', default: 1, min: 1, max: 8 },
  ],
  build(o) {
    const r = reader(o);
    const tabNames = r.lines('tabs');
    const sample = tabNames.map((Name, i) => ({ ID: i + 1, Name }));
    return {
      root: vCon('vConTabs', { w: 480, h: 44, alignItems: 'Stretch' }, [
        gal('galTabs', {
          dir: 'Horizontal',
          w: 'fill',
          h: 'fill',
          items: 'fxTabs',
          sample,
          templateSize: 120,
          selectedIndex: r.n('selected') - 1,
          template: (row) => [
            lbl('lblTabName', {
              text: row.f('Name'),
              x: 0,
              y: 0,
              w: 'fill',
              h: fx('Parent.TemplateHeight - 3', 41),
              size: 'Regular',
              weight: 'Semibold',
              textAlign: 'Center',
              color: { if: row.selected, then: 'Primary1', else: 'Primary3' },
              onSelect: 'Select(Parent)',
            }),
            rect('shpTabUnderline', { x: 16, y: fx('Parent.TemplateHeight - 3', 41), w: fx('Parent.TemplateWidth - 32', 88), h: 3, fill: { if: row.selected, then: 'Primary1', else: 'Transparent' } }),
          ],
        }),
        rect('shpTabsBaseline', { w: 'fill', h: 1, fill: 'BorderColor' }),
      ]),
      formulas: `fxTabs =\n[\n${sample.map((s) => `    { ID: ${s.ID}, Name: ${str(s.Name)} }`).join(',\n')}\n];`,
      notes: [
        'Show a tab’s content with Visible: galTabs.Selected.ID = 1 (2, 3, …) on the container for that tab.',
        'Open a tab from a formula with Set(gblTabDefault, 2) and the gallery’s Default set to LookUp(fxTabs, ID = gblTabDefault).',
      ],
      uses: [{ name: 'fxTabs', what: 'Named formula: the tabs' }],
    };
  },
};

export const breadcrumbs: KitItem = {
  slug: 'breadcrumbs',
  name: 'Breadcrumbs',
  category: 'Navigation',
  summary: 'Where the user is, with links back to the screens above. The last crumb is the current page.',
  keywords: ['breadcrumbs', 'path', 'trail', 'location'],
  canvas: { w: 520, h: 90 },
  options: [{ id: 'crumbs', label: 'Crumbs (one per line)', type: 'lines', default: ['Home', 'Requests', 'REQ-1042'] }],
  build(o) {
    const crumbs = reader(o).lines('crumbs').slice(0, 5);
    const parts = crumbs.flatMap((c, i) => {
      const last = i === crumbs.length - 1;
      const label = lbl(`lblCrumb${i + 1}`, {
        text: c,
        w: textWidth(c, 12),
        h: 'fill',
        size: 'Small',
        weight: last ? 'Semibold' : 'Normal',
        color: last ? 'TextColor' : 'Primary1',
        pad: 0,
        wrap: false,
        onSelect: last ? undefined : `// Navigate(scr${c.replace(/[^A-Za-z0-9]/g, '') || 'Home'})`,
      });
      return last ? [label] : [label, icon(`imgCrumbSeparator${i + 1}`, 'chevronRight', 'IconFill', { w: 14, h: 14 })];
    });
    return {
      root: hCon('hConBreadcrumbs', { w: 480, h: 28, gap: 'Tiny', alignItems: 'Center' }, parts),
      notes: ['Replace each crumb’s OnSelect with a Navigate to its screen. The current page (the last crumb) has none.'],
    };
  },
};

export const stepper: KitItem = {
  slug: 'stepper',
  name: 'Stepper',
  category: 'Navigation',
  summary: 'Numbered steps for a multi-screen form: done, current and still to come, driven by one variable.',
  keywords: ['stepper', 'wizard', 'progress', 'steps', 'multi step form', 'status indicator'],
  canvas: { w: 620, h: 120 },
  options: [
    { id: 'steps', label: 'Steps (one per line)', type: 'lines', default: ['General information', 'Items', 'Attachments', 'Summary'] },
    { id: 'current', label: 'Current step in the preview', type: 'number', default: 2, min: 1, max: 6 },
  ],
  build(o) {
    const r = reader(o);
    const steps = r.lines('steps').slice(0, 6);
    const current = r.n('current');
    const sample = steps.map((Title, i) => ({ Step: i + 1, Title, Status: i + 1 < current ? 'Done' : i + 1 === current ? 'Current' : 'Open', Last: i === steps.length - 1 }));
    const width = 140;
    return {
      root: gal('galStepper', {
        dir: 'Horizontal',
        w: width * steps.length,
        h: 64,
        items: 'AddColumns(fxSteps, Status, If(Step < gblCurrentStep, "Done", Step = gblCurrentStep, "Current", "Open"))',
        sample,
        templateSize: width,
        template: (row) => {
          const status = String(row.sample.Status);
          const done = fx('ThisItem.Status = "Done"', status === 'Done');
          const cur = fx('ThisItem.Status = "Current"', status === 'Current');
          return [
            rect('shpStepLine', { x: fx('Parent.TemplateWidth / 2 + 18', width / 2 + 18), y: 15, w: fx('Parent.TemplateWidth - 36', width - 36), h: 2, fill: { if: done, then: 'SuccessColor', else: 'BorderColor' }, visible: fx('ThisItem.Step < CountRows(fxSteps)', !row.sample.Last) }),
            circle('shpStepDot', {
              x: fx('(Parent.TemplateWidth - 32) / 2', (width - 32) / 2),
              y: 0,
              w: 32,
              h: 32,
              fill: { switch: 'ThisItem.Status', cases: [['Done', 'SuccessColor'], ['Current', 'Primary1']], else: 'Fill', pick: status },
              border: { color: { switch: 'ThisItem.Status', cases: [['Done', 'SuccessColor'], ['Current', 'Primary1']], else: 'BorderColor', pick: status }, thickness: 'Regular' },
            }),
            lbl('lblStepNumber', {
              text: fx('If(ThisItem.Status = "Done", "✓", Text(ThisItem.Step))', status === 'Done' ? '✓' : String(row.sample.Step)),
              x: fx('(Parent.TemplateWidth - 32) / 2', (width - 32) / 2),
              y: 0,
              w: 32,
              h: 32,
              size: 'Small',
              weight: 'Bold',
              textAlign: 'Center',
              pad: 0,
              color: { if: fx('ThisItem.Status = "Open"', status === 'Open'), then: 'Primary3', else: 'SelectedColor' },
            }),
            lbl('lblStepTitle', {
              text: row.f('Title'),
              x: 0,
              y: 38,
              w: 'fill',
              h: 24,
              size: 'Tiny',
              weight: 'Semibold',
              textAlign: 'Center',
              pad: { x: 'Tiny', y: 0 },
              wrap: false,
              color: { if: cur, then: 'Primary1', else: 'TextColor' },
            }),
          ];
        },
      }),
      formulas: `fxSteps =\n[\n${steps.map((s, i) => `    { Step: ${i + 1}, Title: ${str(s)} }`).join(',\n')}\n];`,
      onVisible: ['// 1 on the first screen of the form, 2 on the second, and so on', 'Set(gblCurrentStep, 1)'].join('\n'),
      notes: ['Set gblCurrentStep on each screen of the form, or with Next and Back buttons: Set(gblCurrentStep, gblCurrentStep + 1).'],
      uses: [
        { name: 'fxSteps', what: 'Named formula: the steps' },
        { name: 'gblCurrentStep', what: 'Global variable: the step the user is on' },
      ],
    };
  },
};

export const pagination: KitItem = {
  slug: 'pagination',
  name: 'Pagination',
  category: 'Navigation',
  summary: 'Previous and next buttons with a page count, for galleries that show one page of records at a time.',
  keywords: ['pagination', 'paging', 'pages', 'next', 'previous'],
  canvas: { w: 460, h: 100 },
  options: [
    { id: 'size', label: 'Rows per page', type: 'number', default: 10, min: 5, max: 50, step: 5 },
    { id: 'page', label: 'Page in the preview', type: 'number', default: 2, min: 1, max: 8 },
  ],
  build(o) {
    const r = reader(o);
    const size = r.n('size');
    const page = r.n('page');
    const pages = 8;
    const ghost = { fill: 'Transparent', color: 'Primary1', border: { color: 'BorderColor', thickness: 'Thin' }, hoverFill: 'HoverFill', radius: 'Medium', size: 'Small' } as const;
    return {
      root: hCon('hConPagination', { w: 400, h: 40, gap: 'Small', alignItems: 'Center', justify: 'Center' }, [
        btn('btnPagePrevious', { ...ghost, text: 'Previous', w: 100, h: 34, disabled: fx('lclPage <= 1', page <= 1), onSelect: 'UpdateContext({ lclPage: lclPage - 1 })' }),
        lbl('lblPageCount', {
          text: fx(`"Page " & lclPage & " of " & Max(1, RoundUp(CountRows(colRequests) / ${size}, 0))`, `Page ${page} of ${pages}`),
          w: 140,
          h: 'fill',
          size: 'Small',
          textAlign: 'Center',
          color: 'Primary3',
        }),
        btn('btnPageNext', {
          ...ghost,
          text: 'Next',
          w: 100,
          h: 34,
          disabled: fx(`lclPage >= RoundUp(CountRows(colRequests) / ${size}, 0)`, page >= pages),
          onSelect: 'UpdateContext({ lclPage: lclPage + 1 })',
        }),
      ]),
      onVisible: 'UpdateContext({ lclPage: 1 })',
      notes: [
        `Set your gallery’s Items to FirstN(LastN(colRequests, CountRows(colRequests) - (lclPage - 1) * ${size}), ${size}) to show one page.`,
        'Reset to page 1 when the search or filters change: UpdateContext({ lclPage: 1 }).',
      ],
      uses: [
        { name: 'lclPage', what: 'Local variable: the page shown' },
        { name: 'colRequests', what: 'Collection: your records (rename to yours)' },
      ],
    };
  },
};

