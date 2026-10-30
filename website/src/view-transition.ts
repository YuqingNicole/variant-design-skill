import { flushSync } from 'react-dom';

// Animates a state change with the View Transitions API where it exists; otherwise, or with reduced motion, it just applies the change.
export function transition(update: () => void) {
  const doc = document as Document & { startViewTransition?: (callback: () => void) => unknown };
  if (!doc.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) return update();
  doc.startViewTransition(() => flushSync(update));
}
