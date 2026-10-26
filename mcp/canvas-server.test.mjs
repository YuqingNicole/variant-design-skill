import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createServer} from 'node:http';
import {fileURLToPath} from 'node:url';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
import {handleCanvasApi} from '../website/server/canvas-api.mjs';
test('canvas MCP uses the same HTTP document as browser; conflicts and export verified',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'canvas-mcp-'));const old=process.env.CANVAS_DATA_DIR;process.env.CANVAS_DATA_DIR=dir;
 const http=createServer((req,res)=>void handleCanvasApi(req,res));await new Promise(r=>http.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${http.address().port}`;
 const client=new Client({name:'canvas-test',version:'1.0.0'});
 try{
 const response=await fetch(base+'/api/canvas/projects',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({brief:'共享画布回归测试'})});assert.equal(response.status,201);const initial=await response.json();
 await client.connect(new StdioClientTransport({command:process.execPath,args:[fileURLToPath(new URL('./canvas-server.mjs',import.meta.url)),base],stderr:'pipe'}));
 assert.equal((await client.listTools()).tools.length,18);
 const call=(name,args)=>client.callTool({name,arguments:{projectId:initial.id,...args}});
 const data=r=>{assert.ok(!r.isError,JSON.stringify(r));return JSON.parse(r.content[0].text);};
 const tree=data(await call('get_tree_summary',{direction:'B'}));assert.equal(tree.revision,1);
 const edit=data(await call('set_text_content',{direction:'B',expectedRevision:1,nodeId:'headline',text:'Agent 与人共享同一张画布。'}));assert.equal(edit.revision,2);
 const browser=await(await fetch(base+'/api/canvas/projects/'+initial.id)).json();assert.equal(browser.documents.B.root.children[1].children[1].text,'Agent 与人共享同一张画布。');assert.deepEqual(browser.documents.A,initial.documents.A);
 assert.ok((await call('delete_node',{direction:'B',expectedRevision:1,nodeId:'hero'})).isError);
 data(await call('set_selection',{direction:'B',expectedRevision:2,nodeId:'headline'}));assert.equal(data(await call('get_selection',{})).nodeId,'headline');
 data(await call('undo',{expectedRevision:2}));data(await call('redo',{expectedRevision:3}));
 assert.equal(data(await call('validate_landing',{direction:'B'})).issues.length,0);
 const exported=data(await call('export_html',{direction:'B'})).html;assert.match(exported,/Agent 与人共享同一张画布/);assert.ok(!exported.includes('postMessage'));
 const cross=await fetch(base+'/api/canvas/projects/'+initial.id+'/undo',{method:'POST',headers:{'content-type':'application/json',origin:'https://unrelated.example'},body:JSON.stringify({expectedRevision:4})});assert.equal(cross.status,403);
 }finally{await client.close();await new Promise(r=>http.close(r));if(old===undefined)delete process.env.CANVAS_DATA_DIR;else process.env.CANVAS_DATA_DIR=old;fs.rmSync(dir,{recursive:true,force:true});}
});
