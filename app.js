const $=s=>document.querySelector(s);
const base=[
{id:'schranka-duvery',title:'Schránka důvěry',icon:'heart',url:null,content:'schranka-duvery'},
{id:'hodnoty',title:'Hodnoty školy',icon:'heart',url:null,content:'hodnoty'},
{id:'uraz',title:'Úrazy',icon:'medical',url:null,content:'uraz'},
{id:'dohledy',title:'Dohledy',icon:'eye',url:null,content:'dohledy'},
{id:'ipady',title:'iPady',icon:'tablet',url:null,content:'ipady'},
{id:'kodex-ai',title:'Kodex AI',icon:'shield',url:null,content:'kodex-ai'},
{id:'aktualne',title:'Aktuálně',icon:'calendar',url:null,content:'aktualne'},
{id:'gemini',title:'Gemini',icon:'tool',url:null,content:'gemini'},
{id:'canva',title:'Canva',icon:'tool',url:null,content:'canva'},
{id:'formulare',title:'Formuláře',icon:'file',url:null,content:'formulare'},
{id:'umimeto',title:'umimeto.org',icon:'book',url:null,content:'umimeto'},
{id:'akce',title:'Akce a exkurze',icon:'calendar',url:null,content:'akce'},
{id:'ruzne',title:'Podpora',icon:'misc',url:null,content:'ruzne'},
{id:'agenda-ucitele',title:'Agenda učitele',icon:'file',url:null,content:'agenda-ucitele'}
];

const cardColors=['#F8F7F4','#263BAA','#F8F7F4','#263BAA','#F8F7F4','#263BAA','#F8F7F4','#263BAA','#F8F7F4','#263BAA','#F8F7F4','#263BAA','#F8F7F4'];
const brandLogos={'kodex-ai':'generative.png',akce:'vylet.png','ai-detem':'ai-detem.png',gemini:'gemini-symbol.svg',canva:'canva-circle.svg',umimeto:'umimeto.svg'};
function icon(name){const s=document.createElementNS('http://www.w3.org/2000/svg','svg');const u=document.createElementNS(s.namespaceURI,'use');u.setAttribute('href','#i-'+name);s.append(u);s.setAttribute('aria-hidden','true');return s;}
const folderGroups=[
 {title:'Život školy',note:'Lidé, pravidla a každodenní provoz',ids:['aktualne','hodnoty','uraz','dohledy','schranka-duvery']},
 {title:'Po ruce',note:'Podklady, přípravy a užitečné odkazy',ids:['agenda-ucitele','akce','ruzne','formulare']},
 {title:'Digitální sborovna',note:'Inspirace a nástroje pro výuku',ids:['kodex-ai','ipady','gemini','canva']}
];
// Match the animated perimeter to native squircle corners, including after resize.
const homeOutlineObserver=new ResizeObserver(entries=>{
 const continuous=true;
 entries.forEach(({target})=>{
  const path=target.querySelector('.folder-hover-outline path');if(!path)return;
  const {width,height}=target.getBoundingClientRect();if(width<2||height<2)return;
  const radius=Math.min(parseFloat(getComputedStyle(target).borderTopLeftRadius)-1,(width-2)/2,(height-2)/2);
  const left=1,top=1,right=width-1,bottom=height-1,power=continuous ? 0.5 : 1;
  const corners=[[right-radius,top+radius,-Math.PI/2],[right-radius,bottom-radius,0],[left+radius,bottom-radius,Math.PI/2],[left+radius,top+radius,Math.PI]];
  let d=`M ${left+radius} ${top} L ${right-radius} ${top}`;
  corners.forEach(([cx,cy,start])=>{
   for(let step=0;step<=24;step++){
    const angle=start+Math.PI/2*step/24,cos=Math.cos(angle),sin=Math.sin(angle);
    const x=cx+radius*Math.sign(cos)*Math.abs(cos)**power,y=cy+radius*Math.sign(sin)*Math.abs(sin)**power;
    d+=` L ${x.toFixed(3)} ${y.toFixed(3)}`;
   }
  });path.setAttribute('d',d+' Z');
 });
});
function render(){
 homeOutlineObserver.disconnect();
 const root=$('#results');root.replaceChildren();
 folderGroups.forEach(group=>{
  const stack=document.createElement('section');stack.className='folder-stack';if(group.title==='Život školy')stack.classList.add('group-zivot-skoly');if(group.title==='Po ruce')stack.classList.add('group-po-ruce');if(group.title==='Digitální sborovna')stack.classList.add('group-digitalni');
  const heading=document.createElement('h2');heading.className='folder-group-title';heading.textContent=group.title;
  const note=document.createElement('p');note.className='folder-group-note';note.textContent=group.note;
  const files=document.createElement('div');files.className='folder-files';stack.append(heading,note,files);root.append(stack);
  group.ids.forEach((id,position)=>{
   const item=base.find(item=>item.id===id),index=base.indexOf(item);
   const folder=document.createElement('article');folder.className='link-card folder-entry'+(item.content?'':' pending');folder.dataset.cardId=item.id;
   folder.style.setProperty('--card-color',cardColors[index%cardColors.length]);folder.style.setProperty('--folder-order',position);
   const button=document.createElement('button');button.type='button';button.className='card-main folder-button';button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-label',item.title+(item.content?'':' – připravujeme'));button.onclick=()=>cardPages.open(item,folder);
   const visual=document.createElement('span');visual.className='card-visual folder-symbol';visual.setAttribute('aria-hidden','true');
   if(brandLogos[id]){const img=document.createElement('img');img.src='assets/logos/'+brandLogos[id];img.alt='';img.width=32;img.height=32;visual.append(img);}else visual.append(icon(item.icon));
   const title=document.createElement('span');title.className='card-title folder-title';title.textContent=item.title;
   const arrow=document.createElement('span');arrow.className='folder-arrow';arrow.setAttribute('aria-hidden','true');arrow.append(icon('arrow'));
   const outline=document.createElementNS('http://www.w3.org/2000/svg','svg');outline.classList.add('folder-hover-outline');outline.setAttribute('aria-hidden','true');outline.setAttribute('focusable','false');
   const outlinePath=document.createElementNS('http://www.w3.org/2000/svg','path');outlinePath.setAttribute('pathLength','1');outline.append(outlinePath);
   button.append(visual,title,arrow,outline);folder.append(button);files.append(folder);homeOutlineObserver.observe(button);
  });
 });
}
$('#close-agenda-ucitele').onclick=$('#agenda-ucitele-ok').onclick=cardPages.requestClose;
$('#close-aktualne').onclick=$('#aktualne-ok').onclick=cardPages.requestClose;
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
$('#close-schranka-duvery').onclick=$('#schranka-duvery-ok').onclick=cardPages.requestClose;
$('#close-kodex-ai').onclick=$('#kodex-ai-ok').onclick=cardPages.requestClose;
document.querySelectorAll('[data-umime-jump]').forEach(button=>button.addEventListener('click',()=>{const target=document.getElementById(button.dataset.umimeJump);target.querySelector('h3').focus({preventScroll:true});target.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});}));
$('.brand').addEventListener('click',e=>{e.preventDefault();window.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});});
render();
prepareReadingPanels();
cardPages.init(base,folderGroups);
prepareSquircleFallback();

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

