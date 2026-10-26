const tags = new Set(['main','nav','section','footer','div','h1','h2','h3','p','span','a','img','ul','li','details','summary']);
const containers = new Set(['main','nav','section','footer','div','ul','li','details']);
const textTags = new Set(['h1','h2','h3','p','span','a','summary']);
const colors = /^(#[\da-f]{3,8}|transparent)$/i;
const styleRules = {
  color: colors, backgroundColor: colors, borderColor: colors,
  fontSize: /^(\d{1,3})(px|rem)$/, padding: /^(\d{1,3}px|0)( (\d{1,3}px|0))?$/, gap: /^\d{1,3}px$/, borderRadius: /^\d{1,3}px$/,
  maxWidth: /^(\d{1,4}px|100%)$/, textAlign: /^(left|center|right)$/, display: /^(block|flex|grid)$/,
  flexDirection: /^(row|column)$/, alignItems: /^(start|center|end|stretch)$/, justifyContent: /^(start|center|end|space-between)$/,
  fontWeight: /^(400|500|600|700|800)$/, fontFamily: /^(serif|sans-serif|monospace)$/, gridTemplateColumns: /^(1fr|1fr 1fr|1fr 1fr 1fr)$/, minHeight: /^\d{1,3}px$/,
};
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function safeUrl(value, image = false) {
  if (typeof value !== 'string') return false;
  if (image && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value)) return value.length <= 3_000_000;
  if (!image && /^#[\w-]+$/.test(value)) return true;
  try { const url = new URL(value); return image ? url.protocol === 'https:' : ['https:', 'http:', 'mailto:', 'tel:'].includes(url.protocol); } catch { return false; }
}
export function walk(node, fn, parent = null) { fn(node, parent); for (const child of node.children ?? []) walk(child, fn, node); }
export function findNode(doc, id) { let result; walk(doc.root, n => { if (n.id === id) result = n; }); return result; }
export function validateDocument(doc) {
  if (!doc || doc.schemaVersion !== 1 || !['A','B','C'].includes(doc.direction) || typeof doc.title !== 'string' || doc.title.length > 200 || doc.root?.type !== 'main') throw new Error('Invalid landing document.');
  if(doc.description !== undefined && (typeof doc.description !== 'string'||doc.description.length>600))throw new Error('Invalid page description.');
  const ids = new Set(); let count = 0;
  if (!doc.tokens || Array.isArray(doc.tokens) || typeof doc.tokens !== 'object' || Object.values(doc.tokens).some(v => typeof v !== 'string' || !colors.test(v))) throw new Error('Invalid color tokens.');
  function visit(n, depth = 0) {
    if (depth > 12 || ++count > 300 || !n || !/^[a-zA-Z][\w-]{0,79}$/.test(n.id) || ids.has(n.id) || !tags.has(n.type)) throw new Error('Invalid, duplicate or excessively nested node.');
    ids.add(n.id);
    if (typeof n.name !== 'string' || n.name.length > 160 || typeof n.text !== 'string' || n.text.length > 6000 || !Array.isArray(n.children)) throw new Error('Invalid node content.');
    for(const key of ['styles','props'])if(!n[key]||typeof n[key]!=='object'||Array.isArray(n[key]))throw new Error(`Node needs a ${key} object.`);
    if (!containers.has(n.type) && n.children.length) throw new Error('Leaf elements cannot have children.');
    if (n.text && !textTags.has(n.type)) throw new Error('Text belongs on a text element.');
    for (const [key, value] of Object.entries(n.styles ?? {})) if (!Object.hasOwn(styleRules, key) || typeof value !== 'string' || !styleRules[key].test(value)) throw new Error(`Unsupported style: ${key}`);
    if (n.props && Object.keys(n.props).some(k => !['href','src','alt'].includes(k))) throw new Error('Unsupported node property.');
    if (n.props?.href !== undefined && (n.type !== 'a' || !safeUrl(n.props.href))) throw new Error('Invalid link.');
    if (n.props?.src !== undefined && (n.type !== 'img' || !safeUrl(n.props.src, true))) throw new Error('Invalid image. Use HTTPS or PNG/JPEG/WebP.');
    if (n.props?.alt !== undefined && (typeof n.props.alt !== 'string' || n.props.alt.length > 600)) throw new Error('Invalid image description.');
    if (n.hidden !== undefined && typeof n.hidden !== 'boolean') throw new Error('Invalid visibility.');
    for (const child of n.children) visit(child, depth + 1);
  }
  visit(doc.root);
  return doc;
}
export function applyCommands(document, commands) {
  const doc = structuredClone(document);
  if (!Array.isArray(commands) || commands.length < 1 || commands.length > 30) throw new Error('Provide 1–30 edit commands.');
  for (const cmd of commands) {
    const node = findNode(doc, cmd.nodeId);
    if (!node) throw new Error('Node not found.');
    let parent; walk(doc.root, (n,p) => { if (n.id === node.id) parent = p; });
    switch (cmd.type) {
      case 'meta': if(node.id!==doc.root.id)throw new Error('Select the page root to edit metadata.'); if(cmd.title!==undefined)doc.title=cmd.title;if(cmd.description!==undefined)doc.description=cmd.description;break;
      case 'text': if (!textTags.has(node.type) || typeof cmd.text !== 'string') throw new Error('Select a text node.'); node.text = cmd.text; break;
      case 'style': if (!cmd.styles || typeof cmd.styles !== 'object' || Array.isArray(cmd.styles)) throw new Error('Invalid styles.'); node.styles = { ...node.styles, ...cmd.styles }; for (const [key,value] of Object.entries(node.styles)) if (value === '') delete node.styles[key]; break;
      case 'props': node.props = { ...node.props, ...cmd.props }; break;
      case 'rename': node.name = cmd.name; break;
      case 'hide': if (!parent) throw new Error('Cannot hide root.'); node.hidden = cmd.hidden; break;
      case 'delete': if (!parent) throw new Error('Cannot delete root.'); parent.children = parent.children.filter(n => n.id !== node.id); break;
      case 'move': {
        const target = findNode(doc, cmd.parentId);
        let cycle = false; walk(node, n => { if (n.id === cmd.parentId) cycle = true; });
        if (!parent || !target || !containers.has(target.type) || cycle || !Number.isInteger(cmd.index) || cmd.index < 0) throw new Error('Invalid move.');
        parent.children = parent.children.filter(n => n.id !== node.id);
        target.children.splice(Math.min(cmd.index, target.children.length), 0, node); break;
      }
      case 'duplicate': {
        if (!parent || typeof cmd.prefix !== 'string' || !/^[a-zA-Z][\w-]{0,20}$/.test(cmd.prefix)) throw new Error('Invalid duplicate.');
        const copy = structuredClone(node); let i = 0; const mapping = {};
        walk(copy, n => { const old = n.id; n.id = `${cmd.prefix}-${i++}`; mapping[old] = n.id; });
        walk(copy, n => { if (n.props?.href?.startsWith('#') && mapping[n.props.href.slice(1)]) n.props.href = '#' + mapping[n.props.href.slice(1)]; });
        parent.children.splice(parent.children.indexOf(node) + 1, 0, copy); break;
      }
      case 'insert': if (!containers.has(node.type)) throw new Error('Cannot insert into a leaf.'); node.children.push(structuredClone(cmd.node)); break;
      default: throw new Error('Unknown edit command.');
    }
  }
  return validateDocument(doc);
}
const node = (id, type, name, text = '', children = [], styles = {}, props = {}) => ({ id, type, name, text, children, styles, props });
export function createLanding(direction = 'B', brief = 'Variant Design · 从三个方向找到值得交付的设计') {
  const palette = { A: ['#f7f3eb','#25372d','#a4492f'], B: ['#f7f8fa','#192a39','#185c45'], C: ['#f8e96d','#242522','#6b332c'] }[direction];
  if (!palette) throw new Error('Invalid direction.');
  const [paper,ink,accent] = palette;
  const n = node;
  // The three starters share copy and tasks but differ in type, hierarchy, density and order.
  const shape = {
    A: { root:{fontFamily:'serif'}, hero:{maxWidth:'760px',padding:'120px 0'}, headline:{fontSize:'64px',fontWeight:'500'}, grid:{display:'grid',gridTemplateColumns:'1fr',gap:'40px',maxWidth:'720px'}, steps:{display:'grid',gridTemplateColumns:'1fr',gap:'24px',maxWidth:'720px'} },
    B: { root:{fontFamily:'sans-serif'}, hero:{}, headline:{}, grid:{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'32px'}, steps:{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'32px'} },
    C: { root:{fontFamily:'sans-serif'}, hero:{textAlign:'center',backgroundColor:ink,color:paper,padding:'80px',borderRadius:'16px'}, headline:{fontWeight:'800',fontSize:'72px'}, grid:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'24px'}, steps:{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'16px'} },
  }[direction];
  const hero = n('hero','section','首屏', '', [
    n('eyebrow','span','产品定位','为认真打磨产品的人而造'),
    n('headline','h1','主标题','好设计，值得多一个方向。',[],shape.headline),
    n('intro','p','产品介绍', brief),
    n('cta','a','主要行动',direction==='C'?'现在开始比较 →':'了解工作方式 →', [], {}, {href:'#process'}),
  ], shape.hero);
  const feature = (id,title,body) => n(id,'div',title,'',[n(id+'-title','h3','卖点标题',title),n(id+'-body','p','卖点说明',body)]);
  const features = n('features','section','核心价值','',[
    n('features-title','h2','价值标题','让每一次选择，都有依据。'),
    n('feature-grid','div','卖点布局','',[
      feature('f1','先看不同可能','比较三种结构和叙事，找到真正适合产品的方向。'),
      feature('f2','把细节握在手中','直接调整文字、颜色和间距，让表达符合你的判断。'),
      feature('f3','把成果带走','保留修改记录，交付可以独立运行的页面。')
    ],shape.grid)
  ]);
  const process = n('process','section','使用过程','',[
    n('process-title','h2','过程标题','从一份命题，到一个可用的页面。'),
    n('steps','div','步骤','',[feature('s1','01 / 描述','说明你的产品、用户和最重要的行动。'),feature('s2','02 / 打磨','选择一个方向，逐步调整页面的内容和结构。'),feature('s3','03 / 交付','检查手机布局与链接，再导出完整页面。')],shape.steps)
  ]);
  const faq = n('faq','section','常见问题','',[n('faq-title','h2','问题标题','在开始之前'),n('question','details','常见问题','',[n('question-title','summary','问题','我可以继续修改导出的页面吗？'),n('answer','p','回答','可以。导出的是完整 HTML 和 CSS，能够在浏览器独立打开，也可以继续交给开发者修改。')])]);
  const nav = n('navigation','nav','导航','',[n('brand','a','品牌','VARIANT / STUDIO',[],{fontWeight:'700'},{href:'#hero'}),n('nav-link','a','导航链接','工作方式',[],{},{href:'#process'})]);
  const footer = n('footer','footer','页脚','',[n('footer-name','p','署名','Variant Design · 用判断，推进设计。'),n('back','a','返回顶部','返回顶部 ↑',[],{},{href:'#hero'})]);
  const sections = direction === 'A' ? [nav,hero,process,features,faq,footer] : direction === 'C' ? [nav,hero,process,features,faq,footer] : [nav,hero,features,process,faq,footer];
  return validateDocument({schemaVersion:1,direction,title:'Variant Design',root:n('page','main','页面','',sections,{backgroundColor:paper,color:ink,...shape.root}),tokens:{paper,ink,accent}});
}
export function inspectLanding(doc) {
  const issues = []; let headings = 0; const ids = new Set();
  const collectVisible=n=>{if(n.hidden)return;ids.add(n.id);n.children.forEach(collectVisible);};collectVisible(doc.root);
  const visit = n => {
    if (n.hidden) return;
    if (n.type==='h1') headings++;
    if (n.type==='a' && (!n.props?.href || (n.props.href.startsWith('#') && !ids.has(n.props.href.slice(1))))) issues.push({nodeId:n.id,message:'链接缺少目标，或目标区块已被删除。'});
    if (n.type==='img' && (!n.props?.src || !n.props?.alt)) issues.push({nodeId:n.id,message:'图片需要文件和文字描述。'});
    for(const child of n.children) visit(child);
  }; visit(doc.root);
  if(headings!==1) issues.push({nodeId:'page',message:'页面需要且只需要一个主标题 H1。'});
  return {issues,scope:'structure-and-links',note:'仍需检查实际文案、图片授权、手机布局和外部链接；此检查不代表无障碍认证。'};
}
export function renderLanding(doc, options = {}) {
  validateDocument(doc);
  const css = `*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;font:17px/1.7 system-ui,-apple-system,"PingFang SC",sans-serif}main{min-height:100vh;padding:0 max(24px,calc((100vw - 1120px)/2))}nav,footer{display:flex;align-items:center;justify-content:space-between;gap:24px;padding:26px 0}nav{border-bottom:1px solid currentColor}section{padding:64px 0;border-bottom:1px solid #88888840}h1{text-wrap:balance;font-size:clamp(38px,5.5vw,76px);line-height:1.16;letter-spacing:-.045em;max-width:900px;margin:24px 0}h2{font-size:clamp(26px,3vw,42px);line-height:1.3;margin:0 0 32px;letter-spacing:-.025em}h3{font-size:22px;line-height:1.4;margin:0 0 12px}p{max-width:720px;margin:16px 0}a{color:inherit;text-underline-offset:5px}section>span{font-size:13px;letter-spacing:.1em}section>a{display:inline-flex;background:${escape(doc.tokens?.accent || '#185c45')};color:#fff;border-radius:4px;padding:14px 24px;margin-top:20px;text-decoration:none}img{max-width:100%;height:auto;display:block;margin-top:32px}summary{cursor:pointer;padding:16px 0;font-weight:600}footer{font-size:13px}a:focus-visible,summary:focus-visible{outline:3px solid currentColor;outline-offset:5px}#hero{padding-top:88px;padding-bottom:88px}#hero>p{font-size:20px}#hero[style*="center"]>p{margin-left:auto;margin-right:auto}#feature-grid>div,#steps>div{padding-top:20px;border-top:1px solid currentColor}@media(max-width:640px){main{padding:0 22px!important}section,#hero{padding-top:40px!important;padding-bottom:40px!important}#hero[style*="background-color"]{padding-left:24px!important;padding-right:24px!important}h1[style]{font-size:38px!important}[style*="grid-template-columns"]{grid-template-columns:1fr!important}[style*="flex-direction:row"]{flex-direction:column!important}h1{font-size:38px!important}h2{font-size:28px!important}nav,footer{flex-wrap:wrap}p{overflow-wrap:anywhere}}@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}`;
  function render(n) {
    if(n.hidden) return '';
    const style = Object.entries(n.styles || {}).map(([k,v])=>`${k.replace(/[A-Z]/g,c=>'-'+c.toLowerCase())}:${v}`).join(';');
    const attrs = `id="${escape(n.id)}"${options.editor?' data-node-id="'+escape(n.id)+'"':''} style="${escape(style)}"`;
    const props = Object.entries(n.props||{}).map(([k,v])=>` ${k}="${escape(v)}"`).join('');
    if(n.type==='img') return `<img ${attrs}${props}>`;
    return `<${n.type} ${attrs}${props}>${escape(n.text)}${n.children.map(render).join('')}</${n.type}>`;
  }
  const editorScript = options.editor ? `<style>[data-node-id]:hover{outline:1px dashed #29966e;outline-offset:2px}[data-node-id][data-selected]{outline:2px solid #16845e;outline-offset:3px}[contenteditable=true]{cursor:text;outline:2px solid #16845e}img:not([src]){width:100%;min-height:180px;background:#00000008;outline:1px dashed #88888880;font-size:13px;color:#777}</style><script>
const revision=${JSON.stringify(options.revision ?? 0)};
const send=(type,data)=>parent.postMessage({source:'variant-canvas',type,revision,...data},'*');
new ResizeObserver(()=>send('height',{height:document.documentElement.scrollHeight})).observe(document.body);
document.addEventListener('click',e=>{const n=e.target.closest('[data-node-id]');if(!n)return;if(!e.target.isContentEditable)e.preventDefault();e.stopPropagation();document.querySelectorAll('[data-selected]').forEach(n=>n.removeAttribute('data-selected'));n.setAttribute('data-selected','');send('select',{nodeId:n.dataset.nodeId});},true);
document.addEventListener('dblclick',e=>{const n=e.target.closest('[data-node-id]');if(!n||!['H1','H2','H3','P','SPAN','A','SUMMARY'].includes(n.tagName))return;e.preventDefault();n.dataset.original=n.textContent;n.contentEditable='plaintext-only';n.focus();send('editing',{});});
document.addEventListener('focusout',e=>{const n=e.target;if(!n.isContentEditable)return;n.contentEditable='false';const original=n.dataset.original;delete n.dataset.original;
 if(n.dataset.cancel){delete n.dataset.cancel;n.textContent=original;send('cancel',{});return;}
 // Only paragraphs keep line breaks; headings, links and labels are single-line.
 const text=n.tagName==='P'?n.textContent:n.textContent.replace(/\\s*\\n\\s*/g,' ').trim();send('text',{nodeId:n.dataset.nodeId,text,original});});
document.addEventListener('keydown',e=>{const n=e.target;if(!n.isContentEditable)return;
 if(e.key==='Escape'){e.preventDefault();n.dataset.cancel='1';n.blur();}
 else if(e.key==='Enter'&&!e.isComposing&&!(e.shiftKey&&n.tagName==='P')){e.preventDefault();n.blur();}});
addEventListener('message',e=>{if(e.source!==parent||e.data?.type!=='highlight')return;document.querySelectorAll('[data-selected]').forEach(n=>n.removeAttribute('data-selected'));const n=document.getElementById(e.data.nodeId);if(n)n.setAttribute('data-selected','');});
<\/script>` : '';
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="${escape(doc.description || doc.title)}"><title>${escape(doc.title)}</title><style>${css}</style></head><body>${render(doc.root)}${editorScript}</body></html>`;
}
