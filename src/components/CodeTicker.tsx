import type { CSSProperties } from 'react';
import type { Lang } from '../data/types';
import { highlight } from '../lib/highlight';

// Rendered to static HTML (no client directive). The rotation is pure CSS.
export default function CodeTicker({ lines }: { lines: { code: string; note: string; lang?: Lang }[] }) {
  return (
    <figure className="ticker" aria-label="Example formulas">
      <div className="ticker__bar">
        <span className="ticker__dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        formula of the moment
      </div>
      <div className="ticker__stage">
        {lines.map((l, i) => (
          <div key={i} className="ticker__line" style={{ '--i': i } as CSSProperties}>
            <pre>
              <code>{highlight(l.code, l.lang)}</code>
            </pre>
            <p>{l.note}</p>
          </div>
        ))}
      </div>
    </figure>
  );
}
