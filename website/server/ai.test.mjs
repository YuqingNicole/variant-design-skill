import assert from "node:assert/strict";
import test from "node:test";
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { auditGeneratedHtml, buildWithModel, generateWithModel } from "./ai.mjs";

function validHtml(id) {
  return `<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>
  :root{--ink:#111111;--paper:#ffffff}*{box-sizing:border-box}body{margin:0;color:var(--ink);background:var(--paper)}
  a:focus-visible{outline:3px solid currentColor}@media(max-width:700px){section{padding:2rem 1rem}}
  @media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
  </style></head><body><header><nav><a href="#main">${id}</a></nav></header><main id="main"><h1>Direction ${id}</h1>
  <section><h2>One</h2><p>${"Specific product narrative. ".repeat(45)}</p></section>
  <section><h2>Two</h2><p>${"Specific product proof. ".repeat(45)}</p></section>
  <section><h2>Three</h2><p>${"Specific product method. ".repeat(45)}</p></section>
  <section><h2>Four</h2><p>${"Specific product action. ".repeat(45)}</p></section>
  </main><footer>Variant Design</footer></body></html>`;
}

function plan(id, layout) {
  return {
    id, name: `Direction ${id}`, thesis: "A clear design thesis", typography: "A coherent serif system", density: "Measured", layout,
    layoutLabel: `${layout} layout`, motion: "Purposeful reveals", reason: "It fits the product and audience",
    colors: ["#111111", "#ffffff", "#8844ff", "#ffee55"], sampleTitle: `Direction ${id}`, sampleMeta: "A working page",
    artDirection: "A precise visual composition", signatureMove: "A recurring typographic rule",
    contentPlan: ["Hero", "Problem", "Method", "Proof", "Action"], avoid: ["generic gradients", "floating glass cards"],
  };
}

test("HTML audit reports missing production requirements", () => {
  const audit = auditGeneratedHtml("<!doctype html><html lang=\"en\"><main><h1>Thin</h1></main></html>", "en");
  assert.equal(audit.passed, false);
  assert.ok(audit.issues.includes("responsive breakpoint"));
  assert.ok(audit.issues.includes("substantive page structure"));
});

test("generation returns three design contracts without building HTML", async (t) => {
  const previousFetch = globalThis.fetch;
  const previousKey = process.env.ANTHROPIC_API_KEY;
  process.env.ANTHROPIC_API_KEY = "test-key";
  const calls = [];
  globalThis.fetch = async (_url, init) => {
    const prompt = JSON.parse(init.body).messages[0].content;
    calls.push(prompt);
    const text = prompt.includes("Write a buildable design contract")
      ? JSON.stringify({ directions: [plan("A", "editorial"), plan("B", "system"), plan("C", "expressive")] })
      : validHtml(prompt.match(/DIRECTION ID: ([ABC])/)?.[1]);
    return { ok: true, json: async () => ({ content: [{ type: "text", text }] }) };
  };
  t.after(() => {
    globalThis.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = previousKey;
  });

  const result = await generateWithModel({ brief: "A focused product", language: "en" });
  assert.deepEqual(result.directions.map(({ id }) => id), ["A", "B", "C"]);
  assert.equal(calls.length, 1);
  assert.ok(result.directions.every((direction) => !direction.html));
  assert.ok(result.directions.every((direction) => direction.contract?.contentPlan.length === 5));
});

test("a failed page receives one focused repair pass", async (t) => {
  const previousFetch = globalThis.fetch;
  const previousKey = process.env.ANTHROPIC_API_KEY;
  process.env.ANTHROPIC_API_KEY = "test-key";
  let repairedA = false;
  globalThis.fetch = async (_url, init) => {
    const prompt = JSON.parse(init.body).messages[0].content;
    let text;
    if (prompt.includes("Write a buildable design contract")) {
      text = JSON.stringify({ directions: [plan("A", "editorial"), plan("B", "system"), plan("C", "expressive")] });
    } else if (prompt.includes("TASK: Repair") && prompt.includes("DIRECTION ID: A")) {
      repairedA = true;
      text = validHtml("A");
    } else {
      const id = prompt.match(/DIRECTION ID: ([ABC])/)?.[1];
      text = id === "A" ? "<!doctype html><html lang=\"en\"><main><h1>Incomplete</h1></main></html>" : validHtml(id);
    }
    return { ok: true, json: async () => ({ content: [{ type: "text", text }] }) };
  };
  t.after(() => {
    globalThis.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = previousKey;
  });

  const planned = await generateWithModel({ brief: "A focused product", language: "en" });
  const result = await buildWithModel({ brief: "A focused product", language: "en", direction: planned.directions[0] });
  assert.equal(repairedA, true);
  assert.equal(auditGeneratedHtml(result.direction.html, "en").passed, true);
  assert.equal(result.direction.verification.staticChecks.policy, 'strict');
  assert.equal(result.direction.verification.staticChecks.passed, true);
  assert.equal(result.direction.verification.status, 'unverified');
});

