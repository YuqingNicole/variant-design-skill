// Shared token declarations, origins and layers. This is a single-value CSS audit, not a cascade evaluator.
export const references = value => [...String(value).matchAll(/var\(\s*(--[\w-]+)/g)].map(m => m[1]);
const semantic = /^--(?:color|text|font|weight|leading|tracking|space|gap|radius|shadow|duration|ease|z|control|row|content|container|breakpoint|size|width|height|opacity|border)-/;
const heading = comment => {
  const text = comment.replace(/^\/\*|\*\/$/g, '').trim().replace(/^[\s*─—=\-]+/, '');
  const m = text.match(/^(?:layer\s*:\s*)?(primitive|semantic|component)s?\b/i);
  return m ? m[1].toLowerCase() : null;
};

export function tokenDeclarations(sources) {
  const tokens = [];
  sources.forEach((input, sourceIndex) => {
    const { source, origin = 'generated' } = typeof input === 'string' ? { source: input } : input;
    if (!['brand', 'generated', 'extension'].includes(origin)) throw new Error(`Unknown token origin: ${origin}`);
    const comments = [], raw = String(source);
    // Mask comments and quoted strings for locating declarations; retain offsets into the real values.
    const masked = raw.replace(/\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g, (s, at) => {
      if (s.startsWith('/*')) comments.push({ at, end: at + s.length, text: s });
      return s.replace(/[^\n]/g, ' ');
    });
    let section = null, ci = 0;
    for (const match of masked.matchAll(/(--[\w-]+)\s*:/g)) {
      while (ci < comments.length && comments[ci].at < match.index) section = heading(comments[ci++].text) ?? section;
      const start = match.index + match[0].length;
      let end = start, depth = 0;
      for (; end < masked.length; end++) {
        const ch = masked[end];
        if (!depth && (ch === ';' || ch === '}')) break;
        if (ch === '(') depth++;
        if (ch === ')') depth--;
      }
      // A declaration-like sequence inside a value is not another token.
      if (tokens.at(-1)?.sourceIndex === sourceIndex && match.index < tokens.at(-1).end) continue;
      const name = match[1], value = raw.slice(start, end).replace(/\/\*[\s\S]*?\*\//g, ' ').trim();
      const note = masked[end] === ';' ? raw.slice(end + 1).match(/^[ \t]*(\/\*[\s\S]*?\*\/)/)?.[1] ?? '' : '';
      const use = note.match(/\buse:\s*([^;]*?)(?:;|\*\/)/)?.[1]?.trim();
      const on = note.match(/\bon:\s*([^;]*?)(?:;|\*\/)/)?.[1];
      const layer = origin === 'brand' ? 'brand' : name.startsWith('--p-') ? 'primitive' : semantic.test(name) ? 'semantic' : section ?? 'component';
      tokens.push({ name, value, layer, origin, sourceIndex, end, ...(use ? { use } : {}),
        ...(on ? { on: on.match(/--[\w-]+/g) ?? [] } : {}), nonText: /\bcontrast:\s*non-text\b/.test(note) });
    }
  });
  return tokens;
}

export function tokenMap(sources) {
  const tokens = new Map();
  for (const token of tokenDeclarations(sources)) {
    const previous = tokens.get(token.name);
    tokens.set(token.name, { ...token, values: [...new Set([...(previous?.values ?? []), token.value])] });
  }
  return tokens;
}

export function layerIssues(sources) {
  const tokens = tokenMap(sources), issues = [];
  for (const token of tokenDeclarations(sources).filter(t => t.layer === 'component')) {
    const target = token.value.match(/^var\(\s*(--[\w-]+)\s*\)$/)?.[1];
    if (!target) issues.push({ token: token.name, reason: 'component tokens must be a single semantic var() alias, without raw values or fallbacks' });
    else if (!tokens.has(target)) issues.push({ token: token.name, target, reason: 'alias target is not defined in the supplied system files' });
    else if (!['semantic', 'brand'].includes(tokens.get(target).layer)) issues.push({ token: token.name, target, reason: `component token references the ${tokens.get(target).layer} layer instead of semantic tokens` });
  }
  return issues.filter((item, index) => issues.findIndex(other => JSON.stringify(other) === JSON.stringify(item)) === index);
}
