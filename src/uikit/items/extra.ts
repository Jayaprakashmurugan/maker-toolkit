// Calendar, date picker, file and photo upload, line and pie charts, a top menu, a notification badge,
// an email dialog, an activity heatmap and a splash screen.

import { iconSvg, spinnerSvg } from '../icons';
import { addMedia, att, btn, circle, fx, gal, hCon, img, lbl, nCon, rect, str, txt, vCon, type Row } from '../model';
import { reader, type KitItem } from '../types';
import { icon, textWidth } from './shared';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

/** 42 days (6 weeks, Monday first) around a month, for the preview. */
function monthGrid(year: number, month: number, selected: number) {
  const first = new Date(Date.UTC(year, month, 1));
  const offset = (first.getUTCDay() + 6) % 7;
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(Date.UTC(year, month, 1 - offset + i));
    const inMonth = d.getUTCMonth() === month;
    return { Day: String(d.getUTCDate()), InMonth: inMonth, Today: inMonth && d.getUTCDate() === 3, Selected: inMonth && d.getUTCDate() === selected };
  });
}

/** The month calendar, shared by the Calendar and the Date picker. */
function calendarNode(selected: number, onPick: string) {
  const W = 300;
  const cell = Math.floor(W / 7);
  return vCon('vConCalendar', { w: W + 24, h: 330, fill: 'Fill', radius: 'Medium', border: { color: 'BorderColor', thickness: 'Thin' }, pad: 'Small', gap: 'Tiny', alignItems: 'Stretch' }, [
    hCon('hConCalendarHead', { w: 'fill', h: 40, alignItems: 'Center', gap: 'Tiny' }, [
      icon('imgCalendarPrev', 'chevronLeft', 'TextColor', { w: 32, h: 32, pad: 6, tooltip: 'Previous month', onSelect: 'UpdateContext({ lclMonthStart: DateAdd(lclMonthStart, -1, TimeUnit.Months) })' }),
      lbl('lblCalendarMonth', { text: fx('Text(lclMonthStart, "mmmm yyyy")', 'November 2026'), w: 'fill', h: 'fill', size: 'Regular', weight: 'Semibold', textAlign: 'Center', pad: 0 }),
      icon('imgCalendarNext', 'chevronRight', 'TextColor', { w: 32, h: 32, pad: 6, tooltip: 'Next month', onSelect: 'UpdateContext({ lclMonthStart: DateAdd(lclMonthStart, 1, TimeUnit.Months) })' }),
    ]),
    hCon('hConCalendarWeekdays', { w: 'fill', h: 24, alignItems: 'Center' }, WEEKDAYS.map((d, i) =>
      lbl(`lblWeekday${i + 1}`, { text: d, w: 'fill', h: 'fill', size: 'Tiny', weight: 'Semibold', color: 'Primary3', textAlign: 'Center', pad: 0 }),
    )),
    gal('galCalendarDays', {
      dir: 'Vertical',
      w: 'fill',
      h: 'fill',
      // 42 days from the Monday on or before the 1st of the month.
      items: 'ForAll(Sequence(42), DateAdd(lclMonthStart, Value - Weekday(lclMonthStart, StartOfWeek.Monday), TimeUnit.Days))',
      sample: monthGrid(2026, 10, selected),
      wrapCount: 7,
      templateSize: 38,
      template: (row: Row) => {
        const picked = fx('ThisItem.Value = lclSelectedDate', Boolean(row.sample.Selected));
        const inMonth = fx('Month(ThisItem.Value) = Month(lclMonthStart)', Boolean(row.sample.InMonth));
        const today = fx('ThisItem.Value = Today()', Boolean(row.sample.Today));
        return [
          btn('btnCalendarDay', {
            x: fx('(Parent.TemplateWidth - 34) / 2', (cell - 34) / 2),
            y: 2,
            w: 34,
            h: 34,
            text: fx('Text(Day(ThisItem.Value))', String(row.sample.Day)),
            size: 'Small',
            weight: 'Normal',
            radius: 17,
            fill: { if: picked, then: 'SelectedFill', else: 'Transparent' },
            color: { if: picked, then: 'SelectedColor', else: { if: inMonth, then: 'TextColor', else: 'DisabledColor' } },
            border: { color: { if: today, then: 'Primary1', else: 'Transparent' }, thickness: 'Thin' },
            hoverFill: { if: picked, then: 'SelectedFill', else: 'HoverFill' },
            hoverColor: { if: picked, then: 'SelectedColor', else: 'TextColor' },
            onSelect: onPick,
          }),
        ];
      },
    }),
  ]);
}

const calendarStart = 'UpdateContext({ lclMonthStart: Date(Year(Today()), Month(Today()), 1), lclSelectedDate: Today() })';

export const calendar: KitItem = {
  slug: 'calendar',
  name: 'Calendar',
  category: 'Inputs',
  summary: 'A month calendar with previous and next, today ringed and the picked day filled. Weeks start on Monday.',
  keywords: ['calendar', 'month', 'date', 'schedule', 'day picker', 'agenda'],
  canvas: { w: 420, h: 380 },
  options: [{ id: 'day', label: 'Selected day in the preview', type: 'number', default: 12, min: 1, max: 30 }],
  build(o) {
    return {
      root: calendarNode(reader(o).n('day'), 'UpdateContext({ lclSelectedDate: ThisItem.Value })'),
      onVisible: calendarStart,
      notes: [
        'The days come from one formula over lclMonthStart, so no collection is needed. Weekday(…, StartOfWeek.Monday) makes Monday the first column.',
        'Show events on a day: add a dot under the number with Visible: !IsEmpty(Filter(colEvents, DateValue(Start) = ThisItem.Value)).',
      ],
      uses: [
        { name: 'lclMonthStart', what: 'Local variable: the 1st of the month shown' },
        { name: 'lclSelectedDate', what: 'Local variable: the day the user picked' },
      ],
    };
  },
};

