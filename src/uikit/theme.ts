// The UI Kit's design system. It mirrors the fxConfig named formula used in our canvas apps:
// fxConfig = { ColorConfigs: {...}, TextConfigs: {...} }, with fxColorConfigs and fxTextConfigs as shortcuts.
// Every snippet in the kit reads its colors and sizes from these, so one paste of fxConfig themes them all.

export const COLOR_KEYS = [
  'Primary1', 'Primary2', 'Primary3',
  'Secondary1', 'Secondary2', 'Secondary3',
  'Accent1', 'Accent2', 'Accent3',
  'TextColor', 'Fill', 'BackgroundFill', 'BorderColor',
  'HoverFill', 'HoverBorderColor', 'PressedFill', 'PressedBorderColor',
  'DisabledColor', 'DisabledFill', 'SelectedColor', 'SelectedFill',
  'ErrorColor', 'WarningColor', 'SuccessColor',
] as const;
export type ColorKey = (typeof COLOR_KEYS)[number];

/** Status pill fills (StatusColors) and their text colors (StatusFontColors), 1 to 7. */
export const STATUS_KEYS = [1, 2, 3, 4, 5, 6, 7] as const;
export type StatusIndex = (typeof STATUS_KEYS)[number];

export const SIZE_KEYS = ['Tiny', 'Small', 'Regular', 'Subtitle', 'Title', 'Headline', 'Display'] as const;
export type SizeKey = (typeof SIZE_KEYS)[number];
export const RADIUS_KEYS = ['None', 'Small', 'Medium', 'Large'] as const;
export type RadiusKey = (typeof RADIUS_KEYS)[number];
export const THICKNESS_KEYS = ['None', 'Thin', 'Regular', 'Thick'] as const;
export type ThicknessKey = (typeof THICKNESS_KEYS)[number];
export const PADDING_KEYS = ['Tiny', 'Small', 'Regular', 'Large', 'Huge'] as const;
export type PaddingKey = (typeof PADDING_KEYS)[number];

export interface KitTheme {
  id: string;
  name: string;
  colors: Record<ColorKey, string>;
  status: Record<StatusIndex, string>;
  statusFont: Record<StatusIndex, string>;
  font: string;
  size: Record<SizeKey, number>;
  height: { Singleline: number; Multiline: number };
  thickness: Record<ThicknessKey, number>;
  radius: Record<RadiusKey, number>;
  padding: Record<PaddingKey, number>;
}

/** What each status slot is for, so people pick the right one. */
export const STATUS_MEANING: Record<StatusIndex, string> = {
  1: 'Neutral or info (the fallback)',
  2: 'Rejected or error',
  3: 'Waiting or needs attention',
  4: 'Draft or submitted',
  5: 'Approved or done',
  6: 'Forwarded or in review',
  7: 'Cancelled',
};

const TEXT = {
  font: 'Segoe UI',
  size: { Tiny: 10, Small: 12, Regular: 14, Subtitle: 16, Title: 20, Headline: 24, Display: 32 },
  height: { Singleline: 35, Multiline: 100 },
  thickness: { None: 0, Thin: 1, Regular: 2, Thick: 3 },
  radius: { None: 0, Small: 4, Medium: 8, Large: 16 },
  padding: { Tiny: 4, Small: 8, Regular: 16, Large: 24, Huge: 32 },
};

