import test from 'node:test';
import assert from 'node:assert/strict';
import { RUBRICS, CALIBRATION, VETOES, bandFor, parseScreening, rubricBlock, answerBlock, builderHost, reviewLines, record } from './screening-rubric.mjs';

const answer = (scores, extra = {}) => JSON.stringify({ vetoes: [], scores: Object.fromEntries(Object.entries(scores).map(([k, n]) => [k, { score: n, reason: `${k} line` }])), ...extra });
const notes = json => { const v = JSON.parse(json); if (!v.name) throw new Error('"name" must be 1–60 characters'); return { name: v.name }; };

test('the rubrics match the owner-approved standard: weights, maxima, bands and floors', () => {
  for (const [kind, max] of [['design', 45], ['video', 40]]) assert.equal(RUBRICS[kind].dims.reduce((n, d) => n + 5 * d.weight, 0), max, kind);
  assert.deepEqual([RUBRICS.design.accept, RUBRICS.design.review, RUBRICS.video.accept, RUBRICS.video.review], [34, 27, 30, 24]);
  // 75% and 60% of the weighted maximum, rounded up.
  for (const r of Object.values(RUBRICS)) assert.deepEqual([r.accept, r.review], [Math.ceil(r.max * 0.75), Math.ceil(r.max * 0.6)]);
  assert.deepEqual(Object.keys(RUBRICS.design.floors), ['concept', 'craft', 'originality']);
  assert.deepEqual(Object.keys(RUBRICS.video.floors), ['idea', 'completeness']);
});

test('the bands are computed in code at the edges, floors reject, and vetoes win', () => {
  const v = (idea, completeness, craft, originality, shareability) => ({ idea, completeness, craft, originality, shareability });
  assert.equal(bandFor('video', v(4, 4, 4, 3, 3)).band, 'accept');           // 30
  assert.equal(bandFor('video', v(4, 4, 4, 3, 2)).band, 'review');           // 29
  assert.equal(bandFor('video', v(3, 3, 3, 3, 3)).band, 'review');           // 24
  assert.equal(bandFor('video', v(3, 3, 3, 2, 3)).band, 'reject');           // 23
  assert.deepEqual(bandFor('video', v(2, 5, 5, 5, 5)).below, ['idea']);      // 34, but idea is under its floor
  assert.equal(bandFor('video', v(2, 5, 5, 5, 5)).band, 'reject');
  assert.equal(bandFor('video', v(5, 5, 5, 5, 5), { vetoes: ['fan-work'] }).band, 'reject');
  const d = (concept, craft, originality, hierarchy, consistency, learnability) => ({ concept, craft, originality, hierarchy, consistency, learnability });
  assert.equal(bandFor('design', d(4, 4, 4, 4, 3, 3)).total, 34); assert.equal(bandFor('design', d(4, 4, 4, 4, 3, 3)).band, 'accept');
  assert.equal(bandFor('design', d(4, 4, 4, 3, 3, 3)).band, 'review');       // 33
  assert.equal(bandFor('design', d(3, 3, 3, 3, 3, 3)).band, 'review');       // 27
  assert.equal(bandFor('design', d(5, 5, 2, 5, 5, 5)).band, 'reject');       // originality under its floor
  // A brand scores extensibility in place of hierarchy.
  assert.equal(bandFor('design', { concept: 4, craft: 5, originality: 4, extensibility: 4, consistency: 4, learnability: 3 }).total, 37);
});

test('an AI-generated video with no visible human choices is held for review at most', () => {
  const top = { idea: 5, completeness: 5, craft: 5, originality: 5, shareability: 5 };
  assert.equal(bandFor('video', top, { ai: { generated: true, humanChoices: false } }).band, 'review');
  assert.equal(bandFor('video', top, { ai: { generated: true, humanChoices: true } }).band, 'accept');
  assert.equal(bandFor('video', top, { ai: { generated: false } }).band, 'accept');
  const r = parseScreening(answer(top, { ai: true, name: 'Pirates' }), 'video', notes);
  assert.deepEqual([r.band, r.capped, r.ai], ['review', true, { generated: true, humanChoices: false }]);
  assert.match(r.reason, /AI-generated with no visible human choices/);
});

test('the calibration items land in the bands the standard gives them', () => {
  const totals = { "Mimo's one scene in four tools (motion design video)": 38, "Ayush Soni's Second identity (brand)": 37, "Gleb Kuznetsov's personal site": 36, 'A crosswalk turns into a staircase in the sky': 34, 'Beaver Moon mixed-media stop-motion': 33, 'Beethoven line animation test': 27, 'AI felt-look pirate short': 28, 'Low-poly cat walk cycle': 22 };
  for (const [kind, items] of Object.entries(CALIBRATION)) for (const c of items) {
    const r = bandFor(kind, c.scores ?? {}, { vetoes: c.vetoes ?? [], ai: c.ai });
    assert.equal(r.band, c.band, c.name);
    if (c.scores) assert.equal(r.total, totals[c.name], c.name);
  }
});

