// The material benchmark (owner-approved 2026-11-28; docs/benchmark.md): what every screening prompt scores, and the
// thresholds that turn the model's per-dimension scores into accept, review or reject. The model only scores and names vetoes;
// the weighted total, the floors and the band are computed here, so the bar is the same whatever the model's arithmetic.
// Used by threads-publish.mjs (sites), x-publish.mjs and youtube-publish.mjs (Videos tab), and benchmark.mjs.

// Weighted dimensions, scored 1–5. `alt` is a dimension that may stand in for this one (brands score extensibility, not hierarchy).
export const RUBRICS = {
  design: {
    name: 'design', max: 45, accept: 34, review: 27, floors: { concept: 3, craft: 3, originality: 3 },
    dims: [
      { key: 'concept', weight: 2, label: 'concept and memorability', high: 'one idea you can say in a sentence runs through the whole page and stays with you after it closes', low: "any brand's logo could be swapped in without anything feeling off" },
      { key: 'craft', weight: 2, label: 'craft and detail', high: 'type weights, spacing, alignment and transitions are deliberate everywhere and hold up close', low: 'uneven spacing, compressed images, components that clash' },
      { key: 'originality', weight: 2, label: 'originality', high: 'a treatment we have not seen (layout, interaction, type use, illustration language)', low: 'recognisably a template, a UI kit or default AI output (purple-blue gradient, centred headline with two buttons and three cards)' },
      { key: 'hierarchy', weight: 1, label: 'information and hierarchy', high: 'you know at once what to look at first and what you can do; copy and visuals say the same thing', low: 'it takes a long read to work out what it is', alt: { key: 'extensibility', label: 'extensibility (brands and identities only, instead of hierarchy)', high: 'the same language carries onto posters, packaging and interfaces', low: 'a mark that only works in one place' } },
      { key: 'consistency', weight: 1, label: 'consistency', high: 'colour, type and motion form one system; the second screen is clearly by the same hand as the first', low: 'a polished first screen, then a template below it' },
      { key: 'learnability', weight: 1, label: 'learnability', high: 'you can point to one or two techniques worth taking away', low: 'all you can say is that it looks nice' },
    ],
  },
  video: {
    name: 'video', max: 40, accept: 30, review: 24, floors: { idea: 3, completeness: 3 },
    dims: [
      { key: 'idea', weight: 2, label: 'idea', high: 'a fun idea you can say in a sentence, with a twist, a contrast or a payoff ending (a crosswalk that becomes stairs into the sky)', low: 'only a tech demo, an animation library clip or empty footage' },
      { key: 'completeness', weight: 2, label: 'completeness', high: 'it has a beginning and an end and the pacing lands; a test at least does one thing very well (the Beethoven line test)', low: 'a sketch, a T-pose, an unfinished WIP' },
      { key: 'craft', weight: 2, label: 'craft and texture', high: 'material, light and motion are convincing and the style is consistent; stop-motion and handmade work show the human hand', low: 'blurry, flickering, clipping; AI warping, broken fingers, frames that do not follow on' },
      { key: 'originality', weight: 1, label: 'originality', high: "the characters, world and style are the author's own", low: "borrowed characters or art style from an existing work (fan work is a veto, below)" },
      { key: 'shareability', weight: 1, label: 'shareability', high: 'someone outside the field gets it and laughs or is amazed', low: 'only insiders get it (fandom jokes, game asset packs)' },
    ],
  },
};

// Hit any veto and the candidate is rejected whatever it scores. Most are mistakes the library has already made once.
export const VETOES = [
  { code: 'fan-work', kinds: ['video'], text: "the main characters are someone else's existing characters (the fan-work rule above spells it out)" },
  { code: 'not-original', kinds: ['design', 'video'], text: 'a repost, a curation or aggregator account, or an original author you cannot confirm ("who made this", "via", credited to someone else)' },
  { code: 'promo', kinds: ['design', 'video'], text: 'a tool or repo list, a money-making post, a course, or a tool, product or sponsor promotion, including a piece whose main selling point is "made with model X" (mentioning a few tools in passing is not a list)' },
  { code: 'merch', kinds: ['video'], text: 'game assets or merchandise for sale: avatar, emote or animation packs (#robloxugc), commissions, pre-sales, shop links (an original effect made in the Roblox engine is not a game asset)' },
  { code: 'news', kinds: ['video'], text: 'news, politics or sports broadcast footage' },
  { code: 'template', kinds: ['design'], text: "a template demo, theme showcase or link-in-bio page, or a site on a site-builder's subdomain (for example *.framer.website, *.webflow.io, *.sites.uprock.pro), rather than a real brand's or person's own site" },
  { code: 'shock', kinds: ['design', 'video'], text: 'sexual or suggestive, gory, or shock content (jumpscares, kill animations)' },
  { code: 'broken', kinds: ['design'], text: 'the page itself fails: a block page, a verification, age or subscription gate, a pop-up covering the content, an error or empty page, a shutdown or farewell notice, a redirect to an unrelated site. A page that shows one screen because it is designed that way (the capture notes when the page stayed put) is not broken; a capture fault is retried, not vetoed' },
  { code: 'out-of-scope', kinds: ['design', 'video'], text: 'outside what this library collects (the source lists what that means below)' },
];
export const vetoesFor = kind => VETOES.filter(v => v.kinds.includes(kind));

