import test from 'node:test';
import assert from 'node:assert/strict';
import {facetsModule,facetFileProblems,missingFacets} from './reference-facets.mjs';
const {facetProblems,collectionCandidates}=facetsModule;
const draft=(over={})=>({status:'draft',industry:null,medium:'website',pageTypes:[],patterns:[],components:[],techniques:[],styles:[],...over});

test('stored facets are valid and point at published references; a new reference may have none yet', () => {
  assert.deepEqual(facetFileProblems(), []);
  // A weekly job adds a reference without facets: not an error, just listed as missing.
  assert.deepEqual(facetFileProblems({a:draft()},['a','new-site']),[]);
  assert.deepEqual(missingFacets({a:draft()},['a','new-site']),['new-site']);
  assert.deepEqual(facetFileProblems({gone:draft()},['a']),['gone: facets for a reference that is not published']);
});

test('rejects values outside the vocabulary, long lists and reviews without a date', () => {
  assert.deepEqual(facetProblems('a', draft({styles:['dark','minimal']})), []);
  assert.deepEqual(facetProblems('a', draft({industry:'banking',styles:['moody']})), ['a: unknown industry banking','a: unknown styles value moody']);
  assert.match(facetProblems('a', draft({patterns:['faq','faq']}))[0], /repeats/);
  assert.match(facetProblems('a', draft({components:['button','card','tabs','toggle']}))[0], /more than 3/);
  assert.deepEqual(facetProblems('a', draft({status:'reviewed'})), ['a: reviewed without reviewedAt','a: reviewed without reviewedBy']);
  assert.deepEqual(facetProblems('a', draft({status:'reviewed',reviewedAt:'2026-11-22',reviewedBy:'agent'})), []);
  assert.deepEqual(facetProblems('a', draft({reviewedBy:'agent'})), ['a: draft with review fields']);
  assert.deepEqual(facetProblems('a', draft({medium:'constructor',styles:['toString',1]})), ['a: unknown medium constructor','a: unknown styles value toString','a: unknown styles value 1']);
});

test('only reviewed references make a collection ready', () => {
  const all=Object.fromEntries([...Array(6)].map((_,i)=>[`r${i}`,draft({styles:['dark'],...(i<5?{status:'reviewed',reviewedAt:'2026-11-21',reviewedBy:'agent'}:{})})]));
  const dark=collectionCandidates(all).find(r=>r.facet==='styles'&&r.value==='dark');
  assert.deepEqual(dark,{facet:'styles',value:'dark',reviewed:5,draft:1,ready:false});
  Object.assign(all.r5,{status:'reviewed',reviewedAt:'2026-11-21',reviewedBy:'maintainer'});
  assert.equal(collectionCandidates(all).find(r=>r.value==='dark').ready,true);
});

test('a review confirms one record with today\'s date and keeps the file one line per reference', async () => {
  const {reviewRecord,serializeFacets}=await import('./facet-review.mjs');
  const all={a:draft({styles:['dark']}),b:draft()};
  const next=reviewRecord(all,'a',{styles:['dark','editorial'],industry:'ai'},{reviewed:true,today:'2026-11-22'});
  assert.deepEqual(next.a,{status:'reviewed',reviewedAt:'2026-11-22',reviewedBy:'maintainer',industry:'ai',medium:'website',pageTypes:[],patterns:[],components:[],techniques:[],styles:['dark','editorial']});
  assert.equal(next.b,all.b);
  assert.equal(reviewRecord(next,'a',{},{reviewed:false,today:'2026-11-22'}).a.reviewedAt,undefined);
  assert.throws(()=>reviewRecord(all,'a',{styles:['moody']},{reviewed:true,today:'2026-11-22'}),/unknown styles value moody/);
  assert.throws(()=>reviewRecord(all,'zzz',{},{reviewed:true,today:'2026-11-22'}),/Unknown reference/);
  assert.deepEqual(JSON.parse(serializeFacets(next)),next);
  assert.equal(serializeFacets(next).split('\n').length,5);
});
