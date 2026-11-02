// Inputs: buttons, fields, search and filter chips.

import { btn, fx, gal, hCon, lbl, nCon, str, txt, vCon, type Color } from '../model';
import { reader, type KitItem } from '../types';
import { icon, textWidth } from './shared';

const VARIANTS: Record<string, { fill: Color; color: Color; border?: Color; hover: Color; iconHex: string }> = {
  primary: { fill: 'Primary1', color: 'SelectedColor', hover: { fade: 'Primary1', by: -15 }, iconHex: 'White' },
  secondary: { fill: 'Fill', color: 'Primary1', border: 'Primary1', hover: 'Primary2', iconHex: 'Primary1' },
  ghost: { fill: 'Transparent', color: 'Primary1', hover: 'Primary2', iconHex: 'Primary1' },
  danger: { fill: 'ErrorColor', color: 'SelectedColor', hover: { fade: 'ErrorColor', by: -15 }, iconHex: 'White' },
};

export const button: KitItem = {
  slug: 'button',
  name: 'Button',
  category: 'Inputs',
  summary: 'A themed button in four styles, with an optional icon that stays clickable.',
  keywords: ['button', 'primary', 'secondary', 'ghost', 'danger', 'cta', 'icon button'],
  canvas: { w: 360, h: 140 },
  options: [
    { id: 'text', label: 'Text', type: 'text', default: 'New request' },
    {
      id: 'variant',
      label: 'Style',
      type: 'select',
      default: 'primary',
      choices: [
        { value: 'primary', label: 'Primary' },
        { value: 'secondary', label: 'Secondary' },
        { value: 'ghost', label: 'Ghost' },
        { value: 'danger', label: 'Danger' },
      ],
    },
    { id: 'icon', label: 'Plus icon', type: 'toggle', default: true },
    { id: 'width', label: 'Width', type: 'number', default: 180, min: 90, max: 360, step: 10 },
    { id: 'disabled', label: 'Show as disabled', type: 'toggle', default: false },
  ],
  build(o) {
    const r = reader(o);
    const v = VARIANTS[r.s('variant')] ?? VARIANTS.primary;
    const withIcon = r.b('icon');
    return {
      root: nCon('nConAction', { w: r.n('width'), h: 40 }, [
        btn('btnAction', {
          w: 'fill',
          h: 'fill',
          text: r.s('text'),
          fill: v.fill,
          color: v.color,
          border: v.border ? { color: v.border, thickness: 'Thin' } : undefined,
          hoverFill: v.hover,
          radius: 'Medium',
          size: 'Small',
          pad: { l: withIcon ? 30 : 'Small', r: 'Small' },
          disabled: fx('lclSaving', r.b('disabled')),
          onSelect: 'UpdateContext({ lclSaving: true });\n// your action here\nUpdateContext({ lclSaving: false })',
        }),
        icon('imgActionIcon', 'plus', v.iconHex, {
          x: 14,
          y: 10,
          visible: fx(String(withIcon), withIcon),
          onSelect: 'Select(btnAction)',
        }),
      ]),
      notes: [
        'The icon is an image placed on the button. Its OnSelect runs Select(btnAction), so clicks on the icon still press the button.',
        'lclSaving disables the button while your action runs, so it can’t be pressed twice.',
      ],
      uses: [{ name: 'lclSaving', what: 'Local variable: true while the action runs' }],
    };
  },
};

export const textField: KitItem = {
  slug: 'text-field',
  name: 'Text field',
  category: 'Inputs',
  summary: 'A labelled text input with a required marker, a hint and an inline error message.',
  keywords: ['text input', 'field', 'form', 'required', 'validation', 'error'],
  canvas: { w: 380, h: 140 },
  options: [
    { id: 'label', label: 'Label', type: 'text', default: 'Request title' },
    { id: 'hint', label: 'Hint text', type: 'text', default: 'e.g. New laptop for onboarding' },
    { id: 'required', label: 'Required', type: 'toggle', default: true },
    { id: 'error', label: 'Error message', type: 'text', default: 'Please enter a title.' },
    { id: 'showError', label: 'Show the error in the preview', type: 'toggle', default: false },
  ],
  build(o) {
    const r = reader(o);
    const required = r.b('required');
    return {
      root: vCon('vConField', { w: 320, h: 92, gap: 'Tiny', alignItems: 'Stretch' }, [
        hCon('hConFieldLabel', { w: 'fill', h: 24, gap: 2, alignItems: 'Center' }, [
          lbl('lblFieldLabel', { text: r.s('label'), w: textWidth(r.s('label'), 12), h: 'fill', size: 'Small', weight: 'Semibold', pad: 0, wrap: false }),
          lbl('lblFieldRequired', { text: '*', w: 12, h: 'fill', size: 'Small', color: 'ErrorColor', weight: 'Bold', pad: 0, visible: fx(String(required), required) }),
        ]),
        txt('txtField', {
          w: 'fill',
          h: fx('fxTextConfigs.Height.Singleline', 35),
          hint: r.s('hint'),
          size: 'Small',
          radius: 'Small',
          border: {
            color: { if: fx('lclShowErrors && IsBlank(Self.Text)', r.b('showError')), then: 'ErrorColor', else: 'BorderColor' },
            thickness: 'Thin',
          },
          pad: { x: 'Small' },
        }),
        lbl('lblFieldError', {
          text: r.s('error'),
          w: 'fill',
          h: 22,
          size: 'Tiny',
          color: 'ErrorColor',
          pad: 0,
          visible: fx('lclShowErrors && IsBlank(txtField.Text)', r.b('showError')),
        }),
      ]),
      notes: [
        'Set lclShowErrors to true when the user presses Save, for example UpdateContext({ lclShowErrors: true }). The error only shows after that, not while they are still typing.',
        `To block the save: If(IsBlank(txtField.Text), UpdateContext({ lclShowErrors: true }), /* save */ ).`,
      ],
      uses: [{ name: 'lclShowErrors', what: 'Local variable: true once the user tried to save' }],
    };
  },
};

