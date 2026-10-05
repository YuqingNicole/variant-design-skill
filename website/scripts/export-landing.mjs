#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';

export function exportLanding(project, id) {
  if (!['A', 'B', 'C'].includes(id)) throw new Error('Name the direction to export: A, B, or C.');
  const output = path.join(project, 'variant-output');
  const state = JSON.parse(fs.readFileSync(path.join(output, '.variant-context.json'), 'utf8'));
  const source = fs.readFileSync(path.join(output, `Variant${id}.tsx`), 'utf8');
  const match = source.match(/export const hero: LandingHeroConfig = ([\s\S]*?);\s*\/\* zone:hero:end \*\//);
  if (!match) throw new Error('Expected a JSON hero configuration inside the hero zone.');
  const hero = JSON.parse(match[1]);
  if (hero.id !== id || !['story', 'proof', 'install'].includes(hero.layout)) throw new Error('Invalid landing configuration.');
  const content = `import type { LandingHeroConfig } from "./LandingIntroduction";\n\n// Exported from ${id}, revision ${state.variants[id].version}.\nexport const landingHero: LandingHeroConfig = ${JSON.stringify(hero, null, 2)};\n`;
  const target = path.join(project, 'src/landing-config.ts');
  const original = fs.readFileSync(target, 'utf8');
  if (original === content) return { changed: false, id, version: state.variants[id].version };
  const archive = path.join(output, '.exports', randomUUID());
  fs.mkdirSync(archive, { recursive: true });
  fs.writeFileSync(path.join(archive, 'landing-config.ts'), original, { flag: 'wx', flush: true });
  if (fs.readFileSync(path.join(archive, 'landing-config.ts'), 'utf8') !== original) throw new Error('Export backup verification failed.');
  const temp = target + '.tmp';
  try { fs.writeFileSync(temp, content); fs.renameSync(temp, target); }
  finally { if (fs.existsSync(temp)) fs.unlinkSync(temp); }
  return { changed: true, id, version: state.variants[id].version, target, backup: archive };
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try { console.log(JSON.stringify(exportLanding(fileURLToPath(new URL('../', import.meta.url)), process.argv[2]), null, 2)); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
