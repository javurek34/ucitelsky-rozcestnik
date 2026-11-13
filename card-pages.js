/* Card-to-page navigation, including the reverse trip and browser history. */
const cardPages=(()=>{
 let active=null,items=[],routeRevision=0;
 const pendingArt={"ai-detem": {"src": "assets/mono/ai-detem.webp", "width": 1300, "height": 1210}, "formulare": {"src": "assets/mono/formulare.webp", "width": 1322, "height": 1190}, "gemini": {"src": "assets/mono/gemini-chatbot.webp", "width": 1536, "height": 1024}};
 const pageArtwork={'agenda-ucitele':'assets/undraw-team-spirit.svg',hodnoty:'assets/mono/hodnoty.webp',uraz:'assets/mono/uraz.webp',dohledy:'assets/mono/dohledy.webp',ipady:'assets/mono/ipady.webp','kodex-ai':'assets/undraw-artificial-intelligence.svg','ai-detem':'assets/mono/ai-detem.webp',gemini:'assets/mono/gemini-chatbot.webp',canva:'assets/mono/canva-worksheet.webp',formulare:'assets/mono/formulare.webp',umimeto:'assets/mono/umimeto.webp',akce:'assets/mono/akce.webp',ruzne:'assets/undraw-team-spirit.svg'};
 const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 function play(owner,target,frames,options){
  const animation=target.animate(frames,{fill:'both',...options});
  owner.animations.push(animation);
  return animation.finished.catch(()=>{});
 }
 function clearAnimations(owner){owner.animations.forEach(a=>a.cancel());owner.animations=[];}
 function makeTunnel(ctx,host=ctx.dialog){
  const rect=ctx.card.getBoundingClientRect();
  const clone=document.createElement('div');clone.className='tunnel-card tunnel-flip-card';clone.setAttribute('aria-hidden','true');
  Object.assign(clone.style,{left:rect.left+'px',top:rect.top+'px',width:rect.width+'px',height:rect.height+'px'});
  clone.style.setProperty('--turn-color',ctx.color);
  const turner=document.createElement('div');turner.className='tunnel-turner';
  const front=document.createElement('div');front.className='tunnel-face tunnel-front';
  const back=document.createElement('div');back.className='tunnel-face tunnel-back';
  const contents=document.createElement('div');contents.className='tunnel-card-contents';
  const visual=ctx.card.querySelector('.card-visual').cloneNode(true);
  visual.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));
  const title=document.createElement('span');title.className='tunnel-title';title.textContent=ctx.item.title;if(ctx.item.id==='ipady'){title.classList.add('ipad-wordmark');title.textContent='iPADY';}
  contents.append(visual,title);front.append(contents);turner.append(front,back);clone.append(turner);host.append(clone);
  return {clone,turner,contents,rect};
 }
 async function enter(ctx){
  const {dialog,shell,surface}=ctx;
  if(!ctx.card.classList.contains('folder-entry')&&!reduced()&&typeof dialog.animate==='function'){
   const tunnel=makeTunnel(ctx);ctx.card.style.visibility='hidden';
   await play(ctx,tunnel.turner,[{transform:'rotateY(0deg)'},{transform:'rotateY(180deg)'}],{duration:420,easing:'cubic-bezier(.4,0,.2,1)'});
   tunnel.turner.style.transform='rotateY(180deg)';
   await play(ctx,tunnel.clone,[
    {left:tunnel.rect.left+'px',top:tunnel.rect.top+'px',width:tunnel.rect.width+'px',height:tunnel.rect.height+'px',opacity:1,borderRadius:'10px'},
    {left:'0px',top:'0px',width:innerWidth+'px',height:innerHeight+'px',opacity:1,borderRadius:'0px'}
   ],{duration:300,easing:'cubic-bezier(.3,.05,.2,1)'});
   // Only the card's colored back expands; page content follows after it lands.
   surface.style.opacity='1';tunnel.clone.remove();shell.style.opacity='1';
   const sections=[...shell.querySelectorAll('.content-header,.dialog-header,.content-body section,.content-body figure,.pending-label,.pending-copy,.pending-illustration:not([hidden]),.content-actions,.dialog-actions')];
   await Promise.all((sections.length?sections:[shell]).map((part,index)=>play(ctx,part,[
    {opacity:0,transform:'translateY(14px)'},{opacity:1,transform:'translateY(0)'}
   ],{duration:240,delay:20+Math.min(index,6)*35,easing:'cubic-bezier(.2,.7,.2,1)'})));
  }
  surface.style.opacity='1';shell.style.opacity='1';shell.style.transform='none';clearAnimations(ctx);
  ctx.card.style.visibility=ctx.originalVisibility;shell.inert=false;
  if(!ctx.skipFocus)dialog.querySelector('h2').focus({preventScroll:true});
 }
 function open(item,card,push=true){
  if(active)return;
  const dialog=document.getElementById(item.content?item.content+'-dialog':'pending-dialog');
  if(!item.content){
   document.getElementById('pending-title').textContent=item.title;
   const figure=dialog.querySelector('.pending-illustration'),image=figure.querySelector('img'),art=pendingArt[item.id];
   figure.hidden=!art;dialog.dataset.hasIllustration=String(Boolean(art));
   if(art){image.src=art.src;image.width=art.width;image.height=art.height;}else image.removeAttribute('src');
  }
  const color=card.style.getPropertyValue('--card-color').trim();
  const ctx={dialog,card,item,color,shell:dialog.querySelector('.page-shell'),surface:dialog.querySelector('.page-surface'),originalVisibility:card.style.visibility,animations:[],skipFocus:false};
  active=ctx;dialog.style.setProperty('--page-accent',color);
  ctx.surface.style.setProperty('--page-art','url("'+pageArtwork[item.id]+'")');
  const holder=dialog.querySelector('.page-icon');holder.replaceChildren(card.querySelector('.card-visual').cloneNode(true));
  ctx.shell.inert=true;ctx.shell.style.opacity='0';ctx.surface.style.opacity='0';
  document.documentElement.classList.add('card-page-open');dialog.showModal();
  dialog.scrollTop=0;ctx.shell.scrollTop=0;
  if(push)history.pushState({...history.state,cardPage:item.id},'',location.pathname+location.search+'#'+item.id);
  ctx.opening=enter(ctx);
 }
 function close(){
  const ctx=active;if(!ctx)return Promise.resolve();if(ctx.closing)return ctx.closing;
  ctx.skipFocus=true;
  ctx.closing=(async()=>{
   await ctx.opening;ctx.shell.inert=true;
   let cover=null,shield=null;
   const frame=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
   try{
    if(!ctx.card.classList.contains('folder-entry')&&!reduced()&&typeof ctx.dialog.animate==='function'){
     document.documentElement.classList.add('card-returning');
     // The return is a colored-back collapse followed by a flip to the front.
     cover=document.createElement('div');cover.className='tunnel-card';cover.setAttribute('aria-hidden','true');
     Object.assign(cover.style,{left:'0px',top:'0px',width:innerWidth+'px',height:innerHeight+'px',background:ctx.color,border:'0',borderRadius:'0px',zIndex:'0'});
     ctx.dialog.append(cover);
     await play(ctx,ctx.shell,[{opacity:1},{opacity:0}],{duration:80,easing:'ease-out'});
     ctx.shell.style.opacity='0';
     Object.assign(cover.style,{zIndex:'10001'});document.body.append(cover);
     shield=document.createElement('div');shield.className='tunnel-return-shield';shield.setAttribute('aria-hidden','true');document.body.append(shield);
     ctx.dialog.close();document.documentElement.classList.remove('card-page-open');
     ctx.card.style.visibility=ctx.originalVisibility;
     ctx.card.querySelector('.card-main').focus({preventScroll:true});
     const rect=ctx.card.getBoundingClientRect();
     const landing=makeTunnel(ctx,document.body);
     Object.assign(landing.clone.style,{left:'0px',top:'0px',width:innerWidth+'px',height:innerHeight+'px',opacity:'1',borderRadius:'0px',zIndex:'10001'});
     landing.turner.style.transform='rotateY(180deg)';
     cover.remove();cover=landing.clone;ctx.card.style.visibility='hidden';
     await play(ctx,cover,[
      {left:'0px',top:'0px',width:innerWidth+'px',height:innerHeight+'px',opacity:1,borderRadius:'0px'},
      {left:rect.left+'px',top:rect.top+'px',width:rect.width+'px',height:rect.height+'px',opacity:1,borderRadius:'10px'}
     ],{duration:300,easing:'cubic-bezier(.22,.78,.2,1)'});
     await play(ctx,landing.turner,[{transform:'rotateY(180deg)'},{transform:'rotateY(0deg)'}],{duration:420,easing:'cubic-bezier(.4,0,.2,1)'});
     landing.turner.style.transform='rotateY(0deg)';
     // Paint the real card underneath the identical cover before removing it.
     ctx.card.style.visibility=ctx.originalVisibility;
     await frame();cover.remove();cover=null;
    }
   }finally{
    // Commit hidden page styles before cancelling their animation fills.
    ctx.shell.style.opacity='0';ctx.surface.style.opacity='0';
    clearAnimations(ctx);if(ctx.dialog.open)ctx.dialog.close();
    ctx.card.style.visibility=ctx.originalVisibility;cover?.remove();shield?.remove();
    document.documentElement.classList.remove('card-page-open','card-returning');active=null;
    ctx.card.querySelector('.card-main').focus({preventScroll:true});
   }
  })();return ctx.closing;
 }
 function requestClose(){
  if(!active)return;
  if(history.state?.cardPage===active.item.id){history.back();}
  else{history.replaceState(history.state,'',location.pathname+location.search);close();}
 }
 async function syncRoute(){
  const revision=++routeRevision;
  const item=items.find(item=>'#'+item.id===location.hash);
  if(active?.item.id===item?.id)return;
  await close();if(revision!==routeRevision||!item)return;
  const card=document.querySelector(`[data-card-id="${item.id}"]`);if(card)open(item,card,false);
 }
 function init(list,groups=[]){
  items=list;
  for(const dialog of document.querySelectorAll('dialog')){
   dialog.classList.add('card-subpage');
   const surface=document.createElement('div');surface.className='page-surface';surface.setAttribute('aria-hidden','true');
   const shell=document.createElement('div');shell.className='page-shell';shell.append(...dialog.childNodes);dialog.append(surface,shell);
   const header=shell.querySelector('.content-header,.dialog-header'),title=header.querySelector('h2');title.tabIndex=-1;
   const navigation=document.createElement('details');navigation.className='page-navigation';
   const menuToggle=document.createElement('summary');menuToggle.className='page-navigation-toggle';menuToggle.setAttribute('aria-label','Navigace webu');
   menuToggle.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg><span>Menu</span>';
   const menu=document.createElement('nav');menu.className='page-navigation-menu';menu.setAttribute('aria-label','Sekce rozcestníku');
   let menuAnimation=null,menuWanted=false,menuRevision=0;
   menuToggle.setAttribute('aria-expanded','false');
   async function setMenuOpen(wanted){
    const revision=++menuRevision;menuWanted=wanted;menuToggle.setAttribute('aria-expanded',String(wanted));
    const wasOpen=navigation.open;
    if(!wasOpen&&!wanted)return;
    const current=wasOpen?getComputedStyle(menu):null;
    const start=wasOpen?{opacity:current.opacity,transform:current.transform,clipPath:current.clipPath}:{opacity:0,transform:'translateY(-16px)',clipPath:'inset(0 0 100% 0 round 16px)'};
    menuAnimation?.cancel();navigation.open=true;menu.inert=!wanted;
    if(reduced()||!dialog.open){navigation.open=wanted;return;}
    const end=wanted?{opacity:1,transform:'translateY(0)',clipPath:'inset(0 0 0 0 round 16px)'}:{opacity:0,transform:'translateY(-16px)',clipPath:'inset(0 0 100% 0 round 16px)'};
    const animation=menu.animate([start,end],{duration:wanted?260:200,easing:wanted?'cubic-bezier(.2,.8,.2,1)':'cubic-bezier(.4,0,.8,.2)',fill:'both'});menuAnimation=animation;
    await animation.finished.catch(()=>{});if(revision!==menuRevision)return;
    navigation.open=wanted;animation.cancel();menuAnimation=null;
   }
   menuToggle.addEventListener('click',event=>{event.preventDefault();setMenuOpen(!menuWanted);});
   dialog.addEventListener('close',()=>{++menuRevision;menuAnimation?.cancel();menuAnimation=null;menuWanted=false;navigation.open=false;menuToggle.setAttribute('aria-expanded','false');});
   const home=document.createElement('a');home.href='./';home.className='page-navigation-home';home.textContent='Úvodní rozcestník';home.addEventListener('click',async event=>{event.preventDefault();await setMenuOpen(false);if(dialog.open)requestClose();});menu.append(home);
   groups.forEach(group=>{
    const column=document.createElement('div');column.className='page-navigation-group';
    const homeGroup=[...document.querySelectorAll('.folder-stack')].find(section=>section.querySelector('h2')?.textContent===group.title);
    if(homeGroup)[...homeGroup.classList].filter(name=>name.startsWith('group-')).forEach(name=>column.classList.add(name));
    const label=document.createElement('h3');label.className='folder-group-title';label.textContent=group.title;column.append(label);
    const links=document.createElement('ul');
    group.ids.forEach(id=>{
     const item=list.find(item=>item.id===id);if(!item)return;
     const li=document.createElement('li'),link=document.createElement('a');link.href='#'+id;
     const originalIcon=document.querySelector(`[data-card-id="${id}"] .folder-symbol`);
     if(originalIcon){const icon=originalIcon.cloneNode(true);icon.className='page-navigation-icon';link.append(icon);if(id==='akce')icon.classList.add('navigation-trip-icon');}
     const text=document.createElement('span');text.className='page-navigation-label';text.textContent=item.title;link.append(text);
     const arrow=document.createElement('span');arrow.className='page-navigation-arrow';arrow.textContent='→';arrow.setAttribute('aria-hidden','true');link.append(arrow);
     link.addEventListener('click',async event=>{event.preventDefault();await setMenuOpen(false);if(!dialog.open)return;if(active?.item.id===id){menuToggle.focus();return;}
      const state=history.state?.cardPage?{...history.state,cardPage:id}:history.state;
      history.replaceState(state,'',location.pathname+location.search+'#'+id);syncRoute();
     });li.append(link);links.append(li);
    });column.append(links);menu.append(column);
   });
   navigation.append(menuToggle,menu);shell.insertBefore(navigation,header);
   navigation.addEventListener('toggle',()=>{if(navigation.open){menu.querySelectorAll('a').forEach(link=>{if(link.hash&&link.hash===location.hash)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');});}});
   dialog.addEventListener('click',event=>{if(menuWanted&&!navigation.contains(event.target))setMenuOpen(false);});
   const heading=document.createElement('div');heading.className='page-heading';
   const icon=document.createElement('span');icon.className='page-icon';icon.setAttribute('aria-hidden','true');
   heading.append(icon,title);header.prepend(heading);
   dialog.addEventListener('cancel',event=>{event.preventDefault();if(navigation.open){setMenuOpen(false).then(()=>{if(dialog.open)menuToggle.focus();});}else requestClose();});
  }
  addEventListener('popstate',syncRoute);addEventListener('hashchange',syncRoute);syncRoute();
 }
 return {open,requestClose,init};
})();
