/* Card-to-page navigation, including the reverse trip and browser history. */
const cardPages=(()=>{
 let active=null,items=[],routeRevision=0;
 const pendingArt={"ai-detem": {"src": "assets/mono/ai-detem.webp", "width": 1300, "height": 1210}, "formulare": {"src": "assets/mono/formulare.webp", "width": 1322, "height": 1190}, "gemini": {"src": "assets/mono/gemini-chatbot.webp", "width": 1536, "height": 1024}};
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
  if(!reduced()&&typeof dialog.animate==='function'){
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
    if(!reduced()&&typeof ctx.dialog.animate==='function'){
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
 function init(list){
  items=list;
  for(const dialog of document.querySelectorAll('dialog')){
   dialog.classList.add('card-subpage');
   const surface=document.createElement('div');surface.className='page-surface';surface.setAttribute('aria-hidden','true');
   const shell=document.createElement('div');shell.className='page-shell';shell.append(...dialog.childNodes);dialog.append(surface,shell);
   const header=shell.querySelector('.content-header,.dialog-header'),title=header.querySelector('h2');title.tabIndex=-1;
   const back=document.createElement('button');back.type='button';back.className='page-back';back.setAttribute('aria-label','Zpět na rozcestník');back.title='Zpět na rozcestník';
   const backImage=document.querySelector('.signpost img').cloneNode();backImage.alt='';backImage.removeAttribute('loading');backImage.setAttribute('aria-hidden','true');back.append(backImage);
   back.addEventListener('click',requestClose);shell.insertBefore(back,header);
   const heading=document.createElement('div');heading.className='page-heading';
   const icon=document.createElement('span');icon.className='page-icon';icon.setAttribute('aria-hidden','true');
   heading.append(icon,title);header.prepend(heading);
   dialog.addEventListener('cancel',event=>{event.preventDefault();requestClose();});
  }
  addEventListener('popstate',syncRoute);addEventListener('hashchange',syncRoute);syncRoute();
 }
 return {open,requestClose,init};
})();