export const THEMES: KitTheme[] = [
  {
    id: 'slate',
    name: 'Slate',
    colors: {
      Primary1: '#5080A5', Primary2: '#EFF3F3', Primary3: '#8A97A3',
      Secondary1: '#1C2B36', Secondary2: '#EDF3F7', Secondary3: '#F2F5F7',
      Accent1: '#EEF0FF', Accent2: '#D5A021', Accent3: '#4F9DA6',
      TextColor: '#2E3E4F', Fill: '#FFFFFF', BackgroundFill: '#EDF3F7', BorderColor: '#C1C9C8',
      HoverFill: '#E8F0EF', HoverBorderColor: '#98B4B3', PressedFill: '#B0C7BD', PressedBorderColor: '#6F8A83',
      DisabledColor: '#A0A5A5', DisabledFill: '#F1F1F1', SelectedColor: '#FFFFFF', SelectedFill: '#5080A5',
      ErrorColor: '#C04D3E', WarningColor: '#D5A021', SuccessColor: '#79A541',
    },
    status: { 1: '#D7E5F0', 2: '#FCE0DD', 3: '#FCF2C7', 4: '#EEF0F2', 5: '#E4F3EA', 6: '#CAEEE9', 7: '#F4DDE8' },
    statusFont: { 1: '#5080A5', 2: '#B23A2E', 3: '#8A6D06', 4: '#556270', 5: '#2C7A52', 6: '#339485', 7: '#96335E' },
    ...TEXT,
  },
  {
    id: 'harbor',
    name: 'Harbor',
    colors: {
      Primary1: '#0F7C86', Primary2: '#E8F5F5', Primary3: '#7FA3A6',
      Secondary1: '#102A2E', Secondary2: '#EEF6F6', Secondary3: '#F5FAFA',
      Accent1: '#E6F4F1', Accent2: '#E0A23B', Accent3: '#3D6FB6',
      TextColor: '#1F3A3D', Fill: '#FFFFFF', BackgroundFill: '#EEF6F6', BorderColor: '#BFD3D3',
      HoverFill: '#E3F1F0', HoverBorderColor: '#8DB8B6', PressedFill: '#B9DAD7', PressedBorderColor: '#5F8F8C',
      DisabledColor: '#9AA9A9', DisabledFill: '#F0F3F3', SelectedColor: '#FFFFFF', SelectedFill: '#0F7C86',
      ErrorColor: '#C2453A', WarningColor: '#C98A12', SuccessColor: '#3F8F4E',
    },
    status: { 1: '#D9ECEE', 2: '#FBE0DC', 3: '#FBF0CF', 4: '#ECF0F1', 5: '#DFF2E3', 6: '#DCE7F7', 7: '#F3E0EC' },
    statusFont: { 1: '#0F7C86', 2: '#A8362C', 3: '#80620A', 4: '#4F6164', 5: '#2E7340', 6: '#2F5D9E', 7: '#8E3A6C' },
    ...TEXT,
  },
  {
    id: 'plum',
    name: 'Plum',
    colors: {
      Primary1: '#7A4E9C', Primary2: '#F4EFF8', Primary3: '#A497AE',
      Secondary1: '#2A1F33', Secondary2: '#F3EFF6', Secondary3: '#F8F6FA',
      Accent1: '#F1ECFA', Accent2: '#D99A2B', Accent3: '#3F8E8A',
      TextColor: '#352B3D', Fill: '#FFFFFF', BackgroundFill: '#F3EFF6', BorderColor: '#D0C6D8',
      HoverFill: '#EFE8F4', HoverBorderColor: '#B39EC4', PressedFill: '#D6C6E3', PressedBorderColor: '#7E6A90',
      DisabledColor: '#A7A0AD', DisabledFill: '#F3F1F4', SelectedColor: '#FFFFFF', SelectedFill: '#7A4E9C',
      ErrorColor: '#BF4040', WarningColor: '#C98912', SuccessColor: '#4C8C47',
    },
    status: { 1: '#E9DFF2', 2: '#F9DEDE', 3: '#FAF0CF', 4: '#EFEDF1', 5: '#E1F0DF', 6: '#D7ECEA', 7: '#F5DDE9' },
    statusFont: { 1: '#7A4E9C', 2: '#A63434', 3: '#7F630A', 4: '#5A5262', 5: '#3A7335', 6: '#2E7370', 7: '#93375F' },
    ...TEXT,
  },
  {
    id: 'graphite',
    name: 'Graphite',
    colors: {
      Primary1: '#3D4A5C', Primary2: '#F1F2F4', Primary3: '#949BA6',
      Secondary1: '#14181F', Secondary2: '#F0F1F3', Secondary3: '#F6F7F8',
      Accent1: '#ECEFF6', Accent2: '#D9A21E', Accent3: '#2F8F83',
      TextColor: '#232A33', Fill: '#FFFFFF', BackgroundFill: '#F0F1F3', BorderColor: '#C9CDD3',
      HoverFill: '#EAECEF', HoverBorderColor: '#A3AAB4', PressedFill: '#CDD2D9', PressedBorderColor: '#6D7581',
      DisabledColor: '#A3A8AF', DisabledFill: '#F2F3F4', SelectedColor: '#FFFFFF', SelectedFill: '#3D4A5C',
      ErrorColor: '#C2413B', WarningColor: '#C78B10', SuccessColor: '#3E8A4F',
    },
    status: { 1: '#E1E5EB', 2: '#FADFDD', 3: '#FAF0CE', 4: '#EEEFF1', 5: '#DFF1E4', 6: '#D6EEEA', 7: '#F2DFEA' },
    statusFont: { 1: '#3D4A5C', 2: '#A73530', 3: '#7E620A', 4: '#565D67', 5: '#2F7140', 6: '#24736A', 7: '#8C3A63' },
    ...TEXT,
  },
];

