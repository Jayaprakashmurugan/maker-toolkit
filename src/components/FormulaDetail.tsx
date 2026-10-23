import type { RefItem } from '../data/types';
import { highlight } from '../lib/highlight';

// Plain button: the click is handled by one delegated listener in Base.astro,
// so it also works on static pages that ship no React.
export function CopyButton({ text, label }: { text: string; label: string }) {
  return (
    <button type="button" className="copy-btn" data-copy={text} aria-label={`Copy ${label}`}>
      <span className="copy-btn__idle">Copy</span>
      <span className="copy-btn__done" aria-hidden="true">
        Copied
      </span>
    </button>
  );
}

export function CodeLine({ code, label }: { code: string; label: string }) {
  return (
    <div className="code">
      <pre>
        <code>{highlight(code)}</code>
      </pre>
      <CopyButton text={code} label={label} />
    </div>
  );
}

interface Props {
  item: RefItem;
  docsBase: string;
  /** Heading level for section titles: h3 inside the explorer panel, h2 on a page. */
  level?: 2 | 3;
}

export default function FormulaDetail({ item, docsBase, level = 3 }: Props) {
  const H = `h${level}` as 'h2' | 'h3';
  return (
    <div className="detail">
      <section className="detail__block">
        <H className="detail__label">Syntax</H>
        <CodeLine code={item.syntax} label={`${item.name} syntax`} />
      </section>

      {item.params && item.params.length > 0 && (
        <section className="detail__block">
          <H className="detail__label">Parameters</H>
          <dl className="params">
            {item.params.map((p) => (
              <div key={p.name} className="params__row">
                <dt>
                  <code>{p.name}</code>
                  {p.optional && <span className="params__opt">optional</span>}
                </dt>
                <dd>{p.description}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <section className="detail__block">
        <H className="detail__label">Examples</H>
        <ol className="examples">
          {item.examples.map((ex, i) => (
            <li key={i}>
              <CodeLine code={ex.code} label={`${item.name} example ${i + 1}`} />
              {ex.result && <p className="examples__result">{ex.result}</p>}
            </li>
          ))}
        </ol>
      </section>

      {item.notes && item.notes.length > 0 && (
        <section className="detail__block">
          <H className="detail__label">Maker notes</H>
          <ul className="notes">
            {item.notes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </section>
      )}

      {item.docs && (
        <a className="detail__docs" href={docsBase + item.docs} target="_blank" rel="noopener">
          Official documentation on Microsoft Learn <span aria-hidden="true">↗</span>
        </a>
      )}
    </div>
  );
}
