const PREFIX='/kapli/api/schranka';
const COOKIE='__Host-rozcestnik_trust_admin';
const ADMIN_SECONDS=2*60*60;
const alphabet='0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const encoder=new TextEncoder();
const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store, max-age=0','X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','X-Robots-Tag':'noindex, nofollow, noarchive'};
const encode=bytes=>btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const decode=value=>Uint8Array.from(atob(value.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
const sha=async value=>encode(await crypto.subtle.digest('SHA-256',encoder.encode(value)));
const reply=(data,status=200,extra={})=>new Response(JSON.stringify(data),{status,headers:{...headers,...extra}});
export const clearTrustAdminCookie=()=>`${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`;
function unavailableReason(env){
 if(!env.TRUST_INBOX)return 'Správce musí připojit úložiště schránky v Cloudflare.';
 if(!env.TRUST_RATE_LIMITER)return 'Správce musí dokončit nastavení ochrany schránky v Cloudflare.';
 if(typeof env.TRUST_ADMIN_PASSWORD!=='string'||env.TRUST_ADMIN_PASSWORD.length<16||env.TRUST_ADMIN_PASSWORD===env.SITE_PASSWORD)return 'Správce musí nastavit samostatné heslo pro pověřený tým schránky (alespoň 16 znaků, jiné než heslo rozcestníku).';
 return '';
}
const configured=env=>!unavailableReason(env);
async function key(env,purpose){
 const material=await crypto.subtle.digest('SHA-256',encoder.encode(env.SESSION_SECRET+'\0'+purpose+(purpose==='session'?'\0'+env.TRUST_ADMIN_PASSWORD:'')));
 return crypto.subtle.importKey('raw',material,{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);
}
async function samePassword(first,second){const a=await sha(first),b=await sha(second);let diff=a.length^b.length;for(let i=0;i<Math.max(a.length,b.length);i++)diff|=(a.charCodeAt(i)||0)^(b.charCodeAt(i)||0);return diff===0;}
async function adminCookie(env){const payload=encode(encoder.encode(JSON.stringify({scope:'trust-admin',expires:Math.floor(Date.now()/1000)+ADMIN_SECONDS})));const signature=encode(await crypto.subtle.sign('HMAC',await key(env,'session'),encoder.encode(payload)));return `${COOKIE}=${payload}.${signature}; Path=/; HttpOnly; Secure; SameSite=Strict`;}
async function adminSession(request,env){
 try{
  const value=(request.headers.get('Cookie')||'').split(';').map(c=>c.trim()).find(c=>c.startsWith(COOKIE+'='))?.slice(COOKIE.length+1);
  if(!value||value.length>1024)return false;
  const [payload,signature,...rest]=value.split('.');if(rest.length||!payload||!signature)return false;
  if(!await crypto.subtle.verify('HMAC',await key(env,'session'),decode(signature),encoder.encode(payload)))return false;
  const data=JSON.parse(new TextDecoder().decode(decode(payload))),now=Math.floor(Date.now()/1000);
  return data.scope==='trust-admin'&&Number.isSafeInteger(data.expires)&&data.expires>now&&data.expires<=now+ADMIN_SECONDS;
 }catch{return false;}
}
async function body(request){
 const reader=request.body?.getReader();if(!reader)throw Error('empty');let bytes=0,text='';const decoder=new TextDecoder();
 while(true){const part=await reader.read();if(part.done)break;bytes+=part.value.byteLength;if(bytes>32768){await reader.cancel();throw Error('large');}text+=decoder.decode(part.value,{stream:true});}
 const value=JSON.parse(text+decoder.decode());if(!value||typeof value!=='object'||Array.isArray(value))throw Error('invalid');return value;
}
const text=(value,min,max)=>typeof value==='string'&&value.trim().length>=min&&value.trim().length<=max?value.trim():null;
const code=value=>typeof value==='string'?value.toUpperCase().replace(/[\s-]/g,''):'';
const validCode=value=>value.length===32&&[...value].every(char=>alphabet.includes(char));
const uuid=value=>typeof value==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
async function accessCode(env,submissionId){
 const bytes=new Uint8Array(await crypto.subtle.sign('HMAC',await key(env,'receipt'),encoder.encode(submissionId)));
 // 160 random-looking bits; kept out of URLs, logs and the stored case record.
 let bits=0,value=0,result='';for(const byte of bytes.slice(0,20)){value=(value<<8)|byte;bits+=8;while(bits>=5){bits-=5;result+=alphabet[(value>>>bits)&31];}}
 return result;
}
async function stored(env,operation,input){
 const stub=env.TRUST_INBOX.get(env.TRUST_INBOX.idFromName('kaplickeho-teacher-trust'));
 const response=await stub.fetch(new Request('https://trust.internal/'+operation,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)}));
 const result=await response.json();
 if(result.conversation&&Object.hasOwn(result.conversation,'receipt_id')){
  const receiptId=result.conversation.receipt_id;delete result.conversation.receipt_id;
  result.conversation.accessCode=receiptId?(await accessCode(env,receiptId)).match(/.{4}/g).join('-'):null;
 }
 return reply(result,response.status);
}
export async function handleTrustRequest(request,env){
 const url=new URL(request.url);if(!url.pathname.startsWith(PREFIX+'/'))return null;
 const route=url.pathname.slice(PREFIX.length),method=request.method;
 if(route==='/status'&&method==='GET')return reply({ready:configured(env),admin:configured(env)&&await adminSession(request,env),message:unavailableReason(env)});
 if(!configured(env))return reply({error:'Schránka se právě připravuje. Zatím sem žádné zprávy neodesílejte.'},503);
 if(!['GET','POST'].includes(method))return reply({error:'Nepovolený požadavek.'},405,{Allow:'GET, POST'});
 if(method==='POST'){
  if(request.headers.get('Origin')!==url.origin)return reply({error:'Požadavek musí pocházet ze školního rozcestníku.'},403);
  if(request.headers.get('Content-Type')?.split(';')[0].trim()!=='application/json')return reply({error:'Nepodporovaný formát požadavku.'},415);
 }
 // Limit guesses and submissions without persisting IP addresses with messages.
 try{const allowed=await env.TRUST_RATE_LIMITER.limit({key:route+':'+await sha(request.headers.get('CF-Connecting-IP')||'local-preview')});if(!allowed.success)return reply({error:'Příliš mnoho požadavků. Zkuste to prosím za minutu.'},429,{'Retry-After':'60'});}catch{return reply({error:'Schránka je dočasně nedostupná. Zkuste to prosím později.'},503);}
 const adminRoute=route.startsWith('/admin/');
 if(adminRoute&&route!=='/admin/login'&&!await adminSession(request,env))return reply({error:'Nejdříve se přihlaste do správy schránky.'},401);
 let input={};if(method==='POST'){try{input=await body(request);}catch{return reply({error:'Zpráva není platná nebo je příliš dlouhá.'},400);}}
 try{
  if(route==='/admin/login'&&method==='POST'){
   if(!text(input.password,1,256)||!await samePassword(input.password,env.TRUST_ADMIN_PASSWORD))return reply({error:'Heslo pro správu schránky není správné.'},401);
   return reply({ok:true},200,{'Set-Cookie':await adminCookie(env)});
  }
  if(route==='/admin/logout'&&method==='POST')return reply({ok:true},200,{'Set-Cookie':clearTrustAdminCookie()});
  if(route==='/create'&&method==='POST'){
   const message=text(input.message,10,6000),subject=text(input.subject,0,120),contact=text(input.contact,0,200);
   if(!message||subject===null||contact===null||!['advice','concern','conflict'].includes(input.kind)||!['written','meeting','unsure'].includes(input.preference)||!uuid(input.submissionId)||!Array.isArray(input.participants)||input.participants.length>2||!input.participants.every(p=>['leadership','spp'].includes(p)))return reply({error:'Zkontrolujte prosím vyplněné údaje. Zpráva má mít alespoň 10 a nejvýše 6 000 znaků.'},400);
   const raw=await accessCode(env,input.submissionId),response=await stored(env,'create',{kind:input.kind,subject:subject||({advice:'Žádost o radu',concern:'Podnět k řešení',conflict:'Pomoc s konfliktem'}[input.kind]),message,preference:input.preference,participants:[...new Set(input.participants)],contact,submissionHash:await sha(input.submissionId),codeHash:await sha(raw),receiptId:input.submissionId});
   const result=await response.json();if(response.ok)return reply({id:result.id,code:raw.match(/.{4}/g).join('-')},response.status);return reply(result,response.status);
  }
  if(['/conversation','/conversation/reply'].includes(route)&&method==='POST'){
   const normalized=code(input.code);if(!validCode(normalized))return reply({error:'Kód není správný nebo zpráva nebyla nalezena.'},404);
   const codeHash=await sha(normalized);
   if(route==='/conversation')return stored(env,'conversation',{codeHash});
   const message=text(input.message,1,4000);if(!message)return reply({error:'Napište zprávu o délce 1 až 4 000 znaků.'},400);
   return stored(env,'reply',{codeHash,message,author:'teacher'});
  }
  if(route==='/admin/cases'&&method==='GET'){
   const status=url.searchParams.get('status')||'all',offset=Number(url.searchParams.get('offset')||0);
   if(!['all','new','in_progress','resolved'].includes(status)||!Number.isSafeInteger(offset)||offset<0||offset>1000000)return reply({error:'Neplatný filtr.'},400);
   return stored(env,'list',{status,offset});
  }
  const match=route.match(/^\/admin\/cases\/([0-9a-f-]{36})(?:\/(reply|status|delete))?$/i);
  if(match&&uuid(match[1])){
   const id=match[1];if(!match[2]&&method==='GET')return stored(env,'case',{id});
   if(match[2]==='delete'&&method==='POST'){if(input.confirm!==true)return reply({error:'Smazání podnětu je nutné potvrdit.'},400);return stored(env,'delete',{id});}
   if(match[2]==='reply'&&method==='POST'){const message=text(input.message,1,4000);if(!message)return reply({error:'Napište odpověď o délce 1 až 4 000 znaků.'},400);return stored(env,'reply',{id,message,author:'team'});}
   if(match[2]==='status'&&method==='POST'){if(!['new','in_progress','resolved'].includes(input.status))return reply({error:'Neplatný stav zprávy.'},400);return stored(env,'status',{id,status:input.status});}
  }
  return reply({error:'Tato část schránky nebyla nalezena.'},404);
 }catch{return reply({error:'Schránka je dočasně nedostupná. Zpráva se nyní nepodařila potvrdit; zadaný text si ponechte a zkuste to později.'},503);}
}
