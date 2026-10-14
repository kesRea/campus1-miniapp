/* Campus №1 V2.0.13 — restore classic compact home card and minimal login.
   UI only: does not replace app render(), navigation, data, roles, API or Telegram auth. */
(function(){
 'use strict';
 if(window.__campusV213Clean)return;
 window.__campusV213Clean=true;
 const find=(selector,root=document)=>root.querySelector(selector);
 const emblem='<span class="campus-v213-mark" aria-hidden="true"></span>';
 let adjusting=false;
 function refreshHeaderMark(){
   if(adjusting)return;
   const home=find('#homeLogoBtn');
   if(!home||home.querySelector('.campus-v213-mark'))return;
   adjusting=true;
   try{
     home.innerHTML=emblem;
     home.classList.add('campus-v213-logo-button');
     home.setAttribute('aria-label','На главную');
   }finally{adjusting=false;}
 }
 function refreshSplash(){
   const splash=find('#splash');
   if(!splash)return;
   splash.classList.add('campus-v213-splash');
   const holder=find('#splashLogoHolder',splash);
   if(holder&&!holder.querySelector('.campus-v213-mark')){
     holder.innerHTML='<span class="campus-v213-wordmark">'+emblem+
       '<span class="campus-v213-wordmark-copy"><strong>TORAIGHYROV</strong><strong>UNIVERSITY</strong></span></span>';
   }
   const img=find('.splash-dorm-art',splash);
   if(img&&img.getAttribute('src')!=='campus-login-compact-v213.webp'){
      img.setAttribute('src','campus-login-compact-v213.webp');
      img.setAttribute('alt','Вход в Campus №1 осенью');
      img.setAttribute('decoding','async');
   }
 }
 function fallbackBulbs(){
   const b=[['5%','16px','#ff625f'],['13%','29px','#ffd34e'],['21%','19px','#55c7ff'],
     ['29%','31px','#5ed99c'],['37%','18px','#e986ff'],['45%','33px','#ff9f55'],
     ['54%','18px','#ffd34e'],['63%','31px','#55c7ff'],['72%','19px','#5ed99c'],
     ['81%','30px','#ff625f'],['89%','18px','#e986ff'],['96%','27px','#ff9f55']];
   return b.map(([x,y,c],i)=>'<span class="winter-bulb-v137" style="--bx:'+x+';--by:'+y+';--bc:'+c+';--bd:'+(i*.11)+'s"></span>').join('');
 }
 function refreshClassicHome(){
   const view=find('#view');
   if(!view||typeof state!=='undefined'&&state.currentPage!=='home')return;
   const hero=find('.hero-panel',view);
   if(!hero)return;
   hero.classList.add('campus-v213-classic');
   // Remove only decorative remnants from the newer UI packages.
   hero.querySelectorAll('.premium-anniversary,.campus-v212-photo,.campus-v211-photo').forEach(n=>n.remove());
   const intro=find('.hero-copy p',hero);
   if(intro&&intro.textContent.trim()==='Твой кампус. Твои возможности.')
      intro.textContent='Управление общежитием';
   // The original winter decorations are retained in winter. For the familiar
   // card appearance, present the SAME original garland in other seasons too.
   if(!hero.querySelector('.winter-garland-v137')){
      const bulbs=typeof winterGarlandBulbs==='function'?winterGarlandBulbs():fallbackBulbs();
      hero.insertAdjacentHTML('afterbegin','<div class="winter-garland-v137" aria-hidden="true">'+
       '<svg class="winter-wire-v137" viewBox="0 0 1000 90" preserveAspectRatio="none">'+
       '<path d="M-30 5 C220 72 390 58 520 40 C690 16 810 73 1030 9"/></svg>'+
       '<div class="winter-bulbs-v137">'+bulbs+'</div></div>');
   }
 }
 function init(){
   refreshHeaderMark();refreshSplash();refreshClassicHome();
   const header=find('#homeLogoBtn');
   if(header)new MutationObserver(refreshHeaderMark).observe(header,{childList:true});
   const view=find('#view');
   if(view)new MutationObserver(()=>{refreshHeaderMark();refreshClassicHome();}).observe(view,{childList:true});
   // No timers or forced season/theme changes. The existing owner's season
   // settings, Telegram profile, button callbacks and navbar remain untouched.
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
 else init();
})();
