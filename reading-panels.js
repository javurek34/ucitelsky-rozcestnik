/* Break reading pages into small illustrated groups without rewriting their copy. */
function prepareReadingPanels(){
 const iconFor=(text)=>{
  const rules=[[/úraz|pomoc|pojiště|zdrav/i,'medical'],[/dohled|bezpeč|prevenc|kontrol/i,'eye'],[/doporuč|formul|zápis|dokument|pracovní list/i,'file'],[/vztah|laskav|hodnot|emo|respekt/i,'heart'],[/tříd|komunit|komunik|spolupr|poradensk/i,'ruzne-people'],[/termín|plán|akce|exkurz|kdy/i,'calendar'],[/ipad|zařízení|technick/i,'tablet'],[/pravid|ochran|osobní|rizik/i,'shield'],[/výuk|učení|učiv|procvič|materiál/i,'book']];
  return rules.find(([pattern])=>pattern.test(text))?.[1]||'tool';
 };
 const makeIcon=name=>{const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('aria-hidden','true');const use=document.createElementNS(svg.namespaceURI,'use');use.setAttribute('href','#i-'+name);svg.append(use);return svg;};
 document.querySelectorAll('dialog.content-dialog').forEach(dialog=>{
  const body=dialog.querySelector('.content-body');if(!body)return;
  body.classList.add('reading-panels');
  const illustration=body.querySelector(':scope>.page-illustration');
  const sections=[...body.querySelectorAll(':scope>section.prose,:scope>.reading-subsection>section.prose')];
  sections.forEach((original,index)=>{
   const keepTogether=Boolean(original.dataset.readingLayout);
   const copy=original.querySelector(':scope>.mosaic-copy')||original;
   const visual=original.querySelector(':scope>.mosaic-visual');
   const heading=copy.querySelector('h3,h4');
   const topic=heading?.textContent||dialog.querySelector('h2').textContent;
   let nodes=[...copy.childNodes].filter(n=>n.nodeType===1||n.textContent.trim());
   // Lists stay lists; split long ones at item boundaries, preserving numbering.
   nodes=nodes.flatMap(node=>{
    if(keepTogether||node.nodeType!==1||!node.matches('ol,ul')||node.children.length<5)return [node];
    const result=[];let list=null;
    [...node.children].forEach((li,i)=>{
     if(i%3===0){list=node.cloneNode(false);if(result.length)list.removeAttribute('id');if(node.matches('ol'))list.start=(Number(node.getAttribute('start'))||1)+i;result.push(list);}
     list.append(li);
    });return result;
   });
   const groups=[];let current=[],length=0;
   nodes.forEach(node=>{
    const size=node.textContent.length;
    const boundary=node.nodeType===1&&node.matches('h3,h4');
    const last=current[current.length-1];
    const danglingHeading=last?.nodeType===1&&last.matches('h3,h4');
    if(current.length&&!danglingHeading&&(boundary||length+size>650)){
     groups.push(current);current=[];length=0;
    }
    current.push(node);length+=size;
   });if(current.length)groups.push(current);
   if(keepTogether)groups.splice(0,groups.length,nodes);
   groups.forEach((group,part)=>{
    const box=document.createElement('section');box.className='prose reading-box';
    if(original.dataset.readingLayout==='wide')box.classList.add('reading-wide');
    if(part===0&&original.id)box.id=original.id;
    if(original.classList.contains('quick-start'))box.classList.add('reading-quick');
    if(part>0)box.setAttribute('aria-label',topic+' – pokračování');
    const art=document.createElement('div');art.className='reading-art';art.setAttribute('aria-hidden','true');
    if(visual){const mark=visual.firstElementChild?.cloneNode(true);if(mark){mark.removeAttribute('width');mark.removeAttribute('height');if(mark.matches('img'))mark.alt='';art.append(mark);}art.style.setProperty('--art-tint',original.style.getPropertyValue('--mosaic-color'));}
    else if(index===0&&part===0&&illustration){art.classList.add('reading-illustration');const image=illustration.querySelector('img');image.loading='eager';art.append(image);}
    else art.append(makeIcon(iconFor(group.find(n=>n.matches?.('h3,h4'))?.textContent||topic)));
    if(dialog.id==='ruzne-dialog'&&original.id==='ruzne-vividbooks')art.classList.add('reading-art-dark');
    const text=document.createElement('div');text.className='reading-copy';group.forEach(node=>{text.append(node,document.createTextNode('\n'));});box.append(art,text);
    if(group.some(n=>n.nodeType===1&&n.matches('table,.gemini-comparison')))box.classList.add('reading-wide');
    original.parentElement.insertBefore(box,original);
   });original.remove();
  });
  illustration?.remove();body.classList.remove('has-painting');
 });
}