// Real items scored against this standard in the owner-approved document; the model calibrates its 1–5 scale on them.
// Totals are the document's; the split across dimensions is ours, chosen to add up to them.
export const CALIBRATION = {
  design: [
    { name: "Mimo's one scene in four tools (motion design video)", scores: { concept: 5, craft: 4, originality: 4, hierarchy: 3, consistency: 4, learnability: 5 }, band: 'accept', why: 'a clear concept and very learnable; the four columns merge into one landscape at the end' },
    { name: "Ayush Soni's Second identity (brand)", scores: { concept: 4, craft: 5, originality: 4, extensibility: 4, consistency: 4, learnability: 3 }, band: 'accept', why: 'hand-painted illustration and a fine serif form one system that carries onto envelopes and sleeves' },
    { name: "Gleb Kuznetsov's personal site", scores: { concept: 4, craft: 5, originality: 5, hierarchy: 3, consistency: 3, learnability: 2 }, band: 'accept', why: 'high craft and strong originality' },
    { name: 'Snapa (a site-builder demo for a fictional camera, snapa.sites.uprock.pro)', vetoes: ['template'], band: 'reject', why: 'a template demo site' },
  ],
  video: [
    { name: 'A crosswalk turns into a staircase in the sky', scores: { idea: 5, completeness: 4, craft: 4, originality: 4, shareability: 4 }, band: 'accept', why: 'a strong idea, well finished' },
    { name: 'Beaver Moon mixed-media stop-motion', scores: { idea: 4, completeness: 4, craft: 5, originality: 4, shareability: 3 }, band: 'accept', why: 'the handmade marks show and the style holds together' },
    { name: 'Beethoven line animation test', scores: { idea: 3, completeness: 3, craft: 4, originality: 4, shareability: 3 }, band: 'review', why: 'good craft, but only a test and a weak idea' },
    { name: 'AI felt-look pirate short', scores: { idea: 3, completeness: 4, craft: 4, originality: 3, shareability: 3 }, band: 'review', ai: { generated: true, humanChoices: false }, why: 'a consistent style, but which choices a person made needs checking' },
    { name: 'Low-poly cat walk cycle', scores: { idea: 2, completeness: 3, craft: 4, originality: 2, shareability: 2 }, band: 'reject', why: 'an animation-library demo with no idea' },
    { name: "A Five Nights at Freddy's purple rabbit animatronic", vetoes: ['fan-work'], band: 'reject', why: 'fan work of an existing franchise' },
  ],
};

export const BANDS = ['accept', 'review', 'reject'];
const dimKeys = d => [d.key, ...(d.alt ? [d.alt.key] : [])];

// The weighted total, floors and band for a set of scores. An AI-generated video with no visible human choices is held for review at most.
export function bandFor(kind, scores, { vetoes = [], ai = null } = {}) {
  const rubric = RUBRICS[kind];
  if (vetoes.length) return { band: 'reject', total: null, max: rubric.max, below: [], capped: false };
  let total = 0;
  for (const d of rubric.dims) total += d.weight * (scores[dimKeys(d).find(k => scores[k] != null)] ?? 0);
  const below = Object.entries(rubric.floors).filter(([k, min]) => (scores[k] ?? 0) < min).map(([k]) => k);
  let band = below.length || total < rubric.review ? 'reject' : total >= rubric.accept ? 'accept' : 'review';
  const capped = band === 'accept' && kind === 'video' && ai?.generated === true && ai.humanChoices !== true;
  if (capped) band = 'review';
  return { band, total, max: rubric.max, below, capped };
}

