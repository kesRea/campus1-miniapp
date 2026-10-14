/* Campus №1 V2.0.10 · Seasonal real-photo presentation only.
   Preserves the existing Telegram authentication, core functions, navbar and listeners.
   Entrance = autumn permanently. Home banner = existing data-season setting.
*/
(function(){
  'use strict';
  if(window.__campusSeasonal2010)return;
  window.__campusSeasonal2010=true;
  const q=(selector,root=document)=>root.querySelector(selector);
  const mark='<svg class="tou-seasonal-mark" viewBox="0 0 72 80" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path d="M5 7h62v8H39v36c0 11 8 19 18 18V53c-7-2-12-8-12-17 0-8 5-14 13-14s13 6 13 14c0 7-3 11-8 16v24C43 81 30 67 30 50V15H5z" fill="currentColor"/><path d="M52 37c0-4 2-7 6-7s6 3 6 7c0 2-1 4-3 6l-3 4-3-4c-2-2-3-4-3-6z" fill="currentColor"/></svg>';
  function updateSplash(){
    const splash=q('#splash');if(!splash)return;
    splash.classList.add('campus-season-login');
    const holder=q('#splashLogoHolder');
    if(holder&&!q('.tou-seasonal-wordmark',holder)){
      holder.innerHTML='<div class="tou-seasonal-wordmark">'+mark+'<span><strong>TORAIGHYROV<br>UNIVERSITY</strong><small>Campus №1</small></span></div>';
    }
    const img=q('.splash-dorm-art',splash);
    if(img){
      if(!img.src.includes('campus-autumn-login.webp'))img.src='campus-autumn-login.webp';
      img.alt='Вход в общежитие Campus №1, осенние сумерки';
      img.decoding='async';
      img.setAttribute('fetchpriority','high');
    }
    const title=q('.splash-campus-title',splash);if(title)title.textContent='Campus №1';
    const subtitle=q('.splash-campus-subtitle',splash);if(subtitle)subtitle.textContent='Цифровая система общежития';
    const note=q('.splash-note',splash);if(note)note.textContent='Доступ для администрации, Студсовета и активистов';
    // openStateBtn and splashText are deliberately untouched: login and status are driven by the existing app.
  }
  function updateLogo(){
    const btn=q('#homeLogoBtn');if(!btn||q('.tou-seasonal-mark',btn))return;
    // Existing BUTTON element, ID, and click handler stay in place.
    btn.innerHTML=mark;
    btn.classList.add('tou-seasonal-logo-button');
    btn.setAttribute('aria-label','На главную');
  }
  function updateHero(){
    const view=q('#view'),hero=q('#view .hero-panel');
    if(!hero||!view)return;
    if(typeof state!=='undefined'&&state.currentPage!=='home')return;
    hero.classList.add('campus-season-hero');
    const anniversary=q('.premium-anniversary',hero);if(anniversary)anniversary.remove();
    const description=q('.hero-copy p',hero);
    if(description&&description.textContent!=='Управление общежитием')description.textContent='Управление общежитием';
    hero.setAttribute('aria-label','Campus №1 — главное меню, сезонное фото входа');
    for(const icon of hero.querySelectorAll('.home-season-emoji,.hero-season-emoji'))icon.style.display='none';
    // IMPORTANT: no replacement of stats/actions nodes; their original onclick handlers remain intact.
  }
  function init(){
    updateSplash();updateLogo();updateHero();
    const view=q('#view');
    if(view){
      // Main UI rerenders from existing functions. Decorate only, never replace the view.
      const observer=new MutationObserver(()=>{updateHero();updateLogo();});
      observer.observe(view,{childList:true,subtree:false});
    }
    const button=q('#homeLogoBtn');
    if(button){
      const observer=new MutationObserver(()=>updateLogo());
      observer.observe(button,{childList:true});
    }
    const logo=q('#splashLogoHolder');
    if(logo){
      const observer=new MutationObserver(()=>{
        if(!q('.tou-seasonal-wordmark',logo))updateSplash();
      });
      observer.observe(logo,{childList:true});
    }
    const splash=q('#splash');
    if(splash){
      // Keep the autumn entrance image when an older splash helper refreshes its contents.
      const scene=q('.splash-dorm-scene',splash);
      if(scene){
        const observer=new MutationObserver(()=>{
          const img=q('.splash-dorm-art',scene);
          if(img&&!img.src.includes('campus-autumn-login.webp'))updateSplash();
        });
        observer.observe(scene,{childList:true,subtree:true,attributes:true,attributeFilter:['src']});
      }
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