// Calendar-day countdowns follow the school's timezone, including DST changes.
function updateEventCountdowns(){
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Prague',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
 const part=type=>Number(parts.find(value=>value.type===type).value);
 const today=Date.UTC(part('year'),part('month')-1,part('day'));
 document.querySelectorAll('[data-event-date]').forEach(box=>{
  const [year,month,day]=box.dataset.eventDate.split('-').map(Number);
  const days=Math.round((Date.UTC(year,month-1,day)-today)/86400000);
  const event=box.closest('.upcoming-events>li');
  if(event)event.hidden=days<0;
  if(days<0)return;
  const months=['LED','ÚNR','BŘE','DUB','KVĚ','ČER','ČVC','SRP','ZÁŘ','ŘÍJ','LIS','PRO'];
  let monthLabel=box.querySelector('.event-month');if(!monthLabel){monthLabel=document.createElement('span');monthLabel.className='event-month';box.prepend(monthLabel);}
  monthLabel.textContent=months[month-1];
  const label=days===0?'Dnes':days===1?'Zítra':`za ${days} ${days<5?'dny':'dní'}`;
  const counter=box.querySelector('.event-countdown');if(counter)counter.textContent=label;
 });
 document.querySelectorAll('.upcoming-events').forEach(list=>{
  const hasUpcoming=[...list.children].some(event=>!event.hidden);
  list.hidden=!hasUpcoming;
  let empty=list.nextElementSibling;
  if(!empty?.classList.contains('events-empty')){
   empty=document.createElement('p');empty.className='events-empty';empty.textContent='Další akce připravujeme.';list.after(empty);
  }
  empty.hidden=hasUpcoming;
 });
}
updateEventCountdowns();
setInterval(updateEventCountdowns,60000);
// Refresh immediately when returning to a tab left open overnight.
document.addEventListener('visibilitychange',()=>{if(!document.hidden)updateEventCountdowns();});
addEventListener('pageshow',updateEventCountdowns);
