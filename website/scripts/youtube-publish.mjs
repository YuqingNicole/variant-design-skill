#!/usr/bin/env node
// Closes the loop after YouTube discovery. A candidate is read from YouTube's own public thumbnails (the cover and three frames from
// the middle of the video, joined into one image); nothing is downloaded from the video. A model scores it against the material
// benchmark (screening-rubric.mjs, the Videos rules shared with x-publish.mjs) and writes bilingual notes; the code turns the scores
// into accept, review (held in the inbox) or reject. run-youtube-weekly.sh puts the change in a pull request.
// Usage: node website/scripts/youtube-publish.mjs [--limit n] [--dry-run]
//        node website/scripts/youtube-publish.mjs --url <youtube watch address> [--dry-run]   screen one video without an API key
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readItems, appendItems, askClaude, parseVerdict, TAG_GUIDE, AI_RULE, SCOPE, IP_RULE, VIDEO_OUT_OF_SCOPE, VIDEO_CARD, review, report } from './x-publish.mjs';
import { rubricBlock, answerBlock, screen, record } from './screening-rubric.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const inboxPath = path.resolve(here, '../content/youtube-video-inbox.json');
const dataPath = path.resolve(here, '../src/inspiration-data.ts');

export const videoId = url => { try { const u = new URL(url); return u.hostname.replace(/^www\./, '') === 'youtu.be' ? u.pathname.slice(1) || null : /(^|\.)youtube\.com$/.test(u.hostname) && u.pathname === '/watch' ? u.searchParams.get('v') : null; } catch { return null; } };
const idPattern = /^[A-Za-z0-9_-]{11}$/;

// One channel, one video, as with X authors: a second video from a channel already in the library is not collected.
export function channelInLibrary(items, candidate) {
  const name = candidate.channel?.trim().toLowerCase();
  return items.find(i => i.video?.platform === 'youtube' && ((candidate.channelUrl && i.video.channelUrl === candidate.channelUrl) || (name && i.video.channel.trim().toLowerCase() === name))) ?? null;
}

export function buildPrompt(candidate, sheet) {
  const facts = [`Title: ${JSON.stringify(candidate.title)}`, `Channel: ${candidate.channel}`, candidate.seconds ? `Length: ${candidate.seconds} seconds` : null, candidate.views ? `${candidate.views} views` : null,
    candidate.text ? `Description (start): ${JSON.stringify(candidate.text)}` : null].filter(Boolean).join('\n');
  return `You are screening one YouTube video for the Videos tab of Variant Design's inspiration library. Entries that score in the collect band go live once CI passes, without a person reviewing them.
${SCOPE}
Read the image at ${sheet}: YouTube's public thumbnails of ${candidate.url}, in a 2×2 grid: top left is the cover; the other three are small, blurry frames from the middle of the video. You cannot play the video, so describe only what the pictures and the title show, and say nothing about motion or timing that they do not.

${facts}

${IP_RULE}
${AI_RULE}
${rubricBlock('video', { outOfScope: `${VIDEO_OUT_OF_SCOPE}; a course or tips list; a talk, interview, podcast, vlog, reaction or commentary; a compilation of other people's work (the not-original veto); pictures too unclear to describe` })}

Card fields: write notes on what makes it fun or clever.
${TAG_GUIDE}
Do not invent: no names, claims or tools the pictures and the text do not show.

${answerBlock('video', VIDEO_CARD)}`;
}

export function entryFor(candidate, verdict, at) {
  const channelUrl = candidate.channelUrl ?? null;
  return {
    id: `yt-${candidate.id}`, name: verdict.name, category: 'practice', tag: verdict.tag, ...(verdict.ai ? { ai: true } : {}), url: `https://www.youtube.com/watch?v=${candidate.id}`, source: 'link-only',
    focus: verdict.focus, application: verdict.application, publisher: candidate.channel, kind: 'youtube-video', designer: null,
    checkedAt: at.slice(0, 10), addedAt: at, verification: 'public-video', mobile: 'not-tested',
    video: { platform: 'youtube', id: candidate.id, channel: candidate.channel, channelUrl, ...(candidate.publishedAt ? { date: candidate.publishedAt.slice(0, 10) } : {}), ...(candidate.seconds ? { seconds: candidate.seconds } : {}) },
  };
}

// The cover plus the three mid-video frames, each scaled to one tile. HD uploads have `maxresdefault`; the rest fall back to `hqdefault`.
async function fetchImage(url, file) {
  const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!res.ok) return false;
  await fs.writeFile(file, Buffer.from(await res.arrayBuffer()));
  return true;
}
export async function makeSheet(id, dir) {
  const files = [];
  const cover = path.join(dir, 'cover.jpg');
  if (!(await fetchImage(`https://i.ytimg.com/vi/${id}/maxresdefault.jpg`, cover)) && !(await fetchImage(`https://i.ytimg.com/vi/${id}/hqdefault.jpg`, cover))) throw new Error('YouTube has no thumbnail for this video');
  files.push(cover);
  for (const n of [1, 2, 3]) { const f = path.join(dir, `f${n}.jpg`); if (!(await fetchImage(`https://i.ytimg.com/vi/${id}/${n}.jpg`, f))) throw new Error(`frame ${n} is missing`); files.push(f); }
  const sheet = path.join(dir, 'sheet.jpg');
  const scale = files.map((_, i) => `[${i}:v]scale=480:270:force_original_aspect_ratio=increase,crop=480:270[v${i}]`).join(';');
  const made = spawnSync('ffmpeg', ['-v', 'error', '-y', ...files.flatMap(f => ['-i', f]), '-filter_complex', `${scale};[v0][v1][v2][v3]xstack=inputs=4:layout=0_0|w0_0|0_h0|w0_h0`, '-frames:v', '1', sheet], { timeout: 60000 });
  if (made.status !== 0) throw new Error(`ffmpeg failed: ${String(made.stderr).slice(0, 200)}`);
  return sheet;
}

