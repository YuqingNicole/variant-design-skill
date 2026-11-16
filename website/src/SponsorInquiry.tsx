import { useState, type FormEvent } from 'react';
import { t, type Localized } from './i18n/localized';
import { useLocale } from './i18n/LocaleProvider';
import { localePath } from './i18n/locale-route';
import { sendInquiry } from './sponsor-inquiry';
const m={
 brand:{zh:'品牌',en:'Brand'},
 name:{zh:'你的名字（可不填）',en:'Your name (optional)'},
 email:{zh:'回复邮箱',en:'Email for our reply'},
 url:{zh:'想介绍的产品网址',en:'Product URL'},
 message:{zh:'想怎么合作、希望的时间',en:'What you have in mind, and when'},
 send:{zh:'发送咨询',en:'Send inquiry'},
 sending:{zh:'正在发送…',en:'Sending…'},
 sent:{zh:'已收到。我们会用你留的邮箱回复。',en:'Received. We will reply to the email you gave.'},
 failed:{zh:'没有发送成功。可以稍后再试，或者在 GitHub 上开一个赞助咨询 Issue。',en:'That did not go through. Try again later, or open a sponsorship inquiry on GitHub.'},
 github:{zh:'在 GitHub 上咨询',en:'Ask on GitHub'},
 note:{zh:'填写的内容只用来回复这次咨询，不公开。',en:'What you send is used only to reply to this inquiry and is not published.'},
 privacy:{zh:'隐私说明',en:'Privacy'},
} satisfies Record<string,Localized>;
export function SponsorInquiry({github}:{github:string}){
 const language=useLocale(),l=(k:keyof typeof m)=>t(m[k],language);
 const [status,setStatus]=useState<'idle'|'sending'|'sent'|'failed'>('idle');
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(status==='sending')return;
  const data=new FormData(event.currentTarget),get=(k:string)=>String(data.get(k)??'').trim();
  // A hidden field people never see; scripts that fill every field get a quiet "received" and nothing is stored.
  if(get('website')){setStatus('sent');return}
  setStatus('sending');
  try{await sendInquiry({brand:get('brand'),contact_name:get('name'),email:get('email'),product_url:get('url'),message:get('message'),language});setStatus('sent')}
  catch{setStatus('failed')}
 };
 if(status==='sent')return <p className="sponsor-inquiry-done" role="status">{l('sent')}</p>;
 const field=(name:string,label:keyof typeof m,type='text',max=200,required=true)=><label htmlFor={`sponsor-${name}`}><span>{l(label)}</span><input id={`sponsor-${name}`} name={name} type={type} maxLength={max} required={required} autoComplete={name==='email'?'email':name==='name'?'name':name==='brand'?'organization':'off'}/></label>;
 return <form className="submission-intake sponsor-inquiry" onSubmit={submit} aria-label={l('send')}>
  <div className="submission-fields">
   {field('brand','brand')}{field('name','name','text',200,false)}{field('email','email','email',320)}{field('url','url','url',2000)}
   <label htmlFor="sponsor-message" className="sponsor-inquiry-wide"><span>{l('message')}</span><textarea id="sponsor-message" name="message" required maxLength={4000}/></label>
   <label className="sponsor-inquiry-trap" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off"/></label>
  </div>
  <p className="submission-note">{l('note')} <a href={localePath('/privacy',language)}>{l('privacy')}</a></p>
  {status==='failed'&&<p role="alert">{l('failed')} <a href={github} target="_blank" rel="noreferrer">{l('github')}</a></p>}
  <div className="submission-actions"><button type="submit" disabled={status==='sending'}>{l(status==='sending'?'sending':'send')}</button></div>
 </form>;
}
