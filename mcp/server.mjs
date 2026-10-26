#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { localFile, readContext, prepareVariant, applyVariant, undoVariant, selectVariant } from '../scripts/variant-history.mjs';
import { buildPreview } from '../scripts/build-preview.mjs';

export function createServer(output, project = path.dirname(path.resolve(output))) {
  const root = fs.realpathSync(output);
  const projectRoot = fs.realpathSync(project);
  if (!root.startsWith(projectRoot + path.sep)) throw new Error('Project must contain output directory.');
  readContext(root);
  const server = new McpServer({ name: 'variant-design', version: '0.1.0' }, {
    instructions: 'Manage existing schema-v2 Variant Design output. Read get_guide first. Prepare a candidate BEFORE editing; write only candidate files, then apply. No canvas DOM, screenshots, HTML-to-JSX conversion, or website localStorage access is provided.'
  });
  const variant = z.enum(['A', 'B', 'C']);
  const candidateId = z.string().uuid();
  const candidates = () => {
    const dir = localFile(projectRoot, '.variant-mcp-candidates');
    fs.mkdirSync(dir, { recursive: true });
    return dir;
  };
  const candidatePath = id => localFile(candidates(), id);
  function candidate(id) {
    const dir = candidatePath(id);
    const baseline = JSON.parse(fs.readFileSync(localFile(dir, '.candidate-baseline.json'), 'utf8'));
    if (baseline.output !== root || baseline.projectRoot !== projectRoot) throw new Error('Candidate belongs to another output/project.');
    return { dir, baseline };
  }
  function getVariant(id) {
    const v = readContext(root).variants?.[id];
    if (!v) throw new Error(`Variant ${id} is not registered.`);
    return v;
  }
  function register(name, description, inputSchema, readOnly, action) {
    server.registerTool(name, { description, inputSchema,
      annotations: { readOnlyHint: readOnly, destructiveHint: !readOnly, openWorldHint: false }
    }, async args => {
      try { return { content: [{ type: 'text', text: JSON.stringify(await action(args), null, 2) }] }; }
      catch (error) { return { isError: true, content: [{ type: 'text', text: error.message }] }; }
    });
  }
  register('get_guide', 'Read workflow, scope, and limitations.', {}, true, () => ({
    workflow: ['get_basic_info', 'read_file', 'prepare_variant', 'write_candidate_file', 'apply_variant', 'build_preview'],
    notes: [
      'Existing schemaVersion 2 output is required. Generation remains the responsibility of the design skill/agent.',
      'Candidates persist outside output and survive server restarts. Keep conflicted candidates for reconciliation.',
      'apply_variant snapshots files and rejects stale baselines, out-of-zone edits, and locked-token changes.',
      'tokens passed to apply_variant update metadata only: edit corresponding CSS/source in the candidate too.',
      'select_variant is explicit winner selection; applying and undoing do not select a winner.',
      'build_preview writes local preview files, but does not start a web server. Rebuild after apply/undo/select.',
      'No Paper compatibility guarantee, editable canvas, node IDs, computed styles, screenshots, comments, or automatic JSX conversion.',
      'This server operates on local output files, independently of the website browser-local workspace.'
    ]
  }));
  register('get_basic_info', 'Read complete persisted design context.', {}, true, () => readContext(root));
  register('get_selection', 'Read active variant and explicitly selected winner; not a canvas selection.', {}, true, () => {
    const s = readContext(root); return { activeVariant: s.activeVariant ?? null, selectedVariant: s.selectedVariant ?? null };
  });
  register('list_files', 'List files owned by registered variants.', { variant: variant.optional() }, true, ({ variant: id }) => {
    const s = readContext(root);
    return Object.fromEntries(Object.entries(s.variants).filter(([key]) => !id || key === id).map(([key, v]) => [key, { entry: v.entry, files: v.files, version: v.version }]));
  });
  register('read_file', 'Read a registered variant-owned file as UTF-8 source or base64 asset.', {
    variant, file: z.string(), encoding: z.enum(['utf8', 'base64']).default('utf8')
  }, true, ({ variant: id, file, encoding }) => {
    if (!getVariant(id).files.includes(file)) throw new Error('File is not owned by this variant.');
    return { file, encoding, content: fs.readFileSync(localFile(root, file)).toString(encoding) };
  });
  register('get_tokens', 'Read persisted token metadata; does not infer computed CSS.', { variant }, true, ({ variant: id }) => getVariant(id).tokens ?? {});
  register('get_history', 'Read revision history and undo depth.', { variant }, true, ({ variant: id }) => {
    const v = getVariant(id); return { version: v.version, history: v.history ?? [], undoDepth: v.undo?.length ?? 0 };
  });
  register('prepare_variant', 'Snapshot current files into a durable candidate before editing.', { variant }, false, ({ variant: id }) => {
    const key = randomUUID();
    const dir = prepareVariant(root, id, candidatePath(key), projectRoot);
    return { candidateId: key, files: Object.keys(JSON.parse(fs.readFileSync(localFile(dir, '.candidate-baseline.json'), 'utf8')).files) };
  });
  register('write_candidate_file', 'Replace an existing candidate-owned file. Live output remains unchanged until apply.', {
    candidateId, file: z.string(), content: z.string().max(10_000_000), encoding: z.enum(['utf8', 'base64']).default('utf8')
  }, false, ({ candidateId: id, file, content, encoding }) => {
    const { dir, baseline } = candidate(id);
    if (!Object.hasOwn(baseline.files, file)) throw new Error('File is not owned by this candidate.');
    fs.writeFileSync(localFile(dir, file), Buffer.from(content, encoding));
    return { candidateId: id, file, applied: false };
  });
  register('apply_variant', 'Apply candidate with conflict checks, durable snapshot, and revision increment.', {
    candidateId, summary: z.string().trim().min(1), zone: z.string().regex(/^[\w-]+$/).optional(),
    tokens: z.record(z.string(), z.unknown()).optional(),
    comparison: z.object({ optimizes: z.string().min(1), tradeoff: z.string().min(1), bestFor: z.string().min(1) }).optional()
  }, false, ({ candidateId: id, ...change }) => {
    const { dir, baseline } = candidate(id);
    return applyVariant(root, baseline.variant, dir, change);
  });
  register('undo_variant', 'Restore previous variant revision, preserving the winner and other variants; rejects external edits.', { variant }, false, ({ variant: id }) => undoVariant(root, id));
  register('select_variant', 'Explicitly choose the winning variant.', { variant }, false, ({ variant: id }) => selectVariant(root, id));
  register('build_preview', 'Build local A/B/C comparison and React mounts. Does not launch or render a browser.', {}, false, () => ({ output: root, ...buildPreview(root) }));
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href) {
  try {
    const output = path.resolve(process.argv[2] ?? 'variant-output');
    await createServer(output, process.argv[3]).connect(new StdioServerTransport());
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
