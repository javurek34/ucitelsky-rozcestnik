/* Teacher trust inbox: anonymous conversations, optional contact, separate staff access. */
(()=>{
 const dialog=document.createElement('dialog');dialog.id='schranka-duvery-dialog';dialog.className='content-dialog';dialog.setAttribute('aria-labelledby','schranka-duvery-title');
 dialog.innerHTML=`<div class="content-header"><h2 id="schranka-duvery-title" tabindex="-1">Schránka důvěry pro učitele</h2><button type="button" class="icon-button" id="close-schranka-duvery" aria-label="Zavřít schránku důvěry"><svg aria-hidden="true"><use href="#i-close"/></svg></button></div>
 <div class="content-body trust-body">
  <div class="trust-intro"><span class="trust-eyebrow">PROSTOR PRO TO, CO VÁS TRÁPÍ</span><h3>Nemusíte na to být sami.</h3><p>Potřebujete radu, chcete upozornit na problém nebo hledáte cestu z konfliktu? Napište nám, co by vám pomohlo. Můžete zůstat bez uvedení jména a v rozhovoru pokračovat přes soukromý kód.</p><p class="trust-readers"><svg aria-hidden="true"><use href="#i-shield"/></svg><span>Podněty čte vedení školy a určení členové ŠPP. Přístup mají oddělený od běžného rozcestníku. U nových podnětů vidí také soukromý přístupový kód.</span></p></div>
  <div class="trust-tabs" role="tablist" aria-label="Schránka důvěry"><button type="button" id="trust-tab-new" role="tab" aria-selected="true" aria-controls="trust-new" data-trust-tab="new">Napsat zprávu</button><button type="button" id="trust-tab-conversation" role="tab" aria-selected="false" aria-controls="trust-conversation" tabindex="-1" data-trust-tab="conversation">Mám přístupový kód</button></div>
  <p class="trust-service-status" role="status" hidden></p>
  <div id="trust-new" role="tabpanel" aria-labelledby="trust-tab-new">
   <form id="trust-create-form" class="trust-form" autocomplete="off">
    <fieldset class="trust-section trust-kind"><legend><span class="trust-step">01</span> S čím přicházíte?</legend><div class="trust-kind-options">
     <label class="trust-choice"><input type="radio" name="kind" value="advice" required checked><span><svg aria-hidden="true"><use href="#i-heart"/></svg><strong>Potřebuji radu</strong><small>Hledám podporu nebo jiný pohled.</small></span></label>
     <label class="trust-choice"><input type="radio" name="kind" value="concern" required><span><svg aria-hidden="true"><use href="#i-file"/></svg><strong>Podnět k řešení</strong><small>Něco mě trápí a přeji si změnu.</small></span></label>
     <label class="trust-choice"><input type="radio" name="kind" value="conflict" required><span><svg aria-hidden="true"><use href="#i-ruzne-people"/></svg><strong>Pomoc s konfliktem</strong><small>Chci pomoci najít společnou cestu.</small></span></label>
    </div></fieldset>
    <section class="trust-section"><h3><span class="trust-step">02</span> Co byste nám chtěli říct?</h3><label class="trust-field"><span>Čeho se zpráva týká? <small>nepovinné</small></span><input name="subject" maxlength="120" placeholder="Krátký název, podle kterého zprávu poznáte"></label><label class="trust-field"><span>Vaše zpráva</span><textarea name="message" rows="8" required minlength="10" maxlength="6000" aria-describedby="trust-message-help trust-message-count" placeholder="Popište, co se děje, s čím potřebujete pomoct nebo co byste si přáli řešit."></textarea></label><div class="trust-field-footer"><small id="trust-message-help">Můžete přidat i to, co jste už zkusili a jakou pomoc si představujete.</small><small id="trust-message-count">0 / 6 000</small></div></section>
    <div class="trust-support-grid">
     <fieldset class="trust-section"><legend><span class="trust-step">03</span> Jak chcete pokračovat?</legend><label class="trust-option"><input type="radio" name="preference" value="written" checked required><span><strong>Nejdřív písemně</strong><small>Přes soukromý kód, i bez uvedení jména.</small></span></label><label class="trust-option"><input type="radio" name="preference" value="meeting"><span><strong>Společné setkání</strong><small>Chci se domluvit na osobním rozhovoru.</small></span></label><label class="trust-option"><input type="radio" name="preference" value="unsure"><span><strong>Zatím nevím</strong><small>Pomozte mi vybrat vhodný postup.</small></span></label></fieldset>
     <fieldset class="trust-section"><legend><span class="trust-step">04</span> Koho chcete zapojit?</legend><p class="trust-muted">Vyberte, s kým si přejete hledat řešení. Můžete zvolit oba nebo výběr nechat otevřený.</p><label class="trust-option"><input type="checkbox" name="participants" value="leadership"><span><strong>Vedení školy</strong><small>Společný rozhovor a domluva dalšího postupu.</small></span></label><label class="trust-option"><input type="checkbox" name="participants" value="spp"><span><strong>Školní poradenské pracoviště</strong><small>Podpora, konzultace nebo pomoc při řešení konfliktu.</small></span></label><p class="trust-fine">Tato volba vyjadřuje vaše přání pro další postup. Zprávy přijímá společný pověřený tým uvedený výše.</p></fieldset>
    </div>
    <section class="trust-section"><h3>Chcete nám zanechat kontakt? <small>nepovinné</small></h3><label class="trust-field"><span>Jméno, e-mail nebo jiný způsob, jak se domluvit</span><input name="contact" maxlength="200" placeholder="Můžete nechat prázdné"></label><p class="trust-fine">Pro domluvu setkání se kontakt může hodit. Pokud ho neuvedete, můžete se domluvit později ve svém vlákně.</p></section>
    <div class="trust-submit-row"><p>Po odeslání získáte soukromý kód. Uschovejte si ho pro přečtení odpovědi a další zprávy.</p><button type="submit" class="primary" disabled>Odeslat zprávu</button></div><p class="trust-form-error" role="alert" hidden></p><p class="trust-submit-status trust-service-status" role="status" hidden></p>
   </form>
   <section id="trust-receipt" class="trust-section trust-receipt" hidden aria-labelledby="trust-receipt-title"><span class="trust-eyebrow">ZPRÁVA JE ULOŽENÁ</span><h3 id="trust-receipt-title" tabindex="-1">Děkujeme, že jste napsali.</h3><p>Toto je váš soukromý kód. Odpověď si s ním můžete přečíst zde ve schránce a případně doplnit další zprávu.</p><code class="trust-access-code" id="trust-access-code"></code><div class="trust-actions"><button type="button" class="secondary-action" id="trust-copy-code">Zkopírovat kód</button><button type="button" class="primary" id="trust-open-receipt">Otevřít moje vlákno</button></div><p class="trust-fine">Kód nikomu nepředávejte. Kdo ho zná, může číst vaše vlákno a psát do něj. Kód nelze obnovit. Pokud jste zanechali kontakt, tým se s vámi může domluvit i jinou cestou.</p><p id="trust-copy-status" role="status"></p></section>
  </div>
  <div id="trust-conversation" role="tabpanel" aria-labelledby="trust-tab-conversation" hidden><section class="trust-section"><h3>Vraťte se ke své zprávě</h3><p>Vložte kód, který jste dostali po odeslání. Jméno ani přihlášení dalším účtem nepotřebujete.</p><form id="trust-lookup-form" class="trust-lookup-form" autocomplete="off"><label class="trust-field"><span>Soukromý přístupový kód</span><input name="code" type="password" required maxlength="64" spellcheck="false" autocapitalize="characters" autocomplete="off" placeholder="Kód z potvrzení o odeslání"></label><button type="submit" class="primary" disabled>Otevřít vlákno</button></form><p class="trust-form-error" role="alert" hidden></p></section><section class="trust-section trust-thread-panel" id="trust-personal-thread" hidden></section></div>
  <div id="trust-admin" hidden>
   <section class="trust-section" id="trust-admin-login-panel"><span class="trust-eyebrow">JEN PRO POVĚŘENÝ TÝM</span><h3>Správa schránky důvěry</h3><p>Přístup je určen vedení školy a určeným členům ŠPP. Heslo ke schránce se liší od společného hesla rozcestníku.</p><form id="trust-admin-login-form" class="trust-lookup-form"><label class="trust-field"><span>Heslo ke správě schránky</span><input name="password" type="password" autocomplete="current-password" required maxlength="256"></label><button type="submit" class="primary" disabled>Přihlásit do správy</button></form><p class="trust-form-error" role="alert" hidden></p></section>
   <div id="trust-admin-workspace" hidden><div class="trust-admin-toolbar"><label class="trust-field"><span>Zobrazit zprávy</span><select id="trust-admin-filter"><option value="all">Všechny zprávy</option><option value="new">Nové</option><option value="in_progress">V řešení</option><option value="resolved">Uzavřené</option></select></label><button type="button" class="secondary-action" id="trust-admin-refresh">Obnovit</button><button type="button" class="secondary-action" id="trust-admin-logout">Odhlásit správu</button></div><p class="trust-admin-error trust-form-error" role="alert" hidden></p><div class="trust-admin-grid"><section class="trust-section"><h3>Přijaté zprávy</h3><div id="trust-case-list"></div><button type="button" class="secondary-action" id="trust-admin-more" hidden>Načíst další zprávy</button></section><section class="trust-section trust-thread-panel" id="trust-admin-thread"><p class="trust-muted">Vyberte zprávu ze seznamu.</p></section></div></div>
  </div>
  <div class="trust-staff-entry"><button type="button" id="trust-show-admin">Vstup pro pověřený tým</button><button type="button" id="trust-back-from-admin" hidden>Zpět k napsání zprávy</button></div>
 </div><div class="content-actions"><button type="button" class="primary" id="schranka-duvery-ok">Zpět na rozcestník</button></div>`;
 document.body.append(dialog);
 const $=selector=>dialog.querySelector(selector),$$=selector=>[...dialog.querySelectorAll(selector)];
 const API='/kapli/api/schranka';
 const kindLabels={advice:'Žádost o radu',concern:'Podnět k řešení',conflict:'Pomoc s konfliktem'};
 const statuses={new:'Nové',in_progress:'V řešení',resolved:'Uzavřeno'};
 const preferences={written:'Nejdřív písemně',meeting:'Společné setkání',unsure:'Postup zatím otevřený'};
 const names={leadership:'Vedení školy',spp:'ŠPP'};
 let ready=false,currentTab='new',activeCode='',receiptCode='',submissionId=crypto.randomUUID(),adminId='',adminOffset=0;
 let serial=0,controller=new AbortController();
 const date=value=>new Intl.DateTimeFormat('cs-CZ',{timeZone:'Europe/Prague',day:'numeric',month:'numeric',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(value));
 const element=(tag,className,text)=>{const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;};
 function error(target,message){target.textContent=message||'';target.hidden=!message;}
 async function api(path,data,method){
  let response;try{response=await fetch(API+path,{method:method||(data===undefined?'GET':'POST'),headers:data===undefined?{}:{'Content-Type':'application/json'},body:data===undefined?undefined:JSON.stringify(data),credentials:'same-origin',cache:'no-store',signal:controller.signal});}catch(e){if(e.name==='AbortError')throw e;throw Error('Spojení se schránkou se přerušilo. Zadaný text si ponechte a zkuste to znovu.');}
  let result;try{result=await response.json();}catch{throw Error('Spojení se schránkou se přerušilo. Zadaný text si ponechte a zkuste to znovu.');}
  if(!response.ok){const failure=Error(result.error||'Požadavek se nepodařilo dokončit.');failure.status=response.status;throw failure;}
  return result;
 }
 const busy=(button,value,label)=>{button.disabled=value;if(label){if(value){button.dataset.originalLabel=button.textContent;button.textContent=label;}else button.textContent=button.dataset.originalLabel||button.textContent;}};
 function setTab(tab){
  currentTab=tab;serial++;
  for(const name of ['new','conversation','admin'])$('#trust-'+name).hidden=name!==tab;
  $$('.trust-tabs [role=tab]').forEach(button=>{const selected=button.dataset.trustTab===tab;button.setAttribute('aria-selected',String(selected));button.tabIndex=selected?0:-1;});
  $('.trust-tabs').hidden=tab==='admin';$('#trust-show-admin').hidden=tab==='admin';$('#trust-back-from-admin').hidden=tab!=='admin';
  if(tab==='admin')loadAdmin();
 }
 $$('.trust-tabs button').forEach(button=>button.addEventListener('click',()=>setTab(button.dataset.trustTab)));
 $('.trust-tabs').addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const tab=event.key==='Home'?'new':event.key==='End'?'conversation':currentTab==='new'?'conversation':'new';setTab(tab);$('[data-trust-tab="'+tab+'"]').focus();});
 $('#trust-show-admin').addEventListener('click',()=>setTab('admin'));$('#trust-back-from-admin').addEventListener('click',()=>setTab('new'));
 async function service(){
  const notice=$('.trust-service-status');
  const showStatus=message=>{error(notice,message);error($('.trust-submit-status'),message);};
  try{const state=await api('/status');ready=state.ready;showStatus(ready?'':(state.message||'Schránka se připravuje. Správce musí dokončit její nastavení.'));}
  catch(e){if(e.name==='AbortError')return;ready=false;showStatus(e.status===401?'Přihlášení do rozcestníku vypršelo. Pro odeslání se znovu přihlaste. Před obnovením stránky si zkopírujte rozepsaný text.':'Schránku se nepodařilo připojit. Zadaný text zůstane ve formuláři; zkuste to prosím později.');}
  $$('#trust-create-form button[type=submit],#trust-lookup-form button[type=submit],#trust-admin-login-form button[type=submit]').forEach(button=>button.disabled=!ready);
 }
 // Observe the open attribute: older Safari versions do not emit dialog toggle events.
 new MutationObserver(records=>{if(records.some(record=>record.attributeName==='open')&&dialog.open)service();}).observe(dialog,{attributes:true,attributeFilter:['open']});
 dialog.addEventListener('close',()=>{
  controller.abort();controller=new AbortController();serial++;activeCode='';receiptCode='';adminId='';
  $('#trust-personal-thread').replaceChildren();$('#trust-personal-thread').hidden=true;
  $('#trust-access-code').textContent='';$('#trust-receipt').hidden=true;$('#trust-create-form').hidden=false;
  $('#trust-admin-thread').replaceChildren(element('p','trust-muted','Vyberte zprávu ze seznamu.'));$('#trust-case-list').replaceChildren();
  $('#trust-lookup-form').reset();$('#trust-admin-login-form').reset();setTab('new');
 });
 const form=$('#trust-create-form');
 form.addEventListener('input',()=>{submissionId=crypto.randomUUID();$('#trust-message-count').textContent=form.elements.message.value.length.toLocaleString('cs-CZ')+' / 6 000';});
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(!ready)return;const button=form.querySelector('button[type=submit]'),out=form.querySelector('[role=alert]');error(out,'');busy(button,true,'Ukládám zprávu…');
  const values=new FormData(form),data={submissionId,kind:values.get('kind'),subject:values.get('subject'),message:values.get('message'),preference:values.get('preference'),participants:values.getAll('participants'),contact:values.get('contact')};
  try{const result=await api('/create',data);receiptCode=result.code;$('#trust-access-code').textContent=receiptCode;form.reset();submissionId=crypto.randomUUID();$('#trust-message-count').textContent='0 / 6 000';form.hidden=true;$('#trust-receipt').hidden=false;$('#trust-receipt-title').focus();}
  catch(e){if(e.name!=='AbortError')error(out,e.message);}
  finally{busy(button,false);}
 });
 $('#trust-copy-code').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(receiptCode);$('#trust-copy-status').textContent='Kód je zkopírovaný.';}catch{$('#trust-copy-status').textContent='Kód zkopírujte ručně z pole výše.';}});
 $('#trust-open-receipt').addEventListener('click',()=>{activeCode=receiptCode;setTab('conversation');openConversation(activeCode);});
 async function openConversation(code){
  const out=$('#trust-lookup-form').parentElement.querySelector('[role=alert]'),panel=$('#trust-personal-thread'),revision=++serial;error(out,'');panel.hidden=true;panel.replaceChildren();
  try{const result=await api('/conversation',{code});if(revision!==serial||!dialog.open)return;activeCode=code;renderThread(panel,result.conversation,false);panel.hidden=false;panel.scrollIntoView({block:'start',behavior:'auto'});}
  catch(e){if(e.name!=='AbortError')error(out,e.message);}
 }
 $('#trust-lookup-form').addEventListener('submit',async event=>{event.preventDefault();const button=event.target.querySelector('button');busy(button,true,'Otevírám…');try{await openConversation(event.target.elements.code.value);}finally{busy(button,false);}});
 function renderThread(panel,record,admin){
  panel.replaceChildren();const top=element('div','trust-thread-header');top.append(element('span','trust-eyebrow',kindLabels[record.kind]),element('span','trust-status trust-status-'+record.status,statuses[record.status]));panel.append(top,element('h3','',record.subject));
  const facts=element('dl','trust-facts');for(const [term,value] of [['Přání pro další postup',preferences[record.preference]],['Koho si přejete zapojit',record.participants.length?record.participants.map(p=>names[p]).join(', '):'Výběr zatím otevřený'],['Dobrovolný kontakt',record.contact||'Neuveden']]){facts.append(element('dt','',term),element('dd','',value));}panel.append(facts);
  if(admin){
   const codeBox=element('div','trust-section'),caption=element('strong','','Soukromý přístupový kód');codeBox.append(caption);
   if(record.accessCode){const code=element('code','trust-access-code',record.accessCode);codeBox.append(code);}
   else codeBox.append(element('p','trust-muted','U tohoto staršího podnětu nebyl kód uložen pro zobrazení správci. Původní kód odesílatele zůstává platný.'));
   panel.append(codeBox);
  }
  if(admin){const controls=element('div','trust-status-controls'),label=element('label','','Stav podnětu'),select=element('select');Object.entries(statuses).forEach(([value,title])=>{const option=element('option','',title);option.value=value;select.append(option);});select.value=record.status;label.append(select);const save=element('button','secondary-action','Uložit stav');save.type='button';const out=element('p','trust-form-error');out.setAttribute('role','alert');out.hidden=true;save.addEventListener('click',async()=>{busy(save,true,'Ukládám…');try{const result=await api('/admin/cases/'+record.id+'/status',{status:select.value});renderThread(panel,result.conversation,true);await loadCases(true);}catch(e){if(e.name!=='AbortError')error(out,e.message);}finally{busy(save,false);}});controls.append(label,save,out);panel.append(controls);
   if(record.status==='resolved'){
    const remove=element('button','secondary-action trust-delete','Smazat vyřešený podnět');remove.type='button';
    remove.addEventListener('click',async()=>{
     if(!window.confirm('Trvale smazat tento vyřešený podnět včetně celé konverzace? Smazání nelze vrátit a přístupový kód přestane fungovat.'))return;
     error(out,'');busy(remove,true,'Mažu podnět…');
     try{await api('/admin/cases/'+record.id+'/delete',{confirm:true});serial++;adminId='';panel.replaceChildren(element('p','trust-muted','Vyřešený podnět byl smazán včetně celé konverzace.'));await loadCases(true);}
     catch(e){if(e.name!=='AbortError')error(out,e.message);}
     finally{busy(remove,false);}
    });controls.insertBefore(remove,out);
   }
  }
  const messages=element('div','trust-messages');record.messages.forEach(message=>{const article=element('article','trust-message trust-message-'+message.author),meta=element('div','trust-message-meta');const time=element('time','',date(message.created_at));time.dateTime=new Date(message.created_at).toISOString();meta.append(element('strong','',message.author==='team'?'Tým schránky':'Vaše zpráva'),time);article.append(meta,element('p','trust-message-text',message.body));messages.append(article);});panel.append(messages);
  if(!admin&&!record.messages.some(message=>message.author==='team'))panel.append(element('p','trust-muted','Tým zatím neodpověděl. Odpověď najdete zde po opětovném vložení kódu.'));
  const replyForm=element('form','trust-reply-form'),label=element('label','trust-field'),caption=element('span','',admin?'Odpověď učiteli / učitelce':'Chcete něco doplnit?'),textarea=element('textarea');textarea.name='message';textarea.rows=5;textarea.maxLength=4000;textarea.required=true;label.append(caption,textarea);const button=element('button','primary',admin?'Odeslat odpověď':'Odeslat doplnění');button.type='submit';const out=element('p','trust-form-error');out.hidden=true;out.setAttribute('role','alert');replyForm.append(label,button,out);replyForm.addEventListener('submit',async event=>{event.preventDefault();busy(button,true,'Odesílám…');error(out,'');try{const result=await api(admin?'/admin/cases/'+record.id+'/reply':'/conversation/reply',admin?{message:textarea.value}:{code:activeCode,message:textarea.value});renderThread(panel,result.conversation,admin);if(admin)await loadCases(true);}catch(e){if(e.name!=='AbortError')error(out,e.message);}finally{busy(button,false);}});panel.append(replyForm);
 }
 async function loadAdmin(){
  const login=$('#trust-admin-login-panel'),workspace=$('#trust-admin-workspace');login.hidden=true;workspace.hidden=true;
  try{const state=await api('/status');if(currentTab!=='admin')return;if(state.admin){workspace.hidden=false;await loadCases(true);}else login.hidden=false;}
  catch(e){if(e.name!=='AbortError'){login.hidden=false;error(login.querySelector('[role=alert]'),e.message);}}
 }
 $('#trust-admin-login-form').addEventListener('submit',async event=>{event.preventDefault();const button=event.target.querySelector('button'),out=event.target.parentElement.querySelector('[role=alert]');busy(button,true,'Přihlašuji…');error(out,'');try{await api('/admin/login',{password:event.target.elements.password.value});event.target.reset();await loadAdmin();}catch(e){if(e.name!=='AbortError')error(out,e.message);}finally{busy(button,false);}});
 async function loadCases(reset=false){
  const out=$('.trust-admin-error'),revision=serial;error(out,'');if(reset)adminOffset=0;
  try{const result=await api('/admin/cases?status='+encodeURIComponent($('#trust-admin-filter').value)+'&offset='+adminOffset);if(revision!==serial||currentTab!=='admin')return;const list=$('#trust-case-list');if(reset)list.replaceChildren();if(reset&&!result.cases.length)list.append(element('p','trust-muted','V této kategorii zatím nejsou žádné zprávy.'));result.cases.forEach(record=>{const button=element('button','trust-case-item');button.type='button';button.dataset.caseId=record.id;button.setAttribute('aria-pressed',String(record.id===adminId));button.append(element('span','trust-status trust-status-'+record.status,statuses[record.status]),element('strong','',record.subject),element('small','',kindLabels[record.kind]+' · '+date(record.updated_at)));if(record.last_author==='teacher')button.append(element('small','trust-new-message','Poslední zpráva od učitele / učitelky'));button.addEventListener('click',async()=>{const current=++serial;adminId=record.id;try{const result=await api('/admin/cases/'+record.id);if(current!==serial||currentTab!=='admin')return;renderThread($('#trust-admin-thread'),result.conversation,true);$$('.trust-case-item').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.caseId===adminId)));if(matchMedia('(max-width:899px)').matches)$('#trust-admin-thread').scrollIntoView({block:'start',behavior:'auto'});}catch(e){if(e.name!=='AbortError')error(out,e.message);}});list.append(button);});adminOffset+=result.cases.length;$('#trust-admin-more').hidden=!result.hasMore;}
  catch(e){if(e.name==='AbortError')return;error(out,e.message);if(e.status===401){$('#trust-admin-workspace').hidden=true;$('#trust-admin-login-panel').hidden=false;}}
 }
 $('#trust-admin-filter').addEventListener('change',()=>loadCases(true));$('#trust-admin-refresh').addEventListener('click',()=>loadCases(true));$('#trust-admin-more').addEventListener('click',()=>loadCases());
 $('#trust-admin-logout').addEventListener('click',async()=>{try{await api('/admin/logout',{});$('#trust-case-list').replaceChildren();$('#trust-admin-thread').replaceChildren();adminId='';await loadAdmin();}catch(e){if(e.name!=='AbortError')error($('.trust-admin-error'),e.message);}});
})();
