(()=>{
 const key='ucitelsky-rozcestnik.theme.v1';
 const system=window.matchMedia('(prefers-color-scheme: dark)');
 let choice=null;
 try{const saved=localStorage.getItem(key);if(saved==='light'||saved==='dark')choice=saved;}catch{}
 function apply(theme){
  document.documentElement.dataset.theme=theme;
  document.documentElement.style.colorScheme=theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content',theme==='dark'?'#101927':'#F7F9FC');
  document.querySelectorAll('[data-theme-choice]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.themeChoice===theme)));
 }
 apply(choice||(system.matches?'dark':'light'));
 document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('[data-theme-choice]').forEach(button=>button.addEventListener('click',()=>{choice=button.dataset.themeChoice;try{localStorage.setItem(key,choice);}catch{}apply(choice);}));
  apply(choice||(system.matches?'dark':'light'));
 });
 system.addEventListener('change',()=>{if(!choice)apply(system.matches?'dark':'light');});
 window.addEventListener('storage',e=>{if(e.key===key){choice=['light','dark'].includes(e.newValue)?e.newValue:null;apply(choice||(system.matches?'dark':'light'));}});
})();
