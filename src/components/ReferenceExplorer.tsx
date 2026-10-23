import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { Category, Lang, RefItem } from '../data/types';
import { slugify } from '../data/types';
import FormulaDetail, { CopyButton } from './FormulaDetail';

interface Props {
  items: RefItem[];
  categories: Category[];
  docsBase: string;
  /** URL of the reference page, e.g. "/formula-reference/". Detail pages live below it. */
  basePath: string;
  noun?: string;
  singular?: string;
  lang?: Lang;
  placeholder?: string;
}

type View = 'cards' | 'tree';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const catStyle = (color: string | undefined) => ({ '--cat': color ?? 'var(--ink-3)' }) as CSSProperties;

function score(item: RefItem, q: string): number {
  const name = item.name.toLowerCase();
  if (name === q) return 100;
  if (name.startsWith(q)) return 80;
  if (name.includes(q)) return 60;
  if (item.tags?.some((t) => t.includes(q))) return 45;
  if (item.summary.toLowerCase().includes(q)) return 30;
  if (item.category.toLowerCase().includes(q)) return 20;
  // Several words: every word has to appear somewhere.
  const hay = [name, item.summary, item.category, ...(item.tags ?? [])].join(' ').toLowerCase();
  const terms = q.split(/\s+/).filter(Boolean);
  return terms.length > 1 && terms.every((t) => hay.includes(t)) ? 10 : 0;
}

function Highlighted({ text, q }: { text: string; q: string }) {
  const at = q ? text.toLowerCase().indexOf(q) : -1;
  if (at < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <mark>{text.slice(at, at + q.length)}</mark>
      {text.slice(at + q.length)}
    </>
  );
}

