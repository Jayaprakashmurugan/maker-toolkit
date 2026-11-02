// A small set of stroke icons drawn for the UI Kit (simple geometry, no third-party icon set).
// They're written with single quotes only, so they fit inside a Power Fx text literal, and the
// stroke color comes from the design system (HexColors) through `hex`.

const shapes: Record<string, string> = {
  search: "<circle cx='11' cy='11' r='6.5'/><path d='M16 16l4.5 4.5'/>",
  plus: "<path d='M12 5v14M5 12h14'/>",
  close: "<path d='M6.5 6.5l11 11M17.5 6.5l-11 11'/>",
  check: "<path d='M5 12.5l4.5 4.5L19 7.5'/>",
  chevronRight: "<path d='M9.5 5.5L16 12l-6.5 6.5'/>",
  chevronLeft: "<path d='M14.5 5.5L8 12l6.5 6.5'/>",
  chevronDown: "<path d='M5.5 9.5L12 16l6.5-6.5'/>",
  chevronUp: "<path d='M5.5 14.5L12 8l6.5 6.5'/>",
  arrowLeft: "<path d='M19 12H5M11 6l-6 6 6 6'/>",
  home: "<path d='M4 11l8-6.5 8 6.5v9h-5.5v-5.5h-5V20H4z'/>",
  user: "<circle cx='12' cy='8' r='3.8'/><path d='M4.5 20c1.4-3.6 4.2-5.5 7.5-5.5s6.1 1.9 7.5 5.5'/>",
  users: "<circle cx='9' cy='8.5' r='3.2'/><path d='M3 19.5c1-3 3.2-4.6 6-4.6s5 1.6 6 4.6'/><path d='M15.5 5.6a3.2 3.2 0 0 1 0 5.8M17 14.9c2 .5 3.3 2 4 4.6'/>",
  bell: "<path d='M6.5 16.5v-5a5.5 5.5 0 0 1 11 0v5l1.8 1.8H4.7z'/><path d='M10 21h4'/>",
  calendar: "<rect x='4' y='5.5' width='16' height='14.5' rx='2.2'/><path d='M4 10h16M8.5 3.5v4M15.5 3.5v4'/>",
  filter: "<path d='M4.5 5.5h15l-5.8 6.8v5.4l-3.4 1.8v-7.2z'/>",
  menu: "<path d='M4.5 7h15M4.5 12h15M4.5 17h15'/>",
  info: "<circle cx='12' cy='12' r='8.5'/><path d='M12 11v5.5M12 7.8v.4'/>",
  warning: "<path d='M12 4.5l8.5 15h-17z'/><path d='M12 10v4.2M12 16.8v.4'/>",
  error: "<circle cx='12' cy='12' r='8.5'/><path d='M9.2 9.2l5.6 5.6M14.8 9.2l-5.6 5.6'/>",
  success: "<circle cx='12' cy='12' r='8.5'/><path d='M8.3 12.3l2.6 2.6 4.8-5.2'/>",
  inbox: "<path d='M4 13.5l2.6-7.5h10.8l2.6 7.5V19H4z'/><path d='M4 13.5h4.6l1.2 2h4.4l1.2-2H20'/>",
  file: "<path d='M7 3.5h7l4.5 4.5v12.5H7z'/><path d='M14 3.5V8h4.5'/>",
  chart: "<path d='M5 20v-7M10 20V8M15 20v-4.5M20 20V5'/>",
  edit: "<path d='M5 19.5l1-4.2L15.8 5.5a2 2 0 0 1 2.8 0l.2.2a2 2 0 0 1 0 2.8L9 18.2z'/>",
  trash: "<path d='M5 7h14M10 7V4.5h4V7M7 7l1 13h8l1-13'/>",
  upload: "<path d='M12 15.5V5M7.5 9.5L12 5l4.5 4.5M5 19.5h14'/>",
  grid: "<rect x='4.5' y='4.5' width='6' height='6' rx='1.2'/><rect x='13.5' y='4.5' width='6' height='6' rx='1.2'/><rect x='4.5' y='13.5' width='6' height='6' rx='1.2'/><rect x='13.5' y='13.5' width='6' height='6' rx='1.2'/>",
  settings: "<path d='M4 7h9M17 7h3M4 17h3M11 17h9'/><circle cx='15' cy='7' r='2'/><circle cx='9' cy='17' r='2'/>",
  more: "<path d='M6 12h.01M12 12h.01M18 12h.01'/>",
  logout: "<path d='M14 4.5H6.5v15H14M10.5 12H20M16.5 8.5L20 12l-3.5 3.5'/>",
  spinner: "<path d='M12 3.5a8.5 8.5 0 1 1-8.5 8.5'/>",
};

export type IconName = keyof typeof shapes;
export const ICON_NAMES = Object.keys(shapes) as IconName[];

/** An icon as SVG markup. `color` is a hex color, or a formula piece in YAML. */
export function iconSvg(name: IconName, color: string, width = 2): string {
  const extra = name === 'more' ? ` stroke-width='3.2'` : ` stroke-width='${width}'`;
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='${color}'${extra} stroke-linecap='round' stroke-linejoin='round'>${shapes[name]}</svg>`;
}

/** The same spinner, turning, for loading states (SVG animation works inside an Image control). */
export function spinnerSvg(color: string, track: string): string {
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke-width='2.4' stroke-linecap='round'><circle cx='12' cy='12' r='8.5' stroke='${track}'/><path d='M12 3.5a8.5 8.5 0 0 1 8.5 8.5' stroke='${color}'><animateTransform attributeName='transform' type='rotate' from='0 12 12' to='360 12 12' dur='0.9s' repeatCount='indefinite'/></path></svg>`;
}
