#!/usr/bin/env node
// Closes the loop after weekly discovery: every `pending` candidate in the X inbox gets its video frames read by a model,
// which scores it against the material benchmark (screening-rubric.mjs) and writes bilingual notes; the code turns the scores into
// accept (into the library), review (held in the inbox for the owner) or reject. Every decision is written to the inbox.
// Nothing here publishes by itself: run-x-weekly.sh puts the change in a pull request that merges once CI passes, with no person reviewing it.
// Usage: node website/scripts/x-publish.mjs [--limit n] [--dry-run]
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parsePostUrl, fromOembed, draftEntry } from './x-post.mjs';
import { pickMedia, syndicationToken } from './x-media.mjs';
import { rubricBlock, answerBlock, screen, record, reviewLines } from './screening-rubric.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const inboxPath = path.resolve(here, '../content/x-post-inbox.json');
const dataPath = path.resolve(here, '../src/inspiration-data.ts');

// The Videos tab collects fun, creative videos that are not design work (maintainer, 2026-11-20); the tag is how a video was made,
// and inspiration-sections.ts files a video under `videos` by it. Design videos already in the library stay under `design-motion`.
// 2026-11-28 (owner-approved tag review): Humor never fit, because it is a tone and every other tag is a medium, so it went and a
// filmed joke is Live action; Real-time came in for games and engine or browser worlds, which had been split across Generative and Animation.
export const TAGS = ['Animation', 'VFX', 'Craft', 'Generative', 'Real-time', 'Live action'];
// Shared with youtube-publish.mjs, so both sources apply one definition of what belongs in the tab.
export const SCOPE = `The Videos tab holds fun, creative short videos that have nothing to do with design: animation, visual effects, stop-motion and handmade craft, generative or code-made visuals, games and real-time worlds, and clever or funny live-action ideas. A viewer should enjoy it or want to share it.`;
// One tag per video, by how it was made. The rules are checked in order and the first that fits wins, so a borderline video has one answer.
// The examples are real library entries as tagged on 2026-11-28.
export const TAG_GUIDE = `Pick exactly one tag by how the video was made. Go through these in order and take the first that fits:
1. VFX: the point is an effect (an explosion, a portal, a black hole, a world cracking apart), either composited into real footage or built as an effect in an engine. Examples: a filmed crosswalk whose stripes rise into steps above the clouds; a black hole effect made in Roblox Studio.
2. Craft: what you see was physically made by hand: stop-motion with clay, paper, felt or toys, collage, puppets, costumes, models. Examples: brick figures eating a real cookie frame by frame; a stack of printed moon photos shot as stop-motion; a handmade fursuit shown off next to a dog. A video that only looks handmade but was rendered or AI-generated is not Craft.
3. Generative: the picture is computed by rules the author wrote or prompted into code (a shader, a physics or fluid simulation, a procedural or endless world), and that system is the subject. Examples: a fog shader that swirls when a character walks through; a pickup truck crash test in a real-time sand simulation; an endless papercraft world that grows around the walker.
4. Real-time: a game, or a world built in a game engine or the browser (Unreal, Unity, Godot, Roblox, three.js), shown as a place someone plays, walks or flies through, rather than as an effect or a simulation. Examples: a 24-hour ink-wash platformer; a medieval town built in Unreal Engine; a three.js flythrough of an illustrated market town.
5. Animation: an animated film or test made frame by frame or keyframed, 2D, 3D or hand-drawn, including AI-generated animated shorts. Examples: a hand-drawn D&D comedy short; a low-poly cat walk cycle in Blender; a pencil animation test of Beethoven; an AI felt-look pirate short.
6. Live action: filmed people, animals or places where the idea happens in front of the camera (forced perspective, in-camera tricks, performance, a filmed sketch or joke) with no effect, animation or handmade object as the point.
Humour is a quality, not a tag: a funny video takes the tag of how it was made.`;
// The AI marker (2026-11-28) is a separate yes/no, so a reader can tell AI-made work at a glance without a tag of its own.
export const AI_RULE = `Also set "ai": true when the post text or the frames say generative AI made a substantial part of what you see: the frames or footage, the characters, textures or models, or the code that renders the scene (for example "made with AI", "prompt below", a named image or video model, or "Opus wrote this"). Otherwise set "ai": false. Using AI is not a reason to reject; the other rules still apply.`;
export const SCOPE_REJECTS = `design work of any kind (interfaces, apps, websites, logos, brand identities, posters, print, typography, product or UI animation); ads, trailers and official music videos; pranks or stunts that hurt or humiliate someone; sexual, violent or shock content`;
// Fan work of someone else's characters is out even when the craft is good (owner, 2026-11-26): the model accepted a Bonnie-like
// animatronic and Sega's Whisper the Wolf while rejecting Looney Tunes and TUGS fan work in the same batches, so the rule is spelled out.
export const IP_RULE = `Reject fan work: a video whose main characters are existing characters from someone else's franchise or IP, however good the craft. That covers games, anime, cartoons, comics, films, TV, toys and mascots, for example Five Nights at Freddy's animatronics (Freddy, Bonnie, Chica, Foxy), Sonic characters (Sonic, Tails, Shadow, Whisper the Wolf), Pokémon, Mario, Looney Tunes, Disney or Pixar characters, TUGS, Hazbin Hotel, anime heroes and Minecraft mobs. Fan art, fan animation, fan remakes, "my version of", redesigns, crossovers, cosplay, and an "OC" that is plainly a known character in another name all count. If a character looks like it might come from an existing franchise and you cannot tell it is the author's own, reject. Original characters in a familiar style or medium (a voxel world, a cartoon look, a furry or mascot suit) are fine when nothing ties them to an existing franchise. Also reject shots made for someone else's video, a commission or a client excerpt ("for @someone's video", "commissioned by", "my part in"): the finished work belongs to someone else.`;
// The source's own `out-of-scope` veto and card fields for the material benchmark (screening-rubric.mjs); youtube-publish.mjs shares both.
export const VIDEO_OUT_OF_SCOPE = `${SCOPE_REJECTS}; a montage of clips; a tutorial or "how to"; frames too unclear to describe`;
export const VIDEO_CARD = `"name": "<short title, at most 60 characters>", "tag": "<one of ${TAGS.join(', ')}>", "focus": {"zh": "<what happens and what makes it fun or clever, one sentence, at most 300 characters>", "en": "<same, in English>"}, "application": {"zh": "<the idea worth borrowing, a short phrase>", "en": "<same, in English>"}`;
const cjk = /[㐀-鿿]/, latin = /[A-Za-z]{3}/;

