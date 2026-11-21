import test from 'node:test';
import assert from 'node:assert/strict';
import {facetsModule,facetFileProblems} from './reference-facets.mjs';
const {facetProblems,collectionCandidates}=facetsModule;
const draft=(over={})=>({status:'draft',industry:null,medium:'website',pageTypes:[],patterns:[],components:[],techniques:[],styles:[],...over});

test('every published reference has valid facets and no facets point at a missing reference', () => {
  assert.deepEqual(facetFileProblems(), []);
});

test('rejects values outside the vocabulary, long lists and reviews without a date', () => {
  assert.deepEqual(facetProblems('a', draft({styles:['dark','minimal']})), []);
  assert.deepEqual(facetProblems('a', draft({industry:'banking',styles:['moody']})), ['a: unknown industry banking','a: unknown styles value moody']);
  assert.match(facetProblems('a', draft({patterns:['faq','faq']}))[0], /repeats/);
  assert.match(facetProblems('a', draft({components:['button','card','tabs','toggle']}))[0], /more than 3/);
  assert.deepEqual(facetProblems('a', draft({status:'reviewed'})), ['a: reviewed without reviewedAt']);
});

test('only reviewed references make a collection ready', () => {
  const all=Object.fromEntries([...Array(6)].map((_,i)=>[`r${i}`,draft({styles:['dark'],status:i<5?'reviewed':'draft',reviewedAt:'2026-11-21'})]));
  const dark=collectionCandidates(all).find(r=>r.facet==='styles'&&r.value==='dark');
  assert.deepEqual(dark,{facet:'styles',value:'dark',reviewed:5,draft:1,ready:false});
  all.r5.status='reviewed';
  assert.equal(collectionCandidates(all).find(r=>r.value==='dark').ready,true);
});