test('a shared warning reaches the actual model repair path and is retained if repair still fails',async t=>{
 const previousFetch=globalThis.fetch,previousKey=process.env.ANTHROPIC_API_KEY;process.env.ANTHROPIC_API_KEY='test-key';
 t.after(()=>{globalThis.fetch=previousFetch;if(previousKey===undefined)delete process.env.ANTHROPIC_API_KEY;else process.env.ANTHROPIC_API_KEY=previousKey});
 const warning=validHtml('A').replace('background:var(--paper)','background:#000');let repairSucceeds=true,repairs=[];
 globalThis.fetch=async(_url,init)=>{const prompt=JSON.parse(init.body).messages[0].content;let text;
  if(prompt.includes('Write a buildable design contract'))text=JSON.stringify({directions:[plan('A','editorial'),plan('B','system'),plan('C','expressive')]});
  else if(prompt.includes('TASK: Repair')){repairs.push(prompt);text=repairSucceeds?validHtml('A'):warning}
  else text=warning;
  return{ok:true,json:async()=>({content:[{type:'text',text}]})};
 };
 const planned=await generateWithModel({brief:'A focused product',language:'en'}),input={brief:'A focused product',language:'en',direction:planned.directions[0]},result=await buildWithModel(input);
 assert.equal(repairs.length,1);assert(repairs[0].includes('pure-black-surface'));assert.equal(result.direction.verification.staticChecks.passed,true);assert.equal(result.direction.verification.status,'unverified');
 repairSucceeds=false;await assert.rejects(buildWithModel(input),/quality_gate_failed:A:pure-black-surface/);assert.equal(repairs.length,2);
});

test('shared focus diagnostics reject suppressed focus and report runtime as unverified',()=>{
 const bad=validHtml('A').replace('outline:3px solid currentColor','outline:none');
 const audit=auditGeneratedHtml(bad);assert.equal(audit.passed,false);assert.ok(audit.findings.some(f=>f.rule==='focus-visible-suppressed'));
 assert.equal(audit.scope,'static-only');assert.equal(audit.runtime.status,'unverified');assert.equal('score' in audit,false);
});

test('online static readiness matches actual strict CLI findings and gate on identical sanitized inputs',t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'variant-static-parity-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const helper=fileURLToPath(new URL('../../scripts/quality-gate.mjs',import.meta.url));
 const cases=[
  ['surface-warning',validHtml('A').replace('background:var(--paper)','background:#000'),false],
  ['valid',validHtml('A'),true],
  ['suppressed-focus',validHtml('A').replace('outline:3px solid currentColor','outline:none'),false],
  ['copy-warning',validHtml('A').replace('</main>','<p>Something went wrong</p></main>'),false],
  ['image-error',validHtml('A').replace('</main>','<img src="mark.svg"></main>'),false],
  ['review-only',validHtml('A').replace('</main>','<p class="kicker">Direction B · Room to grow</p></main>'),true],
  ['sanitized-script',validHtml('A').replace('</main>','<script>requestAnimationFrame(tick)</script></main>'),true]
 ];
 const normalize=list=>list.map(({file,...finding})=>finding);
 for(const [name,input,passed]of cases){
  const audit=auditGeneratedHtml(input),file=path.join(root,name+'.html');fs.writeFileSync(file,audit.html);
  const cli=spawnSync(process.execPath,[helper,file,'--strict','--json'],{encoding:'utf8'});assert.equal(cli.error,undefined);const report=JSON.parse(cli.stdout);
  assert.equal(audit.passed,passed,name);assert.equal(cli.status,passed?0:1,name);
  assert.deepEqual(normalize(audit.findings),normalize(report.findings),name);
  assert.deepEqual(audit.staticChecks,{policy:report.policy,passed:report.passed,errors:report.errors,warnings:report.warnings,reviews:report.reviews},name);
  assert.equal(report.policy,'strict');assert.equal(report.passed,passed);assert.equal(audit.scope,'static-only');assert.equal(audit.runtime.status,'unverified');assert.equal('score' in audit,false);
  if(name==='review-only')assert(report.reviews>0);
  if(name==='sanitized-script')assert(!audit.html.includes('<script>'));
  if(name==='surface-warning'){
   assert.equal(report.errors,0);assert(report.warnings>0);assert(audit.issues.includes('pure-black-surface'));
   const loose=spawnSync(process.execPath,[helper,file,'--json'],{encoding:'utf8'}),looseReport=JSON.parse(loose.stdout);assert.equal(loose.status,0);assert.equal(looseReport.policy,'errors-only');assert.equal(looseReport.passed,true);
  }
 }
});

test('online document requirements stay separate from passing shared static rules',()=>{
 const thin='<!doctype html><html lang="en"><main><h1>Review</h1></main></html>',audit=auditGeneratedHtml(thin);
 assert.equal(audit.staticChecks.passed,true);assert.equal(audit.passed,false);assert(audit.issues.includes('viewport metadata'));assert.equal(audit.runtime.status,'unverified');
});
