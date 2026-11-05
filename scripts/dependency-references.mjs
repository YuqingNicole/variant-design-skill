// Syntax readers only. They never execute an imported module or project configuration.
const quoted = (source, start, escaped = true) => {
  const quote = source[start]; let value = '', i = start + 1;
  for (; i < source.length; i++) { if (escaped && source[i] === '\\') { value += source.slice(i, i + 2); i++; } else if (source[i] === quote) return { value, end: i + 1 }; else value += source[i]; }
  return { value, end: source.length, invalid: true };
};
const cssText = value => value.replace(/\\([a-f\d]{1,6})(?:\s)?|\\([^\r\n])/gi, (_, hex, char) => hex ? String.fromCodePoint(Math.min(parseInt(hex, 16) || 0xfffd, 0x10ffff)) : char);
export function cssReferences(source) {
  const refs = [], unknowns = []; let i = 0;
  while (i < source.length) {
    if (source.startsWith('/*', i)) { const end = source.indexOf('*/', i + 2); if (end < 0) { unknowns.push('invalid-css-comment'); break; } i = end + 2; continue; }
    if (source[i] === '"' || source[i] === "'") { const q = quoted(source, i); if (q.invalid) unknowns.push('invalid-css-string'); i = q.end; continue; }
    if (source[i] === '\\') unknowns.push('escaped-css-syntax');
    const rest = source.slice(i), imported = /^@import\s+(["'])/i.exec(rest);
    if (imported) { const q = quoted(source, i + imported[0].length - 1); refs.push({ value: cssText(q.value), kind: 'css-import' }); if (q.invalid) unknowns.push('invalid-css-import'); i = q.end; continue; }
    const url = /^url\s*\(/i.exec(rest);
    if (url && (i === 0 || !/[\w-]/.test(source[i - 1]))) {
      let start = i + url[0].length; while (/\s/.test(source[start] ?? '') && start < source.length) start++;
      let value, end;
      if ('"\''.includes(source[start] ?? '\0')) { const q = quoted(source, start); value = q.value; end = q.end; while (/\s/.test(source[end] ?? '') && end < source.length) end++; if (q.invalid || source[end] !== ')') unknowns.push('dynamic-or-invalid-css-url'); }
      else { end = source.indexOf(')', start); if (end < 0) end = source.length; value = source.slice(start, end).trim(); if (/[()]/.test(value)) unknowns.push('dynamic-or-invalid-css-url'); }
      if (value && !/[()]/.test(value)) refs.push({ value: cssText(value), kind: 'css-url' }); i = end + 1; continue;
    }
    if (/^(?:-webkit-)?image-set\s*\(/i.test(rest)) unknowns.push('css-image-set-needs-review');
    i++;
  }
  return { refs, unknowns };
}
const entities = value => value.replace(/&(?:amp|quot|apos|lt|gt|#\d+|#x[a-f\d]+);/gi, token => {
  const key = token.slice(1, -1).toLowerCase(), names = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>' };
  if (names[key]) return names[key]; const code = key.startsWith('#x') ? parseInt(key.slice(2), 16) : Number(key.slice(1)); return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : '\ufffd';
});
export function htmlReferences(source) {
  const refs = [], scripts = [], styles = [], unknowns = []; let i = 0;
  while ((i = source.indexOf('<', i)) !== -1) {
    if (source.startsWith('<!--', i)) { const end = source.indexOf('-->', i + 4); if (end < 0) { unknowns.push('invalid-html-comment'); break; } i = end + 3; continue; }
    const opening = /^<([a-z][\w:-]*)\b/i.exec(source.slice(i)); if (!opening) { i++; continue; }
    const tag = opening[1].toLowerCase(), attrs = {}; let cursor = i + opening[0].length;
    while (cursor < source.length && source[cursor] !== '>') {
      if (/[\s/]/.test(source[cursor])) { cursor++; continue; }
      const name = /^[^\s=/>]+/.exec(source.slice(cursor)); if (!name) { cursor++; continue; }
      cursor += name[0].length; while (/\s/.test(source[cursor] ?? '') && cursor < source.length) cursor++;
      let value = '';
      if (source[cursor] === '=') {
        cursor++; while (/\s/.test(source[cursor] ?? '') && cursor < source.length) cursor++;
        if (source[cursor] === '"' || source[cursor] === "'") { const q = quoted(source, cursor, false); value = q.value; cursor = q.end; if (q.invalid) unknowns.push('invalid-html-attribute'); }
        else { const unquoted = /^[^\s>]+/.exec(source.slice(cursor)); value = unquoted?.[0] ?? ''; cursor += value.length; }
      }
      attrs[name[0].toLowerCase()] = entities(value);
    }
    i = cursor + 1;
    const resource = (name, kind = 'html-resource') => { if (attrs[name]) refs.push({ value: attrs[name], kind }); };
    if (tag === 'script') resource('src', 'module-import');
    if (['img', 'source', 'audio', 'video', 'track', 'iframe', 'embed', 'input'].includes(tag)) resource('src');
    if (tag === 'video') resource('poster'); if (tag === 'object') resource('data');
    if (tag === 'link' && /(?:^|\s)(?:stylesheet|icon|preload|modulepreload|manifest)(?:\s|$)/i.test(attrs.rel ?? '')) resource('href');
    if (['image', 'use'].includes(tag)) { resource('href'); resource('xlink:href'); }
    if (attrs.srcset) { if (/data:|["']/.test(attrs.srcset)) unknowns.push('complex-srcset'); else for (const item of attrs.srcset.split(',')) refs.push({ value: item.trim().split(/\s+/)[0], kind: 'html-resource' }); }
    if (attrs.style) styles.push(attrs.style);
    if (tag === 'base') unknowns.push('html-base-needs-review');
    if (tag === 'script' || tag === 'style') {
      const closing = new RegExp(`</${tag}\\s*>`, 'ig'); closing.lastIndex = i; const match = closing.exec(source);
      if (!match) { unknowns.push('invalid-html-raw-text'); break; }
      if (tag === 'style') styles.push(source.slice(i, match.index));
      else if (!attrs.src && (!attrs.type || ['module', 'text/javascript', 'application/javascript'].includes(attrs.type.toLowerCase()))) scripts.push(source.slice(i, match.index));
      else if (attrs.type === 'importmap') unknowns.push('html-importmap-needs-review');
      i = match.index + match[0].length;
    }
  }
  for (const style of styles) { const parsed = cssReferences(style); refs.push(...parsed.refs); unknowns.push(...parsed.unknowns); }
  return { refs, scripts, unknowns };
}
export function scriptReferences(ts, source, file, config = false) {
  const kind = /\.jsx$/.test(file) ? ts.ScriptKind.JSX : /\.tsx$/.test(file) ? ts.ScriptKind.TSX : /\.[cm]?js$/.test(file) ? ts.ScriptKind.JS : ts.ScriptKind.TS;
  const parsed = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, kind);
  const refs = [], unknowns = parsed.parseDiagnostics?.length ? ['invalid-script-syntax'] : [];
  const literal = node => node && ts.isStringLiteralLike(node) ? node.text : null;
  const add = (node, kind) => { const value = literal(node); if (value !== null) refs.push({ value, kind }); else unknowns.push('dynamic-module-reference'); };
  const visit = node => {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) { if (node.moduleSpecifier) add(node.moduleSpecifier, 'module-import'); }
    else if (ts.isImportEqualsDeclaration(node) && ts.isExternalModuleReference(node.moduleReference)) add(node.moduleReference.expression, 'module-import');
    else if (ts.isCallExpression(node)) {
      if (node.expression.kind === ts.SyntaxKind.ImportKeyword || (ts.isIdentifier(node.expression) && node.expression.text === 'require')) add(node.arguments[0], 'module-import');
      else if (ts.isPropertyAccessExpression(node.expression) && ['glob', 'globEager'].includes(node.expression.name.text)) unknowns.push('glob-needs-review');
    } else if (!config && ts.isNewExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'URL') {
      const base = node.arguments?.[1];
      if (base && ts.isPropertyAccessExpression(base) && base.name.text === 'url' && ts.isMetaProperty(base.expression) && base.expression.keywordToken === ts.SyntaxKind.ImportKeyword) add(node.arguments?.[0], 'script-url');
      else unknowns.push('dynamic-url-base');
    }
    ts.forEachChild(node, visit);
  };
  visit(parsed);
  for (const reference of parsed.referencedFiles ?? []) refs.push({ value: reference.fileName.startsWith('.') ? reference.fileName : './' + reference.fileName, kind: 'module-import' });
  return { refs, unknowns };
}
