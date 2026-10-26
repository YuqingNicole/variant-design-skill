#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { findNode } from '../website/shared/landing-document.mjs';
import { pathToFileURL } from 'node:url';
import fs from 'node:fs';
export function createCanvasServer(origin='http://127.0.0.1:4188') {
  const base=new URL(origin);
  if(base.protocol!=='http:'||!['127.0.0.1','localhost','[::1]'].includes(base.hostname)||base.username||base.password)throw new Error('Use the local canvas HTTP origin.');
  const server=new McpServer({name:'variant-canvas',version:'0.1.0'},{instructions:'This server edits the SAME node documents as /canvas. Ask get_basic_info/get_selection first. Every mutation requires expectedRevision from the latest read. Do not retry conflicts with a fresh revision without reconciling. Export validates structure and links; it does not publish. Screenshots and JSX conversion are not provided.'});
  const projectId=z.string().uuid(),direction=z.enum(['A','B','C']),nodeId=z.string().min(1),expectedRevision=z.number().int().positive();
  const context={projectId,direction},editContext={...context,expectedRevision};
  async function api(id,suffix='',body){const res=await fetch(new URL(`/api/canvas/projects/${id}${suffix}`,base),body?{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(15000)}:{signal:AbortSignal.timeout(15000)});if(!res.ok){const data=await res.json();throw new Error(data.error);}return res.headers.get('content-type')?.includes('text/html')?res.text():res.json();}
  function tool(name,description,schema,readOnly,fn){server.registerTool(name,{description,inputSchema:schema,annotations:{readOnlyHint:readOnly,destructiveHint:!readOnly,openWorldHint:false}},async args=>{try{return {content:[{type:'text',text:JSON.stringify(await fn(args),null,2)}]};}catch(e){return {isError:true,content:[{type:'text',text:e.message}]};}});}
  async function edit(a,commands){return api(a.projectId,'/edit',{expectedRevision:a.expectedRevision,direction:a.direction,commands,summary:a.summary||'Agent 修改画布'});}
  tool('get_basic_info','Read live canvas project, documents, revision and history.',{projectId},true,a=>api(a.projectId));
  tool('get_selection','Read the human-selected node, active direction and delivery winner.',{projectId},true,async a=>{const s=await api(a.projectId);return {revision:s.revision,direction:s.active,nodeId:s.selection,selectedVariant:s.selected,node:s.selection?findNode(s.documents[s.active],s.selection):null};});
  tool('get_tree_summary','Read the named direction node hierarchy.',context,true,async a=>{const s=await api(a.projectId);const tree=n=>({id:n.id,type:n.type,name:n.name,hidden:!!n.hidden,children:n.children.map(tree)});return {revision:s.revision,tree:tree(s.documents[a.direction].root)};});
  tool('get_node_info','Read one node and its descendants.',{...context,nodeId},true,async a=>{const s=await api(a.projectId),n=findNode(s.documents[a.direction],a.nodeId);if(!n)throw new Error('Node not found.');return {revision:s.revision,node:n};});
  tool('get_tokens','Read document color tokens.',context,true,async a=>(await api(a.projectId)).documents[a.direction].tokens);
  tool('set_selection','Select a node so it is highlighted in the browser.',{...editContext,nodeId},false,a=>api(a.projectId,'/selection',{expectedRevision:a.expectedRevision,direction:a.direction,nodeId:a.nodeId}));
  tool('set_text_content','Update a text element; preserves all other nodes.',{...editContext,nodeId,text:z.string().max(6000)},false,a=>edit(a,[{type:'text',nodeId:a.nodeId,text:a.text}]));
  tool('update_styles','Update allowed CSS styles, such as fontSize, color, padding, gap and gridTemplateColumns.',{...editContext,nodeId,styles:z.record(z.string(),z.string())},false,a=>edit(a,[{type:'style',nodeId:a.nodeId,styles:a.styles}]));
  tool('update_props','Update an anchor href or image src/alt. No arbitrary attributes or JavaScript.',{...editContext,nodeId,props:z.record(z.string(),z.string())},false,a=>edit(a,[{type:'props',nodeId:a.nodeId,props:a.props}]));
  tool('rename_node','Rename a layer without changing rendered text.',{...editContext,nodeId,name:z.string().max(160)},false,a=>edit(a,[{type:'rename',nodeId:a.nodeId,name:a.name}]));
  tool('move_node','Move/reorder a node in a container; cycles rejected. Index refers to the final order.',{...editContext,nodeId,parentId:nodeId,index:z.number().int().nonnegative()},false,a=>edit(a,[{type:'move',nodeId:a.nodeId,parentId:a.parentId,index:a.index}]));
  tool('duplicate_node','Duplicate a subtree with fresh stable IDs.',{...editContext,nodeId,prefix:z.string().regex(/^[a-zA-Z][\w-]{0,20}$/)},false,a=>edit(a,[{type:'duplicate',nodeId:a.nodeId,prefix:a.prefix}]));
  tool('delete_node','Remove a node and descendants; undo restores it.',{...editContext,nodeId},false,a=>edit(a,[{type:'delete',nodeId:a.nodeId}]));
  tool('apply_commands','Apply 1–30 validated node commands atomically as one undo step. Supports text/style/props/rename/hide/move/duplicate/delete/insert/meta. Read existing nodes for insert schema.',{...editContext,commands:z.array(z.record(z.string(),z.unknown())).min(1).max(30),summary:z.string().max(200)},false,a=>edit(a,a.commands));
  tool('undo','Undo the last document edit, preserving the delivery winner.',{projectId,expectedRevision},false,a=>api(a.projectId,'/undo',{expectedRevision:a.expectedRevision}));
  tool('redo','Redo the previously undone edit.',{projectId,expectedRevision},false,a=>api(a.projectId,'/redo',{expectedRevision:a.expectedRevision}));
  tool('validate_landing','Check heading structure, image metadata and link targets. Not a browser/accessibility audit.',context,true,a=>api(a.projectId,`/validate?direction=${a.direction}`));
  tool('export_html','Return a standalone HTML landing. Blocks structurally incomplete pages. Does not publish.',context,true,async a=>({html:await api(a.projectId,`/export?direction=${a.direction}`)}));
  return server;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(fs.realpathSync(process.argv[1])).href){await createCanvasServer(process.argv[2]).connect(new StdioServerTransport());}
