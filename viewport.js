/* Desktop dialogs and navigation follow the visible viewport as toolbars move.
   Mobile reading pages use document scrolling instead. Preserve pinch zoom. */
(()=>{
 let frame=0,lastHeight=0;
 function update(){
  frame=0;const viewport=window.visualViewport;
  if(viewport&&Math.abs(viewport.scale-1)>.01)return;
  const height=Math.round(viewport?.height||window.innerHeight);
  if(height>0&&height!==lastHeight){lastHeight=height;document.documentElement.style.setProperty('--reading-viewport-height',height+'px');}
 }
 function schedule(){if(!frame)frame=requestAnimationFrame(update);}
 update();window.addEventListener('resize',schedule,{passive:true});
 window.visualViewport?.addEventListener('resize',schedule,{passive:true});
 window.addEventListener('pageshow',schedule);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule();});
})();
