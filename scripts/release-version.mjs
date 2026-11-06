#!/usr/bin/env node
// Bump one product version and synchronize every manifest and version record for that product.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const parse = value => {
  const match = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-rc\.(0|[1-9]\d*))?$/.exec(value ?? '');
  if (!match) throw new Error(`Unsupported version: ${value}`);
  return { major: +match[1], minor: +match[2], patch: +match[3], rc: match[4] === undefined ? null : +match[4] };
};

export function bumpVersion(current, bump) {
  const version = parse(current);
  if (bump === 'rc') return `${version.major}.${version.minor}.${version.patch}-rc.${version.rc === null ? 1 : version.rc + 1}`;
  if (bump === 'finalize') {
    if (version.rc === null) throw new Error('The current version is not a release candidate.');
    return `${version.major}.${version.minor}.${version.patch}`;
  }
  if (!['patch', 'minor', 'major'].includes(bump)) throw new Error(`Choose patch, minor, major, rc or finalize; received: ${bump}`);
  if (version.rc !== null) throw new Error('Finalize the release candidate before starting the next version.');
  if (bump === 'major') return `${version.major + 1}.0.0`;
  if (bump === 'minor') return `${version.major}.${version.minor + 1}.0`;
  return `${version.major}.${version.minor}.${version.patch + 1}`;
}

export function replaceManifestVersion(source, current, next, name) {
  const escaped = current.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`("version"\\s*:\\s*")${escaped}(")`);
  const matches = source.match(new RegExp(pattern.source, 'g')) ?? [];
  if (matches.length !== 1) throw new Error(`${name} must contain exactly one version field set to ${current}.`);
  return source.replace(pattern, `$1${next}$2`);
}

export function updateVersionRecord(markdown, product, current, next) {
  const label = product === 'skill' ? 'Variant Design skill and plugin' : 'Website package';
  const lines = markdown.split('\n');
  const index = lines.findIndex(line => line.startsWith(`- **${label}:`));
  if (index < 0 || !lines[index].includes(`\`${current}\``)) throw new Error(`docs/versioning.md does not record the current ${product} version.`);
  if (product === 'skill') lines[index] = `- **${label}: \`${next}\`** — the canonical value is \`VERSION\`. The Codex manifest at \`plugin/plugin.json\` and Claude marketplace entry in \`.claude-plugin/marketplace.json\` must match it. See [CHANGELOG.md](../CHANGELOG.md) for this release's notes.`;
  else lines[index] = `- **${label}: \`${next}\`** — recorded in \`website/package.json\`. This is package metadata, not a separate public release tag.`;
  return lines.join('\n');
}

const products = {
  skill: {
    files: ['VERSION', 'plugin/plugin.json', '.claude-plugin/marketplace.json'],
    version: 'VERSION',
  },
  website: {
    files: ['website/package.json'],
    version: 'website/package.json',
  },
};

export async function release(product, bump, { dryRun = false } = {}) {
  const config = products[product];
  if (!config) throw new Error(`Choose skill or website; received: ${product}`);
  const recordPath = path.join(root, 'docs/versioning.md');
  const paths = [...config.files.map(file => path.join(root, file)), recordPath];
  const sources = await Promise.all(paths.map(file => fs.readFile(file, 'utf8')));
  const versionIndex = config.files.indexOf(config.version);
  const current = product === 'skill' ? sources[versionIndex].trim() : JSON.parse(sources[versionIndex]).version;
  const next = bumpVersion(current, bump);
  const updated = sources.slice();
  if (product === 'skill') {
    updated[versionIndex] = `${next}\n`;
    for (let i = 1; i < config.files.length; i++) updated[i] = replaceManifestVersion(sources[i], current, next, config.files[i]);
  } else {
    const manifest = JSON.parse(sources[versionIndex]);
    manifest.version = next;
    updated[versionIndex] = `${JSON.stringify(manifest, null, 2)}\n`;
  }
  updated[updated.length - 1] = updateVersionRecord(sources.at(-1), product, current, next);
  if (!dryRun) {
    for (let i = 0; i < paths.length; i++) await fs.writeFile(`${paths[i]}.tmp`, updated[i]);
    for (const file of paths) await fs.rename(`${file}.tmp`, file);
  }
  return { product, current, next, files: paths.map(file => path.relative(root, file)), dryRun };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const [, , product, bump, ...args] = process.argv;
  const dryRun = args.includes('--dry-run');
  if (args.some(arg => arg !== '--dry-run')) throw new Error('Usage: node scripts/release-version.mjs skill|website patch|minor|major|rc|finalize [--dry-run]');
  const result = await release(product, bump, { dryRun });
  console.log(`${dryRun ? 'Would bump' : 'Bumped'} ${result.product} ${result.current} → ${result.next}; ${result.files.join(', ')}${result.product === 'skill' ? '. Add release notes and a Chinese translation in the same PR.' : '. Add release notes in the same PR.'}`);
}
