/* Campus №1 V2.0.1 — Telegram avatar and username enhancements.
 * Adds UI only. No new privileges, no API tokens, no changes to login/session.
 * Existing backend stores Telegram photo_url/username on a validated login.
 */
(function(){
  'use strict';
  if(window.__campusV2AvatarsReady)return;
  window.__campusV2AvatarsReady=true;

  const safe=v=>typeof esc==='function'?esc(v):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
  const cleanHandle=v=>String(v||'').trim().replace(/^@+/, '');
  const img=(name,url)=>typeof avatarHtml==='function'
    ?avatarHtml(name||'Участник',url||'','v2-telegram-avatar')
    :`<span class="v2-telegram-avatar">${safe(String(name||'?').slice(0,1))}</span>`;
  const users=()=>typeof councilRolesData!=='undefined'&&Array.isArray(councilRolesData?.users)?councilRolesData.users:[];

  function decorateRoleCards(){
    const records=users();
    if(!records.length)return;
    document.querySelectorAll('#view .role-person').forEach(card=>{
      const raw=card.getAttribute('onclick')||'';
      const id=(raw.match(/editCouncilRole\(['"](\d+)['"]\)/)||[])[1];
      const u=records.find(person=>String(person.id)===id);
      if(!u||card.querySelector('.v2-telegram-tag'))return;
      const handle=cleanHandle(u.username);
      const tag=document.createElement('small');
      tag.className='v2-telegram-tag';
      tag.textContent=handle?'@'+handle:'Telegram ID: '+String(u.id);
      const content=[...card.children].find(el=>el.tagName==='SPAN'&&!el.classList.contains('avatar'));
      if(content)content.appendChild(tag);
    });
  }

  if(typeof renderCouncilRoles==='function'){
    const original=renderCouncilRoles;
    renderCouncilRoles=async function(...args){
      const answer=await original.apply(this,args);
      decorateRoleCards();
      return answer;
    };
  }

  if(typeof editCouncilRole==='function'){
    const original=editCouncilRole;
    editCouncilRole=function(id){
      const answer=original.apply(this,arguments);
      const u=users().find(person=>String(person.id)===String(id));
      const sheet=document.querySelector('#modalSheet');
      const header=sheet?.querySelector('h3');
      if(!u||!header||sheet.querySelector('.v2-role-identity'))return answer;
      const handle=cleanHandle(u.username);
      const identity=document.createElement('div');
      identity.className='v2-role-identity';
      identity.innerHTML=img(u.name,u.photoUrl)+`<div class="v2-role-identity-copy"><b>${safe(u.name)}</b><small>${handle?'@'+safe(handle):'Telegram ID: '+safe(u.id)}</small></div>`;
      header.replaceWith(identity);
      return answer;
    };
  }

  let rosterBusy=false;
  async function decorateRosterPicker(){
    const scope=document.querySelector('#v2-roster');
    if(!scope||rosterBusy||typeof apiRequest!=='function')return;
    const selectors=[...scope.querySelectorAll('select[id^="v2-link-"]')];
    if(!selectors.length||selectors.every(s=>s.dataset.v2AvatarEnhanced==='1'))return;
    if(!state.user?.isOwner&&!state.user?.isDeveloper)return;
    const kind=state.currentPage==='v2-activist-roster'?'activists':'council';
    rosterBusy=true;
    selectors.forEach(s=>s.dataset.v2AvatarEnhanced='loading');
    try{
      const result=await apiRequest('appV2Roster',[state.initData,kind],{ttl:0,force:true});
      if(!document.querySelector('#v2-roster')||!Array.isArray(result?.users))return;
      for(const select of selectors){
        if(!select.isConnected)continue;
        let preview=select.parentElement.querySelector('.v2-roster-photo-preview');
        if(!preview){
          preview=document.createElement('div');
          preview.className='v2-roster-photo-preview';
          select.insertAdjacentElement('afterend',preview);
        }
        const rowNo=Number(select.id.replace('v2-link-',''));
        const row=result.roster?.find(r=>Number(r.row)===rowNo);
        const render=()=>{
          const u=result.users.find(item=>String(item.id)===String(select.value));
          const name=u?.name||row?.name||'Участник';
          const handle=cleanHandle(u?.username||row?.username);
          const photo=u?.photoUrl||(String(select.value)===String(row?.telegramId)?row?.photo:'')||'';
          preview.innerHTML=img(name,select.value?photo:'')+
            `<span><b>${safe(select.value?name:'Пользователь не выбран')}</b><small>${select.value?(handle?'@'+safe(handle):'Telegram ID: '+safe(select.value)):'Выберите Telegram-аккаунт выше'}</small></span>`;
        };
        select.addEventListener('change',render);
        select.dataset.v2AvatarEnhanced='1';
        render();
      }
    }catch(e){
      selectors.forEach(s=>{if(s.isConnected)s.dataset.v2AvatarEnhanced='';});
      console.warn('Campus V2 avatar preview unavailable:',e);
    }finally{rosterBusy=false;}
  }

  // V2.0 core still writes "Версия 2.0"; the minor hotfix keeps the label precise.
  const splashVersion=document.querySelector('#splashVersion');
  if(splashVersion){
    const updateVersion=()=>{
      const v=typeof APP_VERSION!=='undefined'?String(APP_VERSION):'20.0.2';
      const label='Версия V'+(v.startsWith('20.')?'2.'+v.slice(3):v);
      if(splashVersion.textContent!==label)splashVersion.textContent=label;
    };
    updateVersion();
    if(typeof MutationObserver==='function'){
      const versionObserver=new MutationObserver(updateVersion);
      versionObserver.observe(splashVersion,{subtree:true,childList:true,characterData:true});
    }
  }

  const view=document.querySelector('#view');
  if(view){
    const observer=new MutationObserver(()=>{
      if(state.currentPage==='v2-roster'||state.currentPage==='v2-activist-roster'){
        void decorateRosterPicker();
      }
    });
    observer.observe(view,{childList:true,subtree:true});
    void decorateRosterPicker();
  }
})();
