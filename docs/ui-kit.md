# UI Kit

`/ui-kit/` is a library of copy-paste canvas app components (about 50 items: components, layouts and full screens).
Each item is described **once**, as a tree of nodes, and that one tree becomes:

- the Power Apps YAML a maker pastes into Studio (`src/uikit/yaml.ts`),
- a live HTML preview (`src/components/uikit/KitPreview.tsx`),
- optionally a reusable canvas component in `ComponentDefinitions` format (`src/uikit/component.ts`).

Everything is themed through **fxConfig**, a named-formula design system (`src/uikit/theme.ts`).

## Where things live

| Path                                          | What it is                                                                                                                                                   |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/uikit/model.ts`                          | Node types and builders: `vCon`, `hCon`, `nCon`, `lbl`, `btn`, `rect`, `circle`, `ico`, `img`, `txt`, `gal`, `att`, `addMedia`; `fx(formula, previewValue)`. |
| `src/uikit/types.ts`                          | `KitItem`, options (text, select, toggle, number, lines), `Snippet`.                                                                                         |
| `src/uikit/resolve.ts`                        | Turns tokens into formulas (`fxColorConfigs.Primary1`) and preview values (CSS vars).                                                                        |
| `src/uikit/compose.ts`                        | Reuse helpers: `part`, `suffixed`, `merge`, `tweak`.                                                                                                         |
| `src/uikit/yaml.ts`                           | Node tree → canvas YAML (`toYaml`); control versions in `CONTROL_ID`.                                                                                        |
| `src/uikit/theme.ts`, `themeStore.ts`         | Color keys, preset themes, the fxConfig formula; the visitor's saved theme.                                                                                  |
| `src/uikit/validate.ts`, `allowed.ts`         | Build-time checks; allowed properties per control version.                                                                                                   |
| `src/uikit/component.ts`, `componentSpecs.ts` | Snippet → canvas component; per-item hints the converter can't infer.                                                                                        |
| `src/uikit/items/*.ts`                        | The items. `items/index.ts` lists them in catalog order (`KIT_ITEMS`).                                                                                       |
| `src/components/uikit/*`                      | Catalog card, item page UI, preview, theme builder, YAML viewer.                                                                                             |
| `src/pages/ui-kit/`                           | Catalog, design-system page, and one page per item.                                                                                                          |

## The model in brief

- **Every formula carries its own preview value:** `fx('CountRows(colRequests)', 12)` writes the formula into YAML
  and shows `12` in the preview.
- **Colors and sizes are tokens**, not literals: a `ColorKey` such as `Primary1` becomes
  `fxColorConfigs.Primary1`; `{ status: n }`, `{ fade: key, by }`, `{ if, then, else }` and `{ switch, cases }` cover
  status colors, `ColorFade`, and conditional colors. Size, radius, thickness and padding keys map to
  `fxTextConfigs.*`.
- **Layout depends on the parent:** inside an auto-layout container a child gets `FillPortions`, `LayoutMin*` and
  `AlignInContainer`; elsewhere it gets `Width`/`Height`/`X`/`Y`, with `'fill'` meaning `Parent.Width` (or
  `Parent.TemplateWidth` in a gallery row).
- **`extra`** sets raw YAML properties the preview ignores. Use it sparingly.

## The theme

Four presets share the same text tokens and differ in colors. The preview takes colors only from CSS variables, so a
theme change repaints without re-rendering. The visitor's theme is saved in `localStorage` (`mt-uikit-theme`) and
applied before first paint by `KitThemeHead.astro`.

The pasted **controls YAML never contains theme values**, only token references. The theme reaches copied code in two
places: the fxConfig formula on the design-system page (`fxConfigFormula`) and a component's `ConfigProperties`
default.

## Validation (fails the build)

`src/pages/ui-kit/[slug].astro` validates each item while generating its page: the defaults, plus one variant per
select choice and one per toggle flipped on its own, each as controls (`checkSnippet`) and, if the item has a component
spec, as a component (`checkComponent`). Any problem throws, so `npm run build` fails. In `npm run dev` the error
shows when you open that item's page.

`checkSnippet` checks naming prefixes (`PREFIXES`), unique names across the tree, known control ids, that every
property exists for that control version (`ALLOWED_PROPS` / `LAYOUT_CHILD_PROPS`), no empty values, and that the
YAML round-trips into the canvas YAML shape. `checkComponent` checks the ComponentDefinition shape, that inputs have
defaults and outputs have formulas, and that the component reads nothing only the screen has (screen variables,
undeclared collections, `fx…`/`scr…` names, `Navigate`).

**Not checked:** Power Fx syntax, token typos (no type checks on token strings at build time), `HexColors` keys used
by icons, and combinations of options (only one change at a time is tried).

## Add a component

1. Write a `KitItem` in the most fitting file in `src/uikit/items/`.
   - Name every control with its prefix (`vCon`/`hCon`/`nCon`, `lbl`, `btn`, `shp` for rectangles and circles,
     `img`, `txt`, `gal`, `att`).
   - Give every formula a preview value with `fx(formula, value)`.
   - Use `icon()` from `items/shared.ts` with a key that exists in the theme's hex colors. Keep SVGs free of double
     quotes.
   - Put "preview" in the label of text options that only affect the preview.
   - Name named formulas `fx…`, end each with `;`, and put comments on their own `//` line above.
   - When you reuse another item's tree, wrap it in `suffixed()` so control names stay unique.
2. Add it to `KIT_ITEMS` in `src/uikit/items/index.ts`.
3. For a component (not a layout or screen), add a `COMPONENT_SPECS` entry in `src/uikit/componentSpecs.ts`: events
   for controls whose action belongs on the screen (Navigate, connectors), outputs for state the screen reads, and
   inputs for screen variables.
4. Add a `kind: 'tool'` line to `src/data/changelog.ts`.
5. `npm run dev`, open the page, try every option, then `npm run build`.

Its page, catalog card, share image and search entry are created automatically.

## Add a control type or property

- **Control type:** an interface, union entry and builder in `model.ts`; `CONTROL_ID` and a case in `yaml.ts`; a
  property list in `allowed.ts` (copied from a real app's `.pa.yaml` for that control version); a `PREFIXES` entry in
  `validate.ts`; a render case in `KitPreview.tsx`; a glyph style in `global.css` and an example on
  `design-system.astro`. Gallery-like controls also need the row helpers in `compose.ts` and the preview updated.
- **Property:** add the field in `model.ts`, write it in `yaml.ts` (resolve tokens through `resolve.ts`), make sure it
  is in `ALLOWED_PROPS`, and render it in the preview. One-off properties can go in `extra`.
- **Color token:** add it to `COLOR_KEYS` and every theme in `theme.ts`, to the hard-coded groups in
  `fxConfigFormula`, and to the theme builder's groups. Otherwise the preview works but the pasted fxConfig lacks it.

## Where the preview differs from Power Apps

The preview approximates Studio. Known gaps: text inputs show the theme fill but the YAML sets none; hover, pressed
and focus states aren't drawn; shadow levels look alike; and galleries with `selectedIndex: -1` show no selected
row. Check anything layout-critical in Studio.
