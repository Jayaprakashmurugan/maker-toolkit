// Colors canvas YAML (controls and component definitions): names, keys, and the Power Fx after each "=".

import { fxHtml } from '../../lib/fxHtml';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function yamlHtml(yaml: string): string {
  let inBlock = -1;
  return yaml
    .split('\n')
    .map((line) => {
      const indent = line.length - line.trimStart().length;
      if (inBlock >= 0 && (line.trim() === '' || indent > inBlock)) return esc(line.slice(0, indent)) + fxHtml(line.slice(indent));
      inBlock = -1;
      let m = line.match(/^(\s*)- ([A-Za-z_]\w*):$/);
      if (m) return `${m[1]}<span class="tk-punc">-</span> <span class="ky-name">${m[2]}</span><span class="tk-punc">:</span>`;
      m = line.match(/^(\s*)(Control|ComponentName|Variant|Properties|Children|ComponentDefinitions|DefinitionType|CustomProperties|PropertyKind|DataType|ReturnType|Description|RaiseOnReset):(.*)$/);
      if (m) return `${m[1]}<span class="ky-struct">${m[2]}</span><span class="tk-punc">:</span><span class="ky-type">${esc(m[3])}</span>`;
      // A component or custom property name on its own line.
      m = line.match(/^(\s*)([A-Za-z_]\w*):$/);
      if (m) return `${m[1]}<span class="ky-name">${m[2]}</span><span class="tk-punc">:</span>`;
      m = line.match(/^(\s*)([A-Za-z_]\w*): (\|-|=.*)$/);
      if (m) {
        if (m[3] === '|-') {
          inBlock = indent;
          return `${m[1]}<span class="ky-prop">${m[2]}</span><span class="tk-punc">:</span> <span class="tk-punc">|-</span>`;
        }
        return `${m[1]}<span class="ky-prop">${m[2]}</span><span class="tk-punc">:</span> <span class="tk-op">=</span>${fxHtml(m[3].slice(1))}`;
      }
      return esc(line);
    })
    .join('\n');
}

export default function YamlCode({ code, lang = 'yaml' }: { code: string; lang?: 'yaml' | 'fx' }) {
  return (
    <pre className="kit-code">
      <code dangerouslySetInnerHTML={{ __html: lang === 'yaml' ? yamlHtml(code) : fxHtml(code) }} />
    </pre>
  );
}
