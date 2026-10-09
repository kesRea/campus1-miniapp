/* CAMPUS_SPECIAL_V13_9: privileged button; role verified by backend every time. */
/* V13.9.1: show the entry to locally identified privileged Telegram users.
   All protected pages still REQUIRE server-side appGetSpecialAccess. */
function localSpecialCandidate(){
 const id=String(state.user?.id||'');
 const telegramId=String(tg?.initDataUnsafe?.user?.id||'');
 // appBootstrap has already validated the signed Telegram initData.
 return !!id && !!telegramId && id===telegramId &&
   (state.user?.isOwner===true || id==='7272434463');
}
function syncSpecialButton(){
 const btn=$('#specialBtn');
 if(!btn)return;
 const allowed=!!state.special?.canOpen || localSpecialCandidate();
 btn.classList.toggle('hidden',!allowed);
 btn.title=state.special?.checkError ? 'Панель управления — требуется проверка сервера' : 'Специальная панель';
}
async function loadSpecialAccess(){
 try{
  const result=await apiRequest('appGetSpecialAccess',[state.initData],{ttl:0,force:true});
  if(!result || typeof result.canOpen!=='boolean')throw new Error('Некорректный ответ проверки прав.');
  state.special={...result,checkError:''};
 }catch(e){
  state.special={canOpen:false,checkError:String(e?.message||e||'Неизвестная ошибка сервера')};
  console.warn('Campus special access check:',e);
 }
 syncSpecialButton();
 return state.special;
}
async function renderSpecial(){
 $('#view').innerHTML=pageHead('Панель управления','home')+'<div class="task-center-loading">Проверяем права…</div>';
 try{
  await loadSpecialAccess();
  const a=state.special;
  if(!a?.canOpen){
   const message=a?.checkError
     ? `Сервер не смог проверить права: ${esc(a.checkError)}. Проверьте, что Google Apps Script обновлён до V13.9.1 и запущен действующий deployment /exec.`
     : localSpecialCandidate()
       ? `Сервер не подтвердил доступ для Telegram ID ${esc(state.user?.id)}. Проверьте свой ID и настройку CAMPUS_DEVELOPER_ID.`
       : 'Раздел доступен только владельцу и разработчику.';
   $('#view').innerHTML=pageHead('Проверка доступа','home')+`<div class="task-empty"><b>Панель пока недоступна</b><p>${message}</p><button class="btn btn-secondary btn-wide" onclick="render('special')">Повторить проверку</button></div>`;
   return;
  }
  $('#view').innerHTML=`${pageHead('Специальная панель','home')}
   <div class="special-hero"><span class="special-hero-icon">${icon('shield')}</span><div><small>${a.isOwner?'ВЛАДЕЛЕЦ': 'РАЗРАБОТЧИК'}</small><h2>Центр управления Campus №1</h2><p>Отдельный раздел для технических настроек и администрирования</p></div></div>
   <div class="section-heading"><h2>Разделы</h2></div><div class="more-grid">
   ${moreCard('users','Участники','Пользователи с доступом',"render('special-users')")}
   ${moreCard('chart','Диагностика','Статус API и приложения',"render('special-diagnostics')")}
   ${moreCard('sun','Оформление','Тема и сезон',"render('special-design')")}
   ${moreCard('book','Версия и обновления','История изменений',"showWhatsNew()")}
   </div><div class="task-note">Настройка должностей (председатель, глава, подчинённый) будет добавлена отдельным этапом. Кнопка разработчика не даёт права владельца.</div>`;
 }catch(e){$('#view').innerHTML=pageHead('Ошибка','home')+`<div class="task-empty">${esc(e.message)}</div>`;}
}
function specialAuthorized(){return !!(state.special?.isOwner||state.special?.isDeveloper);}
async function renderSpecialUsers(){
 if(!specialAuthorized())return renderSpecial();
 $('#view').innerHTML=pageHead('Участники','special')+'<div class="task-center-loading">Загружаем участников…</div>';
 try{const users=await apiRequest('appGetTaskUsers',[state.initData],{ttl:0,force:true});
  $('#view').innerHTML=pageHead('Участники','special')+`<div class="task-note">Роли пока не настроены. Здесь показаны подтверждённые пользователи; редактирование должностей добавим позже.</div><div class="task-list">${users.map(u=>`<div class="task-person"><span class="avatar">${esc(initials(u.name))}</span><span><b>${esc(u.name)}</b><small>${esc(u.role)} · ${esc(u.id)}</small></span></div>`).join('')}</div>`;
 }catch(e){toast(e.message);renderSpecial();}
}
async function renderSpecialDiagnostics(){
 if(!specialAuthorized())return renderSpecial();
 $('#view').innerHTML=pageHead('Диагностика','special')+'<div class="task-center-loading">Проверяем Campus API…</div>';
 const started=Date.now();
 try{const a=await apiRequest('appGetSpecialAccess',[state.initData],{ttl:0,force:true});
  const latency=Date.now()-started;
  $('#view').innerHTML=pageHead('Диагностика','special')+`<div class="panel"><div class="task-diagnostic"><b>API</b><span class="badge">Подключён</span></div><div class="task-diagnostic"><b>Время ответа</b><span>${latency} мс</span></div><div class="task-diagnostic"><b>Интерфейс</b><span>v${esc(APP_VERSION)}</span></div><div class="task-diagnostic"><b>Сервер</b><span>v${esc(a.appVersion||'—')}</span></div><div class="task-diagnostic"><b>Telegram ID</b><span>${esc(a.id)}</span></div><div class="task-diagnostic"><b>Доступ</b><span>${a.isOwner?'Владелец': 'Разработчик'}</span></div></div>`;
 }catch(e){$('#view').innerHTML=pageHead('Диагностика','special')+`<div class="task-empty">${esc(e.message)}<br><button class="btn btn-primary" onclick="render('special-diagnostics')">Повторить</button></div>`;}
}
function renderSpecialDesign(){
 if(!specialAuthorized())return renderSpecial();
 $('#view').innerHTML=pageHead('Оформление','special')+`<div class="panel"><div class="task-diagnostic"><b>Текущая тема</b><span>${state.theme==='dark'?'Тёмная':'Светлая'}</span></div><button class="btn btn-secondary btn-wide" onclick="toggleTheme();renderSpecialDesign()">Сменить тему</button>${state.special?.isOwner?'<button class="btn btn-primary btn-wide" onclick="openOwnerSeasonSettings()">🍂 Управление сезонами</button>':'<div class="task-note">Переключение сезонов доступно только владельцу.</div>'}</div>`;
}
