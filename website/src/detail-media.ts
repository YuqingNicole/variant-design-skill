// X's post embed and the YouTube player appear only in a reference's detail, so the home's script does not carry them
// (2026-11-28). A detail waits for them as it waits for its record: main.tsx before a detail opened by address renders, the
// grid before it opens one, so neither shows a stand-in first. The SSR build imports them up front (ssr-pages.tsx).
type Parts=typeof import('./DetailMedia');
let parts:Parts|undefined;
export const detailMedia=()=>parts;
export const provideDetailMedia=(p:Parts)=>{parts=p};
export const loadDetailMedia=():Promise<void>=>parts?Promise.resolve():import('./DetailMedia').then(provideDetailMedia);
