/* Campus No.1 · Premium UI layer V2.0.9
   Presentation layer only. Does not edit core render(), data, permissions or APIs.
   Existing toolbar nodes are MOVED without cloning, retaining their listeners.
*/
(function(){
  'use strict';
  if(window.__campusPremium209)return;
  window.__campusPremium209=true;
  const q=(s,ctx=document)=>ctx.querySelector(s);
  const safe=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const svgBell='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>';
  const svgDots='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>';
  const svgChevron='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>';
  const cache={testProfile:null,loading:false,userId:''};
  const validImage=url=>{const s=String(url||'').trim();return (/^https:\/\//i.test(s)||/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/i.test(s))?s:'';};
  const getUser=()=>typeof state!=='undefined'?state.user:null;
  const isPrivileged=u=>!!(u&&(u.isOwner||u.isDeveloper));
  function avatarMarkup(u,large){
    u=u||{};
    const full=[u.firstName,u.lastName].filter(Boolean).join(' ').trim()||u.username||'Campus';
    const initials=full.split(/\s+/).slice(0,2).map(p=>p[0]||'').join('').toUpperCase();
    const photo=validImage(cache.testProfile?.photoUrl||u.photoUrl);
    return '<span class="premium-avatar'+(large?' premium-avatar-lg':'')+'"><span class="premium-avatar-fallback">'+safe(initials)+'</span>'+(photo?'<img src="'+safe(photo)+'" alt="" referrerpolicy="no-referrer" onerror="this.remove()">':'')+'</span>';
  }
  function refreshAvatar(){
    const btn=q('#profileBtn'),u=getUser();if(!btn||!u)return;
    btn.innerHTML=avatarMarkup(u,false);
    btn.title='Открыть профиль';
    btn.setAttribute('aria-label','Открыть профиль');
  }
  function toggleTools(force){
    const menu=q('#premiumToolsMenu'),button=q('#premiumToolsBtn');if(!menu||!button)return;
    const open=typeof force==='boolean'?force:menu.classList.contains('hidden');
    menu.classList.toggle('hidden',!open);button.setAttribute('aria-expanded',String(open));
  }
  function setupHeader(){
    const header=q('.topbar'),actions=q('.top-actions'),updates=q('#updatesBtn'),profile=q('#profileBtn'),brand=q('.brand-copy');
    if(!header||!actions||!updates||!profile||!brand)return;
    if(header.dataset.premium209==='1')return;
    header.dataset.premium209='1';document.documentElement.classList.add('premium-ready');
    const title=q('span',brand),subtitle=q('small',brand);
    if(title)title.textContent='TORAIGHYROV';
    if(subtitle)subtitle.textContent='UNIVERSITY · CAMPUS №1';
    const tools=document.createElement('div');tools.id='premiumToolsMenu';tools.className='premium-tools-menu hidden';tools.setAttribute('aria-label','Дополнительные действия');
    const label=document.createElement('div');label.className='premium-tools-title';label.textContent='Управление Campus';tools.appendChild(label);
    for(const id of ['specialBtn','themeBtn','seasonBtn']){
      const control=q('#'+id);if(!control)continue;
      const line=document.createElement('div');line.className='premium-tools-item';
      const word=document.createElement('span');word.textContent=({specialBtn:'Панель управления',themeBtn:'Тема оформления',seasonBtn:'Сезон'}[id]);
      line.append(control,word);tools.appendChild(line);
      control.addEventListener('click',()=>toggleTools(false));
    }
    const more=document.createElement('button');more.type='button';more.id='premiumToolsBtn';more.className='icon-button premium-tools-trigger';more.innerHTML=svgDots;more.title='Другие настройки';more.setAttribute('aria-label','Другие настройки');more.setAttribute('aria-expanded','false');
    more.addEventListener('click',event=>{event.stopPropagation();toggleTools();});
    actions.insertBefore(more,updates);
    header.append(tools);
    updates.querySelector('[data-icon]')?.replaceChildren();
    const slot=updates.querySelector('[data-icon]');if(slot)slot.innerHTML=svgBell;
    updates.title='Уведомления';updates.setAttribute('aria-label','Уведомления');
    document.addEventListener('click',e=>{if(!header.contains(e.target))toggleTools(false);});
    document.addEventListener('keydown',e=>{if(e.key==='Escape')toggleTools(false);});
    updates.addEventListener('click',function(e){e.stopImmediatePropagation();e.preventDefault();toggleTools(false);openNotifications();},true);
    profile.addEventListener('click',function(e){e.stopImmediatePropagation();e.preventDefault();toggleTools(false);openPremiumProfile();},true);
    refreshAvatar();
  }
  function openNotifications(){
    if(typeof showModal!=='function')return;
    const version=typeof APP_VERSION!=='undefined'?APP_VERSION:'—';
    let unseen=false;
    try{unseen=localStorage.getItem('campus-update-seen-version')!==String(typeof UPDATE_CENTER_VERSION!=='undefined'?UPDATE_CENTER_VERSION:version);}catch(_){}
    const recent=typeof CAMPUS_UPDATES!=='undefined'&&CAMPUS_UPDATES.length?CAMPUS_UPDATES[0]:null;
    showModal('<div class="sheet-handle"></div><section class="premium-notifications">'+
      '<div class="premium-sheet-eyebrow">CAMPUS №1 · ЦЕНТР СОБЫТИЙ</div><h3>Уведомления <span class="premium-title-gold">✦</span></h3>'+
      '<p class="premium-description">Новости системы и важные обновления приложения.</p>'+
      '<div class="premium-notice '+(unseen?'premium-notice-new':'')+'"><div class="premium-notice-icon">'+svgBell+'</div><div><b>'+(unseen?'Есть обновление приложения':'Обновления Campus №1')+'</b><small>Версия '+safe(version)+'</small>'+
      '<p>'+(recent?safe(recent.title||'История выпусков доступна в центре обновлений.'):'Новости версий находятся в центре обновлений.')+'</p></div></div>'+
      '<div class="premium-notice-hint">Здесь показаны только уведомления о версиях. Личные сообщения и задачи не имитируются.</div>'+
      '<button id="premiumOpenUpdates" type="button" class="btn btn-primary btn-wide">Открыть центр обновлений '+svgChevron+'</button>'+
      '<button class="btn btn-secondary btn-wide" type="button" onclick="closeModal()">Закрыть</button></section>');
    q('#premiumOpenUpdates')?.addEventListener('click',()=>{if(typeof showWhatsNew==='function')void showWhatsNew();});
  }
  function openPremiumProfile(){
    if(typeof showModal!=='function')return;
    const u=getUser()||{},name=[u.firstName,u.lastName].filter(Boolean).join(' ')||u.username||'Пользователь';
    const role=typeof roleLabel==='function'?roleLabel(u):u.role||'Пользователь';
    const right=u.canManage?'Управление':'Просмотр';
    const handle=u.username?'@'+u.username:'Telegram';
    const description=cache.testProfile?.about;
    const tone=u.isOwner?' premium-role-owner':u.isDeveloper?' premium-role-developer':/председател/i.test(String(role))?' premium-role-chair':'';
    showModal('<div class="sheet-handle"></div><section class="premium-profile-sheet">'+
      '<div class="premium-profile-hero"><span class="premium-profile-emblem">CAMPUS №1</span></div>'+
      '<div class="premium-profile-person">'+avatarMarkup(u,true)+'<div><small class="premium-sheet-eyebrow">МОЙ ПРОФИЛЬ</small><h3>'+safe(name)+'</h3><span class="premium-role-chip'+tone+'">'+safe(role)+'</span></div></div>'+
      '<div class="premium-profile-info"><div><small>TELEGRAM</small><strong>'+safe(handle)+'</strong></div><div><small>ДОСТУП</small><strong>'+safe(right)+'</strong></div></div>'+
      (description?'<p class="premium-profile-about">'+safe(description)+'</p>':'')+
      '<p class="premium-profile-foot">Профиль связан с авторизованным аккаунтом Telegram. Изменение должностей и прав производится только в системе управления.</p>'+
      (isPrivileged(u)?'<button id="premiumOpenTestProfile" class="btn btn-primary btn-wide" type="button">Тестовые профили и аватарки '+svgChevron+'</button>':'')+
      '<button class="btn btn-secondary btn-wide" type="button" onclick="closeModal()">Закрыть</button></section>');
    q('#premiumOpenTestProfile')?.addEventListener('click',()=>{if(typeof closeModal==='function')closeModal();if(typeof window.v2Go==='function')window.v2Go('profiles');else if(typeof toast==='function')toast('Модуль профилей загружается');});
  }
  async function loadTestProfile(){
    const u=getUser(),id=String(u?.id||'');
    if(!id||!isPrivileged(u)||cache.loading||cache.userId===id)return;
    cache.userId=id;cache.loading=true;
    try{
      if(typeof apiRequest!=='function')return;
      const profiles=await apiRequest('appV2Profiles',[state.initData],{ttl:60000});
      if(!Array.isArray(profiles))return;
      const self=profiles.find(p=>p&&((p.mine===true)||String(p.id)===id));
      if(!self)return;
      cache.testProfile={photoUrl:validImage(self.photoUrl),about:String(self.about||'').slice(0,360)};
      refreshAvatar();
    }catch(e){console.warn('Campus premium test profile unavailable; Telegram profile kept.',e);}
    finally{cache.loading=false;}
  }
  function decorateHome(){
    if(typeof state==='undefined'||state.currentPage!=='home')return;
    const hero=q('#view .hero-panel'),view=q('#view');
    if(!hero||!view||hero.classList.contains('premium-hero'))return;
    hero.classList.add('premium-hero');
    const desc=q('.hero-copy p',hero);if(desc)desc.textContent='Управление общежитием';
    for(const h of view.querySelectorAll('.section-heading h2')){
      if(h.textContent.trim()==='Быстрые действия')h.closest('.section-heading')?.classList.add('premium-section-actions');
    }
  }
  function boot(){
    setupHeader();decorateHome();
    const view=q('#view');
    if(view){const observer=new MutationObserver(()=>{if(q('#view .hero-panel:not(.premium-hero)'))decorateHome();});observer.observe(view,{childList:true,subtree:false});}
    const app=q('#app');
    if(app){const observer=new MutationObserver(()=>{if(!app.classList.contains('hidden')){refreshAvatar();void loadTestProfile();decorateHome();}});observer.observe(app,{attributes:true,attributeFilter:['class']});}
    if(getUser()){refreshAvatar();void loadTestProfile();}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
