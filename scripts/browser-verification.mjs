// Uses the caller's Playwright Page; no bundled browser or project dependency changes.
import { verifyArtifact } from './artifact-verification.mjs';

const ids = ['brand','keyboard-focus','reduced-motion','scope-preservation'];
const sample = async (page, assertions) => Promise.all(assertions.map(async rule => {
  const element = page.locator(rule.selector);
  if (await element.count() !== 1) return { ...rule, actual:null, matches:false };
  const actual = rule.property === 'text' ? await element.textContent() : await element.evaluate((el, property) => getComputedStyle(el).getPropertyValue(property), rule.property);
  return { ...rule, actual, matches:actual === rule.expected };
}));
function validateAssertions(rules) {
  if (!Array.isArray(rules) || !rules.length || rules.some(r=>!r.selector || !r.property || typeof r.expected !== 'string')) throw new Error('Assertions need selector, property and expected text.');
}
function bounded(value, fallback, max) {
  const result=value??fallback;
  if (!Number.isInteger(result) || result<1 || result>max) throw new Error(`Expected an integer from 1 to ${max}.`);
  return result;
}

// The caller must rebuild/confirm its preview in ready() within this callback. A URL alone
// cannot prove the server is displaying the source revision that verifyArtifact captured.
export async function verifyInBrowser(root, id, options, adapter) {
  const plan = options.plan ?? {};
  return verifyArtifact(root,id,options,async()=>{
    const results=[];
    if (!adapter?.page || !adapter?.version || typeof adapter.ready !== 'function') return [];
    const {page}=adapter;
    const tool={name:'Playwright browser adapter',version:adapter.version};
    const environment={url:plan.url,viewport:page.viewportSize(),scope:'Declared selectors and interactions only'};
    const check=async(id,run)=>{
      if (!plan[id]) return;
      try {
        const evidence=await run(plan[id]);
        results.push({id,status:evidence.every(e=>e.matches)?'passed':'failed',reason:'Compared observed results with the explicit check plan.',tool,environment,evidence});
      } catch(error) { results.push({id,status:'unverified',reason:`Check could not finish: ${error.message}`}); }
    };
    const open=async()=>{await page.goto(plan.url);await adapter.ready(page);};
    await open();
    await check('brand',async rules=>{validateAssertions(rules);return sample(page,rules);});
    await check('keyboard-focus',async rules=>{
      if (!Array.isArray(rules) || !rules.length) throw new Error('Name the controls to reach by keyboard.');
      const evidence=[];
      for (const rule of rules) {
        await open();
        const target=page.locator(rule.selector);
        if (await target.count() !== 1) throw new Error(`Expected one control: ${rule.selector}`);
        const style=()=>target.evaluate(el=>{const c=getComputedStyle(el);return {outlineStyle:c.outlineStyle,outlineWidth:parseFloat(c.outlineWidth),outlineColor:c.outlineColor,boxShadow:c.boxShadow,backgroundColor:c.backgroundColor};});
        const before=await style();
        let focused=false;
        for(let i=0;i<bounded(rule.maxTabs,40,500);i++) {await page.keyboard.press('Tab');focused=await target.evaluate(el=>el===document.activeElement);if(focused)break;}
        const after=await style(),visible=await target.isVisible();
        const outline=after.outlineStyle!=='none'&&after.outlineWidth>0&&after.outlineColor!=='rgba(0, 0, 0, 0)'&&['outlineStyle','outlineWidth','outlineColor'].some(key=>before[key]!==after[key]);
        // Alternatives are explicitly specified and compared with the unfocused state;
        // an always-present shadow/background must not qualify as a focus indicator.
        const alternative=rule.indicator && ['boxShadow','backgroundColor'].includes(rule.indicator.property)
          && after[rule.indicator.property]===rule.indicator.expected && before[rule.indicator.property]!==after[rule.indicator.property]
          && !['none','transparent','rgba(0, 0, 0, 0)'].includes(rule.indicator.expected);
        evidence.push({selector:rule.selector,focused,visible,before,after,matches:!!(focused&&visible&&(outline||alternative))});
      }
      return evidence;
    });
    await check('reduced-motion',async config=>{
      validateAssertions(config.settled);
      if (typeof adapter.startMotion !== 'function') throw new Error('Supply startMotion(page) to exercise the actual animation.');
      const evidence=[];
      try {
        // Install before navigation to observe application RAF callbacks, including JS loops.
        await page.addInitScript(()=>{window.__variantFrames=0;const original=window.requestAnimationFrame;window.requestAnimationFrame=callback=>original(time=>{window.__variantFrames++;callback(time);});});
        const observe=async phase=>{
          await page.waitForTimeout(bounded(config.settleMs,100,10000));
          const first=await page.evaluate(()=>window.__variantFrames);
          const state=await sample(page,config.settled);
          await page.waitForTimeout(bounded(config.sampleMs,150,10000));
          const last=await page.evaluate(()=>window.__variantFrames);
          const final=await sample(page,config.settled);
          evidence.push({phase,frames:last-first,matches:last===first&&state.every(x=>x.matches)&&final.every(x=>x.matches),state,final});
        };
        await page.emulateMedia({reducedMotion:'reduce'});await open();await adapter.startMotion(page);await observe('initial-reduce');
        await page.emulateMedia({reducedMotion:'no-preference'});await open();await adapter.startMotion(page);
        await page.waitForTimeout(bounded(config.startMs,50,10000));
        await page.emulateMedia({reducedMotion:'reduce'});await observe('switched-to-reduce');
      } finally { await page.emulateMedia({reducedMotion:null}); }
      return evidence;
    });
    await check('scope-preservation',async rules=>{
      validateAssertions(rules);
      if (typeof adapter.exerciseScope !== 'function') throw new Error('Supply exerciseScope(page) for non-target interactions.');
      await open();await adapter.exerciseScope(page);return sample(page,rules);
    });
    if (adapter.projectChecks) results.push(await adapter.projectChecks());
    return results;
  });
}

export function verificationPlan(url) {
  // Deliberately empty until the project's task and brand constraints supply expectations.
  return {url,...Object.fromEntries(ids.map(id=>[id,null]))};
}
