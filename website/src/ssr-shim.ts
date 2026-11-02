// Build-time only: pages read the language and query from browser globals during render, and Node has neither.
// Kept in its own module so it runs before any page module is evaluated.
const storage = { getItem: () => null, setItem: () => undefined, removeItem: () => undefined };
Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true });
Object.defineProperty(globalThis, 'window', { value: globalThis, configurable: true });
Object.defineProperty(globalThis, 'location', { value: { pathname: '/', search: '', hash: '' }, configurable: true });