export const defaultTheme = THEMES[0];
export const themeById = (id: string) => THEMES.find((t) => t.id === id) ?? defaultTheme;

/** HexColors: the same colors as text, for SVG icons built inside formulas. */
export function hexColors(t: KitTheme): Record<string, string> {
  const c = t.colors;
  return {
    ImageFill: c.Primary3,
    IconFill: c.Primary3,
    TextColor: c.TextColor,
    RequiredIconColor: c.ErrorColor,
    Primary1: c.Primary1, Primary2: c.Primary2, Primary3: c.Primary3,
    Secondary1: c.Secondary1, Secondary2: c.Secondary2, Secondary3: c.Secondary3,
    Accent1: c.Accent1, Accent2: c.Accent2, Accent3: c.Accent3,
    Red: c.ErrorColor,
    SuccessColor: c.SuccessColor,
    WarningColor: c.WarningColor,
    ErrorColor: c.ErrorColor,
    White: '#FFFFFF',
    GrayMedium: c.DisabledColor,
    GrayMediumLight: c.BorderColor,
    GrayDark: c.Secondary1,
    Black: '#000000',
  };
}

const COMMENTS: Partial<Record<ColorKey, string>> = {
  Primary1: 'Main brand color: header, primary buttons, selection',
  Primary2: 'Very light brand tint: soft backgrounds',
  Primary3: 'Muted brand color: icons, secondary text',
  Secondary1: 'Darkest color: dark surfaces, strong text',
  Secondary2: 'Page background',
  Secondary3: 'Subtle panels and stripes',
};

const pad = (s: string, n: number) => s + ' '.repeat(Math.max(1, n - s.length));

