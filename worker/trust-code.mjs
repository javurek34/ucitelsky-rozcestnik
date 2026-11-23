const encoder=new TextEncoder();
const alphabet='0123456789ABCDEFGHJKMNPQRSTVWXYZ';
async function key(env){
 const material=await crypto.subtle.digest('SHA-256',encoder.encode(env.SESSION_SECRET+'\0receipt'));
 return crypto.subtle.importKey('raw',material,{name:'HMAC',hash:'SHA-256'},false,['sign']);
}
export async function accessCode(env,submissionId){
 const bytes=new Uint8Array(await crypto.subtle.sign('HMAC',await key(env),encoder.encode(submissionId)));
 // 160 random-looking bits; kept out of URLs, logs and the stored case record.
 let bits=0,value=0,result='';for(const byte of bytes.slice(0,20)){value=(value<<8)|byte;bits+=8;while(bits>=5){bits-=5;result+=alphabet[(value>>>bits)&31];}}
 return result;
}
