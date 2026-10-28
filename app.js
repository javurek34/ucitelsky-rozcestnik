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
const folderGroups=[
 {title:'Život školy',note:'Lidé, pravidla a každodenní provoz',ids:['hodnoty','uraz','dohledy','ipady']},
 {title:'Digitální sborovna',note:'Inspirace a nástroje pro výuku',ids:['kodex-ai','ai-detem','gemini','canva']},
 {title:'Po ruce',note:'Podklady, přípravy a užitečné odkazy',ids:['formulare','umimeto','akce','ruzne']}
];
function render(){
 const root=$('#results');root.replaceChildren();
 folderGroups.forEach(group=>{
  const stack=document.createElement('section');stack.className='folder-stack';
  const heading=document.createElement('h2');heading.className='folder-group-title';heading.textContent=group.title;
  const note=document.createElement('p');note.className='folder-group-note';note.textContent=group.note;
  const files=document.createElement('div');files.className='folder-files';stack.append(heading,note,files);root.append(stack);
  group.ids.forEach((id,position)=>{
   const item=base.find(item=>item.id===id),index=base.indexOf(item);
   const folder=document.createElement('article');folder.className='link-card folder-entry'+(item.content?'':' pending');folder.dataset.cardId=item.id;
   folder.style.setProperty('--card-color',cardColors[index]);folder.style.setProperty('--folder-order',position);
   const button=document.createElement('button');button.type='button';button.className='card-main folder-button';button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-label',item.title+(item.content?'':' – připravujeme'));button.onclick=()=>cardPages.open(item,folder);
   const visual=document.createElement('span');visual.className='card-visual folder-symbol';visual.setAttribute('aria-hidden','true');
   if(brandLogos[id]){const img=document.createElement('img');img.src='assets/logos/'+brandLogos[id];img.alt='';img.width=32;img.height=32;visual.append(img);}else visual.append(icon(item.icon));
   const title=document.createElement('span');title.className='card-title folder-title';title.textContent=item.title;
   const arrow=document.createElement('span');arrow.className='folder-arrow';arrow.setAttribute('aria-hidden','true');arrow.append(icon('arrow'));
   button.append(visual,title,arrow);folder.append(button);files.append(folder);
  });
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
prepareReadingPanels();
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