test('parseScreening checks every dimension, the veto codes and the reasons, and asks for card notes only when not rejected', () => {
  const ok = { idea: 5, completeness: 4, craft: 4, originality: 4, shareability: 4 };
  const r = parseScreening(`Here: ${answer(ok, { ai: false, name: 'Stairs' })}`, 'video', notes);
  assert.deepEqual([r.band, r.total, r.notes.name, r.scores.idea.reason], ['accept', 34, 'Stairs', 'idea line']);
  assert.match(r.reason, /^Score 34\/40 → accept\. Weakest: completeness 4/);
  // A rejection by score needs no card; a review does.
  assert.equal(parseScreening(answer({ ...ok, idea: 1 }, { ai: false }), 'video', notes).band, 'reject');
  assert.throws(() => parseScreening(answer({ idea: 3, completeness: 3, craft: 4, originality: 4, shareability: 3 }, { ai: false }), 'video', notes), /"name"/);
  const vetoed = parseScreening('{"vetoes": ["fan-work"], "reason": "Sonic and Tails."}', 'video', notes);
  assert.deepEqual([vetoed.band, vetoed.reason, vetoed.total], ['reject', 'Veto fan-work: Sonic and Tails.', null]);
  for (const bad of [
    '', '{"accept": true}', '{"vetoes": ["template"], "reason": "x"}', '{"vetoes": ["fan-work"]}',
    answer({ ...ok, idea: 6 }, { ai: false }), answer({ ...ok, idea: 4.5 }, { ai: false }),
    answer({ idea: 5, completeness: 4, craft: 4, originality: 4 }, { ai: false }), answer(ok, {}),
    JSON.stringify({ vetoes: [], scores: { ...Object.fromEntries(Object.keys(ok).map(k => [k, { score: 4, reason: '' }])) }, ai: false }),
  ]) assert.throws(() => parseScreening(bad, 'video', notes), undefined, bad);
  // `template` is a design veto, `fan-work` a video one.
  assert.equal(parseScreening('{"vetoes": ["template"], "reason": "A builder demo."}', 'design', notes).band, 'reject');
  assert.throws(() => parseScreening('{"vetoes": ["fan-work"], "reason": "x"}', 'design', notes), /unknown veto fan-work/);
});

test('the prompt blocks name every veto for their kind, the scale, the thresholds and the answer shape', () => {
  const design = rubricBlock('design', { outOfScope: 'NOT A SITE' }), video = rubricBlock('video', { outOfScope: 'NOT A VIDEO' });
  for (const v of VETOES) {
    if (v.kinds.includes('design')) assert.match(design, new RegExp(`- ${v.code}: `)); else assert.doesNotMatch(design, new RegExp(`- ${v.code}: `));
    if (v.kinds.includes('video')) assert.match(video, new RegExp(`- ${v.code}: `)); else assert.doesNotMatch(video, new RegExp(`- ${v.code}: `));
  }
  assert.match(design, /out-of-scope: NOT A SITE/); assert.match(video, /humanChoices/); assert.doesNotMatch(design, /humanChoices/);
  assert.match(design, /when you are unsure, give the lower score/);
  assert.match(answerBlock('design', '"name": "<n>"'), /"learnability": \{"score": <1-5>, "reason": "<one line>"\}\}, "name": "<n>"\}/);
});

test('site-builder subdomains are caught by host, real domains are not', () => {
  assert.equal(builderHost('https://snapa.sites.uprock.pro/'), 'uprock.pro');
  assert.equal(builderHost('https://studio.framer.website/work'), 'framer.website');
  assert.equal(builderHost('https://framer.com/'), null); assert.equal(builderHost('https://glebich.com/'), null); assert.equal(builderHost('not a url'), null);
});

test('the review section lists one line per candidate, and the inbox record keeps the scores', () => {
  const s = parseScreening(answer({ idea: 3, completeness: 3, craft: 4, originality: 4, shareability: 3 }, { ai: false, name: 'Test' }), 'video', notes);
  assert.deepEqual(reviewLines([]), []);
  const lines = reviewLines([['@a 1', '1', s, 'Test']]);
  assert.match(lines[1], /Held for review \(1\)/); assert.match(lines[2], /^~ 1 27\/40 Test \(@a 1\)\. Score 27\/40 → review/);
  assert.deepEqual(Object.keys(record('video', s, 'T')), ['rubric', 'band', 'total', 'max', 'vetoes', 'scores', 'ai', 'at']);
});
