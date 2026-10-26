import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createLanding,applyCommands,findNode,inspectLanding,renderLanding} from '../shared/landing-document.mjs';
import {canvasStore} from './canvas-store.mjs';
test('node edits are atomic, IDs stable, cycles/duplicate IDs/scripts/CSS injection rejected',()=>{
 const doc=createLanding('B');const original=JSON.stringify(doc);
 const next=applyCommands(doc,[{type:'text',nodeId:'headline',text:'A useful new headline'},{type:'move',nodeId:'features',parentId:'page',index:3}]);
 assert.equal(findNode(next,'headline').text,'A useful new headline');assert.equal(next.root.children[3].id,'features');assert.equal(JSON.stringify(doc),original);
 assert.throws(()=>applyCommands(doc,[{type:'text',nodeId:'headline',text:'must rollback'},{type:'move',nodeId:'hero',parentId:'headline',index:0}]));assert.equal(JSON.stringify(doc),original);
 assert.throws(()=>applyCommands(doc,[{type:'move',nodeId:'hero',parentId:'hero',index:0}]));
 assert.throws(()=>applyCommands(doc,[{type:'props',nodeId:'cta',props:{href:'javascript:alert(1)'}}]));
 assert.throws(()=>applyCommands(doc,[{type:'style',nodeId:'hero',styles:{padding:'1px;background:url(evil)'}}]));
 assert.throws(()=>applyCommands(doc,[{type:'insert',nodeId:'hero',node:doc.root.children[0]}]));
 const escaped=renderLanding(applyCommands(doc,[{type:'text',nodeId:'headline',text:'<script>alert(1)</script>'}]));assert.ok(!escaped.includes('<script>'));assert.match(escaped,/&lt;script&gt;/);
 assert.ok(!renderLanding(doc).includes('data-node-id'));assert.ok(renderLanding(doc,{editor:true}).includes('postMessage'));
});
test('store shares revisions, detects stale writers, undo/redo and persistence preserve other directions',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'canvas-store-'));
 try{const store=canvasStore(dir),s=store.create('A landing for testing'),a=JSON.stringify(s.documents.A);
 const selected=store.mutate(s.id,1,{type:'selection',direction:'B',nodeId:'headline'});assert.equal(selected.revision,1);
 const edited=store.mutate(s.id,1,{type:'edit',direction:'B',commands:[{type:'text',nodeId:'headline',text:'Saved edit'}]});assert.equal(edited.revision,2);assert.equal(JSON.stringify(edited.documents.A),a);
 assert.throws(()=>store.mutate(s.id,1,{type:'edit',direction:'B',commands:[{type:'delete',nodeId:'hero'}]}),/已有新修改/);
 assert.equal(canvasStore(dir).read(s.id).revision,2);
 const undone=store.mutate(s.id,2,{type:'undo'});assert.equal(findNode(undone.documents.B,'headline').text,findNode(s.documents.B,'headline').text);
 const redone=store.mutate(s.id,3,{type:'redo'});assert.equal(findNode(redone.documents.B,'headline').text,'Saved edit');
 const copy=store.mutate(s.id,4,{type:'edit',direction:'B',commands:[{type:'duplicate',nodeId:'hero',prefix:'copy'}]});assert.equal(inspectLanding(copy.documents.B).issues.some(i=>i.message.includes('H1')),true);
 store.mutate(s.id,5,{type:'select',direction:'C'});
 const undoAfterSelection=store.mutate(s.id,6,{type:'undo'});assert.equal(undoAfterSelection.selected,'C');assert.equal(inspectLanding(undoAfterSelection.documents.B).issues.length,0);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('delivery checks broken anchors and image content',()=>{
 const doc=createLanding('A');assert.deepEqual(inspectLanding(doc).issues,[]);
 const deleted=applyCommands(doc,[{type:'delete',nodeId:'process'}]);assert.ok(inspectLanding(deleted).issues.some(i=>i.nodeId==='cta'));
 const image={id:'photo',type:'img',name:'Product image',text:'',children:[],styles:{},props:{}};
 const next=applyCommands(doc,[{type:'insert',nodeId:'hero',node:image}]);assert.ok(inspectLanding(next).issues.some(i=>i.nodeId==='photo'));
});
test('embedded images are stored once across undo snapshots and restored on read',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'canvas-assets-'));
 try{const store=canvasStore(dir),s=store.create('Image storage');const src='data:image/png;base64,'+'A'.repeat(400_000);
  let state=store.mutate(s.id,1,{type:'edit',direction:'B',commands:[{type:'insert',nodeId:'hero',node:{id:'photo',type:'img',name:'Photo',text:'',children:[],styles:{},props:{src,alt:'Product'}}}]});
  for(let i=0;i<8;i++)state=store.mutate(s.id,state.revision,{type:'edit',direction:'B',commands:[{type:'text',nodeId:'headline',text:'Edit '+i}]});
  const raw=fs.readFileSync(path.join(dir,s.id+'.json'),'utf8');assert.equal(raw.split(src).length-1,1);assert.ok(raw.length<src.length*2);
  const read=canvasStore(dir).read(s.id);assert.equal(findNode(read.documents.B,'photo').props.src,src);assert.equal(findNode(read.undo.at(-1).documents.B,'photo').props.src,src);
  const undone=store.mutate(s.id,state.revision,{type:'undo'});assert.equal(findNode(undone.documents.B,'photo').props.src,src);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('a lock left by a crashed writer expires; a fresh lock still blocks',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'canvas-lock-'));
 try{const store=canvasStore(dir),s=store.create('Lock recovery'),lock=path.join(dir,s.id+'.json.lock');
  fs.mkdirSync(lock);assert.throws(()=>store.mutate(s.id,1,{type:'edit',direction:'B',commands:[{type:'text',nodeId:'headline',text:'Blocked'}]}),/正在保存/);
  const old=new Date(Date.now()-60_000);fs.utimesSync(lock,old,old);
  assert.equal(store.mutate(s.id,1,{type:'edit',direction:'B',commands:[{type:'text',nodeId:'headline',text:'Recovered'}]}).revision,2);assert.equal(fs.existsSync(lock),false);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('starters differ in type, order and hero treatment; padding accepts two values',()=>{
 const [a,b,c]=['A','B','C'].map(d=>createLanding(d));
 assert.deepEqual([a,b,c].map(d=>d.root.styles.fontFamily),['serif','sans-serif','sans-serif']);
 assert.notDeepEqual(a.root.children.map(n=>n.id),b.root.children.map(n=>n.id));assert.ok(findNode(c,'hero').styles.backgroundColor);
 assert.equal(findNode(applyCommands(b,[{type:'style',nodeId:'hero',styles:{padding:'40px 0'}}]),'hero').styles.padding,'40px 0');
 assert.throws(()=>applyCommands(b,[{type:'style',nodeId:'hero',styles:{fontFamily:'Comic Sans'}}]),/fontFamily/);
});
test('moves keep a leading nav first and a closing footer last',()=>{
  const doc=createLanding('B','Frame');const ids=d=>d.root.children.map(n=>n.id);const move=(nodeId,index)=>applyCommands(doc,[{type:'move',nodeId,parentId:doc.root.id,index}]);
  assert.deepEqual(ids(doc).at(0),'navigation');assert.deepEqual(ids(doc).at(-1),'footer');
  assert.throws(()=>move('footer',0),/页脚/);assert.throws(()=>move('navigation',3),/导航/);
  assert.throws(()=>move('features',0),/导航/);assert.throws(()=>move('features',ids(doc).length),/页脚/);
  const moved=move('faq',1);assert.deepEqual(ids(moved).slice(0,2),['navigation','faq']);assert.equal(ids(moved).at(-1),'footer');
});
