import {test,expect} from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import {createServer} from 'vite';
import {inspirationPlugin} from '../website/scripts/inspiration-split.mjs';
// Accounts on (src/account.ts): the inspiration page built with a Supabase project configured, against a stand-in for
// @supabase/supabase-js that keeps its session and its one table in localStorage. Google sign-in returns with ?code=, as
// the real redirect does. Nothing here reaches Supabase or Google.
const fixtureDir=path.resolve('.accounts-site');
const fake=`
const db=()=>JSON.parse(localStorage.getItem('fake-db')||'{}'),saveDb=d=>localStorage.setItem('fake-db',JSON.stringify(d));
const token='sb-fake-auth-token',user={id:'user-1',email:'reader@example.test',user_metadata:{full_name:'Reader'}};
const session=()=>localStorage.getItem(token)?{user}:null;
export function createClient(url,key){
  if(!url||!key)throw new Error('not configured');
  const listeners=[];const emit=()=>listeners.forEach(fn=>fn('SIGNED_IN',session()));
  return {
    auth:{
      getSession:async()=>({data:{session:session()}}),
      onAuthStateChange:fn=>{listeners.push(fn);return {data:{subscription:{unsubscribe(){}}}}},
      signInWithOAuth:async({provider,options})=>{localStorage.setItem('fake-last-provider',provider);localStorage.setItem(token,'1');const u=new URL(options.redirectTo);u.searchParams.set('code','fake');location.assign(u.href);return {error:null}},
      signInWithOtp:async({email,options})=>{localStorage.setItem('fake-last-otp',JSON.stringify({email,redirect:options.emailRedirectTo}));return {error:null}},
      signOut:async()=>{localStorage.removeItem(token);listeners.forEach(fn=>fn('SIGNED_OUT',null));return {error:null}},
    },
    from:()=>({
      select:()=>({eq:(_c,id)=>({maybeSingle:async()=>({data:db()[id]?{selection:db()[id]}:null,error:null})})}),
      upsert:async row=>{if(localStorage.getItem('fake-fail-writes'))return {error:{message:'offline'}};const d=db();d[row.user_id]=row.selection;saveDb(d);return {error:null}},
    }),
    rpc:async name=>{localStorage.setItem('fake-rpc',name);const d=db();delete d[user.id];saveDb(d);return {error:null}},
  };
}`;
let server,base;
test.beforeAll(async()=>{const dir=fixtureDir;fs.rmSync(dir,{recursive:true,force:true});fs.mkdirSync(path.join(dir,'src'),{recursive:true});fs.cpSync('../website/src',path.join(dir,'src'),{recursive:true});const modules=path.join(dir,'node_modules');if(!fs.existsSync(modules))fs.symlinkSync(path.resolve('../website/node_modules'),modules,'dir');
 fs.writeFileSync(path.join(dir,'fake-supabase.js'),fake);
 fs.writeFileSync(path.join(dir,'index.html'),'<html><head><meta name="description" content="Fixture"></head><body style="margin:0"><div id="root"></div><script type="module" src="/main.tsx"></script></body></html>');
 fs.writeFileSync(path.join(dir,'main.tsx'),`import {createRoot} from 'react-dom/client';import './src/site-styles';import {InspirationPage} from './src/InspirationPage';import {LocaleProvider} from './src/i18n/LocaleProvider';import {parseLocale} from './src/i18n/locale-route';const p=parseLocale(location.pathname);createRoot(document.getElementById('root')!).render(<LocaleProvider locale={p.locale} route={p.route}><InspirationPage detail={p.route==='/'?undefined:p.route.split('/')[2]}/></LocaleProvider>);`);
 server=await createServer({root:dir,configFile:false,plugins:[inspirationPlugin()],esbuild:{jsx:'automatic'},resolve:{alias:{'@supabase/supabase-js':path.join(dir,'fake-supabase.js')}},
  define:{__SHOW_TRANSLATION_DRAFTS__:'true',__SHOW_CASES__:'true',__SUPABASE__:JSON.stringify({url:'https://fake.supabase.test',key:'public-anon-key'})},server:{host:'127.0.0.1',port:0,fs:{allow:[dir,path.resolve('../website/node_modules')]}}});
 await server.listen();base=`http://127.0.0.1:${server.httpServer.address().port}`;
});
test.afterAll(async()=>{await server?.close();fs.rmSync(fixtureDir,{recursive:true,force:true})});
test.beforeEach(async({page})=>{await page.route(/^https:\/\//,r=>r.abort())});
const firstCard=page=>page.locator('.insp-feed>.insp-card').first();
const cardId=async page=>(await firstCard(page).locator('.insp-card-open').getAttribute('href')).split('/').pop();
const store=(page,key)=>page.evaluate(k=>localStorage.getItem(k),key);

test('signed out, saving a reference asks for sign-in and nothing is saved', async ({page})=>{
 await page.goto(base+'/');const header=page.locator('.site-nav .site-account');await expect(header).toHaveText('登录');
 await firstCard(page).locator('.insp-card-save').click();
 const dialog=page.getByRole('dialog',{name:'登录 Variant Design'});await expect(dialog).toBeVisible();
 await expect(dialog).toContainText('登录后就能收藏这条参考');await expect(dialog.getByRole('button',{name:'使用 Google 登录'})).toBeVisible();
 await expect(dialog).toContainText('只保存你的邮箱');
 await page.keyboard.press('Escape');await expect(dialog).toBeHidden();
 expect(await store(page,'variant-account-pending'),'a dismissed dialog does not resume the save later').toBeNull();
 await expect(page.locator('.inspiration-pack')).toHaveCount(0);expect(await store(page,'variant-inspiration-pack-v1')).toBeNull();
});

test('signing in with Google saves the reference that asked for it and cleans the address', async ({page})=>{
 await page.goto(base+'/');const id=await cardId(page);
 await firstCard(page).locator('.insp-card-save').click();
 await page.getByRole('button',{name:'使用 Google 登录'}).click();
 await expect(page.locator('.site-nav .site-account')).toHaveAttribute('aria-label','账号: reader@example.test');
 await expect(page).toHaveURL(base+'/');expect(await store(page,'fake-last-provider')).toBe('google');
 await expect(firstCard(page).locator('.insp-card-save')).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('.inspiration-pack')).toContainText('保存在你的账号里');
 expect(JSON.parse(await store(page,'fake-db'))['user-1']).toEqual({[id]:{use:'',avoid:''}});
});

test('the first sign-in imports the pack this browser saved before, notes included, then clears it', async ({page})=>{
 await page.goto(base+'/');const id=await cardId(page);
 await page.evaluate(id=>localStorage.setItem('variant-inspiration-pack-v1',JSON.stringify({[id]:{use:'Study the rhythm',avoid:''}})),id);
 await page.reload();await expect(page.locator('.inspiration-pack')).toHaveCount(0);
 await page.locator('.site-nav .site-account').click();await page.getByRole('button',{name:'使用 Google 登录'}).click();
 await expect(page.locator('.inspiration-pack textarea').first()).toHaveValue('Study the rhythm');
 await expect.poll(()=>store(page,'variant-inspiration-pack-v1')).toBeNull();
 expect(JSON.parse(await store(page,'fake-db'))['user-1']).toEqual({[id]:{use:'Study the rhythm',avoid:''}});
});

test('signed in, changes are written to the account and a failed write says so', async ({page})=>{
 await page.goto(base+'/');await page.evaluate(()=>localStorage.setItem('sb-fake-auth-token','1'));await page.reload();
 const id=await cardId(page);await firstCard(page).locator('.insp-card-save').click();
 await expect.poll(async()=>JSON.parse(await store(page,'fake-db')||'{}')['user-1']).toEqual({[id]:{use:'',avoid:''}});
 await page.evaluate(()=>localStorage.setItem('fake-fail-writes','1'));
 await page.locator('.inspiration-pack textarea').first().fill('A note');
 await expect(page.getByRole('alert').filter({hasText:'没能把收藏保存到账号'})).toBeVisible();
});

test('the email link is sent to the address given, and briefs ask for sign-in too', async ({page})=>{
 await page.goto(base+'/');await page.locator('.site-nav .site-account').click();
 const dialog=page.getByRole('dialog');await dialog.getByLabel('邮箱').fill('reader@example.test');await dialog.getByRole('button',{name:'发送登录链接'}).click();
 await expect(dialog.getByRole('status')).toContainText('登录链接已发到 reader@example.test');
 expect(JSON.parse(await store(page,'fake-last-otp'))).toEqual({email:'reader@example.test',redirect:base+'/'});
 await dialog.getByRole('button',{name:'关闭'}).click();
 await firstCard(page).locator('.insp-card-open').click();
 await page.getByRole('button',{name:'生成参考指令'}).click();
 await expect(page.getByRole('dialog',{name:'登录 Variant Design'})).toContainText('登录后就能生成参考指令');
});

test('the account menu signs out and deletes the account', async ({page})=>{
 await page.goto(base+'/');await page.evaluate(()=>localStorage.setItem('sb-fake-auth-token','1'));await page.reload();
 const menu=page.locator('.site-nav .site-account');await menu.click();
 await expect(page.locator('.site-account-panel')).toContainText('reader@example.test');
 await page.getByRole('button',{name:'退出登录'}).click();await expect(menu).toHaveText('登录');
 await page.evaluate(()=>localStorage.setItem('sb-fake-auth-token','1'));await page.reload();
 await page.locator('.site-nav .site-account').click();await page.getByRole('button',{name:'删除账号'}).click();
 await expect(page.locator('.site-account-panel')).toContainText('不能恢复');
 await page.getByRole('button',{name:'确认删除账号和全部收藏'}).click();
 await expect(page.locator('.site-nav .site-account')).toHaveText('登录');expect(await store(page,'fake-rpc')).toBe('delete_my_account');
});
