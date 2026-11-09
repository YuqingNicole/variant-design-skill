// Motion checks for fixtures whose brief asks for animation (`"motion": true` in fixture.json).
// They read the CSS each direction wrote and test what `references/design-system/motion-rules.md` states as rules.
// Static text checks only: they say nothing about whether the motion looks good or runs smoothly.

const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const moves = /(^|[;\s{])(transform|translate|scale|rotate)\s*:/;
const hoverMedia = /\(\s*hover\s*:\s*hover\s*\)/;

// Rules in source order with the preludes of the blocks around them (`@media ...`), so a rule's context is known.
export function rules(css) {
  const out = [], stack = [];
  let start = 0;
  for (let i = 0; i < css.length; i++) {
    const c = css[i];
    if (c === '{') { stack.push(css.slice(start, i).trim()); start = i + 1; }
    else if (c === '}') {
      const prelude = stack.pop() ?? '', keyframes = /^@(-\w+-)?keyframes/.test(prelude);
      // `@media` and `@supports` only wrap other rules; they are context, not rules.
      if (keyframes || !prelude.startsWith('@')) out.push({ prelude, body: css.slice(start, i), context: [...stack], keyframes });
      start = i + 1;
    } else if (c === ';' && stack.length === 0) start = i + 1;
  }
  return out;
}

// One direction's findings. `source` is every file the direction owns, joined.
export function motionFindings(source) {
  const css = strip(source), all = rules(css);
  const problems = { transitionAll: [], scaleZero: [], hoverMoves: [], reducedMotion: [] };
  for (const r of all) {
    if (r.keyframes) continue;
    if (/\btransition(-property)?\s*:[^;}]*\ball\b/.test(r.body)) problems.transitionAll.push(r.prelude);
    if (/\bscale3?d?\(\s*0\s*[,)]/.test(r.body) && !/ripple/i.test(r.prelude)) problems.scaleZero.push(r.prelude);
    if (/:hover/.test(r.prelude) && moves.test(r.body) && !r.context.some(c => hoverMedia.test(c))) problems.hoverMoves.push(r.prelude);
  }
  const animates = /\banimation(-name)?\s*:|\btransition(-property)?\s*:|@keyframes/.test(css);
  if (animates && !/prefers-reduced-motion/.test(css)) problems.reducedMotion.push('animates, with no prefers-reduced-motion rule');
  return { animates, ...problems };
}

// `directions` is [[id, joined source]]. The reading check applies only when the transcript was readable.
export function gradeMotion(directions, reading) {
  const checks = [], add = (id, pass, details = []) => checks.push({ id, pass, details });
  const found = directions.map(([id, source]) => [id, motionFindings(source)]);
  const each = (key, label) => found.flatMap(([id, f]) => f[key].map(x => `${id}: ${label} (${x})`));
  add('motion-present', found.length > 0 && found.every(([, f]) => f.animates), found.filter(([, f]) => !f.animates).map(([id]) => `${id} has no transition or animation`));
  add('motion-no-transition-all', each('transitionAll', 'transition: all').length === 0, each('transitionAll', 'transition: all'));
  add('motion-no-scale-zero', each('scaleZero', 'scale(0)').length === 0, each('scaleZero', 'scale(0)'));
  add('motion-hover-gated', each('hoverMoves', 'hover moves an element outside (hover: hover)').length === 0, each('hoverMoves', 'hover moves an element outside (hover: hover)'));
  add('motion-reduced', each('reducedMotion', 'reduced motion').length === 0, each('reducedMotion', 'reduced motion'));
  if (reading) add('motion-rules-read', reading.files.includes('references/design-system/motion-rules.md'), [`read ${reading.files.filter(f => /motion/.test(f)).join(', ') || 'no motion reference'}`]);
  return checks;
}