export const datePicker: KitItem = {
  slug: 'date-picker',
  name: 'Date picker',
  category: 'Inputs',
  summary: 'A date field that opens the month calendar under it. Picking a day fills the field and closes it.',
  keywords: ['date picker', 'date field', 'calendar', 'due date', 'input', 'form'],
  canvas: { w: 420, h: 460 },
  options: [
    { id: 'label', label: 'Label', type: 'text', default: 'Needed by' },
    { id: 'open', label: 'Open in the preview', type: 'toggle', default: true },
  ],
  build(o) {
    const r = reader(o);
    const open = r.b('open');
    const cal = calendarNode(12, 'UpdateContext({ lclSelectedDate: ThisItem.Value, lclShowDatePicker: false })');
    return {
      root: nCon('nConDatePicker', { w: 340, h: fx('If(lclShowDatePicker, 420, 70)', open ? 420 : 70) }, [
        lbl('lblDateLabel', { text: r.s('label'), x: 0, y: 0, w: 324, h: 22, size: 'Small', weight: 'Semibold', pad: 0 }),
        hCon('hConDateField', { x: 0, y: 26, w: 324, h: 38, fill: 'Fill', radius: 'Small', border: { color: { if: fx('lclShowDatePicker', open), then: 'Primary1', else: 'BorderColor' }, thickness: 'Thin' }, pad: { x: 'Small' }, gap: 'Small', alignItems: 'Center' }, [
          lbl('lblDateValue', { text: fx('If(IsBlank(lclSelectedDate), "Pick a date", Text(lclSelectedDate, "dd mmm yyyy"))', '12 Nov 2026'), w: 'fill', h: 'fill', size: 'Small', pad: 0 }),
          icon('imgDateIcon', 'calendar', 'Primary3', { w: 20, h: 20 }),
        ]),
        btn('btnDateField', {
          x: 0,
          y: 26,
          w: 324,
          h: 38,
          text: '',
          fill: 'Transparent',
          color: 'Transparent',
          hoverFill: 'Transparent',
          pressedFill: 'Transparent',
          tooltip: r.s('label'),
          onSelect: 'UpdateContext({ lclShowDatePicker: !lclShowDatePicker })',
        }),
        { ...cal, x: 0, y: 72, visible: fx('lclShowDatePicker', open) },
      ]),
      onVisible: 'UpdateContext({ lclMonthStart: Date(Year(Today()), Month(Today()), 1), lclSelectedDate: Blank(), lclShowDatePicker: false })',
      notes: [
        'Paste it high in the tree view (or last) so the open calendar covers what’s under it.',
        'Read the date with lclSelectedDate, e.g. Patch(colRequests, …, { NeededBy: lclSelectedDate }).',
      ],
      uses: [
        { name: 'lclSelectedDate', what: 'Local variable: the chosen date' },
        { name: 'lclShowDatePicker', what: 'Local variable: true while the calendar is open' },
        { name: 'lclMonthStart', what: 'Local variable: the month shown' },
      ],
    };
  },
};

const FILES = [
  { Name: 'Quote_Dell_Latitude.pdf', Kind: 'PDF' },
  { Name: 'Cost-center-approval.docx', Kind: 'Word' },
  { Name: 'Specs.xlsx', Kind: 'Excel' },
];

export const fileUpload: KitItem = {
  slug: 'file-upload',
  name: 'File upload',
  category: 'Inputs',
  summary: 'A drop zone for files, with the list of what was added and a remove button on each. Works outside a form.',
  keywords: ['file upload', 'attachments', 'drag and drop', 'drop zone', 'documents', 'upload'],
  canvas: { w: 520, h: 400, bg: 'page' },
  options: [
    { id: 'maxFiles', label: 'Most files', type: 'number', default: 10, min: 1, max: 30 },
    { id: 'maxSize', label: 'Largest file (MB)', type: 'number', default: 10, min: 1, max: 50 },
  ],
  build(o) {
    const r = reader(o);
    const W = 440;
    return {
      root: vCon('vConFileUpload', { w: W, h: 340, gap: 'Small', alignItems: 'Stretch' }, [
        nCon('nConDropZone', { w: 'fill', h: 150, fill: 'Fill', radius: 'Medium', border: { color: 'BorderColor', thickness: 'Regular', dashed: true } }, [
          vCon('vConDropText', { x: 0, y: 0, w: 'fill', h: 'fill', gap: 'Tiny', alignItems: 'Center', justify: 'Center' }, [
            icon('imgDropIcon', 'upload', 'Primary1', { w: 44, h: 44, pad: 10, fill: 'Primary2', radius: 22 }),
            lbl('lblDropTitle', { text: 'Drop files here, or click to browse', w: 'fill', h: 24, size: 'Small', weight: 'Semibold', textAlign: 'Center', pad: 0 }),
            lbl('lblDropHint', { text: `Up to ${r.n('maxFiles')} files, ${r.n('maxSize')} MB each`, w: 'fill', h: 20, size: 'Tiny', color: 'Primary3', textAlign: 'Center', pad: 0 }),
          ]),
          // A clear Attachments control over the zone catches drops and clicks.
          att('attFileDrop', {
            x: 0,
            y: 0,
            w: 'fill',
            h: 'fill',
            maxFiles: r.n('maxFiles'),
            maxSizeMB: r.n('maxSize'),
            tooltip: 'Add files',
            onAdd: ['Collect(colFiles, Self.Attachments);', 'Reset(Self)'].join('\n'),
          }),
        ]),
        gal('galFiles', {
          dir: 'Vertical',
          w: 'fill',
          h: 'fill',
          items: 'colFiles',
          fill: 'Fill',
          sample: FILES,
          templateSize: 44,
          template: (row: Row) => [
            hCon('hConFileRow', { x: 0, y: 0, w: 'fill', h: 'fill', pad: { x: 'Small' }, gap: 'Small', alignItems: 'Center' }, [
              icon('imgFileIcon', 'file', 'Primary1', { w: 22, h: 22 }),
              lbl('lblFileName', { text: row.f('Name'), w: 'fill', h: 'fill', size: 'Small', pad: 0, wrap: false }),
              icon('imgFileRemove', 'close', 'Primary3', { w: 26, h: 26, pad: 5, tooltip: 'Remove', onSelect: 'Remove(colFiles, ThisItem)' }),
            ]),
            rect('shpFileDivider', { x: 0, y: fx('Parent.TemplateHeight - 1', 43), w: 'fill', h: 1, fill: 'Secondary3' }),
          ],
        }),
      ]),
      onVisible: 'Clear(colFiles)',
      notes: [
        'Each file in colFiles has Name and Value (the file itself). Send them to a flow, or Patch them into a SharePoint item’s Attachments with { Attachments: colFiles }.',
        'The Attachments control is see-through and lies on top of the dashed zone, so dropping or clicking anywhere on it works. Only its drop highlight shows.',
      ],
      uses: [{ name: 'colFiles', what: 'Collection: the files added (Name and Value)' }],
    };
  },
};

