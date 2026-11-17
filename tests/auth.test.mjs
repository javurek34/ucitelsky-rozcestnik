import test from 'node:test';
import { createHash, createHmac } from 'node:crypto';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import worker from '../worker/auth.mjs';
const origin='https://rozcestnik.example';
const base=origin+'/kapli';
const password='only-a-local-test-password';
function environment(overrides={}){return {SITE_PASSWORD:password,SESSION_SECRET:'this-is-only-a-test-signing-secret-with-ample-length',LOGIN_RATE_LIMITER:{limit:async()=>({success:true})},ASSETS:{fetch:async()=>new Response('PRIVATE_SCHOOL_CONTENT',{headers:{'Cache-Control':'public, max-age=3600'}})},...overrides};}
function login(value=password,headers={}){return new Request(base+'/__auth/login',{method:'POST',headers:{Origin:origin,'Content-Type':'application/x-www-form-urlencoded',...headers},body:new URLSearchParams({password:value})});}
async function cookieFor(env){const response=await worker.fetch(login(),env);assert.equal(response.status,303);return response.headers.get('Set-Cookie').split(';')[0];}

test('unconfigured or weakly configured deployment never reveals any assets',async()=>{
 for(const path of ['/','/index.html','/app.js','/assets/skola-logo.png']){
  const response=await worker.fetch(new Request(base+path),environment({SITE_PASSWORD:undefined}));assert.equal(response.status,503);assert.ok(!(await response.text()).includes('PRIVATE_SCHOOL_CONTENT'));
 }
});
test('anonymous visitors cannot access HTML, JS, images, or encoded paths',async()=>{
 for(const path of ['/','/index.html','/app.js','/assets/skola-logo.png','/%69ndex.html','/?download=1']){
  const response=await worker.fetch(new Request(base+path),environment());assert.ok([200,303].includes(response.status));assert.ok(!(await response.text()).includes('PRIVATE_SCHOOL_CONTENT'));assert.match(response.headers.get('Cache-Control'),/no-store/);
 }
});
test('wrong passwords do not create a session',async()=>{const r=await worker.fetch(login('incorrect-password'),environment());assert.equal(r.status,401);assert.equal(r.headers.get('Set-Cookie'),null);});
test('login rejects cross-origin forms and oversized submissions',async()=>{
 assert.equal((await worker.fetch(login(password,{Origin:'https://other.example'}),environment())).status,403);
 assert.equal((await worker.fetch(login('a'.repeat(5000)),environment())).status,413);
});
test('valid login creates a non-persistent signed secure cookie and authenticated assets are not cached',async()=>{
 const env=environment();const r=await worker.fetch(login(),env);assert.equal(r.status,303);const cookie=r.headers.get('Set-Cookie');for(const flag of ['HttpOnly','Secure','SameSite=Lax','Path=/'])assert.ok(cookie.includes(flag));assert.ok(!cookie.includes(password));assert.doesNotMatch(cookie,/Max-Age=|Expires=/i);
 const asset=await worker.fetch(new Request(base+'/app.js',{headers:{Cookie:cookie.split(';')[0]}}),env);assert.equal(await asset.text(),'PRIVATE_SCHOOL_CONTENT');assert.match(asset.headers.get('Cache-Control'),/private, no-store/);
});
test('tampering and password rotation invalidate previous cookies',async()=>{
 const env=environment(),cookie=await cookieFor(env);const forged=cookie.slice(0,-4)+'AAAA';
 assert.equal((await worker.fetch(new Request(base+'/app.js',{headers:{Cookie:forged}}),env)).status,303);
 assert.equal((await worker.fetch(new Request(base+'/app.js',{headers:{Cookie:cookie}}),environment({SITE_PASSWORD:'changed-test-password'}))).status,303);
});
test('expired sessions are rejected',async()=>{
 const env=environment(),original=Date.now;let cookie;try{Date.now=()=>original()-8*86400000;cookie=await cookieFor(env);}finally{Date.now=original;}
 assert.equal((await worker.fetch(new Request(base+'/app.js',{headers:{Cookie:cookie}}),env)).status,303);
});
test('logout expires the session cookie and refuses cross-origin logout',async()=>{
 const env=environment();const r=await worker.fetch(new Request(base+'/__auth/logout',{method:'POST',headers:{Origin:origin}}),env);assert.equal(r.status,303);assert.match(r.headers.get('Set-Cookie'),/Max-Age=0/);
 assert.equal((await worker.fetch(new Request(base+'/__auth/logout',{method:'POST',headers:{Origin:'https://other.example'}}),env)).status,403);
});
test('login attempts are rate-limited and a missing limiter fails closed',async()=>{
 const r=await worker.fetch(login(),environment({LOGIN_RATE_LIMITER:{limit:async()=>({success:false})}}));assert.equal(r.status,429);assert.equal(r.headers.get('Retry-After'),'60');
 assert.equal((await worker.fetch(login(),environment({LOGIN_RATE_LIMITER:undefined}))).status,503);
});
test('all paths go through the Worker and protected build contains no server or repository files',async()=>{
 const config=JSON.parse(await readFile(new URL('../wrangler.jsonc',import.meta.url),'utf8'));assert.equal(config.assets.run_worker_first,true);assert.equal(config.preview_urls,false);
 for(const file of ['index.html','app.js','squircle-fallback.js','assets/skola-logo.png'])await access(new URL('../dist/client/'+file,import.meta.url));
 for(const file of ['.git/config','worker/auth.mjs','README.md','.dev.vars','assets/external/sources.json'])await assert.rejects(access(new URL('../dist/client/'+file,import.meta.url)));
 assert.ok((await readFile(new URL('../dist/client/index.html',import.meta.url),'utf8')).includes('/kapli/__auth/logout'));
});

