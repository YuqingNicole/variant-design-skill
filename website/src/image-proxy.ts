// Remote images are resized and cached by Vercel's image service (vercel.json `images`), which also lets
// visitors who cannot reach the source host (pbs.twimg.com from mainland China) see them. Locally,
// server.mjs redirects these URLs to the original.
export const sized=(src:string,w:number)=>`/_vercel/image?url=${encodeURIComponent(src)}&w=${w}&q=75`;
// X posters and avatars go through the service; other hosts are only proxied where a caller asks.
export const proxied=(src:string,w:number)=>/^https:\/\/pbs\.twimg\.com\//.test(src)?sized(src,w):src;