// The public oEmbed answers 200 only for a video that exists and may be embedded, which is also what the library plays it with.
async function oembed(id) {
  const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}&format=json`, { signal: AbortSignal.timeout(20000) });
  return res.ok ? res.json() : { status: res.status };
}
const defaults = { oembed, sheet: makeSheet, ask: askClaude };

// A candidate from an address alone, with what oEmbed gives (no length, date or views).
export async function candidateFromUrl(url, dep = defaults, now = new Date()) {
  const id = videoId(url);
  if (!id || !idPattern.test(id)) throw new Error(`Not a YouTube watch address: ${url}`);
  const meta = await dep.oembed(id);
  if (!meta.title) throw new Error(`YouTube does not serve this video for embedding (HTTP ${meta.status ?? '?'})`);
  return { id, url: `https://www.youtube.com/watch?v=${id}`, title: meta.title, channel: meta.author_name, channelUrl: meta.author_url ?? null, text: '', capturedAt: now.toISOString(), query: 'by address', group: 'manual', status: 'pending' };
}

// A candidate that cannot be read this time (network, the model) stays `pending`; only a decision changes it.
export async function run({ inbox: inboxFile = inboxPath, data: dataFile = dataPath, limit = 10, dryRun = false, now = new Date(), io = {}, only = null } = {}) {
  const dep = { ...defaults, ...io };
  const inbox = JSON.parse(await fs.readFile(inboxFile, 'utf8').catch(() => '{"candidates":[]}'));
  if (only && !inbox.candidates.some(c => c.id === only.id)) inbox.candidates.push(only);
  const source = await fs.readFile(dataFile, 'utf8');
  const items = readItems(source), today = now.toISOString().slice(0, 10), stamp = now.toISOString();
  const added = [], summary = { accepted: [], rejected: [], kept: [], review: [] };
  const queue = inbox.candidates.filter(c => (c.status === 'pending' || !c.status) && (!only || c.id === only.id)).sort((a, b) => (b.views ?? 0) - (a.views ?? 0)).slice(0, limit);
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'youtube-publish-'));
  const decide = (candidate, patch) => { inbox.candidates[inbox.candidates.indexOf(candidate)] = review(candidate, patch, today); };
  const reject = (candidate, label, reason) => { decide(candidate, { status: 'rejected', reason }); summary.rejected.push([label, reason]); };
  try {
    for (const candidate of queue) {
      const label = `${candidate.channel} ${candidate.id}`;
      try {
        if (!idPattern.test(candidate.id)) { reject(candidate, label, 'Not a YouTube video id'); continue; }
        const same = [...items, ...added].find(i => i.video?.id === candidate.id);
        if (same) { reject(candidate, label, `The library already has this video (${same.id})`); continue; }
        const own = channelInLibrary([...items, ...added], candidate);
        if (own) { reject(candidate, label, `The library already has a video from this channel (${own.id})`); continue; }
        const meta = await dep.oembed(candidate.id);
        if (!meta.title) { reject(candidate, label, `YouTube does not serve this video for embedding (HTTP ${meta.status ?? '?'})`); continue; }
        const scored = await screen(dep.ask, buildPrompt(candidate, await dep.sheet(candidate.id, dir)), dir, 'video', parseVerdict), screening = record('video', scored, stamp);
        if (scored.band === 'reject') { decide(candidate, { status: 'rejected', reason: scored.reason, screening }); summary.rejected.push([label, scored.reason]); continue; }
        const entry = entryFor(candidate, scored.notes, stamp);
        if (scored.band === 'review') { decide(candidate, { status: 'review', reason: scored.reason, draft: entry, screening }); summary.review.push([label, candidate.id, scored, entry.name]); continue; }
        added.push(entry);
        decide(candidate, { status: 'published', entry: entry.id, screening });
        summary.accepted.push([label, entry.id, entry.tag, entry.name, scored]);
      } catch (error) { summary.kept.push([label, error.message]); }
    }
  } finally { await fs.rm(dir, { recursive: true, force: true }); }
  if (!dryRun && (added.length || summary.rejected.length || summary.review.length)) {
    await fs.writeFile(dataFile, appendItems(source, added));
    inbox.updatedAt = stamp;
    const temporary = `${inboxFile}.tmp`;
    await fs.writeFile(temporary, `${JSON.stringify(inbox, null, 2)}\n`);
    await fs.rename(temporary, inboxFile);
  }
  return { ...summary, entries: added };
}

// One report format for both video sources, review band included.
export { report };

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2), at = flag => args[args.indexOf(flag) + 1];
  const limit = args.includes('--limit') ? Number(at('--limit')) : 10;
  if (!Number.isInteger(limit) || limit < 1) { console.error('Usage: youtube-publish.mjs [--limit n] [--dry-run] | --url <watch address>'); process.exit(2); }
  try {
    const only = args.includes('--url') ? await candidateFromUrl(at('--url')) : null;
    console.log(report(await run({ limit, dryRun: args.includes('--dry-run'), only })));
  } catch (error) { console.error(error.message); process.exit(1); }
}