/** The full fxConfig named formula (plus the two shortcuts) for App.Formulas. */
export function fxConfigFormula(t: KitTheme): string {
  const color = (k: ColorKey) => {
    const note = COMMENTS[k] ? `  // ${COMMENTS[k]}` : '';
    return `        ${pad(k, 20)}: ColorValue("${t.colors[k]}"),${note}`;
  };
  const group = (title: string, keys: ColorKey[]) => [`        // ${title}`, ...keys.map(color), ''];
  const hex = Object.entries(hexColors(t));
  const lines = [
    `// Design system: ${t.name} theme, from the Maker Toolkit UI Kit.`,
    '// Paste into App.Formulas. Every UI Kit snippet reads its colors and sizes from here.',
    'fxConfig =',
    '{',
    '    ColorConfigs:',
    '    {',
    ...group('Primary colors', ['Primary1', 'Primary2', 'Primary3']),
    ...group('Secondary colors', ['Secondary1', 'Secondary2', 'Secondary3']),
    ...group('Accent colors', ['Accent1', 'Accent2', 'Accent3']),
    ...group('General colors', [
      'TextColor', 'Fill', 'BackgroundFill', 'BorderColor', 'HoverFill', 'HoverBorderColor', 'PressedFill',
      'PressedBorderColor', 'DisabledColor', 'DisabledFill', 'SelectedColor', 'SelectedFill', 'ErrorColor',
      'WarningColor', 'SuccessColor',
    ]),
    '        // The same colors as text, for SVG icons',
    '        HexColors:',
    '        {',
    ...hex.map(([k, v], i) => `            ${pad(k, 20)}: "${v}"${i < hex.length - 1 ? ',' : ''}`),
    '        },',
    '',
    '        // Status pill fills',
    '        StatusColors:',
    '        {',
    ...STATUS_KEYS.map((i) => `            ${pad(`StatusColor${i}`, 16)}: ColorValue("${t.status[i]}")${i < 7 ? ',' : ''}   // ${STATUS_MEANING[i]}`),
    '        },',
    '',
    '        // Status pill text',
    '        StatusFontColors:',
    '        {',
    ...STATUS_KEYS.map((i) => `            ${pad(`StatusFontColor${i}`, 20)}: ColorValue("${t.statusFont[i]}")${i < 7 ? ',' : ''}`),
    '        }',
    '    },',
    '',
    '    TextConfigs:',
    '    {',
    `        ${pad('Font', 20)}: "${t.font}",`,
    `        ${pad('Size', 20)}:`,
    '        {',
    ...SIZE_KEYS.map((k, i) => `            ${pad(k, 16)}: ${t.size[k]}${i < SIZE_KEYS.length - 1 ? ',' : ''}`),
    '        },',
    `        ${pad('Height', 20)}:`,
    '        {',
    `            ${pad('Singleline', 16)}: ${t.height.Singleline},`,
    `            ${pad('Multiline', 16)}: ${t.height.Multiline}`,
    '        },',
    `        ${pad('BorderThickness', 20)}:`,
    '        {',
    ...THICKNESS_KEYS.map((k, i) => `            ${pad(k, 16)}: ${t.thickness[k]}${i < THICKNESS_KEYS.length - 1 ? ',' : ''}`),
    '        },',
    `        ${pad('BorderRadius', 20)}:`,
    '        {',
    ...RADIUS_KEYS.map((k, i) => `            ${pad(k, 16)}: ${t.radius[k]}${i < RADIUS_KEYS.length - 1 ? ',' : ''}`),
    '        },',
    `        ${pad('Padding', 20)}:`,
    '        {',
    ...PADDING_KEYS.map((k, i) => `            ${pad(k, 16)}: ${t.padding[k]}${i < PADDING_KEYS.length - 1 ? ',' : ''}`),
    '        }',
    '    }',
    '};',
    '',
    '// Shortcuts used by every snippet',
    'fxColorConfigs = fxConfig.ColorConfigs;',
    'fxTextConfigs  = fxConfig.TextConfigs;',
  ];
  return lines.join('\n');
}

/** A theme as CSS custom properties, for the HTML previews: colors, status colors, hex colors and the font. */
export function themeVars(t: KitTheme): Record<string, string> {
  const v: Record<string, string> = { '--k-font': `'${t.font}', 'Segoe UI Web (West European)', system-ui, -apple-system, sans-serif` };
  for (const k of COLOR_KEYS) v[`--k-${k}`] = t.colors[k];
  for (const i of STATUS_KEYS) {
    v[`--k-s${i}`] = t.status[i];
    v[`--k-sf${i}`] = t.statusFont[i];
  }
  for (const [k, hex] of Object.entries(hexColors(t))) v[`--k-hex-${k}`] = hex;
  return v;
}

/** themeVars as one inline style string. */
export const themeStyle = (t: KitTheme) =>
  Object.entries(themeVars(t))
    .map(([k, v]) => `${k}:${v}`)
    .join(';');

/** Darken (negative) or lighten (positive) a hex color, like Power Fx ColorFade. */
export function fade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) =>
    Math.round(amount < 0 ? c * (1 + amount) : c + (255 - c) * amount),
  );
  return `#${ch.map((c) => Math.max(0, Math.min(255, c)).toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

/** Which color each HexColors entry copies (or a fixed hex), so custom colors can update the hex colors too. */
export function hexSources(): Record<string, string> {
  const probe = { ...defaultTheme, colors: Object.fromEntries(COLOR_KEYS.map((k) => [k, k])) as Record<ColorKey, string> };
  return hexColors(probe);
}
