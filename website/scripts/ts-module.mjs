// Imports a website/src TypeScript module in node:test without a TS loader, so tests run on Node 22 as in CI.
// Relative imports inside it are transpiled the same way; only modules without JSX or package imports are supported.
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
const cache = new Map();
export async function importTs(file) {
  const abs = path.resolve(file);
  if (cache.has(abs)) return cache.get(abs);
  let code = ts.transpileModule(fs.readFileSync(abs, 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  for (const [, spec] of code.matchAll(/from ['"](\.{1,2}\/[^'"]+)['"]/g)) {
    const dep = await importTs(path.join(path.dirname(abs), spec.endsWith('.ts') ? spec : `${spec}.ts`));
    code = code.replaceAll(`'${spec}'`, `'${dep.__url}'`).replaceAll(`"${spec}"`, `'${dep.__url}'`);
  }
  const url = `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
  const mod = { ...(await import(url)), __url: url };
  cache.set(abs, mod);
  return mod;
}
