import { mkdir, readFile, writeFile, readdir, copyFile, rm } from 'node:fs/promises';
import { resolve, join, extname } from 'node:path';
const root=resolve(import.meta.dirname,'..');
const output=join(root,'dist/client');
await rm(output,{recursive:true,force:true});await mkdir(output,{recursive:true});
const publicFiles=['index.html','app.js','style.css','theme.js','card-pages.js','reading-panels.js','kodex-ai.js','squircle-fallback.js','trust-inbox.js','trust-inbox.css','viewport.js'];
for(const name of publicFiles)await copyFile(join(root,name),join(output,name));
const extensions=new Set(['.png','.jpg','.jpeg','.webp','.avif','.svg','.gif','.ico','.woff','.woff2','.ttf','.otf']);
async function copyAssets(directory,relative='assets'){
 await mkdir(join(output,relative),{recursive:true});
 for(const item of await readdir(directory,{withFileTypes:true})){
  if(item.name.startsWith('.'))continue;
  if(item.isDirectory())await copyAssets(join(directory,item.name),join(relative,item.name));
  else if(item.isFile()&&extensions.has(extname(item.name).toLowerCase()))await copyFile(join(directory,item.name),join(output,relative,item.name));
 }
}
await copyAssets(join(root,'assets'));
await mkdir(join(output,'personal'),{recursive:true});
for(const name of ['index.html','site.css','mark.svg','hero.webp','portrait-smoke.svg','portrait-brush.webp'])await copyFile(join(root,'personal',name),join(output,'personal',name));
const logout='<form class="protected-logout" action="/kapli/__auth/logout" method="post"><button class="secondary-action" type="submit">Odhlásit</button></form>';
let index=await readFile(join(output,'index.html'),'utf8');
index=index.replace('<head>','<head><base href="/kapli/">').replaceAll('href="/assets/icons/','href="/kapli/assets/icons/');
index=index.replace('</footer>',logout+'</footer>');await writeFile(join(output,'index.html'),index);
let app=await readFile(join(output,'app.js'),'utf8');
app+='\n// Logout is available only in the server-protected build.\nconst logoutForm=document.querySelector(".protected-logout");\nif(logoutForm)document.querySelectorAll(".page-navigation-content").forEach(menu=>menu.append(logoutForm.cloneNode(true)));\n';
await writeFile(join(output,'app.js'),app);
let styles=await readFile(join(output,'style.css'),'utf8');
styles+='\n.protected-logout{margin:0}.page-navigation-content>.protected-logout{grid-column:1 / -1;border-top:1px solid var(--line);padding-top:12px}.page-navigation-content>.protected-logout button{width:100%;min-height:44px}\n';
await writeFile(join(output,'style.css'),styles);
console.log('Protected build ready in dist/client; only public application assets included.');
