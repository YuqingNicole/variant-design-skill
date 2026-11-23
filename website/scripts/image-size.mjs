// Width and height of a remote image from the first bytes of its file (PNG, GIF, JPEG, WebP headers), so the feed can lay a
// cover out at the image's own proportions before it loads (no layout shift). Only the start of the file is requested.
// Usage: node website/scripts/image-size.mjs   (adds width and height to src/link-previews.json entries that lack them)
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

export function imageSize(buf) {
  const b = Buffer.from(buf), u16 = (o, le) => le ? b.readUInt16LE(o) : b.readUInt16BE(o), ok = (w, h) => w > 0 && h > 0 ? { width: w, height: h } : null;
  if (b.length >= 24 && b.readUInt32BE(0) === 0x89504e47 && b.toString('ascii', 12, 16) === 'IHDR') return ok(b.readUInt32BE(16), b.readUInt32BE(20));
  if (b.length >= 10 && b.toString('ascii', 0, 3) === 'GIF') return ok(u16(6, true), u16(8, true));
  if (b.length >= 30 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {
    const kind = b.toString('ascii', 12, 16);
    if (kind === 'VP8 ') return ok(u16(26, true) & 0x3fff, u16(28, true) & 0x3fff);
    if (kind === 'VP8L') { const bits = b.readUInt32LE(21); return ok((bits & 0x3fff) + 1, ((bits >> 14) & 0x3fff) + 1); }
    if (kind === 'VP8X') return ok(1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3));
    return null;
  }
  if (b.length >= 4 && b[0] === 0xff && b[1] === 0xd8) {
    // Walk the JPEG segments to the first start-of-frame marker (C0–CF, except C4 DHT, C8 JPG and CC DAC).
    for (let o = 2; o + 9 < b.length;) {
      if (b[o] !== 0xff) { o++; continue; }
      const marker = b[o + 1];
      if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { o += 2; continue; }
      const length = u16(o + 2);
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) return ok(u16(o + 7), u16(o + 5));
      o += 2 + length;
    }
  }
  return null;
}

// The first 128 KB is enough for every header above (a JPEG with a large EXIF block is the longest); the server may ignore
// the range and send the whole file, in which case reading stops at the same limit.
export async function fetchImageSize(url, { limit = 131072, timeout = 15000 } = {}) {
  const res = await fetch(url, { headers: { range: `bytes=0-${limit - 1}`, 'user-agent': 'Mozilla/5.0 (compatible; VariantDesignLinkPreview/1.0)' }, signal: AbortSignal.timeout(timeout), redirect: 'follow' });
  if (!res.ok || !res.body) return null;
  const chunks = []; let size = 0;
  for await (const chunk of res.body) { chunks.push(chunk); size += chunk.length; if (size >= limit) break; }
  return imageSize(Buffer.concat(chunks));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const file = new URL('../src/link-previews.json', import.meta.url), previews = JSON.parse(fs.readFileSync(file, 'utf8'));
  let added = 0, failed = [];
  for (const [id, p] of Object.entries(previews)) {
    if (p.width && p.height) continue;
    try { const s = await fetchImageSize(p.image); if (s) { previews[id] = { ...p, ...s }; added++; } else failed.push(id); } catch { failed.push(id); }
  }
  fs.writeFileSync(file, `${JSON.stringify(previews, null, 2)}\n`);
  console.log(`Sizes added: ${added}; not readable: ${failed.length}${failed.length ? ` (${failed.join(', ')})` : ''}`);
}