const PHOTOS = [{ Kind: 'a' }, { Kind: 'b' }, { Kind: 'c' }];

export const photoUpload: KitItem = {
  slug: 'photo-upload',
  name: 'Photo upload',
  category: 'Inputs',
  summary: 'Take or pick photos: thumbnails with remove buttons and an Add photo tile. On a phone it opens the camera.',
  keywords: ['photo', 'camera', 'image upload', 'add picture', 'gallery', 'mobile'],
  canvas: { w: 520, h: 200, bg: 'page' },
  options: [{ id: 'size', label: 'Tile size', type: 'number', default: 96, min: 72, max: 140, step: 4 }],
  build(o) {
    const size = reader(o).n('size');
    const gap = 8;
    return {
      root: hCon('hConPhotos', { w: 480, h: size, gap: 'Small', alignItems: 'Center' }, [
        gal('galPhotos', {
          dir: 'Horizontal',
          w: fx(`Min(CountRows(colPhotos), 3) * ${size + gap}`, 3 * (size + gap)),
          h: 'fill',
          items: 'colPhotos',
          sample: PHOTOS,
          templateSize: size,
          templatePad: gap / 2,
          template: (row: Row) => [
            img('imgPhoto', {
              x: 0,
              y: 0,
              w: 'fill',
              h: 'fill',
              radius: 'Medium',
              fill: 'Secondary3',
              label: 'Photo',
              extra: { Image: 'ThisItem.Image', ImagePosition: 'ImagePosition.Fill' },
              svg: (hex) => {
                const tones: Record<string, [string, string]> = { a: ['Accent3', 'Primary2'], b: ['Primary1', 'Accent1'], c: ['Accent2', 'Primary2'] };
                const [a, b] = tones[String(row.sample.Kind)] ?? tones.a;
                return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'><rect width='100' height='100' fill='${hex(b)}'/><path d='M0 78 L30 52 L52 70 L72 48 L100 74 L100 100 L0 100Z' fill='${hex(a)}'/><circle cx='72' cy='28' r='10' fill='${hex('White')}'/></svg>`;
              },
            }),
            icon('imgPhotoRemove', 'close', 'White', { x: fx('Parent.TemplateWidth - 28', size - 28), y: 4, w: 24, h: 24, pad: 5, fill: { rgba: [20, 28, 38, 0.55] }, radius: 12, tooltip: 'Remove photo', onSelect: 'Remove(colPhotos, ThisItem)' }),
          ],
        }),
        nCon('nConAddPhoto', { w: size, h: size, fill: 'Fill', radius: 'Medium', border: { color: 'BorderColor', thickness: 'Regular', dashed: true }, visible: fx('CountRows(colPhotos) < 3', true) }, [
          vCon('vConAddPhotoText', { x: 0, y: 0, w: 'fill', h: 'fill', gap: 'Tiny', alignItems: 'Center', justify: 'Center' }, [
            icon('imgAddPhotoIcon', 'plus', 'Primary1', { w: 24, h: 24 }),
            lbl('lblAddPhoto', { text: 'Add photo', w: 'fill', h: 20, size: 'Tiny', weight: 'Semibold', color: 'Primary1', textAlign: 'Center', pad: 0 }),
          ]),
          addMedia('btnAddPhoto', { x: 0, y: 0, w: 'fill', h: 'fill', text: '', onChange: 'Collect(colPhotos, { Id: GUID(), Image: Self.Media })' }),
        ]),
      ]),
      onVisible: 'Clear(colPhotos)',
      notes: [
        'The Add picture control (btnAddPhoto) is clear and covers the dashed tile. On phones it offers the camera; on a computer it opens a file picker.',
        'Up to three photos here; change the 3 in the gallery’s Width and the tile’s Visible for more. Each photo is in colPhotos as Image.',
      ],
      uses: [{ name: 'colPhotos', what: 'Collection: the photos (Id and Image)' }],
    };
  },
};

const TREND = [
  { Label: 'Jun', Amount: 18 },
  { Label: 'Jul', Amount: 24 },
  { Label: 'Aug', Amount: 21 },
  { Label: 'Sep', Amount: 33 },
  { Label: 'Oct', Amount: 29 },
  { Label: 'Nov', Amount: 41 },
];

