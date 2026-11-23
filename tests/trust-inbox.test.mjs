import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import worker from '../worker/auth.mjs';
import { TrustInbox } from '../worker/trust-store.mjs';
const origin='https://rozcestnik.example',prefix=origin+'/kapli/api/schranka';
const schoolPassword='only-a-local-test-password',adminPassword='different-long-admin-test-password';
function setup(t){
 const database=new DatabaseSync(':memory:');t.after(()=>database.close());
 const alarms=[];
 const ctx={storage:{setAlarm:async time=>{alarms.push(time);},sql:{exec(sql,...params){const rows=database.prepare(sql).all(...params);return{toArray:()=>rows};}},transactionSync(fn){database.exec('BEGIN');try{const result=fn();database.exec('COMMIT');return result;}catch(e){database.exec('ROLLBACK');throw e;}}}};
 let store;
 const env={SITE_PASSWORD:schoolPassword,SESSION_SECRET:'this-is-only-a-test-signing-secret-with-ample-length',TRUST_ADMIN_PASSWORD:adminPassword,LOGIN_RATE_LIMITER:{limit:async()=>({success:true})},TRUST_RATE_LIMITER:{limit:async()=>({success:true})},TRUST_INBOX:{idFromName:name=>name,get:()=>({fetch:request=>store.fetch(request)})},ASSETS:{fetch:async()=>new Response('PRIVATE_ASSET')}};
 store=new TrustInbox(ctx,env);
 return{env,database,alarms,alarm:()=>store.alarm(),restart:()=>{store=new TrustInbox(ctx,env);}};
}
async function schoolCookie(env){const r=await worker.fetch(new Request(origin+'/kapli/__auth/login',{method:'POST',headers:{Origin:origin,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({password:schoolPassword})}),env);assert.equal(r.status,303);return r.headers.get('Set-Cookie').split(';')[0];}
function request(path,data,cookie,extra={}){return new Request(prefix+path,{method:data===undefined?'GET':'POST',headers:{...(data===undefined?{}:{Origin:origin,'Content-Type':'application/json'}),...(cookie?{Cookie:cookie}:{}),...extra},body:data===undefined?undefined:JSON.stringify(data)});}
const draft=overrides=>({submissionId:crypto.randomUUID(),kind:'conflict',subject:'Testovací podnět',message:'Potřebuji poradit se společným postupem v testovací situaci.',preference:'meeting',participants:['leadership','spp'],contact:'',...overrides});
async function create(env,cookie,data=draft()){const response=await worker.fetch(request('/create',data,cookie),env);assert.equal(response.status,201);return response.json();}
async function teamCookie(env,cookie){const response=await worker.fetch(request('/admin/login',{password:adminPassword},cookie),env);assert.equal(response.status,200);return cookie+'; '+response.headers.get('Set-Cookie').split(';')[0];}

test('schránka vyžaduje školní přihlášení a zůstává uzavřená bez samostatného hesla',async t=>{
 const {env}=setup(t);assert.equal((await worker.fetch(request('/status'),env)).status,401);
 const cookie=await schoolCookie(env);
 for(const override of [{TRUST_ADMIN_PASSWORD:undefined},{TRUST_ADMIN_PASSWORD:schoolPassword},{TRUST_INBOX:undefined}]){
  const config={...env,...override};const state=await worker.fetch(request('/status',undefined,cookie),config);const status=await state.json();assert.equal(status.ready,false);assert.ok(status.message);assert.ok(!JSON.stringify(status).includes(schoolPassword));
  assert.equal((await worker.fetch(request('/create',draft(),cookie),config)).status,503);
 }
});
test('anonymní zpráva dostane silný kód, opakování stejného odeslání nevytvoří duplikát',async t=>{
 const {env,database,restart}=setup(t),cookie=await schoolCookie(env),data=draft();
 const result=await create(env,cookie,data);assert.match(result.code,/^(?:[0-9A-HJKMNP-TV-Z]{4}-){7}[0-9A-HJKMNP-TV-Z]{4}$/);
 const again=await worker.fetch(request('/create',data,cookie),env);assert.equal(again.status,200);assert.deepEqual(await again.json(),result);
 assert.equal(database.prepare('SELECT COUNT(*) AS n FROM trust_cases').get().n,1);
 const row=database.prepare('SELECT * FROM trust_cases').get();assert.ok(!JSON.stringify(row).includes(result.code));assert.equal(row.contact,'');assert.equal(Object.hasOwn(row,'ip'),false);
 restart();const read=await worker.fetch(request('/conversation',{code:result.code.toLowerCase().replaceAll('-',' ')},cookie),env);assert.equal(read.status,200);
 const record=(await read.json()).conversation;assert.equal(record.messages.length,1);assert.equal(record.preference,'meeting');assert.deepEqual(record.participants,['leadership','spp']);assert.equal(record.code_hash,undefined);assert.equal(record.submission_hash,undefined);assert.equal(record.messages[0].body,data.message);
});
test('samotné společné heslo neumožní číst správu ani cizí vlákno',async t=>{
 const {env}=setup(t),cookie=await schoolCookie(env),first=await create(env,cookie),second=await create(env,cookie);
 assert.equal((await worker.fetch(request('/admin/cases',undefined,cookie),env)).status,401);
 assert.equal((await worker.fetch(request('/admin/cases/'+first.id,undefined,cookie),env)).status,401);
 assert.equal((await worker.fetch(request('/admin/login',{password:schoolPassword},cookie),env)).status,401);
 assert.equal((await worker.fetch(request('/conversation',{code:first.code.slice(0,-1)+'!'},cookie),env)).status,404);
 const record=(await (await worker.fetch(request('/conversation',{code:second.code},cookie),env)).json()).conversation;assert.equal(record.id,second.id);assert.notEqual(record.id,first.id);
});
test('pověřený tým odpoví a anonymní učitel může pokračovat i po uzavření vlákna',async t=>{
 const {env}=setup(t),cookie=await schoolCookie(env),result=await create(env,cookie),team=await teamCookie(env,cookie);
 const list=await worker.fetch(request('/admin/cases?status=new',undefined,team),env);assert.equal((await list.json()).cases[0].id,result.id);
 const response=await worker.fetch(request('/admin/cases/'+result.id+'/reply',{message:'Můžeme společně hledat další postup.'},team),env);assert.equal(response.status,200);
 let thread=(await response.json()).conversation;assert.equal(thread.messages[1].author,'team');assert.equal(thread.status,'in_progress');
 await worker.fetch(request('/admin/cases/'+result.id+'/status',{status:'resolved'},team),env);
 const followup=await worker.fetch(request('/conversation/reply',{code:result.code,message:'Děkuji, ještě bych potřeboval doplnit další informace.'},cookie),env);thread=(await followup.json()).conversation;assert.equal(thread.messages.length,3);assert.equal(thread.messages[2].author,'teacher');assert.equal(thread.status,'new');
 const read=await worker.fetch(request('/conversation',{code:result.code},cookie),env);assert.match(read.headers.get('Cache-Control'),/no-store/);assert.equal((await read.json()).conversation.messages.length,3);
});
test('správcovská relace má jiný podpis, je krátká a změna hesla nepoškodí kódy učitelů',async t=>{
 const {env}=setup(t),cookie=await schoolCookie(env),result=await create(env,cookie),team=await teamCookie(env,cookie);
 const rotated={...env,TRUST_ADMIN_PASSWORD:'a-completely-new-private-admin-password'};
 assert.equal((await worker.fetch(request('/admin/cases',undefined,team),rotated)).status,401);
 assert.equal((await worker.fetch(request('/conversation',{code:result.code},cookie),rotated)).status,200);
 assert.equal((await worker.fetch(request('/admin/cases',undefined,team.slice(0,-5)+'AAAAA'),env)).status,401);
 const token=team.split('; ')[1];assert.equal((await worker.fetch(request('/admin/cases',undefined,token),env)).status,401);
 const original=Date.now;try{Date.now=()=>original()+3*3600000;assert.equal((await worker.fetch(request('/admin/cases',undefined,team),env)).status,401);}finally{Date.now=original;}
});
test('odhlášení rozcestníku zruší i cookie správy schránky',async t=>{
 const {env}=setup(t),cookie=await schoolCookie(env),team=await teamCookie(env,cookie);
 const response=await worker.fetch(new Request(origin+'/kapli/__auth/logout',{method:'POST',headers:{Origin:origin,Cookie:team}}),env);
 const cookies=response.headers.getSetCookie();assert.equal(cookies.length,2);assert.ok(cookies.some(c=>c.startsWith('__Host-rozcestnik_trust_admin=;')&&c.includes('Max-Age=0')));
});
test('validace, ochrana původu a limit požadavků chrání podání i odpovědi',async t=>{
 const {env,database}=setup(t),cookie=await schoolCookie(env);
 assert.equal((await worker.fetch(request('/create',draft(),cookie,{Origin:'https://other.example'}),env)).status,403);
 assert.equal((await worker.fetch(request('/create',draft(),cookie,{'Content-Type':'text/plain'}),env)).status,415);
 for(const data of [draft({message:'krátké'}),draft({message:'x'.repeat(6001)}),draft({kind:'other'}),draft({participants:['someone-else']}),draft({submissionId:'guessable'})])assert.equal((await worker.fetch(request('/create',data,cookie),env)).status,400);
 assert.equal((await worker.fetch(request('/create',draft({message:'x'.repeat(40000)}),cookie),env)).status,400);
 const limited={...env,TRUST_RATE_LIMITER:{limit:async()=>({success:false})}};const response=await worker.fetch(request('/create',draft(),cookie),limited);assert.equal(response.status,429);assert.equal(response.headers.get('Retry-After'),'60');assert.equal(database.prepare('SELECT COUNT(*) AS n FROM trust_cases').get().n,0);
});


test('upozornění odejde pouze jednou bez obsahu, kontaktu a přístupového kódu',async t=>{
 const {env,database,alarms,alarm}=setup(t);env.RESEND_API_KEY='test-not-a-real-api-key';
 const calls=[];t.mock.method(globalThis,'fetch',async(url,options)=>{calls.push({url,options});return new Response('{}',{status:200});});
 const cookie=await schoolCookie(env),data=draft({contact:'private@example.test'}),result=await create(env,cookie,data);
 assert.ok(alarms.length);assert.equal(calls.length,0);await alarm();assert.equal(calls.length,1);
 const sent=JSON.parse(calls[0].options.body);assert.deepEqual(sent.to,['javurek@zs-kaplickeho.cz']);assert.match(sent.text,/https:\/\/javurek.online\/kapli\/#schranka-duvery/);
 for(const secret of [data.message,data.subject,data.contact,result.code])assert.ok(!calls[0].options.body.includes(secret));
 assert.equal(calls[0].options.headers['Idempotency-Key'],'trust-new-'+result.id);
 assert.equal((await worker.fetch(request('/create',data,cookie),env)).status,200);await alarm();assert.equal(calls.length,1);assert.ok(database.prepare('SELECT sent_at FROM trust_notifications').get().sent_at);
});
test('chyba e-mailu nebrání uložení a fronta přežije restart a zopakuje pokus',async t=>{
 const {env,database,alarm,restart}=setup(t);const cookie=await schoolCookie(env),result=await create(env,cookie);
 await alarm();assert.equal(database.prepare('SELECT sent_at FROM trust_notifications').get().sent_at,null);
 env.RESEND_API_KEY='test-not-a-real-api-key';let calls=0;t.mock.method(globalThis,'fetch',async()=>{calls++;return new Response('{}',{status:calls===1?503:200});});
 database.exec('UPDATE trust_notifications SET next_attempt=0');await alarm();assert.equal(calls,1);assert.equal(database.prepare('SELECT sent_at FROM trust_notifications').get().sent_at,null);
 restart();database.exec('UPDATE trust_notifications SET next_attempt=0');await alarm();assert.equal(calls,2);assert.ok(database.prepare('SELECT sent_at FROM trust_notifications').get().sent_at);
 assert.equal((await worker.fetch(request('/conversation',{code:result.code},cookie),env)).status,200);
});

test('jen pověřený tým smí potvrzením smazat uzavřený podnět včetně konverzace a upozornění',async t=>{
 const {env,database,restart}=setup(t),cookie=await schoolCookie(env),result=await create(env,cookie),team=await teamCookie(env,cookie);
 const endpoint='/admin/cases/'+result.id+'/delete';
 assert.equal((await worker.fetch(request(endpoint,{confirm:true},cookie),env)).status,401);
 assert.equal((await worker.fetch(request(endpoint,{confirm:true},team,{Origin:'https://other.example'}),env)).status,403);
 assert.equal((await worker.fetch(request(endpoint,{confirm:true},team),env)).status,409);
 await worker.fetch(request('/admin/cases/'+result.id+'/status',{status:'resolved'},team),env);
 assert.equal((await worker.fetch(request(endpoint,{},team),env)).status,400);
 // A teacher's new reply reopens the case, even if an admin still sees an old closed view.
 await worker.fetch(request('/conversation/reply',{code:result.code,message:'Ještě potřebuji pomoc.'},cookie),env);
 assert.equal((await worker.fetch(request(endpoint,{confirm:true},team),env)).status,409);
 await worker.fetch(request('/admin/cases/'+result.id+'/status',{status:'resolved'},team),env);
 assert.equal((await worker.fetch(request(endpoint,{confirm:true},team),env)).status,200);
 for(const table of ['trust_cases','trust_messages','trust_notifications'])assert.equal(database.prepare('SELECT COUNT(*) AS n FROM '+table).get().n,0);
 restart();assert.equal((await worker.fetch(request('/conversation',{code:result.code},cookie),env)).status,404);
 assert.equal((await worker.fetch(request('/admin/cases/'+result.id,undefined,team),env)).status,404);
 assert.equal((await worker.fetch(request(endpoint,{confirm:true},team),env)).status,404);
});

test('kód vidí jen správci v detailu a zůstává stejný po restartu a změně jejich hesla',async t=>{
 const {env,database,restart}=setup(t),cookie=await schoolCookie(env),result=await create(env,cookie),team=await teamCookie(env,cookie);
 const detail=async()=> (await (await worker.fetch(request('/admin/cases/'+result.id,undefined,team),env)).json()).conversation;
 assert.equal((await detail()).accessCode,result.code);assert.ok(!Object.hasOwn(await detail(),'receipt_id'));
 const personal=(await (await worker.fetch(request('/conversation',{code:result.code},cookie),env)).json()).conversation;
 assert.ok(!Object.hasOwn(personal,'accessCode'));assert.ok(!Object.hasOwn(personal,'receipt_id'));
 assert.ok(!JSON.stringify(await (await worker.fetch(request('/admin/cases',undefined,team),env)).json()).includes(result.code));
 restart();assert.equal((await detail()).accessCode,result.code);
 const rotated={...env,TRUST_ADMIN_PASSWORD:'another-long-admin-password-for-test'};
 const login=await worker.fetch(request('/admin/login',{password:rotated.TRUST_ADMIN_PASSWORD},cookie),rotated);
 const rotatedCookie=cookie+'; '+login.headers.get('Set-Cookie').split(';')[0];
 assert.equal((await (await worker.fetch(request('/admin/cases/'+result.id,undefined,rotatedCookie),rotated)).json()).conversation.accessCode,result.code);
 database.exec('UPDATE trust_cases SET receipt_id=NULL');restart();assert.equal((await detail()).accessCode,null);
 assert.equal((await worker.fetch(request('/conversation',{code:result.code},cookie),env)).status,200);
});
