import { flushSync } from 'react-dom';

let pending = false;

// Animates a state change with the View Transitions API where it exists; otherwise, or with reduced motion, it just applies the change.
// Clicks that land before a pending update has run are ignored: their handlers still hold the previous render's state.
export function transition(update: () => void) {
  const doc = document as Document & { startViewTransition?: (callback: () => void) => { updateCallbackDone: Promise<void> } };
  if (!doc.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) return update();
  if (pending) return;
  pending = true;
  doc.startViewTransition(() => flushSync(update)).updateCallbackDone.finally(() => { pending = false; });
}
