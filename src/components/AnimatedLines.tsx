import type { CSSProperties, ReactNode } from 'react';

/** Splits rendered tokens into lines so each line can animate on its own. */
export function toLines(nodes: ReactNode[]): ReactNode[][] {
  const lines: ReactNode[][] = [[]];
  for (const n of nodes) {
    if (typeof n === 'string' && n.includes('\n')) {
      n.split('\n').forEach((part, k) => {
        if (k > 0) lines.push([]);
        if (part) lines[lines.length - 1].push(part);
      });
    } else lines[lines.length - 1].push(n);
  }
  return lines;
}

/** One block per line; CSS (.bf-output .ln) staggers them in. */
export default function AnimatedLines({ lines }: { lines: ReactNode[][] }) {
  return (
    <>
      {lines.map((line, i) => (
        <span key={i} className="ln" style={{ '--i': i } as CSSProperties}>
          {line.length ? line : '​'}
        </span>
      ))}
    </>
  );
}
