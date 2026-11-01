import { flushSync } from 'react-dom';

let pending = false;
let queued: (() => void) | null = null;

// Animates a state change with the View Transitions API where it exists; otherwise, or with reduced motion, it just applies the change.
// A change that lands while one is pending is queued (latest wins) and runs once it has applied, so a quick second
// choice is not lost. Updates must not close over state that the pending update changes: use functional updaters.
export function transition(update: () => void) {
  const doc = document as Document & { startViewTransition?: (callback: () => void) => { updateCallbackDone: Promise<void> } };
  if (!doc.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) return update();
  if (pending) { queued = update; return; }
  pending = true;
  doc.startViewTransition(() => flushSync(update)).updateCallbackDone.finally(() => { pending = false; const next = queued; queued = null; if (next) transition(next); });
}
