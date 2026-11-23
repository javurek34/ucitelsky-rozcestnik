/* Private SQLite Durable Object. Only the authenticated Worker can call it.
   No message content, contact details or access codes belong in source control. */
export class TrustInbox {
 constructor(ctx,env={}){
  this.ctx=ctx;this.env=env;this.sql=ctx.storage.sql;
  this.sql.exec(`CREATE TABLE IF NOT EXISTS trust_cases (
   id TEXT PRIMARY KEY, code_hash TEXT NOT NULL UNIQUE, submission_hash TEXT NOT NULL UNIQUE,
   kind TEXT NOT NULL, subject TEXT NOT NULL, body TEXT NOT NULL,
   preference TEXT NOT NULL, participants TEXT NOT NULL, contact TEXT NOT NULL,
   status TEXT NOT NULL DEFAULT 'new', created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
  )`);
  this.sql.exec(`CREATE TABLE IF NOT EXISTS trust_messages (
   id INTEGER PRIMARY KEY AUTOINCREMENT, case_id TEXT NOT NULL REFERENCES trust_cases(id),
   author TEXT NOT NULL, body TEXT NOT NULL, created_at INTEGER NOT NULL
  )`);
  this.sql.exec('CREATE INDEX IF NOT EXISTS trust_messages_case ON trust_messages(case_id,id)');
  this.sql.exec('CREATE INDEX IF NOT EXISTS trust_cases_updated ON trust_cases(updated_at DESC)');
  this.sql.exec(`CREATE TABLE IF NOT EXISTS trust_notifications (case_id TEXT PRIMARY KEY, created_at INTEGER NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, next_attempt INTEGER NOT NULL, sent_at INTEGER)`);
 }
 row(sql,...args){return this.sql.exec(sql,...args).toArray()[0]||null;}
 view(row){
  if(!row)return null;
  const {code_hash,submission_hash,...record}=row;
  record.participants=JSON.parse(record.participants);
  record.messages=this.sql.exec('SELECT id,author,body,created_at FROM trust_messages WHERE case_id=? ORDER BY id',row.id).toArray();
  return record;
 }
 json(value,status=200){return Response.json(value,{status});}
 async scheduleNotifications(){
  const pending=this.row('SELECT MIN(next_attempt) AS next FROM trust_notifications WHERE sent_at IS NULL');
  if(pending?.next!==null&&pending?.next!==undefined)await this.ctx.storage.setAlarm(Math.max(Date.now()+1000,pending.next));
 }
 async alarm(){
  const pending=this.sql.exec('SELECT case_id,created_at,attempts FROM trust_notifications WHERE sent_at IS NULL AND next_attempt<=? ORDER BY created_at LIMIT 10',Date.now()).toArray();
  for(const item of pending){
   let sent=false;
   if(this.env.RESEND_API_KEY){
    try{
     const response=await fetch('https://api.resend.com/emails',{
      method:'POST',headers:{Authorization:'Bearer '+this.env.RESEND_API_KEY,'Content-Type':'application/json','Idempotency-Key':'trust-new-'+item.case_id},
      body:JSON.stringify({from:this.env.TRUST_NOTIFY_FROM||'Schránka důvěry <schranka@javurek.online>',to:['javurek@zs-kaplickeho.cz'],subject:'Nový podnět ve schránce důvěry',text:'Ve schránce důvěry pro učitele přibyl nový podnět.\n\nPřihlaste se do rozcestníku, otevřete schránku a zvolte Vstup pro pověřený tým:\nhttps://javurek.online/kapli/#schranka-duvery\n\nObsah podnětu je dostupný pouze ve schránce.'}),signal:AbortSignal.timeout(15000)
     });
     sent=response.ok;await response.body?.cancel();
    }catch{ /* Never log secrets, provider responses or message content. */ }
   }
   if(sent)this.sql.exec('UPDATE trust_notifications SET sent_at=? WHERE case_id=?',Date.now(),item.case_id);
   else this.sql.exec('UPDATE trust_notifications SET attempts=attempts+1,next_attempt=? WHERE case_id=?',Date.now()+Math.min(3600000,60000*2**Math.min(item.attempts,6)),item.case_id);
  }
  await this.scheduleNotifications();
 }
 async fetch(request){
  try{
   if(request.method!=='POST')return this.json({error:'Method not allowed'},405);
   const input=await request.json(),operation=new URL(request.url).pathname;
   if(operation==='/create'){
    const existing=this.row('SELECT id FROM trust_cases WHERE submission_hash=?',input.submissionHash);
    if(existing){await this.scheduleNotifications().catch(()=>{});return this.json({id:existing.id},200);}
    const id=crypto.randomUUID(),now=Date.now();
    this.ctx.storage.transactionSync(()=>{
     this.sql.exec('INSERT INTO trust_cases (id,code_hash,submission_hash,kind,subject,body,preference,participants,contact,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)',id,input.codeHash,input.submissionHash,input.kind,input.subject,input.message,input.preference,JSON.stringify(input.participants),input.contact,now,now);
     this.sql.exec('INSERT INTO trust_messages (case_id,author,body,created_at) VALUES (?,?,?,?)',id,'teacher',input.message,now);
     this.sql.exec('INSERT INTO trust_notifications (case_id,created_at,next_attempt) VALUES (?,?,?)',id,now,now);
    });
    // Notification delivery cannot turn a successfully saved submission into an error.
    await this.scheduleNotifications().catch(()=>{});
    return this.json({id},201);
   }
   if(operation==='/conversation'){
    const item=this.row('SELECT * FROM trust_cases WHERE code_hash=?',input.codeHash);
    return item?this.json({conversation:this.view(item)}):this.json({error:'Kód není správný nebo zpráva nebyla nalezena.'},404);
   }
   if(operation==='/case'){
    const item=this.row('SELECT * FROM trust_cases WHERE id=?',input.id);
    return item?this.json({conversation:this.view(item)}):this.json({error:'Zpráva nebyla nalezena.'},404);
   }
   if(operation==='/list'){
    const status=input.status||'all',offset=input.offset||0;
    const fields='id,kind,subject,preference,participants,status,created_at,updated_at';
    const rows=status==='all'?this.sql.exec(`SELECT ${fields},(SELECT author FROM trust_messages WHERE case_id=trust_cases.id ORDER BY id DESC LIMIT 1) AS last_author FROM trust_cases ORDER BY updated_at DESC,id LIMIT 51 OFFSET ?`,offset).toArray():this.sql.exec(`SELECT ${fields},(SELECT author FROM trust_messages WHERE case_id=trust_cases.id ORDER BY id DESC LIMIT 1) AS last_author FROM trust_cases WHERE status=? ORDER BY updated_at DESC,id LIMIT 51 OFFSET ?`,status,offset).toArray();
    return this.json({cases:rows.slice(0,50).map(row=>({...row,participants:JSON.parse(row.participants)})),hasMore:rows.length>50});
   }
   if(operation==='/reply'){
    const item=input.codeHash?this.row('SELECT * FROM trust_cases WHERE code_hash=?',input.codeHash):this.row('SELECT * FROM trust_cases WHERE id=?',input.id);
    if(!item)return this.json({error:'Zpráva nebyla nalezena.'},404);
    const count=this.row('SELECT COUNT(*) AS n FROM trust_messages WHERE case_id=?',item.id).n;
    if(count>=200)return this.json({error:'Toto vlákno už obsahuje maximální počet zpráv. Založte prosím nový podnět.'},409);
    const now=Date.now(),status=input.author==='team'?'in_progress':item.status==='resolved'?'new':item.status;
    this.ctx.storage.transactionSync(()=>{
     this.sql.exec('INSERT INTO trust_messages (case_id,author,body,created_at) VALUES (?,?,?,?)',item.id,input.author,input.message,now);
     this.sql.exec('UPDATE trust_cases SET updated_at=?,status=? WHERE id=?',now,status,item.id);
    });
    return this.json({conversation:this.view(this.row('SELECT * FROM trust_cases WHERE id=?',item.id))});
   }
   if(operation==='/status'){
    this.sql.exec('UPDATE trust_cases SET status=?,updated_at=? WHERE id=?',input.status,Date.now(),input.id);
    const item=this.row('SELECT * FROM trust_cases WHERE id=?',input.id);
    return item?this.json({conversation:this.view(item)}):this.json({error:'Zpráva nebyla nalezena.'},404);
   }
   return this.json({error:'Not found'},404);
  }catch{
   // Never log request bodies or database errors that might contain personal data.
   return this.json({error:'Zprávu se nepodařilo bezpečně uložit. Zkuste to prosím později.'},503);
  }
 }
}
