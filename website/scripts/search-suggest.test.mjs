import test from 'node:test';
import assert from 'node:assert/strict';
import { importTs } from './ts-module.mjs';
const { guessFromHistory, inLibrary } = await importTs(new URL('../src/search-suggest.ts', import.meta.url).pathname);
const dark = { slug: 'dark-websites', short: { zh: '深色网站', en: 'Dark sites' }, title: { zh: '深色网站设计灵感', en: 'Dark website design inspiration' }, where: { styles: 'dark' } };
const motion = { slug: 'micro-interactions', short: { zh: '微交互', en: 'Micro-interactions' }, title: { zh: '微交互设计灵感', en: 'Micro-interaction design inspiration' }, where: { techniques: 'micro-interaction' } };
const saas = { id: 'saas-home', title: { zh: 'SaaS 首页', en: 'SaaS homepages' } };
const vocab = { styles: { dark: { zh: '深色', en: 'Dark' } }, techniques: { 'micro-interaction': { zh: '微交互', en: 'Micro-interaction' } } };

test('guesses follow this browser\'s history through either language, newest search first, without repeats', () => {
  assert.deepEqual(guessFromHistory(['saas', 'dark', '深色'], [dark, motion], [saas], vocab).map(g => g.kind === 'collection' ? g.item.slug : g.item.id), ['saas-home', 'dark-websites']);
  assert.deepEqual(guessFromHistory(['交互'], [dark, motion], [saas], vocab).map(g => g.item.slug), ['micro-interactions']);
  assert.deepEqual(guessFromHistory(['x', 'pricing'], [dark, motion], [saas], vocab), [], 'one letter, or nothing related, guesses nothing');
});

test('a trending term is shown only when the library has text for it', () => {
  const texts = ['Linear', 'SaaS', 'A dark hero with a product window'];
  assert.equal(inLibrary('Linear', texts), true);
  assert.equal(inLibrary('dark hero', texts), true);
  assert.equal(inLibrary('buy followers', texts), false);
  assert.equal(inLibrary('a', texts), false);
});
