# Adding a tool

Every tool follows the same shape: a pure engine, a React island, an Astro page, and one line of data that puts it
everywhere else. Copy the closest existing tool and adapt it.

## Checklist

1. **Engine:** `src/lib/<engine>.ts`. Pure functions only: input in, output out, no React and no DOM where possible.
   If you need `DOMParser` or other browser APIs, call them only after hydration (see below).
2. **UI:** `src/components/<Tool>.tsx`, default export. Use `useState`/`useMemo`, the shared `bf-*` layout classes,
   `segmented` toggle groups, `CodeLine`/`CopyButton` from `FormulaDetail.tsx`, and `highlight()` for code.
3. **Page:** `src/pages/<slug>/index.astro`. Copy `src/pages/regex-tester/index.astro`:
   - `title`, `description` and `faqs` as constants in the front matter;
   - `<Base title description image="/og/<slug>.png">`, then `.wrap.wrap--wide` → `header.page-head` (kicker, `h1`,
     lede, `<WorksWith href="/<slug>/" />`) → `<Tool client:load />`;
   - then `section.wrap.section` blocks: an `ol.steps` how-to and the FAQ as `<details>` in `.faq`, with
     `data-reveal` / `data-reveal-group` for the scroll animation.
4. **Registry:** add an entry to `src/data/tools.ts` (`category`, optional `also`, `works`, `meta`, `keywords`). The
   homepage, `/tools/`, category pages, header count, footer and search pick it up.
5. **Share image:** add a card for `<slug>` in `src/pages/og/[...path].png.ts` (tools are listed there by hand).
6. **Styles:** a new `/* ── Tool name ── */` section in `src/styles/global.css` with its own class prefix. Reuse
   `bf-*`, `segmented`, `chip`, `code` before adding anything.
7. **Changelog:** a `kind: 'tool'` entry in `src/data/changelog.ts`.
8. Run `npm run check` and `npm run build`, then ship it on a branch ([Development](development.md#ship-a-change)).

## Conventions

### Hydration and browser APIs

`client:load` renders the island on the server too. Anything that only exists in the browser must wait:

```tsx
const [ready, setReady] = useState(false);
useEffect(() => setReady(true), []); // DOMParser exists only in the browser
const analysis = useMemo(() => (ready ? analyzeSvg(src) : null), [ready, src]);
```

Read `localStorage`, `sessionStorage` and `window.location` in effects, never during render.

### Copy buttons

Render `CopyButton` / `CodeLine` from `src/components/FormulaDetail.tsx`. They output `button.copy-btn[data-copy]`,
and the one delegated handler in `Base.astro` copies the text (with a fallback), shows the "copied" state and
announces it in the `#sr-status` live region. Don't add per-tool clipboard code.

### Highlighting

- `highlight(code, 'powerfx' | 'wdl')` from `src/lib/highlight.tsx` returns React nodes with `tk-*` classes.
- `fxHtml(code)` from `src/lib/fxHtml.ts` returns an HTML string for build-time pages.
- `toLines()` + `<AnimatedLines>` unfold output line by line; bump a `key` to replay the animation on deliberate
  changes (paste, sample, options), not on every keystroke.

### Passing data between tools

`sendJson(json, '/other-tool/')` and `takeJson()` in `src/lib/handoff.ts` use one `sessionStorage` key. Only the JSON
Schema Helper and the Expression Picker use it today; if a third tool joins, give each handoff its own key.

### Accessibility

- Toggle groups: `div.segmented[role=group][aria-label]` with buttons using `aria-pressed`.
- Every input has a visible `<label>` or an `aria-label` (not just a placeholder). In repeated rows, include the row
  number in the label.
- Mark invalid inputs with `aria-invalid` and point `aria-describedby` at the message.
- Don't make a whole output pane `aria-live`; announce short status messages through `#sr-status` instead.

### Privacy

Everything runs in the browser. No network calls with the visitor's input, no third-party scripts, no storage beyond
`sessionStorage` handoffs and small preferences.
