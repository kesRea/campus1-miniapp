/* CAMPUS V2.0.11 · visual-only finalization over V2.0.10.
   No replacement of app functions, no new navigation, no Telegram/API changes.
*/
(function(){
  'use strict';
  if(window.__campus211Applied)return;
  window.__campus211Applied=true;
  function decorateEntry(){
    const splash=document.getElementById('splash');
    if(splash)splash.classList.add('campus-v211-entry');
  }
  function decorateHero(){
    const view=document.getElementById('view');
    if(!view || (typeof state!=='undefined' && state.currentPage!=='home'))return;
    const hero=view.querySelector('.hero-panel');
    if(!hero)return;
    hero.classList.add('campus-v211-hero');
    // V2.0.9 added the extra decorations, but we must preserve the actual hero text and user name.
    const anniversary=hero.querySelector('.premium-anniversary');
    if(anniversary)anniversary.remove();
    const label=hero.querySelector('.hero-copy p');
    if(label && label.textContent.trim()!=='Управление общежитием')label.textContent='Управление общежитием';
  }
  function ready(){
    decorateEntry();decorateHero();
    const view=document.getElementById('view');
    if(view){
      const observer=new MutationObserver(decorateHero);
      observer.observe(view,{childList:true,subtree:false});
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});
  else ready();
})();
