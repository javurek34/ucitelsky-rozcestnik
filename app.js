const $=s=>document.querySelector(s);
const base=[
{id:'hodnoty',title:'Hodnoty školy',icon:'heart',url:null,content:'hodnoty'},
{id:'uraz',title:'Úrazy',icon:'medical',url:null,content:'uraz'},
{id:'dohledy',title:'Dohledy',icon:'eye',url:null,content:'dohledy'},
{id:'ipady',title:'iPady',icon:'tablet',url:null,content:'ipady'},
{id:'kodex-ai',title:'Kodex AI',icon:'shield',url:null},
{id:'ai-detem',title:'AI dětem',icon:'book',url:'https://aidetem.cz/'},
{id:'gemini',title:'Gemini',icon:'tool',url:null,content:'gemini'},
{id:'canva',title:'Canva',icon:'tool',url:null,content:'canva'},
{id:'formulare',title:'Formuláře',icon:'file',url:null,content:'formulare'},
{id:'umimeto',title:'umimeto.org',icon:'book',url:null,content:'umimeto'},
{id:'akce',title:'Akce a exkurze',icon:'calendar',url:null,content:'akce'},
{id:'ruzne',title:'Různé',icon:'misc',url:null,content:'ruzne'}
];

const cardColors=['#EFD45A','#EF5848','#80CBA9','#B8DEEC','#C9A2DF','#FFB284','#F0F0E8','#EFD45A','#C9EE73','#B8DEEC','#FFB284','#C9A2DF'];
const brandLogos={'ai-detem':'ai-detem.png',gemini:'gemini-symbol.svg',canva:'canva-circle.svg',umimeto:'umimeto.svg'};
function icon(name){const s=document.createElementNS('http://www.w3.org/2000/svg','svg');const u=document.createElementNS(s.namespaceURI,'use');u.setAttribute('href','#i-'+name);s.append(u);s.setAttribute('aria-hidden','true');return s;}
function clearFan(row){delete row.dataset.active;row.querySelectorAll('.link-card').forEach(card=>delete card.dataset.fan);}
function activateFan(row,active){row.dataset.active='true';let after=false;row.querySelectorAll('.link-card').forEach(card=>{card.dataset.fan=card===active?'active':after?'after':'before';if(card===active)after=true;});}
// Shuffle a varied set once per page load; keep each card steady during navigation.
function createCardPoses(){
 const angles=[-4.2,3.1,-1.6,4.5,.8,-3.3,2.1,-4.7,3.8,-.9,1.5,-2.5];
 for(let i=angles.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[angles[i],angles[j]]=[angles[j],angles[i]];}
 const poses=angles.map(angle=>({angle:(angle+(Math.random()-.5)*.4).toFixed(2)+'deg',lift:((Math.random()-.5)*6).toFixed(1)+'px'}));
 // These neighbouring cards lean in opposite directions on every page load.
 poses[base.findIndex(item=>item.id==='dohledy')].angle=(-2.8+(Math.random()-.5)*.6).toFixed(2)+'deg';
 poses[base.findIndex(item=>item.id==='ipady')].angle=(1.6+(Math.random()-.5)*.6).toFixed(2)+'deg';
 return poses;
}
const cardPoses=createCardPoses();
function render(){
 const root=$('#results');root.replaceChildren();
 let row;
 base.forEach((item,index)=>{
 if(index%4===0){row=document.createElement('div');row.className='card-row';root.append(row);const current=row;current.addEventListener('pointerleave',()=>{const focused=document.activeElement?.closest('.link-card');if(focused&&current.contains(focused))activateFan(current,focused);else clearFan(current);});current.addEventListener('focusout',event=>{if(!current.contains(event.relatedTarget))clearFan(current);});}
 const owner=row;
 const card=document.createElement('article');card.dataset.cardId=item.id;card.className='link-card'+(item.content?'':' pending');card.style.setProperty('--card-color',cardColors[index]);card.style.setProperty('--angle',cardPoses[index].angle);card.style.setProperty('--lift',cardPoses[index].lift);
 const main=document.createElement('button');main.className='card-main';main.type='button';main.setAttribute('aria-haspopup','dialog');main.setAttribute('aria-label',item.title+(item.content?'':' – připravujeme'));main.onclick=()=>cardPages.open(item,card);
 const top=document.createElement('span');top.className='card-top';const visual=document.createElement('span');visual.className='card-visual';if(brandLogos[item.id]){visual.classList.add('brand-visual');visual.dataset.brand=item.id;const image=document.createElement('img');image.src='assets/logos/'+brandLogos[item.id];image.alt='';image.width=64;image.height=64;image.decoding='async';visual.append(image);}else{visual.append(icon(item.icon));}top.append(visual);
 const title=document.createElement('span');title.className='card-title';title.textContent=item.title;if(item.id==='ipady'){title.classList.add('ipad-wordmark');title.textContent='iPADY';}
 main.append(top,title);card.append(main);owner.append(card);card.addEventListener('pointerenter',event=>{if(event.pointerType!=='touch')activateFan(owner,card);});card.addEventListener('focusin',()=>activateFan(owner,card));
 });
}
$('#close-formulare').onclick=$('#formulare-ok').onclick=cardPages.requestClose;
$('#close-pending').onclick=$('#pending-ok').onclick=cardPages.requestClose;
$('#close-dohledy').onclick=$('#dohledy-ok').onclick=cardPages.requestClose;
$('#close-akce').onclick=$('#akce-ok').onclick=cardPages.requestClose;
$('#close-ruzne').onclick=$('#ruzne-ok').onclick=cardPages.requestClose;
$('#close-ipady').onclick=$('#ipady-ok').onclick=cardPages.requestClose;
$('#close-hodnoty').onclick=$('#hodnoty-ok').onclick=cardPages.requestClose;
$('#close-uraz').onclick=$('#uraz-ok').onclick=cardPages.requestClose;
$('#close-umimeto').onclick=$('#umimeto-ok').onclick=cardPages.requestClose;
$('#close-canva').onclick=$('#canva-ok').onclick=cardPages.requestClose;
$('#close-gemini').onclick=$('#gemini-ok').onclick=cardPages.requestClose;
document.querySelectorAll('[data-umime-jump]').forEach(button=>button.addEventListener('click',()=>{const target=document.getElementById(button.dataset.umimeJump);target.querySelector('h3').focus({preventScroll:true});target.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});}));
$('.brand').addEventListener('click',e=>{e.preventDefault();window.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});});
render();
cardPages.init(base);

// Finish the marker stroke before drawing the handwritten oval.
(()=>{
 const marker=document.querySelector('#page-title .subtitle-highlight');
 const circle=document.querySelector('#page-title .subtitle-circle');
 if(!marker||!circle||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const draw=()=>{circle.classList.remove('is-waiting');circle.classList.add('is-drawing');};
 const stroke=marker.getAnimations?.().find(animation=>animation.animationName==='subtitle-marker');
 if(!stroke||stroke.playState==='finished'){draw();return;}
 circle.classList.add('is-waiting');
 stroke.finished.then(draw,draw);
})();

// Shortcuts stay within the open page; focus follows the reading position.
document.querySelectorAll('[data-page-jump]').forEach(button=>{
 button.addEventListener('click',()=>{
  const target=document.getElementById(button.dataset.pageJump);
  if(!target)return;
  const heading=target.querySelector('h3');
  if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}
  target.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
 });
});
