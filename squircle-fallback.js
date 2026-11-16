/* Nested radii follow their containing surface minus its actual padding. */
function prepareNestedSquircleCorners(){
 const inner='.class-resource-inner,.notes-rule-card,.administrator-topic-card';
 const media='.resource-content-photo,.climate-resource-photo,.ipad-final-image,.classroom-guide-photo,.recommendations-photo,.vividbooks-photo,.forms-docs-image,.grade-video-player';
 const elements=[...document.querySelectorAll(inner+','+media)];
 elements.forEach(element=>{if(element.matches(media))element.classList.add('squircle-media');});
 function parentRadius(element){
  if(element.matches(inner))return nestedRadius(element);
  return parseFloat(getComputedStyle(element).getPropertyValue('--squircle-panel-radius'))||64;
 }
 function nestedRadius(element){
  const parent=element.parentElement.closest('.reading-box,.notes-rule-card,.administrator-topic-card');
  if(!parent)return 8;
  const padding=parseFloat(getComputedStyle(parent).paddingLeft)||0;
  return Math.max(8,parentRadius(parent)-padding);
 }
 const update=()=>elements.forEach(element=>{
  const r=nestedRadius(element);element.style.setProperty('--nested-squircle-radius',r+'px');
  if(element.matches(inner))element.style.setProperty('--squircle-inner-radius',r+'px');
 });
 update();const observer=new ResizeObserver(update);elements.forEach(element=>observer.observe(element));
 addEventListener('resize',update);
}
/* Continuous corners for Safari and other engines without corner-shape. */
function prepareSquircleFallback(){
 prepareNestedSquircleCorners();
 if(CSS.supports('corner-shape','squircle'))return;
 const selector='.folder-button,.card-subpage .reading-box,.notes-rule-card,.administrator-topic-card,.page-navigation-menu,.page-navigation-group a,.squircle-media,#kodex-ai-dialog .ai-intro,#kodex-ai-dialog .ai-accordion';
 const nodes=[...document.querySelectorAll(selector)];
 const home=element=>element.matches('.folder-button');
 const media=element=>element.classList.contains('squircle-media');
 const radius=element=>{
  const style=getComputedStyle(element);
  if(media(element))return parseFloat(style.getPropertyValue('--nested-squircle-radius'))||8;
  if(element.matches('.class-resource-inner,.notes-rule-card,.administrator-topic-card'))return parseFloat(style.getPropertyValue('--squircle-inner-radius'));
  if(element.matches('.reading-box,.ai-intro,.ai-accordion'))return parseFloat(style.getPropertyValue('--squircle-panel-radius'));
  return 32;
 };
 function geometry(width,height,r,inset=0){
  const left=inset,top=inset,right=width-inset,bottom=height-inset;
  r=Math.max(0,Math.min(r-inset,(right-left)/2,(bottom-top)/2));
  const points=[[left+r,top]];
  [[right-r,top+r,-Math.PI/2],[right-r,bottom-r,0],[left+r,bottom-r,Math.PI/2],[left+r,top+r,Math.PI]].forEach(([cx,cy,start])=>{
   for(let step=0;step<=24;step++){
    const angle=start+Math.PI/2*step/24,c=Math.cos(angle),s=Math.sin(angle);
    points.push([cx+r*Math.sign(c)*Math.sqrt(Math.abs(c)),cy+r*Math.sign(s)*Math.sqrt(Math.abs(s))]);
   }
  });return points.map(([x,y])=>[+x.toFixed(3),+y.toFixed(3)]);
 }
 function measure(element){
  const {width,height}=element.getBoundingClientRect();if(width<2||height<2)return;
  const r=radius(element),points=geometry(width,height,r);
  element.style.setProperty('--squircle-radius',r+'px');
  element.style.setProperty('--squircle-clip','polygon('+points.map(p=>p.map(v=>v+'px').join(' ')).join(',')+')');
  if(!home(element)&&!media(element)){
   const border=geometry(width,height,r,0.5),d='M '+border.map(p=>p.join(' ')).join(' L ')+' Z';
   const color=element.dataset.squircleBorder||'transparent';
   const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><path d="${d}" fill="none" stroke="${color}" stroke-width="1"/></svg>`;
   element.style.setProperty('--squircle-border-image',`url("data:image/svg+xml,${encodeURIComponent(svg)}")`);
  }
 }
 function capture(element){
  if(media(element)){measure(element);return;}
  // Read the original themed surface synchronously; no intermediate frame is painted.
  element.classList.remove('squircle-fallback-panel');
  const style=getComputedStyle(element);
  element.style.setProperty('--squircle-position',style.position==='static'?'relative':style.position);
  let image=style.backgroundImage;
  if(element.classList.contains('value-photo'))image+=','+getComputedStyle(element,'::before').backgroundImage;
  element.style.setProperty('--squircle-fill',style.backgroundColor);
  const shadows=style.boxShadow.split(/,(?![^()]*\))/).filter(shadow=>!shadow.includes('inset'));
  element.style.setProperty('--squircle-shadow',shadows.join(',')||'none');
  element.style.setProperty('--squircle-image',image);
  element.dataset.squircleBorder=style.borderTopColor;
  if(!home(element))element.classList.add('squircle-fallback-panel');
  measure(element);
 }
 const observer=new ResizeObserver(entries=>entries.forEach(({target})=>measure(target)));
 nodes.forEach(element=>{
  element.classList.add('squircle-fallback');
  element.style.setProperty('--squircle-radius',radius(element)+'px');
  capture(element);observer.observe(element);
 });
 const refresh=()=>nodes.forEach(capture);
 new MutationObserver(refresh).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
 document.querySelectorAll('dialog,.page-navigation,details.agenda-accordion').forEach(element=>element.addEventListener('toggle',()=>requestAnimationFrame(()=>nodes.forEach(measure))));
}
