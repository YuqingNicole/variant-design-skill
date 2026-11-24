import test from 'node:test';
import assert from 'node:assert/strict';
import { draftFor, mediumOf, ask, report, DARK } from './jev-facets.mjs';
import { facetsModule } from './reference-facets.mjs';

test('a Jev draft marks dark only above the threshold, records the probability and stays a draft', () => {
  const site = { id: 'acme', kind: 'official-site', category: 'landing', tag: 'SaaS' };
  const dark = draftFor(site, { dark: 0.973 }), light = draftFor(site, { dark: DARK - 0.01 });
  assert.deepEqual(dark, { status: 'draft', draftedBy: 'jev', jev: { dark: 0.973 }, industry: null, medium: 'website', pageTypes: [], patterns: [], components: [], techniques: [], styles: ['dark'] });
  assert.deepEqual(light.styles, []);
  assert.deepEqual(facetsModule.facetProblems('acme', dark), []);
  assert.deepEqual(facetsModule.facetProblems('acme', { ...dark, jev: { dark: 2 } }), ['acme: jev probabilities need draftedBy jev and values from 0 to 1']);
  assert.equal(mediumOf({ kind: 'social-post', category: 'practice', tag: 'Animation' }), 'film');
  assert.equal(mediumOf({ kind: 'social-post', category: 'practice', tag: 'Interaction' }), 'motion-graphics');
});

test('the client sends the image and questions to /v1/systemone and reads the probabilities', async () => {
  const seen = [];
  const original = globalThis.fetch;
  globalThis.fetch = async (url, init) => { seen.push([url, JSON.parse(init.body)]); return new Response(JSON.stringify({ answers: { dark: { type: 'noul', noul: 0.42 } } }), { status: 200 }); };
  try {
    assert.deepEqual(await ask('http://127.0.0.1:8799/', { bytes: Buffer.from('x'), type: 'image/png' }), { dark: 0.42 });
    assert.equal(seen[0][0], 'http://127.0.0.1:8799/v1/systemone');
    assert.equal(seen[0][1].media[0].data, 'data:image/png;base64,eA==');
    assert.equal(seen[0][1].questions.dark.type, 'noul');
  } finally { globalThis.fetch = original; }
  assert.match(report({ skipped: 'JEV_URL is not set' }), /skipped/);
});

test('confirming a Jev draft keeps what the model guessed, so the review page and report can still show it', async () => {
  const { reviewRecord } = await import('./facet-review.mjs');
  const all = { acme: draftFor({ id: 'acme', kind: 'official-site' }, { dark: 0.97 }) };
  const next = reviewRecord(all, 'acme', { styles: [] }, { reviewed: true, today: '2026-11-24' }).acme;
  assert.deepEqual([next.status, next.reviewedBy, next.draftedBy, next.jev, next.styles], ['reviewed', 'maintainer', 'jev', { dark: 0.97 }, []]);
});