export const lineChart: KitItem = {
  slug: 'line-chart',
  name: 'Line chart',
  category: 'Data display',
  summary: 'A trend line with a soft area under it, drawn as an SVG from your rows, and the labels underneath.',
  keywords: ['line chart', 'trend', 'graph', 'chart', 'time series', 'dashboard', 'svg'],
  canvas: { w: 540, h: 320 },
  options: [
    { id: 'title', label: 'Title', type: 'text', default: 'Requests per month' },
    { id: 'items', label: 'Items (Label and Amount)', type: 'text', default: 'colTrend' },
  ],
  build(o) {
    const r = reader(o);
    const items = r.s('items') || 'colTrend';
    const W = 400;
    const max = Math.max(...TREND.map((d) => d.Amount));
    const pts = TREND.map((d, i) => `${((i * W) / (TREND.length - 1)).toFixed(1)},${(150 - (d.Amount / max) * 130).toFixed(1)}`).join(' ');
    // x from the row's position, y from its Amount; "en-US" keeps the decimal point a dot.
    const points = [
      'Concat(',
      `    ForAll(Sequence(CountRows(${items})), With({ lclPoint: Index(${items}, Value) },`,
      `        Text((Value - 1) * ${W} / Max(1, CountRows(${items}) - 1), "0.0", "en-US") & "," & Text(150 - lclPoint.Amount / Max(${items}, Amount) * 130, "0.0", "en-US"))),`,
      '    Value, " ")',
    ].join('\n');
    return {
      root: vCon('vConLineChart', { w: 460, h: 280, fill: 'Fill', radius: 'Medium', border: { color: 'BorderColor', thickness: 'Thin' }, pad: 'Regular', gap: 'Small', alignItems: 'Stretch' }, [
        hCon('hConLineChartHead', { w: 'fill', h: 26, alignItems: 'Center' }, [
          lbl('lblLineChartTitle', { text: r.s('title'), w: 'fill', h: 'fill', size: 'Subtitle', weight: 'Semibold', pad: 0 }),
          lbl('lblLineChartMax', { text: fx(`"Peak " & Max(${items}, Amount)`, `Peak ${max}`), w: 90, h: 'fill', size: 'Tiny', color: 'Primary3', textAlign: 'Right', pad: 0 }),
        ]),
        img('imgLineChart', {
          w: 'fill',
          h: 'fill',
          label: r.s('title'),
          extra: { ImagePosition: 'ImagePosition.Stretch' },
          svg: (hex, mode) => {
            const p = mode === 'preview' ? pts : `" & ${points} & "`;
            return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${W} 160' preserveAspectRatio='none'><path d='M0 150H${W}' stroke='${hex('GrayMediumLight')}' stroke-width='1'/><polygon points='0,150 ${p} ${W},150' fill='${hex('Primary1')}' fill-opacity='0.12'/><polyline points='${p}' fill='none' stroke='${hex('Primary1')}' stroke-width='3' stroke-linejoin='round' stroke-linecap='round' vector-effect='non-scaling-stroke'/></svg>`;
          },
        }),
        gal('galLineChartLabels', {
          dir: 'Horizontal',
          w: 'fill',
          h: 20,
          items,
          sample: TREND,
          templateSize: Math.floor(428 / TREND.length),
          extra: { TemplateSize: `Self.Width / Max(1, CountRows(${items}))` },
          template: (row: Row) => [lbl('lblLineChartLabel', { text: row.f('Label'), x: 0, y: 0, w: 'fill', h: 'fill', size: 'Tiny', color: 'Primary3', textAlign: 'Center', pad: 0 })],
        }),
      ]),
      formulas: `// Sample data: replace with your own rows that have Label and Amount.\nfxTrend =\n[\n${TREND.map((d) => `    { Label: ${str(d.Label)}, Amount: ${d.Amount} }`).join(',\n')}\n];`,
      onVisible: 'ClearCollect(colTrend, fxTrend)',
      notes: [
        'The line is an SVG polyline: each row becomes an x,y point, built with Concat over ForAll(Sequence(…)). Text(…, "0.0", "en-US") keeps a dot as the decimal point in every language.',
        'Group your records per month first, e.g. AddColumns(GroupBy(colRequests, Month, Rows), Label, Month, Amount, CountRows(Rows)).',
      ],
      uses: [{ name: 'colTrend', what: 'Collection: rows with Label and Amount, in order' }],
    };
  },
};

const SLICES = [
  { Label: 'Hardware', Amount: 46 },
  { Label: 'Software', Amount: 28 },
  { Label: 'Travel', Amount: 16 },
  { Label: 'Other', Amount: 10 },
];
const PALETTE = ['Primary1', 'Accent3', 'Accent2', 'Primary3', 'SuccessColor', 'ErrorColor'];

