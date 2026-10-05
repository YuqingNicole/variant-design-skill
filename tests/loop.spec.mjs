import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fixture } from './fixture.mjs';
import { applyVariant, undoVariant } from '../scripts/variant-history.mjs';
const root=path.resolve('.generated'),candidate=path.resolve('.candidate');
let server, base;
test.beforeAll(async()=>{
  fixture(root);
  server=spawn(process.execPath,['../scripts/react-preview.mjs',process.cwd(),root],{stdio:['ignore','pipe','pipe']});
  base=await new Promise((resolve,reject)=>{let output='';const timeout=setTimeout(()=>reject(new Error(output)),20000);server.stdout.on('data',b=>{output+=b;const match=output.match(/Comparison: (http:\/\/[^\s]+)\/\_compare.html/);if(match){clearTimeout(timeout);resolve(match[1]);}});server.stderr.on('data',b=>output+=b);server.on('exit',code=>{clearTimeout(timeout);reject(new Error(`Preview exited ${code}: ${output}`));});});
});
test.afterAll(()=>{server?.kill();fs.rmSync(candidate,{recursive:true,force:true});});
test('React A/B/C render with working controls, locked font, comparison and keyboard focus',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));page.on('console',msg=>{if(msg.type()==='error')errors.push(`${msg.text()} ${msg.location().url}`);});
  for(const id of ['A','B','C']){
    await page.goto(`${base}/_preview/${id}.html`);await expect(page.getByRole('heading')).toHaveText(`Direction ${id}`);
    await expect(page.locator('main')).toHaveCSS('font-family','Georgia');
    await page.keyboard.press('Tab');const button=page.getByRole('button');await expect(button).toBeFocused();
    expect(await button.evaluate(el=>getComputedStyle(el).outlineStyle)).not.toBe('none');
    await button.click();await expect(button).toHaveText('Inspect 1');
  }
  await page.goto(`${base}/_compare.html`);await expect(page.getByRole('link',{name:'Open B'})).toBeVisible();
  await expect(page.locator('iframe')).toHaveCount(3);await page.setViewportSize({width:390,height:844});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(errors).toEqual([]);
});
test('hero edit and undo render only B changes, preserve brand and footer',async({page})=>{
  fs.cpSync(root,candidate,{recursive:true});const file=path.join(candidate,'VariantB.tsx');fs.writeFileSync(file,fs.readFileSync(file,'utf8').replace('Direction B','Evidence first'));
  applyVariant(root,'B',candidate,{summary:'hero',zone:'hero'});
  await page.goto(`${base}/_preview/B.html`);await expect(page.getByRole('heading')).toHaveText('Evidence first');await expect(page.locator('main')).toHaveCSS('font-family','Georgia');await expect(page.locator('footer')).toHaveText('Evidence retained');
  undoVariant(root,'B');await page.reload();await expect(page.getByRole('heading')).toHaveText('Direction B');
});
test('actual coffee example settles counters immediately and stops frames on preference change',async({page})=>{
  await page.route('https://**/*',route=>route.fulfill({status:200,body:''}));
  fs.copyFileSync('../examples/coffee-brand-interactive.html',path.join(root,'coffee.html'));
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.addInitScript(()=>{window.frameCalls=0;const original=window.requestAnimationFrame;window.requestAnimationFrame=cb=>{window.frameCalls++;return original(cb);};});
  await page.goto(`${base}/coffee.html`);
  const finalValues=()=>page.locator('[data-counter]').evaluateAll(elements=>elements.every(el=>el.textContent===(el.dataset.prefix||'')+new Intl.NumberFormat().format(Number(el.dataset.target))+(el.dataset.suffix||'')));
  expect(await finalValues()).toBe(true);await page.locator('.stats-section').scrollIntoViewIfNeeded();await page.waitForTimeout(150);expect(await page.evaluate(()=>window.frameCalls)).toBe(0);
  await page.emulateMedia({reducedMotion:'no-preference'});await page.evaluate(()=>document.querySelectorAll('[data-counter]').forEach(animateCounter));await page.waitForTimeout(50);
  expect(await page.evaluate(()=>window.frameCalls)).toBeGreaterThan(0);
  await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(50);const calls=await page.evaluate(()=>window.frameCalls);await page.waitForTimeout(150);expect(await page.evaluate(()=>window.frameCalls)).toBe(calls);expect(await finalValues()).toBe(true);
});
