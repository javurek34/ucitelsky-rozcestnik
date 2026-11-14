const COOKIE='__Host-rozcestnik_session';
const SESSION_SECONDS=7*24*60*60;
const encoder=new TextEncoder();
const noStore={'Cache-Control':'private, no-store, max-age=0','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','X-Frame-Options':'DENY','X-Robots-Tag':'noindex, nofollow, noarchive'};
const base64url=bytes=>btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
function decode64(value){if(!/^[A-Za-z0-9_-]+$/.test(value))throw Error('Invalid encoding');return Uint8Array.from(atob(value.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));}
const digest=value=>crypto.subtle.digest('SHA-256',encoder.encode(value));
async function signingKey(env){const material=await digest(env.SESSION_SECRET+'\0'+env.SITE_PASSWORD);return crypto.subtle.importKey('raw',material,{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);}
async function samePassword(a,b){const [first,second]=await Promise.all([digest(a),digest(b)]);const left=new Uint8Array(first),right=new Uint8Array(second);let diff=0;for(let i=0;i<left.length;i++)diff|=left[i]^right[i];return diff===0;}
async function makeSession(env){const payload=base64url(encoder.encode(JSON.stringify({v:1,expires:Math.floor(Date.now()/1000)+SESSION_SECONDS})));const signature=await crypto.subtle.sign('HMAC',await signingKey(env),encoder.encode(payload));return payload+'.'+base64url(signature);}
async function hasSession(request,env){
 try{
  const value=(request.headers.get('Cookie')||'').split(';').map(part=>part.trim()).find(part=>part.startsWith(COOKIE+'='))?.slice(COOKIE.length+1);
  if(!value||value.length>1024)return false;
  const pieces=value.split('.');if(pieces.length!==2)return false;
  const [payload,signature]=pieces;
  if(!await crypto.subtle.verify('HMAC',await signingKey(env),decode64(signature),encoder.encode(payload)))return false;
  const data=JSON.parse(new TextDecoder().decode(decode64(payload)));const now=Math.floor(Date.now()/1000);
  return data.v===1&&Number.isSafeInteger(data.expires)&&data.expires>now&&data.expires<=now+SESSION_SECONDS;
 }catch{return false;}
}
function redirect(path,cookie){const headers=new Headers(noStore);headers.set('Location',path);if(cookie)headers.set('Set-Cookie',cookie);return new Response(null,{status:303,headers});}
function page(message='',status=200,unavailable=false){
 const nonce=base64url(crypto.getRandomValues(new Uint8Array(18)));
 const text=unavailable?'Přístup zatím není nastavený. Obraťte se prosím na správce rozcestníku.':'Pro vstup zadejte společné heslo pro zaměstnance školy.';
 const safeMessage=message.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const html=`<!doctype html><html lang="cs"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="theme-color" content="#F3F5F7"><title>Přihlášení · Učitelský rozcestník</title><style nonce="${nonce}">
*{box-sizing:border-box}body{margin:0;min-height:100svh;display:grid;place-items:center;padding:24px;background:#F3F5F7;color:#20285A;font-family:'greycliff-cf',system-ui,sans-serif}.login{width:100%;max-width:440px;padding:32px;border:1px solid #fff;border-radius:16px;background:linear-gradient(135deg,#ffffffd9,#ffffff80);box-shadow:0 4px 12px #091f5b18}.eyebrow{margin:0 0 12px;font-size:14px;color:#64617A}h1{font-size:28px;line-height:1.2;margin:0 0 16px}p{line-height:1.6;margin:0 0 24px}label{display:block;font-weight:700;margin-bottom:8px}input,button{width:100%;min-height:48px;padding:12px 16px;border-radius:8px;font:inherit}input{border:1px solid #8c98b0;background:#fff;color:#1d2033}button{margin-top:16px;border:1px solid #ffffff30;background:#091F5B;color:#F8F7F4;font-weight:700;cursor:pointer}button:hover{background:#102D78}input:focus-visible,button:focus-visible{outline:3px solid #4B9CD3;outline-offset:4px}.error{margin:16px 0 0;color:#BC162C;font-weight:600}.note{font-size:13px;margin:24px 0 0;color:#64617A}@media(prefers-color-scheme:dark){body{background:#1A1A1D;color:#F8F7F4}.login{background:linear-gradient(to bottom right,#17272D,#0B1215);border-color:#ffffff1f}.eyebrow,.note{color:#BFC7CC}input{background:#0B1215;border-color:#7b8b94;color:#F8F7F4}.error{color:#FF8898}}@media(max-width:399px){.login{padding:24px}}
</style></head><body><main class="login"><p class="eyebrow">ZŠ Kaplického</p><h1>Učitelský rozcestník</h1><p>${text}</p>${unavailable?'':`<form method="post" action="/__auth/login"><label for="password">Heslo pro zaměstnance</label><input id="password" name="password" type="password" autocomplete="current-password" required maxlength="256"${message?' aria-describedby="login-error"':''}><button type="submit">Přihlásit se</button></form>`}${safeMessage?`<p class="error" id="login-error" role="alert">${safeMessage}</p>`:''}<p class="note">Přístup je určen zaměstnancům školy.</p></main></body></html>`;
 const headers=new Headers(noStore);headers.set('Content-Type','text/html; charset=utf-8');headers.set('Content-Security-Policy',`default-src 'none'; style-src 'nonce-${nonce}'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'`);return new Response(html,{status,headers});
}
async function readSmallForm(request){
 if(!request.body)return new URLSearchParams();
 const reader=request.body.getReader();let size=0,text='';const decoder=new TextDecoder();
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>4096){await reader.cancel();throw Error('Body too large');}text+=decoder.decode(value,{stream:true});}
 text+=decoder.decode();return new URLSearchParams(text);
}
function configured(env){return typeof env.SITE_PASSWORD==='string'&&env.SITE_PASSWORD.length>=12&&typeof env.SESSION_SECRET==='string'&&env.SESSION_SECRET.length>=32;}
export default {
 async fetch(request,env){
  const url=new URL(request.url),method=request.method;
  // No configuration means no access, including assets and preview URLs.
  if(!configured(env))return page('',503,true);
  if(url.pathname==='/__auth/login'&&method==='GET')return page();
  if(url.pathname==='/__auth/login'&&method==='POST'){
   if(request.headers.get('Origin')!==url.origin)return new Response('Forbidden',{status:403,headers:noStore});
   if(!request.headers.get('Content-Type')?.startsWith('application/x-www-form-urlencoded'))return new Response('Unsupported content type',{status:415,headers:noStore});
   if(!env.LOGIN_RATE_LIMITER?.limit)return page('',503,true);
   const ip=request.headers.get('CF-Connecting-IP')||'local-preview';const key=base64url(await digest(ip));
   let allowed;try{allowed=await env.LOGIN_RATE_LIMITER.limit({key});}catch{return page('',503,true);}
   if(!allowed.success){const response=page('Příliš mnoho pokusů. Zkuste to prosím za minutu.',429);response.headers.set('Retry-After','60');return response;}
   let form;try{form=await readSmallForm(request);}catch{return new Response('Request too large',{status:413,headers:noStore});}
   const password=form.get('password')||'';
   if(!password||password.length>256||!await samePassword(password,env.SITE_PASSWORD))return page('Heslo není správné. Zkuste to znovu.',401);
   return redirect('/',`${COOKIE}=${await makeSession(env)}; Path=/; Max-Age=${SESSION_SECONDS}; HttpOnly; Secure; SameSite=Lax`);
  }
  if(url.pathname==='/__auth/logout'&&method==='POST'){
   if(request.headers.get('Origin')!==url.origin)return new Response('Forbidden',{status:403,headers:noStore});
   return redirect('/__auth/login',`${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`);
  }
  if(method!=='GET'&&method!=='HEAD')return new Response('Method not allowed',{status:405,headers:{...noStore,Allow:'GET, HEAD'}});
  if(!await hasSession(request,env)){
   if(url.pathname==='/')return method==='HEAD'?new Response(null,{headers:{...noStore,'Content-Type':'text/html; charset=utf-8'}}):page();
   // Do not return login HTML as a JS/image response; no protected bytes escape.
   return new Response(null,{status:303,headers:{...noStore,Location:'/__auth/login'}});
  }
  const response=await env.ASSETS.fetch(request);const headers=new Headers(response.headers);
  for(const [key,value] of Object.entries(noStore))headers.set(key,value);
  headers.set('Content-Security-Policy',"frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
  return new Response(method==='HEAD'?null:response.body,{status:response.status,statusText:response.statusText,headers});
 }
};