// The library is a TS module of JSON literals: `export const inspirationItems = [ ... ];`.
export function readItems(source) {
  const from = source.indexOf('[', source.indexOf('export const inspirationItems = '));
  const end = source.indexOf('\n];', from);
  if (from < 0 || end < 0) throw new Error('inspiration-data.ts: inspirationItems array not found');
  return JSON.parse(source.slice(from, end + 2));
}
export function appendItems(source, entries) {
  if (!entries.length) return source;
  const from = source.indexOf('[', source.indexOf('export const inspirationItems = '));
  const end = source.indexOf('\n];', from);
  const body = entries.map(entry => JSON.stringify(entry, null, 2).replace(/^/gm, '  ')).join(',\n');
  return `${source.slice(0, end)},\n${body}${source.slice(end)}`;
}

// A second video from an author already in the library is not collected (maintainer's batch rule).
export function authorInLibrary(items, handle) {
  const h = handle.toLowerCase();
  return items.find(i => i.post?.handle?.toLowerCase() === h) ?? null;
}

export function buildPrompt(candidate, meta, sheet) {
  return `You are screening one X video post for the Videos tab of Variant Design's inspiration library. Entries that score in the collect band go live without a person reviewing them.
${SCOPE}
Read the image at ${sheet}: six frames from the post's video, left to right, top to bottom. You cannot play the video, so describe only what the frames show.

Post: https://x.com/${candidate.handle}/status/${candidate.id} by ${meta.author} (@${meta.handle}), ${meta.date}, ${candidate.likes} likes.
Post text: ${JSON.stringify(meta.text)}

${IP_RULE}
${AI_RULE}
${rubricBlock('video', { outOfScope: VIDEO_OUT_OF_SCOPE })}

Card fields: write notes on what makes it fun or clever.
${TAG_GUIDE}
Do not invent: no names, claims or tools the frames and the text do not show. Keep the author's own credit if the text gives one.

${answerBlock('video', VIDEO_CARD)}`;
}

const text = (value, max) => typeof value === 'string' && value.trim() && value.trim().length <= max && !/TODO/i.test(value);

