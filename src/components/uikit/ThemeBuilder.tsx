// Pick a preset or your own colors, watch the components repaint, and copy your fxConfig.
// The theme is kept in this browser only.

import { useEffect, useMemo, useState } from 'react';
import { kitItem } from '../../uikit/items';
import { defaults } from '../../uikit/types';
import { STATUS_KEYS, STATUS_MEANING, THEMES, fxConfigFormula, type ColorKey } from '../../uikit/theme';
import { THEME_EVENT, loadStored, resolveTheme, saveStored, type StoredTheme } from '../../uikit/themeStore';
import KitPreview from './KitPreview';
import YamlCode from './YamlCode';

const GROUPS: { title: string; keys: ColorKey[] }[] = [
  { title: 'Brand', keys: ['Primary1', 'Primary2', 'Primary3'] },
  { title: 'Surfaces', keys: ['Secondary1', 'Secondary2', 'Secondary3', 'Fill', 'BackgroundFill', 'BorderColor', 'TextColor'] },
  { title: 'Accents', keys: ['Accent1', 'Accent2', 'Accent3'] },
  { title: 'States', keys: ['HoverFill', 'HoverBorderColor', 'PressedFill', 'PressedBorderColor', 'SelectedFill', 'SelectedColor', 'DisabledFill', 'DisabledColor'] },
  { title: 'Messages', keys: ['SuccessColor', 'WarningColor', 'ErrorColor'] },
];

const SHOWCASE = ['app-header', 'list-row', 'notification-banner', 'button'] as const;

function Swatch({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  return (
    <label className="tb-swatch">
      <input type="color" value={value} onChange={(e) => onChange(e.target.value.toUpperCase())} aria-label={label} />
      <span>{label}</span>
      <input
        className="tb-hex"
        value={text}
        spellCheck={false}
        maxLength={7}
        onChange={(e) => {
          setText(e.target.value);
          if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) onChange(e.target.value.toUpperCase());
        }}
        aria-label={`${label} hex`}
      />
    </label>
  );
}

export default function ThemeBuilder() {
  const [stored, setStored] = useState<StoredTheme | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setStored(loadStored());
    const on = (e: Event) => setStored((e as CustomEvent<StoredTheme | null>).detail);
    window.addEventListener(THEME_EVENT, on);
    return () => window.removeEventListener(THEME_EVENT, on);
  }, []);

  const theme = resolveTheme(stored);
  const base = stored?.base ?? 'slate';
  const formula = useMemo(() => fxConfigFormula(theme), [theme]);
  const update = (patch: Partial<StoredTheme>) => saveStored({ base, ...stored, ...patch });

  return (
    <div className="tb">
      <div className="tb-controls">
        <div className="tb-presets" role="radiogroup" aria-label="Start from a preset">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={base === t.id && theme.id !== 'custom'}
              onClick={() => saveStored(t.id === 'slate' ? null : { base: t.id })}
            >
              <i style={{ background: `linear-gradient(135deg, ${t.colors.Primary1} 50%, ${t.colors.Secondary1} 50%)` }} aria-hidden="true" />
              {t.name}
            </button>
          ))}
        </div>
        {GROUPS.map((g) => (
          <fieldset key={g.title} className="tb-group">
            <legend>{g.title}</legend>
            {g.keys.map((k) => (
              <Swatch key={k} label={k} value={theme.colors[k]} onChange={(v) => update({ colors: { ...stored?.colors, [k]: v } })} />
            ))}
          </fieldset>
        ))}
        <fieldset className="tb-group">
          <legend>Status pills</legend>
          {STATUS_KEYS.map((i) => (
            <div key={i} className="tb-status">
              <span className="tb-pill" style={{ background: theme.status[i], color: theme.statusFont[i] }}>
                {i}
              </span>
              <input type="color" value={theme.status[i]} aria-label={`Status ${i} fill`} onChange={(e) => update({ status: { ...stored?.status, [i]: e.target.value.toUpperCase() } })} />
              <input type="color" value={theme.statusFont[i]} aria-label={`Status ${i} text`} onChange={(e) => update({ statusFont: { ...stored?.statusFont, [i]: e.target.value.toUpperCase() } })} />
              <small>{STATUS_MEANING[i]}</small>
            </div>
          ))}
        </fieldset>
        <button type="button" className="kit-reset" onClick={() => saveStored(base === 'slate' ? null : { base })}>
          Reset to {THEMES.find((t) => t.id === base)?.name}
        </button>
      </div>

      <div className="tb-output">
        <div className="tb-showcase kit-canvas--page">
          {SHOWCASE.map((slug) => {
            const item = kitItem(slug)!;
            const snip = item.build(defaults(item));
            const w = slug === 'app-header' ? 560 : item.canvas.w - 40;
            return (
              <div key={slug} className="tb-show" style={{ width: w }}>
                <KitPreview root={slug === 'app-header' ? { ...snip.root, w: 560 } : snip.root} theme={theme} />
              </div>
            );
          })}
        </div>
        <div className="kit-codebox">
          <div className="kit-tabs">
            <span className="kit-tabs__title">
              fxConfig <small>{theme.name}</small>
            </span>
            <span className="kit-tabs__fill" />
            <button
              type="button"
              className="kit-copy"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(formula);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1600);
                } catch {
                  /* clipboard blocked */
                }
              }}
            >
              {copied ? 'Copied' : 'Copy fxConfig'}
            </button>
          </div>
          <YamlCode code={formula} lang="fx" />
        </div>
      </div>
    </div>
  );
}