const scoreLine = (kind, s) => RUBRICS[kind].dims.map(d => { const k = dimKeys(d).find(x => s[x] != null); return `${k} ${s[k]}`; }).join(', ');
function calibrationText(kind) {
  return CALIBRATION[kind].map(c => {
    if (c.vetoes) return `- ${c.name}: veto ${c.vetoes.join(', ')} → reject (${c.why}).`;
    const { total, max } = bandFor(kind, c.scores, { ai: c.ai });
    return `- ${c.name}: ${scoreLine(kind, c.scores)} = ${total}/${max} → ${c.band} (${c.why}${c.ai ? '; ai true, humanChoices false' : ''}).`;
  }).join('\n');
}

// The scoring part of a screening prompt. `outOfScope` is the source's own list of what the library does not collect.
export function rubricBlock(kind, { outOfScope }) {
  const rubric = RUBRICS[kind];
  const dims = rubric.dims.map(d => `- ${d.key} (${d.label}, weight ×${d.weight}): 5 = ${d.high}; 1–2 = ${d.low}.${d.alt ? `\n- ${d.alt.key} (${d.alt.label}, weight ×${d.weight}): 5 = ${d.alt.high}; 1–2 = ${d.alt.low}. Score either ${d.key} or ${d.alt.key}, not both.` : ''}`).join('\n');
  const vetoes = vetoesFor(kind).map(v => `- ${v.code}: ${v.code === 'out-of-scope' ? outOfScope : v.text}`).join('\n');
  const floors = Object.entries(rubric.floors).map(([k, n]) => `${k} ≥ ${n}`).join(', ');
  const bar = kind === 'design' ? '"a designer learns something from it", not "it looks fine"' : '"a viewer enjoys it and wants to pass it on", not "it is technically fine"';
  return `How to judge it. The bar is ${bar}: quality over quantity, original work by an author you can confirm, a reason it is good that you can say in one sentence, nothing that looks like a template or default AI output.
First check the vetoes. Any hit rejects it whatever it would score:
${vetoes}
Then score each dimension from 1 to 5, with one line saying why. Score only what you can see; when you are unsure, give the lower score.
${dims}
${kind === 'video' ? `Always answer "ai" (the AI rule above). When "ai" is true, also answer "humanChoices": true only when you can see a person's choices (a storyboard, editing or cuts to music, a consistent art direction), false for a single prompt's raw output or when you cannot tell; an AI piece with no visible human choices is held for review at most. AI warping, extra limbs and garbled text lower the craft score unless clearly used as a style.\n` : ''}The weighted total is out of ${rubric.max}. ${rubric.accept} or more is collected, ${rubric.review}–${rubric.accept - 1} goes to a person for review, below ${rubric.review} is rejected; ${floors} are needed for anything but a rejection. The code adds this up from your scores, so just score honestly.
Calibration, real items scored against this standard:
${calibrationText(kind)}`;
}

// The answer shape. `notes` is the source's own JSON fields for the card (name, tag, focus, application...).
export function answerBlock(kind, notes) {
  const dims = RUBRICS[kind].dims.map(d => `"${d.key}": {"score": <1-5>, "reason": "<one line>"}`).join(', ');
  return `Answer with one JSON object and nothing else:
{"vetoes": [], "scores": {${dims}}${kind === 'video' ? ', "ai": <true or false>, "humanChoices": <true or false>' : ''}, ${notes}}
Leave the card fields out when the weighted total is below ${RUBRICS[kind].review} or a floor is missed.
Or, when a veto applies: {"vetoes": ["<code>"], "reason": "<one sentence in English>"}`;
}

const line = (value, max) => typeof value === 'string' && value.trim() && value.trim().length <= max;