export function parseVerdict(output) {
  const match = /\{[\s\S]*\}/.exec(String(output ?? ''));
  if (!match) throw new Error('no JSON object in the model answer');
  let v;
  try { v = JSON.parse(match[0]); } catch { throw new Error('the model answer is not valid JSON'); }
  if (v.accept === false) {
    if (!text(v.reason, 400)) throw new Error('a rejection needs a reason');
    return { accept: false, reason: v.reason.trim() };
  }
  if (v.accept !== true) throw new Error('"accept" must be true or false');
  if (!text(v.name, 60)) throw new Error('"name" must be 1–60 characters');
  if (!TAGS.includes(v.tag)) throw new Error(`"tag" must be one of ${TAGS.join(', ')}`);
  if (typeof v.ai !== 'boolean') throw new Error('"ai" must be true or false');
  for (const [key, max] of [['focus', 400], ['application', 160]]) {
    if (!text(v[key]?.zh, max) || !text(v[key]?.en, max)) throw new Error(`"${key}" needs zh and en text of at most ${max} characters`);
    if (!cjk.test(v[key].zh) || !latin.test(v[key].en)) throw new Error(`"${key}" zh must be Chinese and en must be English`);
  }
  return { accept: true, name: v.name.trim(), tag: v.tag, ai: v.ai, focus: { zh: v.focus.zh.trim(), en: v.focus.en.trim() }, application: { zh: v.application.zh.trim(), en: v.application.en.trim() } };
}

export function entryFor(candidate, meta, verdict, at) {
  const post = parsePostUrl(candidate.url);
  const entry = draftEntry(post, meta, verdict.tag, at);
  // X labels Indonesian `in`; the library writes the standard code, as the earlier batches did.
  const lang = { in: 'id' }[entry.post.lang] ?? entry.post.lang;
  return { ...entry, name: verdict.name, ...(verdict.ai ? { ai: true } : {}), focus: verdict.focus, application: verdict.application, post: { ...entry.post, lang } };
}

// `draft` is the card a review-band row would publish (review-queue.mjs); a new decision replaces it.
export function review(candidate, patch, today) {
  const { reason, entry, draft, ...rest } = candidate;
  return { ...rest, ...patch, reviewedAt: today };
}

// Six frames into one contact sheet, streamed from the post's own video address; nothing is kept but the sheet.
export function makeSheet(videoUrl, dir) {
  const probe = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', videoUrl], { encoding: 'utf8', timeout: 60000 });
  const duration = Number(probe.stdout);
  if (!(duration > 0)) throw new Error('ffprobe could not read the video duration');
  const sheet = path.join(dir, 'sheet.jpg');
  const made = spawnSync('ffmpeg', ['-v', 'error', '-y', '-i', videoUrl, '-vf', `fps=6/${duration.toFixed(3)},scale=480:-2,tile=3x2`, '-frames:v', '1', sheet], { timeout: 120000 });
  if (made.status !== 0) throw new Error(`ffmpeg failed: ${String(made.stderr).slice(0, 200)}`);
  return sheet;
}

// The model runs through the Claude Code CLI the maintainer already has; `--allowedTools Read` lets it open the sheet and nothing else.
export function askClaude(prompt, dir) {
  const run = spawnSync('claude', ['-p', '--allowedTools', 'Read', '--add-dir', dir, '--output-format', 'json', prompt], { encoding: 'utf8', timeout: 300000, cwd: dir });
  if (run.status !== 0) throw new Error(`claude exited ${run.status}: ${String(run.stderr).slice(0, 200)}`);
  return JSON.parse(run.stdout).result;
}

async function fetchJson(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`${res.status} from ${new URL(url).host}`);
  return res.json();
}
const defaults = {
  oembed: post => fetchJson(`https://publish.x.com/oembed?url=${encodeURIComponent(post.url)}&omit_script=1&dnt=1`),
  syndication: id => fetchJson(`https://cdn.syndication.twimg.com/tweet-result?id=${id}&lang=en&token=${syndicationToken(id)}`),
  sheet: makeSheet,
  ask: askClaude,
};

// Pending candidates in the order they are screened: posts from listed authors and watched accounts (`watched`, set by
// x-discovery.mjs) first, then the rest; most likes first within each.
export function screeningOrder(candidates) {
  return candidates.filter(c => c.status === 'pending' || !c.status).sort((a, b) => Number(Boolean(b.watched)) - Number(Boolean(a.watched)) || b.likes - a.likes);
}

