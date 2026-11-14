import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { resolve } from 'node:path';
const cli=resolve(import.meta.dirname,'../node_modules/wrangler/bin/wrangler.js');
function run(args,secret){return new Promise((resolve,reject)=>{
 const child=spawn(process.execPath,[cli,...args],{stdio:[secret?'pipe':'inherit','inherit','inherit']});
 if(secret)child.stdin.end(secret+'\n');
 child.once('error',reject);child.once('exit',code=>code===0?resolve():reject(Error('Nastavení hesla nebylo dokončeno.')));
});}
console.log('Zadejte nové společné heslo (alespoň 12 znaků). Heslo se neukládá do zdrojových souborů.');
await run(['secret','put','SITE_PASSWORD']);
await run(['secret','put','SESSION_SECRET'],randomBytes(48).toString('base64url'));
console.log('Heslo a podepisovací klíč jsou nastavené. Starší přihlášení již neplatí.');
