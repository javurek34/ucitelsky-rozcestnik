/* Full-screen reading pages follow Safari's visible viewport as toolbars move.
   Keep one scroll container; do not reflow the page when the user pinch-zooms. */
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