// A candidate that cannot be read this time (network, X, the model) stays `pending` for the next run; only a decision changes it.
export async function run({ inbox: inboxFile = inboxPath, data: dataFile = dataPath, limit = 10, dryRun = false, now = new Date(), io = {} } = {}) {
  const dep = { ...defaults, ...io };
  const inbox = JSON.parse(await fs.readFile(inboxFile, 'utf8'));
  let source = await fs.readFile(dataFile, 'utf8');
  const items = readItems(source), today = now.toISOString().slice(0, 10);
  const added = [], summary = { accepted: [], rejected: [], kept: [], review: [] };
  const queue = screeningOrder(inbox.candidates).slice(0, limit);
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'x-publish-'));
  const decide = (candidate, patch) => { inbox.candidates[inbox.candidates.indexOf(candidate)] = review(candidate, patch, today); };
  try {
    for (const candidate of queue) {
      const label = `@${candidate.handle} ${candidate.id}`;
      try {
        const own = authorInLibrary([...items, ...added], candidate.handle);
        if (own) { decide(candidate, { status: 'rejected', reason: `The library already has a post by this author (${own.id})` }); summary.rejected.push([label, 'author already in the library']); continue; }
        const post = parsePostUrl(candidate.url);
        const media = pickMedia(await dep.syndication(post.id));
        if (!media) { decide(candidate, { status: 'rejected', reason: 'The post has no video the embed endpoint serves' }); summary.rejected.push([label, 'no video']); continue; }
        const meta = fromOembed(await dep.oembed(post), post);
        const prompt = buildPrompt(candidate, meta, await dep.sheet(media.video, dir));
        const scored = await screen(dep.ask, prompt, dir, 'video', parseVerdict), screening = record('video', scored, now.toISOString());
        if (scored.band === 'reject') { decide(candidate, { status: 'rejected', reason: scored.reason, screening }); summary.rejected.push([label, scored.reason]); continue; }
        const entry = entryFor(candidate, meta, scored.notes, now.toISOString());
        if (items.some(i => i.id === entry.id) || added.some(i => i.id === entry.id)) throw new Error(`entry id ${entry.id} already exists`);
        if (scored.band === 'review') { decide(candidate, { status: 'review', reason: scored.reason, draft: entry, screening }); summary.review.push([label, candidate.id, scored, entry.name]); continue; }
        added.push(entry);
        decide(candidate, { status: 'published', entry: entry.id, screening });
        summary.accepted.push([label, entry.id, entry.tag, entry.name, scored]);
      } catch (error) { summary.kept.push([label, error.message]); }
    }
  } finally { await fs.rm(dir, { recursive: true, force: true }); }
  if (!dryRun && (added.length || summary.rejected.length || summary.review.length)) {
    source = appendItems(source, added);
    await fs.writeFile(dataFile, source);
    inbox.updatedAt = now.toISOString();
    const temporary = `${inboxFile}.tmp`;
    await fs.writeFile(temporary, `${JSON.stringify(inbox, null, 2)}\n`);
    await fs.rename(temporary, inboxFile);
  }
  return { ...summary, entries: added };
}

// The first line is what weekly-guard.mjs reads; the review band gets its own section, one line per candidate.
export function report(summary) {
  const review = summary.review ?? [];
  const lines = [`Accepted ${summary.accepted.length}, rejected ${summary.rejected.length}, left pending ${summary.kept.length}, held for review ${review.length}.`];
  for (const [label, id, tag, name, s] of summary.accepted) lines.push(`+ ${label} → ${id} (${tag}) ${name}${s ? ` [${s.total}/${s.max}]` : ''}`);
  for (const [label, reason] of summary.rejected) lines.push(`- ${label}: ${reason}`);
  for (const [label, reason] of summary.kept) lines.push(`? ${label}: ${reason}`);
  return [...lines, ...reviewLines(review)].join('\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2), at = flag => args[args.indexOf(flag) + 1];
  const limit = args.includes('--limit') ? Number(at('--limit')) : 10;
  if (!Number.isInteger(limit) || limit < 1) { console.error('Usage: x-publish.mjs [--limit n] [--dry-run]'); process.exit(2); }
  console.log(report(await run({ limit, dryRun: args.includes('--dry-run') })));
}