export const pieChart: KitItem = {
  slug: 'pie-chart',
  name: 'Pie chart',
  category: 'Data display',
  summary: 'A donut chart with a legend and percentages, drawn as one SVG. Slice colors come from the design system.',
  keywords: ['pie chart', 'donut', 'share', 'breakdown', 'chart', 'legend', 'svg'],
  canvas: { w: 540, h: 290 },
  options: [
    { id: 'title', label: 'Title', type: 'text', default: 'Spend by category' },
    { id: 'items', label: 'Items (Label and Amount)', type: 'text', default: 'colSlices' },
  ],
  build(o) {
    const r = reader(o);
    const items = r.s('items') || 'colSlices';
    const C = 251.33;
    const total = SLICES.reduce((n, s) => n + s.Amount, 0);
    const palette = `Index(fxChartPalette, Mod(Value - 1, CountRows(fxChartPalette)) + 1).Hex`;
    const segments = [
      'Concat(',
      `    ForAll(Sequence(CountRows(${items})), With({ lclSlice: Index(${items}, Value), lclTotal: Sum(${items}, Amount), lclBefore: Sum(FirstN(${items}, Value - 1), Amount) },`,
      `        "<circle cx='50' cy='50' r='40' fill='none' stroke-width='16' transform='rotate(-90 50 50)' stroke='" & ${palette} &`,
      `        "' stroke-dasharray='" & Text(lclSlice.Amount / lclTotal * ${C}, "0.00", "en-US") & " ${C}' stroke-dashoffset='" & Text(-lclBefore / lclTotal * ${C}, "0.00", "en-US") & "'/>")),`,
      '    Value)',
    ].join('\n');
    let before = 0;
    const previewSegments = (hex: (k: string) => string) =>
      SLICES.map((s, i) => {
        const dash = ((s.Amount / total) * C).toFixed(2);
        const off = ((-before / total) * C).toFixed(2);
        before += s.Amount;
        return `<circle cx='50' cy='50' r='40' fill='none' stroke-width='16' transform='rotate(-90 50 50)' stroke='${hex(PALETTE[i % PALETTE.length])}' stroke-dasharray='${dash} ${C}' stroke-dashoffset='${off}'/>`;
      }).join('');
    return {
      root: vCon('vConPieChart', { w: 460, h: 250, fill: 'Fill', radius: 'Medium', border: { color: 'BorderColor', thickness: 'Thin' }, pad: 'Regular', gap: 'Small', alignItems: 'Stretch' }, [
        lbl('lblPieTitle', { text: r.s('title'), w: 'fill', h: 26, size: 'Subtitle', weight: 'Semibold', pad: 0 }),
        hCon('hConPieBody', { w: 'fill', h: 'fill', gap: 'Large', alignItems: 'Center' }, [
          nCon('nConPie', { w: 170, h: 170 }, [
            img('imgPie', {
              x: 0,
              y: 0,
              w: 170,
              h: 170,
              label: r.s('title'),
              svg: (hex, mode) => {
                before = 0;
                return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='40' fill='none' stroke='${hex('Secondary3')}' stroke-width='16'/>${mode === 'preview' ? previewSegments(hex) : `" & ${segments} & "`}</svg>`;
              },
            }),
            vCon('vConPieCenter', { x: 35, y: 55, w: 100, h: 60, justify: 'Center', alignItems: 'Center' }, [
              lbl('lblPieTotal', { text: fx(`Text(Sum(${items}, Amount))`, String(total)), w: 'fill', h: 34, size: 'Headline', weight: 'Bold', textAlign: 'Center', pad: 0 }),
              lbl('lblPieCaption', { text: 'total', w: 'fill', h: 18, size: 'Tiny', color: 'Primary3', textAlign: 'Center', pad: 0 }),
            ]),
          ]),
          gal('galPieLegend', {
            dir: 'Vertical',
            w: 'fill',
            h: SLICES.length * 32,
            items: `ForAll(Sequence(CountRows(${items})), With({ lclSlice: Index(${items}, Value) }, { Label: lclSlice.Label, Amount: lclSlice.Amount, Hex: ${palette} }))`,
            sample: SLICES.map((s, i) => ({ ...s, Hex: PALETTE[i % PALETTE.length] })),
            templateSize: 32,
            template: (row: Row) => [
              circle('shpLegendDot', { x: 0, y: 11, w: 10, h: 10, fill: fx('ColorValue(ThisItem.Hex)', `var(--k-${row.sample.Hex})`) }),
              lbl('lblLegendLabel', { text: row.f('Label'), x: 18, y: 0, w: fx('Parent.TemplateWidth - 70', 150), h: 'fill', size: 'Small', pad: 0, wrap: false }),
              lbl('lblLegendShare', {
                text: fx(`Text(ThisItem.Amount / Sum(${items}, Amount), "0%")`, `${Math.round(((row.sample.Amount as number) / total) * 100)}%`),
                x: fx('Parent.TemplateWidth - 50', 170),
                y: 0,
                w: 50,
                h: 'fill',
                size: 'Small',
                weight: 'Semibold',
                textAlign: 'Right',
                pad: 0,
              }),
            ],
          }),
        ]),
      ]),
      formulas: [
        '// Slice colors, in order. Every one comes from the design system.',
        'fxChartPalette =',
        '[',
        PALETTE.map((k) => `    { Hex: fxColorConfigs.HexColors.${k} }`).join(',\n'),
        '];',
        '',
        '// Sample data: replace with your own rows that have Label and Amount.',
        'fxSlices =',
        '[',
        SLICES.map((s) => `    { Label: ${str(s.Label)}, Amount: ${s.Amount} }`).join(',\n'),
        '];',
      ].join('\n'),
      onVisible: 'ClearCollect(colSlices, fxSlices)',
      notes: [
        'Each slice is one SVG circle whose dash is its share of the circle, offset by the slices before it (Sum(FirstN(…))). Sort the rows biggest first for the clearest chart.',
        'The legend uses the same colors (fxChartPalette), so slices and dots always match.',
      ],
      uses: [
        { name: 'fxChartPalette', what: 'Named formula: slice colors from HexColors' },
        { name: 'colSlices', what: 'Collection: rows with Label and Amount' },
      ],
    };
  },
};

const MENU = [
  { Title: 'Requests', Items: ['All requests', 'My requests', 'New request'] },
  { Title: 'Approvals', Items: ['Waiting for me', 'Approved', 'Rejected'] },
  { Title: 'Reports', Items: ['Spend by month', 'By cost center'] },
  { Title: 'Settings', Items: ['Profile', 'Notifications'] },
];

export const topMenu: KitItem = {
  slug: 'top-menu',
  name: 'Top menu with dropdowns',
  category: 'Navigation',
  summary: 'A horizontal menu bar where each item opens a dropdown of links. One variable tracks the open menu.',
  keywords: ['menu', 'top navigation', 'dropdown', 'menu bar', 'navbar', 'mega menu'],
  canvas: { w: 860, h: 300, bg: 'page' },
  options: [
    { id: 'brand', label: 'App name', type: 'text', default: 'Requests' },
    { id: 'open', label: 'Open menu in the preview', type: 'number', default: 1, min: 0, max: 4 },
  ],
  build(o) {
    const r = reader(o);
    const openIdx = r.n('open') - 1;
    const openName = MENU[openIdx]?.Title ?? '';
    const brandW = textWidth(r.s('brand'), 16) + 24;
    let x = 16 + brandW + 16;
    const placed = MENU.map((m) => {
      const w = textWidth(m.Title, 12) + 34;
      const at = { ...m, x, w };
      x += w + 4;
      return at;
    });
    const openMenu = placed[openIdx];
    return {
      root: nCon('nConTopMenu', { w: 820, h: 260 }, [
        hCon('hConTopMenuBar', { x: 0, y: 0, w: 'fill', h: 56, fill: 'Fill', border: { color: 'BorderColor', thickness: 'Thin' }, radius: 'Medium', pad: { x: 'Regular' }, alignItems: 'Center' }, [
          lbl('lblTopMenuBrand', { text: r.s('brand'), w: brandW, h: 'fill', size: 'Subtitle', weight: 'Bold', color: 'Primary1', pad: 0 }),
        ]),
        ...placed.map((m, i) =>
          btn(`btnMenu${i + 1}`, {
            x: m.x,
            y: 10,
            w: m.w,
            h: 36,
            text: `${m.Title}  ▾`,
            size: 'Small',
            weight: 'Semibold',
            radius: 'Small',
            fill: { if: fx(`lclOpenMenu = "${m.Title}"`, openName === m.Title), then: 'HoverFill', else: 'Transparent' },
            color: { if: fx(`lclOpenMenu = "${m.Title}"`, openName === m.Title), then: 'Primary1', else: 'TextColor' },
            hoverFill: 'HoverFill',
            hoverColor: 'Primary1',
            onSelect: `UpdateContext({ lclOpenMenu: If(lclOpenMenu = "${m.Title}", Blank(), "${m.Title}") })`,
          }),
        ),
        vCon(
          'vConTopMenuDropdown',
          {
            x: fx(`Switch(lclOpenMenu, ${placed.map((m) => `"${m.Title}", ${m.x}`).join(', ')}, 0)`, openMenu?.x ?? 0),
            y: 60,
            w: 220,
            h: fx('CountRows(LookUp(fxMenu, Title = lclOpenMenu).Items) * 40 + 16', (openMenu?.Items.length ?? 2) * 40 + 16),
            fill: 'Fill',
            radius: 'Medium',
            border: { color: 'BorderColor', thickness: 'Thin' },
            shadow: 'Semilight',
            pad: { y: 'Small' },
            alignItems: 'Stretch',
            visible: fx('!IsBlank(lclOpenMenu)', Boolean(openMenu)),
          },
          [
            gal('galTopMenuItems', {
              dir: 'Vertical',
              w: 'fill',
              h: 'fill',
              items: 'LookUp(fxMenu, Title = lclOpenMenu).Items',
              sample: (openMenu?.Items ?? []).map((Title) => ({ Title })),
              templateSize: 40,
              template: (row: Row) => [
                lbl('lblTopMenuItem', { text: row.f('Title'), x: 0, y: 0, w: 'fill', h: 'fill', size: 'Small', pad: { x: 'Regular' }, wrap: false }),
                btn('btnTopMenuItem', {
                  x: 0,
                  y: 0,
                  w: 'fill',
                  h: 'fill',
                  text: '',
                  fill: 'Transparent',
                  color: 'Transparent',
                  hoverFill: { rgba: [0, 0, 0, 0.04] },
                  pressedFill: 'Transparent',
                  onSelect: ['UpdateContext({ lclOpenMenu: Blank() });', '// Navigate(ThisItem.Screen)'].join('\n'),
                }),
              ],
            }),
          ],
        ),
      ]),
      formulas: `fxMenu =\n[\n${MENU.map((m) => `    { Title: ${str(m.Title)}, Items: [${m.Items.map((it) => `{ Title: ${str(it)} }`).join(', ')}] }`).join(',\n')}\n];`,
      onVisible: 'UpdateContext({ lclOpenMenu: Blank() })',
      notes: [
        'The dropdown moves under the open menu with Switch(lclOpenMenu, …) on its X, and its height follows the number of links.',
        'Add a Screen to each link, e.g. { Title: "New request", Screen: scrNewRequest }, and Navigate(ThisItem.Screen) in the link’s OnSelect.',
      ],
      uses: [
        { name: 'fxMenu', what: 'Named formula: menus and their links' },
        { name: 'lclOpenMenu', what: 'Local variable: the open menu, blank when closed' },
      ],
    };
  },
};

export const notificationBadge: KitItem = {
  slug: 'notification-badge',
  name: 'Notification badge',
  category: 'Feedback',
  summary: 'A bell with an unread count on it. The badge shows 1 to 9, then 9+, and hides when there’s nothing new.',
  keywords: ['badge', 'notification', 'bell', 'count', 'unread', 'alerts', 'indicator'],
  canvas: { w: 180, h: 110, bg: 'page', zoom: 2.4 },
  options: [
    { id: 'count', label: 'Count formula', type: 'text', default: 'CountRows(Filter(colNotifications, !IsRead))' },
    { id: 'preview', label: 'Count in the preview', type: 'number', default: 4, min: 0, max: 30 },
  ],
  build(o) {
    const r = reader(o);
    const n = r.n('preview');
    const count = r.s('count') || '0';
    return {
      root: nCon('nConBadge', { w: 48, h: 44 }, [
        img('imgBadgeBell', { x: 4, y: 8, w: 32, h: 32, pad: 3, label: 'Notifications', tooltip: 'Notifications', svg: (hex) => iconSvg('bell', hex('TextColor')), onSelect: '// UpdateContext({ lclShowNotifications: true })' }),
        hCon('hConBadgeCount', { x: 22, y: 2, w: fx(`If(${count} > 9, 26, 20)`, n > 9 ? 26 : 20), h: 20, radius: 10, fill: 'ErrorColor', border: { color: 'Fill', thickness: 'Regular' }, justify: 'Center', alignItems: 'Center', visible: fx(`${count} > 0`, n > 0) }, [
          lbl('lblBadgeCount', { text: fx(`If(${count} > 9, "9+", Text(${count}))`, n > 9 ? '9+' : String(n)), w: 'fill', h: 'fill', size: 9, weight: 'Bold', color: 'SelectedColor', textAlign: 'Center', pad: 0 }),
        ]),
      ]),
      notes: ['Put it in a header next to the user’s initials. It uses ErrorColor with a Fill border, so it stands out on light and colored headers alike.'],
      uses: [{ name: 'colNotifications', what: 'Collection: notifications with an IsRead column (or use your own count)' }],
    };
  },
};

export const emailDialog: KitItem = {
  slug: 'email-dialog',
  name: 'Email compose dialog',
  category: 'Feedback',
  summary: 'Write and send an email without leaving the app: To, Cc, Subject and a message, sent through Outlook.',
  keywords: ['email', 'send email', 'compose', 'outlook', 'mail', 'dialog', 'office 365'],
  canvas: { w: 720, h: 520, bg: 'page' },
  options: [
    { id: 'title', label: 'Title', type: 'text', default: 'Email the requester' },
    { id: 'subject', label: 'Subject to start with', type: 'text', default: 'About your request' },
  ],
  build(o) {
    const r = reader(o);
    const row = (key: string, label: string, input: ReturnType<typeof txt>) =>
      hCon(`hConEmail${key}`, { w: 'fill', h: 36, gap: 'Small', alignItems: 'Center' }, [lbl(`lblEmail${key}`, { text: label, w: 64, h: 'fill', size: 'Small', color: 'Primary3', pad: 0 }), input]);
    const field = (name: string, hint: string, value?: string) =>
      txt(name, { w: 'fill', h: 34, hint, value, size: 'Small', radius: 'Small', border: { color: 'BorderColor', thickness: 'Thin' }, pad: { x: 'Small' } });
    return {
      root: nCon('nConEmailOverlay', { w: fx('App.Width', 720), h: fx('App.Height', 520), fill: { rgba: [20, 28, 38, 0.45] }, visible: fx('lclShowEmail', true) }, [
        vCon('vConEmailDialog', { w: 520, h: 440, x: fx('(Parent.Width - Self.Width) / 2', 100), y: fx('(Parent.Height - Self.Height) / 2', 40), fill: 'Fill', radius: 'Medium', shadow: 'Semilight', pad: 'Large', gap: 'Small', alignItems: 'Stretch' }, [
          hCon('hConEmailHead', { w: 'fill', h: 32, alignItems: 'Center' }, [
            lbl('lblEmailTitle', { text: r.s('title'), w: 'fill', h: 'fill', size: 'Subtitle', weight: 'Semibold', pad: 0 }),
            icon('imgEmailClose', 'close', 'TextColor', { w: 28, h: 28, pad: 5, tooltip: 'Close', onSelect: 'UpdateContext({ lclShowEmail: false })' }),
          ]),
          row('To', 'To', field('txtEmailTo', 'name@contoso.com; another@contoso.com', 'anna.weber@contoso.com')),
          row('Cc', 'Cc', field('txtEmailCc', 'Optional')),
          row('Subject', 'Subject', field('txtEmailSubject', 'Subject', r.s('subject'))),
          txt('txtEmailBody', { w: 'fill', h: 'fill', mode: 'MultiLine', hint: 'Write your message', size: 'Small', radius: 'Small', border: { color: 'BorderColor', thickness: 'Thin' }, pad: 'Small' }),
          hCon('hConEmailActions', { w: 'fill', h: 38, gap: 'Small', justify: 'End', alignItems: 'Center' }, [
            btn('btnEmailCancel', { text: 'Cancel', w: 100, h: 36, fill: 'Fill', color: 'TextColor', border: { color: 'BorderColor', thickness: 'Thin' }, hoverFill: 'HoverFill', radius: 'Medium', size: 'Small', onSelect: 'UpdateContext({ lclShowEmail: false })' }),
            btn('btnEmailSend', {
              text: 'Send',
              w: 110,
              h: 36,
              fill: 'Primary1',
              hoverFill: { fade: 'Primary1', by: -15 },
              radius: 'Medium',
              size: 'Small',
              disabled: fx('IsBlank(txtEmailTo.Text) || IsBlank(txtEmailSubject.Text)', false),
              onSelect: [
                'Office365Outlook.SendEmailV2(',
                '    txtEmailTo.Text,',
                '    txtEmailSubject.Text,',
                '    Substitute(txtEmailBody.Text, Char(10), "<br>"),',
                '    { Cc: txtEmailCc.Text }',
                ');',
                'Notify("Email sent.", NotificationType.Success);',
                'UpdateContext({ lclShowEmail: false })',
              ].join('\n'),
            }),
          ]),
        ]),
      ]),
      onVisible: 'UpdateContext({ lclShowEmail: false })',
      notes: [
        'Add the Office 365 Outlook connector to the app first (Data, Add data, Office 365 Outlook). The email goes out from the signed-in user’s mailbox.',
        'Prefill To from the record, e.g. Default: gblSelectedItem.\'Created By\'.Email, and open it with UpdateContext({ lclShowEmail: true }). Separate several addresses with semicolons.',
      ],
      uses: [{ name: 'lclShowEmail', what: 'Local variable: true while the dialog is open' }],
    };
  },
};

/** Deterministic sample counts for 5 weeks. */
const HEAT = Array.from({ length: 35 }, (_, i) => ({ Count: Math.max(0, [0, 2, 5, 3, 7, 1, 0][i % 7] + ((i * 7) % 5) - (i % 3 === 0 ? 1 : 0)) }));

export const heatmap: KitItem = {
  slug: 'activity-heatmap',
  name: 'Activity heatmap',
  category: 'Data display',
  summary: 'Five weeks of activity as a grid of days: the darker the square, the busier the day. With a legend.',
  keywords: ['heatmap', 'activity', 'calendar heatmap', 'contributions', 'chart', 'busy days'],
  canvas: { w: 460, h: 320 },
  options: [
    { id: 'title', label: 'Title', type: 'text', default: 'Requests per day' },
    { id: 'items', label: 'Items (35 days, with Count)', type: 'text', default: 'colActivity' },
  ],
  build(o) {
    const r = reader(o);
    const items = r.s('items') || 'colActivity';
    const max = Math.max(1, ...HEAT.map((h) => Math.max(0, h.Count)));
    const W = 7 * 40;
    const shade = (v: number) => `color-mix(in srgb, var(--k-Primary1), #fff ${Math.round(88 - (88 * Math.max(0, v)) / max)}%)`;
    return {
      root: vCon('vConHeatmap', { w: W + 40, h: 290, fill: 'Fill', radius: 'Medium', border: { color: 'BorderColor', thickness: 'Thin' }, pad: 'Regular', gap: 'Tiny', alignItems: 'Stretch' }, [
        lbl('lblHeatmapTitle', { text: r.s('title'), w: 'fill', h: 28, size: 'Subtitle', weight: 'Semibold', pad: 0 }),
        hCon('hConHeatmapDays', { w: 'fill', h: 20, alignItems: 'Center' }, WEEKDAYS.map((d, i) =>
          lbl(`lblHeatDay${i + 1}`, { text: d, w: 'fill', h: 'fill', size: 'Tiny', color: 'Primary3', textAlign: 'Center', pad: 0 }),
        )),
        gal('galHeatmap', {
          dir: 'Vertical',
          w: 'fill',
          h: 'fill',
          items,
          sample: HEAT,
          wrapCount: 7,
          templateSize: 36,
          template: (row: Row) => [
            hCon('hConHeatCell', {
              x: 3,
              y: 3,
              w: fx('Parent.TemplateWidth - 6', 34),
              h: fx('Parent.TemplateHeight - 6', 30),
              radius: 'Small',
              fill: fx(`ColorFade(fxColorConfigs.Primary1, 0.88 - 0.88 * ThisItem.Count / Max(1, Max(${items}, Count)))`, shade(row.sample.Count as number)),
            }, []),
          ],
        }),
        hCon('hConHeatLegend', { w: 'fill', h: 20, gap: 3, alignItems: 'Center', justify: 'End' }, [
          lbl('lblHeatLess', { text: 'Less', w: 34, h: 'fill', size: 'Tiny', color: 'Primary3', textAlign: 'Right', pad: { r: 4 } }),
          ...[0.88, 0.66, 0.44, 0.22, 0].map((f, i) => hCon(`hConHeatKey${i + 1}`, { w: 12, h: 12, radius: 3, fill: fx(`ColorFade(fxColorConfigs.Primary1, ${f})`, `color-mix(in srgb, var(--k-Primary1), #fff ${Math.round(f * 100)}%)`) }, [])),
          lbl('lblHeatMore', { text: 'More', w: 34, h: 'fill', size: 'Tiny', color: 'Primary3', pad: { l: 4 } }),
        ]),
      ]),
      onVisible: [
        '// 35 days ending this week, with a Count for each. Replace the Count with your own, e.g. CountRows(Filter(colRequests, DateValue(Created) = Date)).',
        'ClearCollect(',
        '    colActivity,',
        '    ForAll(',
        '        Sequence(35),',
        '        With(',
        '            { lclDay: DateAdd(Today(), Value - 28 - Weekday(Today(), StartOfWeek.Monday), TimeUnit.Days) },',
        '            { Date: lclDay, Count: CountRows(Filter(colRequests, DateValue(Created) = lclDay)) }',
        '        )',
        '    )',
        ')',
      ].join('\n'),
      notes: ['Each cell is a rounded container whose Fill fades from Primary1 by the day’s share of the busiest day, so the busiest day is full Primary1.'],
      uses: [
        { name: 'colActivity', what: 'Collection: 35 days with Date and Count, Monday first' },
        { name: 'colRequests', what: 'Collection: the records counted (rename to yours)' },
      ],
    };
  },
};

export const screenSplash: KitItem = {
  slug: 'screen-splash',
  name: 'Splash screen',
  category: 'Screens',
  summary: 'A branded loading screen with a progress bar and the step it’s on, that moves to the app when data is ready.',
  keywords: ['splash', 'loading screen', 'start screen', 'onstart', 'progress', 'brand', 'template'],
  canvas: { w: 1000, h: 600 },
  options: [
    { id: 'app', label: 'App name', type: 'text', default: 'Requests' },
    { id: 'tagline', label: 'Tagline', type: 'text', default: 'Purchase requests, approved faster' },
    { id: 'progress', label: 'Progress in the preview (%)', type: 'number', default: 60, min: 0, max: 100 },
  ],
  build(o) {
    const r = reader(o);
    const pct = r.n('progress');
    return {
      root: vCon('vConSplash', { w: fx('Parent.Width', 1000), h: fx('Parent.Height', 600), fill: 'Primary1', gap: 'Regular', alignItems: 'Center', justify: 'Center' }, [
        img('imgSplashLogo', { w: 80, h: 80, pad: 18, fill: { rgba: [255, 255, 255, 0.16] }, radius: 'Large', label: r.s('app'), svg: (hex) => iconSvg('grid', hex('White')) }),
        lbl('lblSplashName', { text: r.s('app'), w: 400, h: 48, size: 'Display', weight: 'Bold', color: 'SelectedColor', textAlign: 'Center', pad: 0 }),
        lbl('lblSplashTagline', { text: r.s('tagline'), w: 400, h: 24, size: 'Regular', color: 'Primary2', textAlign: 'Center', pad: 0 }),
        hCon('hConSplashTrack', { w: 260, h: 6, radius: 3, fill: { rgba: [255, 255, 255, 0.25] }, alignItems: 'Stretch' }, [
          hCon('hConSplashFill', { w: fx('Parent.Width * gblLoadProgress', Math.round((260 * pct) / 100)), h: 'fill', radius: 3, fill: 'SelectedColor' }, []),
        ]),
        hCon('hConSplashStep', { w: 300, h: 24, gap: 'Small', alignItems: 'Center', justify: 'Center' }, [
          img('imgSplashSpinner', { w: 18, h: 18, label: 'Loading', svg: (hex) => spinnerSvg(hex('White'), 'rgba(255,255,255,0.3)') }),
          lbl('lblSplashStep', { text: fx('gblLoadStep', 'Loading your requests…'), w: 'fill', h: 'fill', size: 'Small', color: 'SelectedColor', pad: 0, wrap: false }),
        ]),
      ]),
      onVisible: [
        'Set(gblLoadProgress, 0.1); Set(gblLoadStep, "Signing you in…");',
        'Set(gblUser, User());',
        'Set(gblLoadProgress, 0.4); Set(gblLoadStep, "Loading your requests…");',
        '// ClearCollect(colRequests, Requests);',
        'Set(gblLoadProgress, 0.8); Set(gblLoadStep, "Almost there…");',
        '// ClearCollect(colChoices, …);',
        'Set(gblLoadProgress, 1);',
        'Navigate(scrHome, ScreenTransition.Fade)',
      ].join('\n'),
      notes: [
        'Make it the first screen. Its OnVisible loads the data step by step and moves the bar, then navigates to scrHome (change it to your home screen).',
        'Keep the steps short: everything in OnVisible runs before the user can do anything.',
      ],
      uses: [
        { name: 'gblLoadProgress', what: 'Global variable: 0 to 1, fills the bar' },
        { name: 'gblLoadStep', what: 'Global variable: the step shown under the bar' },
        { name: 'gblUser', what: 'Global variable: the signed-in user' },
      ],
    };
  },
};