export default function ReferenceExplorer({
  items,
  categories,
  docsBase,
  basePath,
  noun = 'formulas',
  singular = 'formula',
  lang = 'powerfx',
  placeholder,
}: Props) {
  const [query, setQuery] = useState('');
  const [letter, setLetter] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [view, setView] = useState<View>('cards');
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const searchRef = useRef<HTMLInputElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const lastCardRef = useRef<HTMLElement | null>(null);

  const colorOf = useMemo(() => new Map(categories.map((c) => [c.name, c.color])), [categories]);
  const q = query.trim().toLowerCase();

  const byCategory = useMemo(
    () => (category ? items.filter((i) => i.category === category) : items),
    [items, category],
  );
  const lettersAvailable = useMemo(() => new Set(byCategory.map((i) => i.name[0].toUpperCase())), [byCategory]);

  const results = useMemo(() => {
    let list = letter ? byCategory.filter((i) => i.name[0].toUpperCase() === letter) : byCategory;
    if (q) {
      list = list
        .map((item) => ({ item, s: score(item, q) }))
        .filter((r) => r.s > 0)
        .sort((a, b) => b.s - a.s || a.item.name.localeCompare(b.item.name))
        .map((r) => r.item);
    }
    return list;
  }, [byCategory, letter, q]);

  const selected = useMemo(() => items.find((i) => i.name === selectedName) ?? null, [items, selectedName]);
  const order = selected && results.includes(selected) ? results : items;
  const pos = selected ? order.indexOf(selected) : -1;
  const prev = pos > 0 ? order[pos - 1] : null;
  const next = pos >= 0 && pos < order.length - 1 ? order[pos + 1] : null;

  const select = useCallback((name: string | null, opts: { focusPanel?: boolean } = {}) => {
    if (name && document.activeElement instanceof HTMLElement && document.activeElement.dataset.card) {
      lastCardRef.current = document.activeElement;
    }
    setSelectedName(name);
    const url = new URL(window.location.href);
    if (name) url.searchParams.set('f', name);
    else url.searchParams.delete('f');
    history.replaceState(null, '', url);
    if (name && opts.focusPanel) requestAnimationFrame(() => headingRef.current?.focus());
    if (!name) requestAnimationFrame(() => lastCardRef.current?.focus());
  }, []);

  const openFromList = (name: string) =>
    select(name, { focusPanel: window.matchMedia('(max-width: 999px)').matches });

  // Deep link: /formula-reference/?f=Patch
  useEffect(() => {
    const f = new URL(window.location.href).searchParams.get('f');
    if (f && items.some((i) => i.name === f)) setSelectedName(f);
  }, [items]);

  // Keep the selected card visible when stepping with Prev/Next.
  useEffect(() => {
    if (!selectedName) return;
    document
      .querySelector(`[data-card="${CSS.escape(selectedName)}"]`)
      ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selectedName, view]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const typing = t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable;
      if (e.key === '/' && !typing) {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === 'Escape') {
        if (selectedName) select(null);
        else if (typing && query) setQuery('');
      } else if (!typing && selectedName && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
        const target = e.key === 'ArrowRight' ? next : prev;
        if (target) {
          e.preventDefault();
          select(target.name);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedName, query, next, prev, select]);

  const resetAll = () => {
    setQuery('');
    setLetter(null);
    setCategory(null);
  };

  const card = (item: RefItem, i: number) => (
    <li key={item.name} style={{ '--i': Math.min(i, 24) } as CSSProperties}>
      <button
        type="button"
        className="card"
        data-card={item.name}
        aria-pressed={item.name === selectedName}
        onClick={() => openFromList(item.name)}
        style={catStyle(colorOf.get(item.category))}
      >
        <span className="card__cat">{item.category}</span>
        <span className="card__name">
          <Highlighted text={item.name} q={q} />
        </span>
        <span className="card__summary">{item.summary}</span>
      </button>
    </li>
  );

  const letterGroups = useMemo(() => {
    const groups = new Map<string, RefItem[]>();
    for (const item of results) {
      const l = item.name[0].toUpperCase();
      groups.set(l, [...(groups.get(l) ?? []), item]);
    }
    return [...groups.entries()];
  }, [results]);

  const categoryGroups = useMemo(
    () =>
      categories
        .map((c) => ({ ...c, items: results.filter((i) => i.category === c.name) }))
        .filter((g) => g.items.length > 0),
    [categories, results],
  );

  const toggleBranch = (name: string) =>
    setCollapsed((s) => {
      const n = new Set(s);
      n.has(name) ? n.delete(name) : n.add(name);
      return n;
    });

  const filtersActive = Boolean(q || letter || category);

  return (
    <div className={`explorer${selected ? ' has-selection' : ''}`}>
      {/* ── Toolbar ─────────────────────────────────────── */}
      <div className="explorer__toolbar">
        <label className="search">
          <span className="visually-hidden">Search {noun}</span>
          <svg className="search__icon" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M15.5 15.5 21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            ref={searchRef}
            type="search"
            placeholder={placeholder ?? `Search ${noun} or tasks, like "remove duplicates"`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="search__kbd" aria-hidden="true">
            /
          </kbd>
        </label>

        <div className="segmented" role="group" aria-label="View">
          {(['cards', 'tree'] as View[]).map((v) => (
            <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)}>
              {v === 'cards' ? 'Cards' : 'Tree'}
            </button>
          ))}
        </div>
      </div>

      <div className="chips" role="group" aria-label="Filter by category">
        <button type="button" className="chip" aria-pressed={!category} onClick={() => setCategory(null)}>
          All <span className="chip__count">{items.length}</span>
        </button>
        {categories.map((c) => (
          <button
            key={c.name}
            type="button"
            className="chip"
            aria-pressed={category === c.name}
            onClick={() => {
              setCategory(category === c.name ? null : c.name);
              setLetter(null);
            }}
            style={catStyle(c.color)}
          >
            <span className="chip__dot" aria-hidden="true" />
            {c.name} <span className="chip__count">{items.filter((i) => i.category === c.name).length}</span>
          </button>
        ))}
      </div>

      <div className="explorer__body">
        {/* ── A–Z rail ──────────────────────────────────── */}
        <nav className="rail" aria-label="Browse by letter">
          {LETTERS.map((l) => (
            <button
              key={l}
              type="button"
              disabled={!lettersAvailable.has(l)}
              aria-pressed={letter === l}
              onClick={() => setLetter(letter === l ? null : l)}
            >
              {l}
            </button>
          ))}
        </nav>

        {/* ── Results ───────────────────────────────────── */}
        <div className="results">
          <div className="results__meta">
            <p aria-live="polite">
              <strong>{results.length}</strong> {results.length === 1 ? singular : noun}
              {q && (
                <>
                  {' '}
                  matching <q>{query.trim()}</q>
                </>
              )}
              {letter && <> starting with {letter}</>}
              {category && <> in {category}</>}
            </p>
            {filtersActive && (
              <button type="button" className="link-btn" onClick={resetAll}>
                Clear filters
              </button>
            )}
            {view === 'tree' && results.length > 0 && (
              <span className="results__tree-actions">
                <button type="button" className="link-btn" onClick={() => setCollapsed(new Set())}>
                  Expand all
                </button>
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => setCollapsed(new Set(categories.map((c) => c.name)))}
                >
                  Collapse all
                </button>
              </span>
            )}
          </div>

          {results.length === 0 ? (
            <div className="empty">
              <p className="empty__title">Nothing matches that.</p>
              <p>Try a shorter word, a task such as “format date”, or clear the filters.</p>
              <button type="button" className="btn" onClick={resetAll}>
                Show all {noun}
              </button>
            </div>
          ) : view === 'cards' ? (
            q ? (
              <ul className="grid">{results.map(card)}</ul>
            ) : (
              letterGroups.map(([l, group]) => (
                <section key={l} className="letter-group" aria-labelledby={`letter-${l}`}>
                  <h2 className="letter-group__head" id={`letter-${l}`}>
                    {l}
                  </h2>
                  <ul className="grid">{group.map(card)}</ul>
                </section>
              ))
            )
          ) : (
            <ul className="tree">
              {categoryGroups.map((g) => {
                const open = !collapsed.has(g.name);
                return (
                  <li key={g.name} className="tree__branch" style={catStyle(g.color)}>
                    <button
                      type="button"
                      className="tree__head"
                      aria-expanded={open}
                      onClick={() => toggleBranch(g.name)}
                    >
                      <span className="tree__caret" aria-hidden="true" />
                      <span className="tree__name">{g.name}</span>
                      <span className="tree__count">{g.items.length}</span>
                    </button>
                    {open && (
                      <ul className="tree__leaves">
                        {g.items.map((item) => (
                          <li key={item.name}>
                            <button
                              type="button"
                              className="leaf"
                              data-card={item.name}
                              aria-pressed={item.name === selectedName}
                              onClick={() => openFromList(item.name)}
                            >
                              <span className="leaf__name">
                                <Highlighted text={item.name} q={q} />
                              </span>
                              <span className="leaf__summary">{item.summary}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* ── Detail panel ──────────────────────────────── */}
        <aside className={`panel${selected ? ' is-open' : ''}`} aria-label={`${singular[0].toUpperCase()}${singular.slice(1)} details`}>
          {selected ? (
            <div className="panel__inner" key={selected.name} style={catStyle(colorOf.get(selected.category))}>
              <div className="panel__top">
                <span className="tag">
                  <span className="chip__dot" aria-hidden="true" />
                  {selected.category}
                </span>
                <button type="button" className="icon-btn" onClick={() => select(null)} aria-label="Close details">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <h2 className="panel__name" ref={headingRef} tabIndex={-1}>
                {selected.name}
              </h2>
              <p className="panel__summary">{selected.summary}</p>

              <FormulaDetail item={selected} docsBase={docsBase} lang={lang} level={3} />

              {(() => {
                const related = items
                  .filter((i) => i.category === selected.category && i.name !== selected.name)
                  .slice(0, 8);
                return related.length > 0 ? (
                  <section className="detail__block">
                    <h3 className="detail__label">More in {selected.category}</h3>
                    <div className="related">
                      {related.map((r) => (
                        <button key={r.name} type="button" className="related__item" onClick={() => select(r.name)}>
                          {r.name}
                        </button>
                      ))}
                    </div>
                  </section>
                ) : null;
              })()}

              <div className="panel__links">
                <a href={`${basePath}${slugify(selected.name)}/`}>Open full page</a>
                <CopyButton
                  text={`${window.location.origin}${basePath}${slugify(selected.name)}/`}
                  label={`link to ${selected.name}`}
                />
              </div>

              <div className="panel__nav">
                <button type="button" className="btn btn--ghost" disabled={!prev} onClick={() => prev && select(prev.name)}>
                  <span aria-hidden="true">←</span> {prev ? prev.name : 'Previous'}
                </button>
                <button type="button" className="btn btn--ghost" disabled={!next} onClick={() => next && select(next.name)}>
                  {next ? next.name : 'Next'} <span aria-hidden="true">→</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="panel__empty">
              <p className="panel__empty-title">Pick a card.</p>
              <p>Its syntax, parameters and copy-ready examples open here.</p>
              <ul className="shortcuts">
                <li>
                  <kbd>/</kbd> search
                </li>
                <li>
                  <kbd>←</kbd>
                  <kbd>→</kbd> step through results
                </li>
                <li>
                  <kbd>Esc</kbd> close
                </li>
              </ul>
            </div>
          )}
        </aside>
      </div>
      {selected && <button type="button" className="scrim" aria-label="Close details" onClick={() => select(null)} />}
    </div>
  );
}