test('previous persistent sessions require a fresh login after the session-cookie migration',async()=>{
 const env=environment();
 const payload=Buffer.from(JSON.stringify({v:1,expires:Math.floor(Date.now()/1000)+3600})).toString('base64url');
 const material=createHash('sha256').update(env.SESSION_SECRET+'\0'+env.SITE_PASSWORD).digest();
 const signature=createHmac('sha256',material).update(payload).digest('base64url');
 const response=await worker.fetch(new Request(base+'/app.js',{headers:{Cookie:'__Host-rozcestnik_session='+payload+'.'+signature}}),env);
 assert.equal(response.status,303);
 assert.equal(response.headers.get('Location'),'/kapli/__auth/login');
});

test('only the two exact branding icon paths are public and login includes their links',async()=>{
 const env=environment();
 for(const path of ['/assets/icons/favicon-32.png','/assets/icons/apple-touch-icon.png']){
  const response=await worker.fetch(new Request(base+path),env);assert.equal(response.status,200);assert.equal(response.headers.get('Content-Type'),'image/png');
 }
 for(const path of ['/assets/icons/elearning.png','/assets/icons/favicon-32.png/anything','/app.js']){
  assert.equal((await worker.fetch(new Request(base+path),env)).status,303);
 }
 const login=await worker.fetch(new Request(base+'/'),env);assert.match(await login.text(),/rel="icon"/);assert.match(login.headers.get('Content-Security-Policy'),/img-src 'self'/);
});

test('root and legacy URLs redirect under /kapli without dropping query parameters',async()=>{
 const env=environment();
 for(const [path,expected] of [['/','/kapli/'],['/kapli','/kapli/'],['/?from=old','/kapli/?from=old'],['/app.js?v=1','/kapli/app.js?v=1'],['/__auth/login','/kapli/__auth/login']]){
  const response=await worker.fetch(new Request(origin+path),env);assert.equal(response.status,303);assert.equal(response.headers.get('Location'),expected);
 }
 const post=await worker.fetch(new Request(origin+'/__auth/login',{method:'POST',body:'test'}),env);assert.equal(post.status,307);assert.equal(post.headers.get('Location'),'/kapli/__auth/login');
});
test('mounted assets are fetched internally from the asset root, with cache and authentication protection',async()=>{
 let received;const env=environment({ASSETS:{fetch:async request=>{received=new URL(request.url);return new Response('PROTECTED');}}});
 const cookie=await cookieFor(env);
 const response=await worker.fetch(new Request(base+'/assets/skola-logo.png?v=2',{headers:{Cookie:cookie}}),env);
 assert.equal(await response.text(),'PROTECTED');assert.equal(received.pathname,'/assets/skola-logo.png');assert.equal(received.search,'?v=2');assert.match(response.headers.get('Cache-Control'),/no-store/);
 const loginResponse=await worker.fetch(login(),env);assert.equal(loginResponse.headers.get('Location'),'/kapli/');
 const loginPage=await worker.fetch(new Request(base+'/'),env);assert.match(await loginPage.text(),/action="\/kapli\/__auth\/login"/);
 const built=await readFile(new URL('../dist/client/index.html',import.meta.url),'utf8');assert.ok(built.includes('<base href="/kapli/">'));assert.ok(built.includes('href="/kapli/assets/icons/'));
});
test('static asset redirects retain the application prefix',async()=>{
 const env=environment({ASSETS:{fetch:async()=>new Response(null,{status:307,headers:{Location:'/?canonical=1'}})}});
 const cookie=await cookieFor(env);const response=await worker.fetch(new Request(base+'/index.html',{headers:{Cookie:cookie}}),env);
 assert.equal(response.headers.get('Location'),'/kapli/?canonical=1');
});
