import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import { probe, grade } from '../scripts/style-budget.mjs';
const source=fs.readFileSync(new URL('../website/src/inspiration-data.ts',import.meta.url),'utf8'),from=source.indexOf('[',source.indexOf('export const inspirationItems = '));
const items=JSON.parse(source.slice(from,source.indexOf('\n];',from)+2));
const pixel=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=','base64');
test.beforeEach(async({page})=>{
 await page.route(/https:\/\//,r=>r.request().resourceType()==='image'?r.fulfill({contentType:'image/png',body:pixel}):r.request().resourceType()==='media'?r.fulfill({contentType:'video/webm',path:new URL('./fixtures/inspiration-motion.webm',import.meta.url).pathname}):r.abort());
 await page.route(/\/_vercel\/image\?/,r=>r.fulfill({contentType:'image/png',body:pixel}));
});

test('the chronological stream includes every kind, pages and preserves shareable filters',async({page})=>{
 await page.setViewportSize({width:1280,height:360});await page.goto('/?utm_source=regression');
 const cards=page.locator('.insp-feed>.insp-card');await expect(cards).toHaveCount(30);
 const expected=[...items].sort((a,b)=>Date.parse(b.addedAt)-Date.parse(a.addedAt));
 expect(await cards.locator('.insp-card-open').evaluateAll(as=>as.map(a=>a.pathname.split('/').pop()))).toEqual(expected.slice(0,30).map(i=>i.id));
 // Paging eventually exposes website previews and X videos in this same list.
 while(await cards.count()<items.length){const before=await cards.count();await cards.last().evaluate(el=>el.scrollIntoView({block:'end'}));await expect.poll(()=>cards.count()).toBeGreaterThan(before);}
 await expect(cards).toHaveCount(items.length);await expect(cards.locator('video').first()).toBeAttached();await expect(cards.locator('.insp-thumb-media').first()).toBeAttached();
 await page.getByRole('link',{name:'网站',exact:true}).click();await expect(page).toHaveURL(/\/browse\/web$/);
 // A tab is a full page load: act only after React has taken over the prerendered page, or its state replaces the filters.
 await page.waitForFunction(()=>Object.keys(document.getElementById('root')).some(k=>k.startsWith('__reactContainer')));
 await page.goto('/browse/web?topic=saas-home');await page.waitForFunction(()=>Object.keys(document.getElementById('root')).some(k=>k.startsWith('__reactContainer')));await page.getByRole('searchbox').fill('Vercel');await page.getByRole('combobox',{name:'排序',exact:true}).selectOption('name');
 await expect(cards).toHaveCount(1);await expect(cards.locator('.insp-card-open')).toHaveAttribute('href',/\/v0$/);
 await expect(page).toHaveURL(/sort=name/);const params=new URL(page.url()).searchParams;expect(Object.fromEntries(params)).toEqual({topic:'saas-home',q:'Vercel',sort:'name'});
 await page.reload();await expect(cards).toHaveCount(1);await expect(page.getByRole('searchbox')).toHaveValue('Vercel');await expect(page).toHaveURL(/topic=saas-home/);
});

test('the slash key focuses the search, except while typing',async({page})=>{
 await page.goto('/');await expect(page.locator('.insp-search input')).toBeVisible();
 await expect(async()=>{await page.keyboard.press('/');await expect(page.locator('.insp-search input')).toBeFocused({timeout:500})}).toPass();
 await page.keyboard.type('a/b');await expect(page.locator('.insp-search input')).toHaveValue('a/b');
});

test('details share an element transition and restore focus, history and the scrolled feed',async({page})=>{
 await page.addInitScript(()=>{window.transitions=[];const start=document.startViewTransition?.bind(document);if(start)document.startViewTransition=update=>{const r={ready:false,error:null};window.transitions.push(r);const vt=start(update);vt.ready.then(()=>r.ready=true,e=>r.error=String(e));return vt};});
 await page.goto('/browse/web?sort=curated');
 // The prerendered feed has default filters; wait for the requested client state before scrolling it.
 await expect(page.getByRole('combobox',{name:'排序',exact:true})).toHaveValue('curated');
 const opener=page.locator('.insp-feed .insp-card-open').nth(12);await opener.scrollIntoViewIfNeeded();const before=await page.evaluate(()=>scrollY),href=await opener.getAttribute('href');await opener.click();
 const dialog=page.getByRole('dialog');await expect(dialog).toBeVisible();await expect(page).toHaveURL(new RegExp(href+'\\?sort=curated&in=web$'));
 await expect.poll(()=>page.evaluate(()=>window.transitions.some(r=>r.ready))).toBe(true);
 expect(await page.evaluate(()=>{const names=[...document.querySelectorAll('[style*="view-transition-name"]')].map(e=>getComputedStyle(e).viewTransitionName).filter(n=>n!=='none');return names.length===new Set(names).size})).toBe(true);
 await page.keyboard.press('ArrowRight');await expect(page).not.toHaveURL(new RegExp(href+'\\?'));await page.keyboard.press('ArrowLeft');await expect(page).toHaveURL(new RegExp(href+'\\?'));
 await page.keyboard.press('Escape');await expect(dialog).not.toBeVisible();await expect(page).toHaveURL(/\/browse\/web\?sort=curated$/);await expect(opener).toBeFocused();await expect.poll(()=>page.evaluate(()=>scrollY)).toBe(before);
 // Native forward/back restores the dialog rather than leaving the detail URL over a closed list.
 await page.goForward();await expect(dialog).toBeVisible();await page.goBack();await expect(dialog).not.toBeVisible();await expect.poll(()=>page.evaluate(()=>scrollY)).toBe(before);
 expect(await page.evaluate(()=>window.transitions.filter(r=>r.error))).toEqual([]);
});

test('motion preference changes stop video downloads and playback; offscreen videos pause',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.addInitScript(()=>{window.transitionCalls=0;const start=document.startViewTransition?.bind(document);if(start)document.startViewTransition=update=>{window.transitionCalls++;return start(update)}});
 await page.goto('/');const first=page.locator('.insp-feed video').first();await expect(first).toBeAttached();await expect(first).not.toHaveAttribute('src');
 await page.locator('.insp-card-open').first().click();await expect(page.getByRole('dialog')).toBeVisible();await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).not.toBeVisible();expect(await page.evaluate(()=>window.transitionCalls)).toBe(0);
 await page.emulateMedia({reducedMotion:'no-preference'});await expect.poll(()=>first.evaluate(v=>!v.paused&&v.currentTime>0)).toBe(true);
 await page.locator('.insp-feed .insp-card').nth(20).scrollIntoViewIfNeeded();await expect.poll(()=>first.evaluate(v=>v.paused)).toBe(true);
 await first.scrollIntoViewIfNeeded();await expect.poll(()=>first.evaluate(v=>!v.paused)).toBe(true);
 await page.emulateMedia({reducedMotion:'reduce'});await expect(first).not.toHaveAttribute('src');await expect.poll(()=>first.evaluate(v=>v.paused)).toBe(true);
});

