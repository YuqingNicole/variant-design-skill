import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { fixture } from '../tests/fixture.mjs';

test('real stdio client: tools, candidate edits, conflicts, undo, isolation and preview', async () => {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'variant-mcp-'));
  const output = path.join(project, 'variant-output');
  fixture(output);
  const client = new Client({ name: 'regression', version: '1.0.0' });
  const transport = new StdioClientTransport({ command: process.execPath, args: [fileURLToPath(new URL('./server.mjs', import.meta.url)), output, project], stderr: 'pipe' });
  const call = (name, args = {}) => client.callTool({ name, arguments: args });
  const data = result => { assert.ok(!result.isError, JSON.stringify(result)); return JSON.parse(result.content[0].text); };
  try {
    await client.connect(transport);
    assert.equal((await client.listTools()).tools.length, 13);
    assert.equal(data(await call('get_selection')).selectedVariant, 'A');
    assert.ok((await call('read_file', { variant: 'B', file: '../outside' })).isError);
    assert.ok((await call('read_file', { variant: 'Z', file: 'VariantB.tsx' })).isError);
    const original = data(await call('read_file', { variant: 'B', file: 'VariantB.tsx' })).content;
    const aBefore = fs.readFileSync(path.join(output, 'VariantA.tsx'), 'utf8');
    const { candidateId } = data(await call('prepare_variant', { variant: 'B' }));
    assert.ok((await call('write_candidate_file', { candidateId, file: '.candidate-baseline.json', content: '{}' })).isError);
    data(await call('write_candidate_file', { candidateId, file: 'VariantB.tsx', content: original.replace('Direction B', 'Updated B') }));
    assert.equal(fs.readFileSync(path.join(output, 'VariantB.tsx'), 'utf8'), original);
    assert.ok((await call('apply_variant', { candidateId, summary: 'attempt locked tokens', tokens: { fonts: ['Arial'] } })).isError);
    data(await call('apply_variant', { candidateId, summary: 'Update B heading', zone: 'hero' }));
    assert.match(fs.readFileSync(path.join(output, 'VariantB.tsx'), 'utf8'), /Updated B/);
    assert.equal(data(await call('get_selection')).selectedVariant, 'A');
    assert.ok((await call('apply_variant', { candidateId, summary: 'stale replay' })).isError);
    data(await call('undo_variant', { variant: 'B' }));
    assert.equal(fs.readFileSync(path.join(output, 'VariantB.tsx'), 'utf8'), original);
    assert.equal(fs.readFileSync(path.join(output, 'VariantA.tsx'), 'utf8'), aBefore);
    const pending = data(await call('prepare_variant', { variant: 'B' }));
    fs.appendFileSync(path.join(output, 'VariantB.tsx'), '\n// user edit');
    assert.ok((await call('apply_variant', { candidateId: pending.candidateId, summary: 'must not overwrite user edit' })).isError);
    assert.match(fs.readFileSync(path.join(output, 'VariantB.tsx'), 'utf8'), /user edit/);
    data(await call('select_variant', { variant: 'C' }));
    assert.equal(data(await call('get_selection')).selectedVariant, 'C');
    data(await call('build_preview'));
    assert.ok(fs.existsSync(path.join(output, '_compare.html')));
    assert.equal(data(await call('get_history', { variant: 'B' })).version, 3);
  } finally {
    await client.close();
    fs.rmSync(project, { recursive: true, force: true });
  }
});