// Reads the model's answer into scores, vetoes and a band. `parseNotes` is the source's own card validator (its parseVerdict),
// run only when the band is not a rejection, so a rejection never fails over a missing note.
export function parseScreening(output, kind, parseNotes) {
  const match = /\{[\s\S]*\}/.exec(String(output ?? ''));
  if (!match) throw new Error('no JSON object in the model answer');
  let v;
  try { v = JSON.parse(match[0]); } catch { throw new Error('the model answer is not valid JSON'); }
  const allowed = vetoesFor(kind).map(x => x.code);
  if (!Array.isArray(v.vetoes)) throw new Error('"vetoes" must be a list (empty when none applies)');
  const unknown = v.vetoes.filter(c => !allowed.includes(c));
  if (unknown.length) throw new Error(`unknown veto ${unknown.join(', ')}; use one of ${allowed.join(', ')}`);
  if (v.vetoes.length) {
    if (!line(v.reason, 400)) throw new Error('a veto needs a one-sentence "reason"');
    return { band: 'reject', vetoes: [...v.vetoes], total: null, max: RUBRICS[kind].max, scores: {}, reason: `Veto ${v.vetoes.join(', ')}: ${v.reason.trim()}` };
  }
  const scores = {}, reasons = {};
  for (const d of RUBRICS[kind].dims) {
    const key = dimKeys(d).find(k => v.scores?.[k] != null);
    const s = v.scores?.[key];
    if (!key || !Number.isInteger(s?.score) || s.score < 1 || s.score > 5) throw new Error(`"scores.${d.key}" needs an integer "score" from 1 to 5`);
    if (!line(s.reason, 300)) throw new Error(`"scores.${key}" needs a one-line "reason"`);
    scores[key] = s.score; reasons[key] = s.reason.trim();
  }
  let ai = null;
  // `ai` is the card's AI marker (x-publish.mjs AI_RULE), asked for every video so the cap applies before any card is written.
  if (kind === 'video') {
    if (typeof v.ai !== 'boolean') throw new Error('"ai" must be true or false');
    ai = { generated: v.ai, ...(v.ai ? { humanChoices: v.humanChoices === true } : {}) };
  }
  const result = bandFor(kind, scores, { ai });
  const out = { band: result.band, vetoes: [], total: result.total, max: result.max, scores: Object.fromEntries(Object.keys(scores).map(k => [k, { score: scores[k], reason: reasons[k] }])), ...(ai ? { ai } : {}), ...(result.below.length ? { below: result.below } : {}), ...(result.capped ? { capped: true } : {}) };
  out.reason = summarize(out);
  if (out.band !== 'reject') out.notes = parseNotes(JSON.stringify({ ...v, accept: true }));
  return out;
}

// One line for the inbox `reason` and the pull request: the total and the weakest dimensions with their reasons.
function summarize(s) {
  const weakest = Object.entries(s.scores).sort((a, b) => a[1].score - b[1].score).slice(0, 2).map(([k, x]) => `${k} ${x.score} (${x.reason})`).join('; ');
  const why = s.below?.length ? `, below the floor on ${s.below.join(', ')}` : s.capped ? ', AI-generated with no visible human choices' : '';
  return `Score ${s.total}/${s.max} → ${s.band}${why}. Weakest: ${weakest}`;
}

// What the inbox row keeps (not shown on the site): enough to calibrate the standard later.
export const record = (kind, s, at) => ({ rubric: kind, band: s.band, total: s.total, max: s.max, vetoes: s.vetoes, scores: s.scores, ...(s.ai ? { ai: s.ai } : {}), ...(s.below ? { below: s.below } : {}), ...(s.capped ? { capped: true } : {}), at });

// An answer that fails validation is sent back once with the reason, as the card validators already do.
export async function screen(ask, prompt, dir, kind, parseNotes) {
  const first = await ask(prompt, dir);
  try { return parseScreening(first, kind, parseNotes); } catch (error) {
    return parseScreening(await ask(`${prompt}\n\nYour previous answer was rejected: ${error.message}. Answer again with the corrected JSON object only.`, dir), kind, parseNotes);
  }
}

// Site-builder and template hosts: a site there is a template demo (the `template` veto) before any page is opened.
export const BUILDER_HOSTS = ['framer.website', 'framer.app', 'framer.ai', 'webflow.io', 'wixsite.com', 'carrd.co', 'uprock.pro', 'notion.site', 'super.site', 'tilda.ws', 'myshopify.com', 'squarespace.com'];
export function builderHost(url) {
  let host;
  try { host = new URL(url).hostname.toLowerCase(); } catch { return null; }
  return BUILDER_HOSTS.find(h => host.endsWith(`.${h}`)) ?? null;
}

// The review band in a weekly report: one line each, so the owner can answer 收 or 拒 per id.
export function reviewLines(review) {
  if (!review.length) return [];
  return ['', `Held for review (${review.length}): not published. Reply 收 or 拒 with the id; node website/scripts/review-queue.mjs accept|reject <id> applies it.`,
    ...review.map(([label, id, s, name]) => `~ ${id} ${s.total}/${s.max} ${name} (${label}). ${s.reason}`)];
}
