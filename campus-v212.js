/* Campus №1 V2.0.12 — one authoritative presentation layer.
 * Does not change any original button, listener, API, access rule or state.
 * Fixes V2010/V2011 visual conflicts by reapplying branded mark only when
 * legacy code overwrites it and painting seasons via html[data-season].
 */
(function(){
 'use strict';
 if(window.__campusV212)return;
 window.__campusV212=true;
 const q=(s,r=document)=>r.querySelector(s);
 const mark='<span class="tou-seasonal-mark tou-v212-mark" aria-hidden="true"></span>';
 let logoBusy=false;
 function refreshLogo(){
   if(logoBusy)return;
   logoBusy=true;
   try{
     const header=q('#homeLogoBtn');
     if(header&&!header.querySelector('.tou-v212-mark')){
       // The original BUTTON (and its click handler) survives intact.
       header.innerHTML=mark;
       header.classList.add('tou-seasonal-logo-button','tou-v212-logo-button');
       header.setAttribute('aria-label','На главную');
     }
     const splash=q('#splashLogoHolder');
     if(splash&&!splash.querySelector('.tou-v212-mark')){
       splash.innerHTML='<div class="tou-seasonal-wordmark tou-v212-wordmark">'+mark+
        '<span><strong>TORAIGHYROV<br>UNIVERSITY</strong><small>Campus №1</small></span></div>';
     }
   }finally{logoBusy=false;}
 }
 function refreshHero(){
   const view=q('#view');
   if(!view)return;
   if(typeof state!=='undefined'&&state.currentPage!=='home')return;
   const hero=q('.hero-panel',view);
   if(!hero)return;
   hero.classList.add('campus-v212-hero');
   // Old premium module still adds anniversary decoration on each render.
   hero.querySelectorAll('.premium-anniversary,.winter-garland-v137,.winter-garland-v136').forEach(n=>n.remove());
   // Existing state-driven heading, name and links are left untouched.
   const sub=q('.hero-copy p',hero);
   if(sub&&sub.textContent!=='Управление общежитием')sub.textContent='Управление общежитием';
 }
 function init(){
   const splash=q('#splash');if(splash)splash.classList.add('campus-v212-login');
   refreshLogo();refreshHero();
   const header=q('#homeLogoBtn'),logo=q('#splashLogoHolder'),view=q('#view');
   if(header)new MutationObserver(refreshLogo).observe(header,{childList:true});
   if(logo)new MutationObserver(refreshLogo).observe(logo,{childList:true});
   if(view)new MutationObserver(()=>{refreshHero();refreshLogo();}).observe(view,{childList:true,subtree:false});
   // Theme and season are already updated by core app in data-theme/data-season;
   // no extra timers, forced defaults or new listeners are necessary.
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