export const searchBox: KitItem = {
  slug: 'search-box',
  name: 'Search box',
  category: 'Inputs',
  summary: 'A search field with an icon, a clear button and delayed output, so galleries don’t filter on every key.',
  keywords: ['search', 'filter', 'text input', 'clear', 'find'],
  canvas: { w: 380, h: 110 },
  options: [
    { id: 'hint', label: 'Hint text', type: 'text', default: 'Search requests' },
    { id: 'value', label: 'Preview text', type: 'text', default: '' },
  ],
  build(o) {
    const r = reader(o);
    const hasText = r.s('value') !== '';
    return {
      root: hCon(
        'hConSearch',
        { w: 320, h: 40, fill: 'Fill', border: { color: 'BorderColor', thickness: 'Thin' }, radius: 'Medium', pad: { x: 'Small' }, gap: 'Tiny', alignItems: 'Center' },
        [
          icon('imgSearchIcon', 'search', 'Primary3', { w: 20, h: 20 }),
          txt('txtSearch', {
            w: 'fill',
            h: 'fill',
            hint: r.s('hint'),
            value: fx('""', r.s('value')),
            size: 'Small',
            fill: 'Transparent',
            border: { color: 'Transparent', thickness: 0 },
            pad: { x: 'Tiny' },
            extra: { DelayOutput: 'true' },
          }),
          icon('imgSearchClear', 'close', 'Primary3', { w: 18, h: 18, visible: fx('!IsBlank(txtSearch.Text)', hasText), onSelect: 'Reset(txtSearch)' }),
        ],
      ),
      notes: [
        'Use it in a gallery’s Items, for example Filter(colRequests, StartsWith(Title, txtSearch.Text)). StartsWith can be delegated to SharePoint and Dataverse, Search() mostly can’t.',
        'DelayOutput waits until the user stops typing before Text changes, so the gallery doesn’t refilter on every key.',
      ],
    };
  },
};

export const filterChips: KitItem = {
  slug: 'filter-chips',
  name: 'Filter chips',
  category: 'Inputs',
  summary: 'Toggle chips for quick filters. Selected chips are kept in a collection you can filter with.',
  keywords: ['chips', 'filter', 'toggle', 'tags', 'pills', 'multi select'],
  canvas: { w: 600, h: 100 },
  options: [
    { id: 'chips', label: 'Chips (one per line)', type: 'lines', default: ['Open', 'Waiting', 'Approved', 'Rejected', 'Mine'] },
    { id: 'selected', label: 'Selected in the preview (one per line)', type: 'lines', default: ['Open', 'Mine'] },
  ],
  build(o) {
    const r = reader(o);
    const chips = r.lines('chips');
    const selected = new Set(r.lines('selected'));
    const sample = chips.map((Name) => ({ Name, Selected: selected.has(Name) }));
    return {
      root: gal('galFilterChips', {
        dir: 'Horizontal',
        // Wide enough for every chip: (template + padding) per chip, plus the padding at the end.
        w: Math.max(120, chips.length * (104 + 4) + 4),
        h: 40,
        items: 'fxFilterChips',
        sample,
        templateSize: 104,
        templatePad: 4,
        template: (row) => {
          const on = fx('ThisItem.Name in colSelectedChips.Name', row.sample.Selected as boolean);
          return [
            btn('btnChip', {
              w: 'fill',
              h: 'fill',
              text: row.f('Name'),
              size: 'Small',
              weight: 'Semibold',
              radius: 16,
              fill: { if: on, then: 'SelectedFill', else: 'Fill' },
              color: { if: on, then: 'SelectedColor', else: 'TextColor' },
              border: { color: { if: on, then: 'SelectedFill', else: 'BorderColor' }, thickness: 'Thin' },
              hoverFill: { if: on, then: 'SelectedFill', else: 'HoverFill' },
              hoverColor: { if: on, then: 'SelectedColor', else: 'TextColor' },
              pad: { x: 'Small' },
              onSelect:
                'If(\n    ThisItem.Name in colSelectedChips.Name,\n    Remove(colSelectedChips, LookUp(colSelectedChips, Name = ThisItem.Name)),\n    Collect(colSelectedChips, { Name: ThisItem.Name })\n)',
            }),
          ];
        },
      }),
      formulas: `fxFilterChips =\n[\n${chips.map((c) => `    { Name: ${str(c)} }`).join(',\n')}\n];`,
      notes: [
        'Filter a gallery with the selection, for example Filter(colRequests, IsEmpty(colSelectedChips) || Status in colSelectedChips.Name).',
        'Clear all filters with Clear(colSelectedChips).',
      ],
      uses: [
        { name: 'fxFilterChips', what: 'Named formula: the chips to show' },
        { name: 'colSelectedChips', what: 'Collection: the selected chips' },
      ],
    };
  },
};