test('both languages meet the visual budget, show a strip of three cards on the first desktop screen and keep credits visible',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 for(const language of ['zh','en'])for(const width of [320,390,1440]){
  await page.setViewportSize({width,height:900});await page.goto(language==='en'?'/en':'/');await expect(page.locator('nav[aria-label="全部参考"]')).toHaveCount(0);await expect(page.locator('.insp-card').first()).toBeVisible();await page.evaluate(()=>document.fonts.ready);
  const sample=await page.evaluate(probe);expect(grade(sample).over,`${language} ${width}`).toEqual([]);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const meta=page.locator('.insp-card-meta').first();await expect(meta).toHaveCSS('opacity','1');if(width<=390){await expect(meta.locator('.insp-vcard-avatar')).toBeVisible();}else{
   // The feed is one horizontal strip: credits sit under each image, and the first screen shows three whole cards.
   expect(await page.locator('.insp-card').evaluateAll(cs=>cs.slice(0,3).every(c=>{const r=c.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight}))).toBe(true);
  }
 }
});


test('direct details support keyboard navigation without the transitions API',async({page})=>{
 await page.addInitScript(()=>Object.defineProperty(document,'startViewTransition',{value:undefined}));
 await page.goto('/inspiration/raycast?sort=curated');await page.getByRole('button',{name:'下一个',exact:true}).focus();await expect(page.locator('h1')).toHaveText('Raycast');
 await page.keyboard.press('ArrowRight');await expect(page.locator('h1')).toHaveText('Resend');await expect(page).toHaveURL(/\/inspiration\/resend\?sort=curated$/);
 await page.keyboard.press('ArrowLeft');await expect(page.locator('h1')).toHaveText('Raycast');
 await page.keyboard.press('Escape');await expect(page).toHaveURL(/\/\?sort=curated$/);await expect(page.locator('.insp-feed')).toBeVisible();
});

// Delay the real update callback so several key events arrive before a transition commits.
for(const mode of ['modal','page'])test(`rapid detail arrows preserve every navigation intent in ${mode} mode`,async({page})=>{
 await page.addInitScript(()=>{const start=document.startViewTransition?.bind(document);if(start)document.startViewTransition=update=>start(async()=>{await new Promise(resolve=>setTimeout(resolve,100));return update()})});
 const list=items.filter(i=>i.category==='landing'||(i.category==='practice'&&!['motion','interaction','branding','brand'].includes(i.tag.toLowerCase())));
 if(mode==='modal'){await page.goto('/browse/web?sort=curated');await page.locator('.insp-card-open').first().click();await expect(page.getByRole('dialog')).toBeVisible();}
 else await page.goto(`/inspiration/${list[0].id}?sort=curated&in=web`);
 await page.getByRole('button',{name:'下一个',exact:true}).focus();
 const arrows=async(key,count)=>page.evaluate(({key,count,mode})=>{const target=mode==='modal'?document.querySelector('dialog'):window;for(let i=0;i<count;i++)target.dispatchEvent(new KeyboardEvent('keydown',{key,bubbles:true,cancelable:true}))},{key,count,mode});
 await arrows('ArrowRight',5);await expect(page).toHaveURL(new RegExp(`/inspiration/${list[5].id}\\?`));
 await arrows('ArrowLeft',2);await expect(page).toHaveURL(new RegExp(`/inspiration/${list[3].id}\\?`));
 await page.keyboard.press('Escape');await expect(page).toHaveURL(/\/browse\/web\?sort=curated$/);await expect(page.locator('.insp-feed')).toBeVisible();
});
