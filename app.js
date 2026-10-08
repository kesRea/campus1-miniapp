/* CAMPUS_GITHUB_UI_V10 */
const CAMPUS_API_URL = 'https://campus1-db-47a56e67.pages.dev/api';
const APP_VERSION = '10.0.0';
const tg = window.Telegram?.WebApp || null;
const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const state = {
  initData:'', user:null, dashboard:null, analytics:null, rooms:[],
  currentPage:'home', renderSeq:0, roomData:null, studentLists:{}, studentMap:new Map(),
  cache:new Map(), inflight:new Map(), aiMessages:[], theme:'light'
};

const ICONS = {
  home:'<svg viewBox="0 0 24 24"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9.5 21v-6h5v6"/></svg>',
  users:'<svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  grid:'<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></svg>',
  spark:'<svg viewBox="0 0 24 24"><path d="m12 3 1.3 4.2L17.5 8.5l-4.2 1.3L12 14l-1.3-4.2-4.2-1.3 4.2-1.3L12 3Z"/><path d="m18.5 14 .8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z"/></svg>',
  menu:'<svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  search:'<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>',
  bed:'<svg viewBox="0 0 24 24"><path d="M3 7v14M21 12v9M3 16h18"/><path d="M7 16v-5h5a4 4 0 0 1 4 4v1"/><path d="M7 11V8h4a2 2 0 0 1 2 2v1"/></svg>',
  door:'<svg viewBox="0 0 24 24"><path d="M5 21h14"/><path d="M7 21V4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v17"/><circle cx="14" cy="12" r=".7" fill="currentColor" stroke="none"/></svg>',
  globe:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/></svg>',
  shield:'<svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/></svg>',
  chart:'<svg viewBox="0 0 24 24"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
  plus:'<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  swap:'<svg viewBox="0 0 24 24"><path d="M7 7h11l-3-3M17 17H6l3 3"/></svg>',
  chevron:'<svg viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>',
  back:'<svg viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg>',
  moon:'<svg viewBox="0 0 24 24"><path d="M20.5 14.5A8 8 0 0 1 9.5 3.5 8.5 8.5 0 1 0 20.5 14.5Z"/></svg>',
  sun:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>',
  logout:'<svg viewBox="0 0 24 24"><path d="M10 17l5-5-5-5M15 12H3"/><path d="M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5"/></svg>',
  book:'<svg viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/></svg>',
  clipboard:'<svg viewBox="0 0 24 24"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2h6v2M9 9h6M9 13h6M9 17h4"/></svg>',
  council:'<svg viewBox="0 0 24 24"><circle cx="8" cy="8" r="3"/><circle cx="17" cy="7" r="2"/><path d="M2 21v-2a6 6 0 0 1 12 0v2M14 15a5 5 0 0 1 8 4v2"/></svg>'
};

function icon(name){ return ICONS[name] || ICONS.grid; }
function injectIcons(){ $$('[data-icon]').forEach(el=>{ el.innerHTML=icon(el.dataset.icon); }); }
function initials(name){ return String(name||'C1').split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase(); }
function roleLabel(u){ return u?.role || 'Пользователь'; }
function canManage(){ return !!state.user?.canManage; }
function formatCount(n,one,few,many){ n=Math.abs(Number(n)||0); const n10=n%10,n100=n%100; const word=(n10===1&&n100!==11)?one:(n10>=2&&n10<=4&&(n100<12||n100>14))?few:many; return `${n} ${word}`; }

function toast(message){
  const el=$('#toast'); if(!el) return;
  el.textContent=message; el.classList.remove('hidden');
  clearTimeout(toast._t); toast._t=setTimeout(()=>el.classList.add('hidden'),2600);
}

function applyTheme(theme, persist=true){
  state.theme = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.dataset.theme = state.theme;
  if(persist) localStorage.setItem('campus-theme',state.theme);
  const btn=$('#themeBtn'); if(btn) btn.innerHTML=icon(state.theme==='dark'?'sun':'moon');
  const meta=$('meta[name="theme-color"]'); if(meta) meta.content=state.theme==='dark'?'#0B111B':'#F5F8FD';
  try{
    tg?.setHeaderColor(state.theme==='dark'?'#0b111b':'#f5f8fd');
    tg?.setBackgroundColor(state.theme==='dark'?'#0b111b':'#f5f8fd');
  }catch(e){}
  const sw=$('#themeSwitch'); if(sw) sw.classList.toggle('on',state.theme==='dark');
}

function initTheme(){
  const saved=localStorage.getItem('campus-theme');
  const telegramDark=tg?.colorScheme==='dark';
  const systemDark=matchMedia?.('(prefers-color-scheme: dark)').matches;
  applyTheme(saved || ((telegramDark||systemDark)?'dark':'light'), false);
}
function toggleTheme(){ applyTheme(state.theme==='dark'?'light':'dark'); }

async function apiRequest(method,args=[],options={}){
  const readOnly = !/^app(Add|Update|Move|Evict)/.test(method);
  const ttl = options.ttl ?? (readOnly ? 15000 : 0);
  const key = method+'|'+JSON.stringify(args);
  const now=Date.now();
  const cached=state.cache.get(key);
  if(!options.force && ttl && cached && now-cached.time<ttl) return cached.value;
  if(!options.force && state.inflight.has(key)) return state.inflight.get(key);

  const promise=(async()=>{
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),22000);
    try{
      const response=await fetch(CAMPUS_API_URL,{
        method:'POST', redirect:'follow', signal:controller.signal,
        headers:{'Content-Type':'text/plain;charset=utf-8'},
        body:JSON.stringify({method,args})
      });
      const text=await response.text();
      let data;
      try{ data=JSON.parse(text); }
      catch(e){ throw new Error('Campus API вернул не JSON. Обновите приложение.'); }
      if(!response.ok || !data.ok) throw new Error(data?.error || 'Ошибка Campus API.');
      if(ttl) state.cache.set(key,{time:Date.now(),value:data.result});
      return data.result;
    }catch(e){
      if(e?.name==='AbortError') throw new Error('Сервер отвечает слишком долго. Повторите попытку.');
      throw e;
    }finally{
      clearTimeout(timer); state.inflight.delete(key);
    }
  })();
  state.inflight.set(key,promise);
  return promise;
}

function invalidateData(){
  state.cache.clear(); state.studentLists={}; state.studentMap.clear(); state.roomData=null;
}

async function boot(){
  const btn=$('#openStateBtn');
  try{
    tg?.ready(); tg?.expand();
    state.initData=tg?.initData || '';
    btn.onclick=boot;
    if(!state.initData){
      btn.disabled=false; btn.textContent='Повторить подключение';
      $('#splashText').textContent='Откройте Campus №1 кнопкой внутри Telegram-бота.';
      return;
    }
    btn.disabled=true; btn.textContent='Проверяем доступ…';
    const data=await apiRequest('appBootstrap',[state.initData],{ttl:0,force:true});
    state.user=data.user; state.dashboard=data.dashboard; state.analytics=data.analytics; state.rooms=data.rooms||[];
    $('#profileInitials').textContent=initials(state.user.firstName || state.user.username || 'C1');
    $('#splash').classList.add('hidden'); $('#app').classList.remove('hidden'); $('#bottomNav').classList.remove('hidden');
    injectIcons(); applyTheme(state.theme,false); render('home');
    const idle=window.requestIdleCallback || (fn=>setTimeout(fn,250));
    idle(()=>prefetchCore());
  }catch(e){
    btn.disabled=false; btn.textContent='Повторить вход'; btn.onclick=boot;
    $('#splashText').textContent=e?.message || String(e);
  }
}

async function prefetchCore(){
  try{
    const [students,rooms]=await Promise.all([
      apiRequest('appGetStudents',[state.initData,'active'],{ttl:30000}),
      apiRequest('appGetRooms',[state.initData],{ttl:30000})
    ]);
    state.studentLists.active=students; indexStudents(students); state.roomData=rooms;
  }catch(e){}
}

function indexStudents(list){ (list||[]).forEach(s=>state.studentMap.set(Number(s.rowNumber),s)); }
function pageAlive(page,seq){ return state.currentPage===page && state.renderSeq===seq; }
function setNav(page){ $$('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.page===page)); }
function pageHead(title,back){ return `<div class="page-head"><button class="back-button" type="button" onclick="render('${back||'home'}')">${icon('back')}</button><h1>${esc(title)}</h1></div>`; }

async function render(page,opts={}){
  state.currentPage=page; state.renderSeq++; const seq=state.renderSeq; setNav(page);
  const view=$('#view'); if(!view) return;
  view.classList.remove('fade-in'); void view.offsetWidth; view.classList.add('fade-in');
  try{
    if(page==='home') return renderHome();
    if(page==='students') return renderStudents(opts.mode||'active',opts.query||'',seq);
    if(page==='rooms') return renderRooms(seq);
    if(page==='ai') return renderAI();
    if(page==='more') return renderMore();
    if(page==='analytics') return renderAnalytics();
    if(page==='foreigners') return renderGenericTable('Иностранные студенты','appGetForeigners','more',seq);
    if(page==='council') return renderCouncil('council',seq);
    if(page==='activists') return renderCouncil('activists',seq);
    if(page==='control') return renderGenericTable('Контроль общежития','appGetControl','more',seq);
    if(page==='journal') return renderGenericTable('Журнал действий','appGetJournal','more',seq);
  }catch(e){ if(pageAlive(page,seq)) view.innerHTML=`${pageHead('Ошибка','home')}<div class="empty">${esc(e.message)}</div>`; }
}

function renderHome(){
  const d=state.dashboard||{};
  const occupancy=d.totalRooms ? Math.round((d.occupiedRooms||0)/d.totalRooms*100) : 0;
  $('#view').innerHTML=`
    <div class="welcome">
      <div><small>Добро пожаловать,</small><h1>${esc(state.user?.firstName || 'Пользователь')}</h1></div>
      <span class="role-chip">${esc(roleLabel(state.user))}</span>
    </div>
    <form class="global-search" onsubmit="homeSearch(event)">
      <span class="mini-icon">${icon('search')}</span>
      <input id="homeSearchInput" autocomplete="off" placeholder="Поиск студента, комнаты, ИИН…">
      <button class="search-action" type="submit">Найти</button>
    </form>

    <div class="section-heading"><h2>Обзор</h2><button onclick="render('analytics')">Аналитика</button></div>
    <div class="stats-grid">
      ${statCard('users',d.currentStudents||0,'Заселено сейчас','green','students')}
      ${statCard('door',d.freeRooms||0,'Свободно комнат','','rooms')}
      ${statCard('globe',d.foreigners||0,'Иностранные','','foreigners')}
      ${statCard('council',(d.council||0)+(d.activists||0),'Студсовет и активисты','','council')}
    </div>

    <div class="section-heading"><h2>Быстрые действия</h2></div>
    <div class="action-grid">
      ${canManage()?actionCard('plus','Заселить','Добавить нового студента',"openAddStudent()") : ''}
      ${actionCard('search','Найти студента','ФИО, ИИН или комната',"render('students')")}
      ${actionCard('grid','Комнаты','Занятость Campus №1',"render('rooms')")}
      ${actionCard('chart','Аналитика','Динамика заселения',"render('analytics')")}
    </div>

    <div class="section-heading"><h2>Загрузка комнат</h2></div>
    <div class="capacity-card" onclick="render('rooms')">
      <div class="capacity-row"><b>Занято ${d.occupiedRooms||0} из ${d.totalRooms||0} комнат</b><span>${occupancy}%</span></div>
      <div class="progress"><span style="width:${Math.min(100,occupancy)}%"></span></div>
      <div class="capacity-meta"><span>${d.currentStudents||0} проживающих</span><span>${d.freeRooms||0} свободно</span></div>
    </div>

    <button class="ai-promo" type="button" onclick="render('ai')">
      <span class="action-icon">${icon('spark')}</span>
      <span class="ai-promo-copy"><b>Campus AI</b><small>Поиск по базе, анализ и подготовка текстов</small></span>
      <span class="arrow">›</span>
    </button>`;
}

function statCard(iconName,value,label,tone,page){ return `<button class="stat-card ${tone||''}" type="button" onclick="render('${page}')"><div class="stat-top"><span class="mini-icon">${icon(iconName)}</span></div><span class="stat-value">${Number(value)||0}</span><span class="stat-label">${esc(label)}</span></button>`; }
function actionCard(iconName,title,subtitle,onclick){ return `<button class="action-card" type="button" onclick="${onclick}"><span class="action-icon">${icon(iconName)}</span><b>${esc(title)}</b><small>${esc(subtitle)}</small></button>`; }
function homeSearch(e){ e.preventDefault(); const q=$('#homeSearchInput')?.value.trim()||''; render('students',{mode:'all',query:q}); }

async function renderStudents(mode='active',query='',seq=state.renderSeq){
  $('#view').innerHTML=`${pageHead('Студенты','home')}
    <form class="global-search" onsubmit="studentSearchSubmit(event)"><span class="mini-icon">${icon('search')}</span><input id="studentSearch" autocomplete="off" value="${esc(query)}" placeholder="ФИО, ИИН, комната, факультет"><button class="search-action" type="submit">Найти</button></form>
    <div class="tabs"><button class="tab ${mode==='active'?'active':''}" onclick="renderStudents('active','',state.renderSeq)" type="button">Заселены</button><button class="tab ${mode==='all'?'active':''}" onclick="renderStudents('all','',state.renderSeq)" type="button">Все</button><button class="tab ${mode==='evicted'?'active':''}" onclick="renderStudents('evicted','',state.renderSeq)" type="button">Выселены</button></div>
    <div id="studentList" class="list">${studentSkeletons()}</div>`;

  if(query){ return doStudentSearch(query,seq); }
  const cached=state.studentLists[mode];
  if(cached){ drawStudents(cached); refreshStudents(mode,seq,true); return; }
  const list=await apiRequest('appGetStudents',[state.initData,mode],{ttl:30000});
  if(!pageAlive('students',seq)) return;
  state.studentLists[mode]=list; indexStudents(list); drawStudents(list);
}
function studentSkeletons(){ return Array.from({length:5},()=>'<div class="row-card"><div class="avatar skeleton"></div><div class="row-main"><div class="skeleton" style="height:14px;width:70%"></div><div class="skeleton" style="height:10px;width:50%;margin-top:7px"></div></div></div>').join(''); }
async function refreshStudents(mode,seq,silent){
  try{ const list=await apiRequest('appGetStudents',[state.initData,mode],{ttl:0,force:true}); state.studentLists[mode]=list; indexStudents(list); if(pageAlive('students',seq)) drawStudents(list); }catch(e){ if(!silent) toast(e.message); }
}
function drawStudents(list){
  const el=$('#studentList'); if(!el)return;
  if(!list?.length){el.innerHTML='<div class="empty">Ничего не найдено</div>';return;}
  el.innerHTML=list.map(s=>`<button class="row-card clickable" type="button" onclick="openStudent(${Number(s.rowNumber)})"><span class="avatar">${esc(initials(s.fio))}</span><span class="row-main"><b>${esc(s.fio)}</b><small>Комната ${esc(s.room||'—')} · ${esc(s.faculty||'Факультет не указан')}</small></span><span class="badge ${s.active?'':'red'}">${s.active?'Заселен':'Выселен'}</span></button>`).join('');
}
function studentSearchSubmit(e){ e.preventDefault(); doStudentSearch($('#studentSearch')?.value.trim()||'',state.renderSeq); }
async function doStudentSearch(q,seq=state.renderSeq){
  if(!q){ return renderStudents('active','',seq); }
  const el=$('#studentList'); if(el) el.innerHTML=studentSkeletons();
  try{ const list=await apiRequest('appSearchStudents',[state.initData,q],{ttl:8000,force:true}); if(!pageAlive('students',seq))return; indexStudents(list); drawStudents(list); }
  catch(e){ if(pageAlive('students',seq)) $('#studentList').innerHTML=`<div class="empty">${esc(e.message)}</div>`; }
}

async function openStudent(row){
  try{
    let s=state.studentMap.get(Number(row));
    if(!s){ s=await apiRequest('appGetStudent',[state.initData,row],{ttl:15000}); state.studentMap.set(Number(row),s); }
    const actions=canManage()&&s.active?`<div class="button-row"><button class="btn btn-secondary" onclick="openMove(${s.rowNumber})">Переселить</button><button class="btn btn-danger" onclick="confirmEvict(${s.rowNumber})">Выселить</button></div>`:'';
    showModal(`<div class="sheet-handle"></div><h3>${esc(s.fio)}</h3><span class="badge ${s.active?'':'red'}">${s.active?'Проживает':'Выселен'}</span><div class="kv"><div><small>Комната</small><b>${esc(s.room||'—')}</b></div><div><small>Факультет</small><b>${esc(s.faculty||'—')}</b></div><div><small>ИИН / паспорт</small><b>${esc(s.iin||'—')}</b></div><div><small>Заселение</small><b>${esc(s.dateIn||'—')}</b></div><div><small>Дата рождения</small><b>${esc(s.birthDate||'—')}</b></div><div><small>Прописка</small><b>${esc(s.registration||'—')}</b></div></div>${actions}<button class="btn btn-secondary btn-wide" onclick="closeModal()">Закрыть</button>`);
  }catch(e){toast(e.message)}
}

async function renderRooms(seq=state.renderSeq){
  $('#view').innerHTML=`${pageHead('Комнаты','home')}<div class="global-search"><span class="mini-icon">${icon('search')}</span><input id="roomFilter" autocomplete="off" placeholder="Номер комнаты" oninput="filterRooms()"></div><div class="page-sub" style="margin:10px 2px 14px">13, 14, 23, 30–117, 119–125, 128–162</div><div id="roomsGrid" class="rooms-grid">${roomSkeletons()}</div>`;
  if(state.roomData){ drawRooms(state.roomData); refreshRooms(seq,true); return; }
  const list=await apiRequest('appGetRooms',[state.initData],{ttl:30000}); if(!pageAlive('rooms',seq))return; state.roomData=list; drawRooms(list);
}
function roomSkeletons(){return Array.from({length:12},()=>'<div class="room-card"><div class="skeleton" style="height:22px;width:42%;margin:8px auto"></div><div class="skeleton" style="height:10px;width:65%;margin:10px auto"></div></div>').join('')}
async function refreshRooms(seq,silent){ try{ const list=await apiRequest('appGetRooms',[state.initData],{ttl:0,force:true}); state.roomData=list; if(pageAlive('rooms',seq))drawRooms(list); }catch(e){if(!silent)toast(e.message)} }
function drawRooms(list){ const el=$('#roomsGrid'); if(!el)return; el.innerHTML=(list||[]).map(r=>`<button class="room-card ${r.occupants?'busy':'empty'}" type="button" onclick="openRoom('${esc(r.room)}')"><span class="room-dot"></span><b>${esc(r.room)}</b><small>${r.occupants?formatCount(r.occupants,'проживает','проживают','проживают'):'Свободна'}</small></button>`).join(''); }
function filterRooms(){ const q=$('#roomFilter')?.value.trim()||''; drawRooms((state.roomData||[]).filter(r=>!q||String(r.room).includes(q))); }
async function openRoom(room){
  try{
    let occupants=null;
    const active=state.studentLists.active;
    if(active) occupants=active.filter(s=>String(s.room)===String(room));
    if(!occupants){ occupants=(await apiRequest('appGetRoom',[state.initData,room],{ttl:15000})).occupants||[]; indexStudents(occupants); }
    showModal(`<div class="sheet-handle"></div><h3>Комната №${esc(room)}</h3><div style="color:var(--muted);font-size:12px;margin-bottom:12px">${formatCount(occupants.length,'проживающий','проживающих','проживающих')}</div><div class="list">${occupants.length?occupants.map(s=>`<button class="row-card clickable" onclick="openStudent(${s.rowNumber})"><span class="avatar">${esc(initials(s.fio))}</span><span class="row-main"><b>${esc(s.fio)}</b><small>${esc(s.faculty||'')}</small></span></button>`).join(''):'<div class="empty">Комната свободна</div>'}</div>${canManage()?`<button class="btn btn-primary btn-wide" onclick="closeModal();openAddStudent('${esc(room)}')">Заселить в комнату</button>`:''}<button class="btn btn-secondary btn-wide" onclick="closeModal()">Закрыть</button>`);
  }catch(e){toast(e.message)}
}

function renderAnalytics(){
  const a=state.analytics||{},d=a.dashboard||state.dashboard||{},m=a.months||[]; const max=Math.max(1,...m.map(x=>x.inCount||0));
  $('#view').innerHTML=`${pageHead('Аналитика','home')}<div class="stats-grid">${statCard('users',d.currentStudents||0,'Заселено','','students')}${statCard('door',d.freeRooms||0,'Свободно','','rooms')}${statCard('grid',d.occupiedRooms||0,'Занято','','rooms')}${statCard('grid',d.totalRooms||0,'Всего комнат','','rooms')}</div><div class="section-heading"><h2>Заселения за 6 месяцев</h2></div><div class="panel"><div class="chart">${m.map(x=>`<div class="bar-wrap"><div class="bar" style="height:${Math.max(6,Math.round((x.inCount||0)/max*120))}px"></div><span>${esc(x.label)}</span></div>`).join('')}</div></div><div class="section-heading"><h2>Распределение комнат</h2></div><div class="panel"><div class="mini-stat-grid"><div class="mini-stat"><b>${a.distribution?.empty||0}</b><small>Пустые</small></div><div class="mini-stat"><b>${a.distribution?.one||0}</b><small>1 человек</small></div><div class="mini-stat"><b>${a.distribution?.two||0}</b><small>2 человека</small></div><div class="mini-stat"><b>${a.distribution?.three||0}</b><small>3 человека</small></div><div class="mini-stat"><b>${a.distribution?.fourPlus||0}</b><small>4+ человека</small></div></div></div>`;
}

function renderMore(){
  $('#view').innerHTML=`${pageHead('Ещё','home')}<div class="more-grid">${moreCard('globe','Иностранцы','Отдельный список',"render('foreigners')")}${moreCard('council','Студсовет','Состав и сектора',"render('council')")}${moreCard('users','Активисты','Список активистов',"render('activists')")}${moreCard('shield','Контроль','Замечания и нарушения',"render('control')")}${moreCard('clipboard','Журнал','История действий',"render('journal')")}${moreCard('chart','Аналитика','Заселение и комнаты',"render('analytics')")}${moreCard('book','Документы','Подготовка документов',"toast('Раздел документов добавим следующим этапом')")}</div><div class="section-heading"><h2>Настройки</h2></div><div class="settings-card"><div class="setting-row"><div class="setting-copy"><b>Тёмная тема</b><small>Сохраняется на этом устройстве</small></div><button id="themeSwitch" class="switch ${state.theme==='dark'?'on':''}" onclick="toggleTheme()"><span></span></button></div><div class="setting-row"><div class="setting-copy"><b>Версия интерфейса</b><small>GitHub Pages · быстрый frontend</small></div><span class="badge blue">v${APP_VERSION}</span></div></div>`;
}
function moreCard(iconName,title,sub,onclick){ return `<button class="more-item" type="button" onclick="${onclick}"><span class="action-icon">${icon(iconName)}</span><b>${esc(title)}</b><small>${esc(sub)}</small></button>`; }

async function renderGenericTable(title,fn,back,seq){
  $('#view').innerHTML=`${pageHead(title,back)}<div id="generic" class="list">${studentSkeletons()}</div>`;
  const data=await apiRequest(fn,[state.initData],{ttl:15000}); if(!pageAlive(state.currentPage,seq))return;
  const el=$('#generic'); if(!data.rows?.length){el.innerHTML='<div class="empty">Таблица пока пустая или не подключена.</div>';return;}
  el.innerHTML=data.rows.map(r=>{const vals=Object.entries(r).filter(([k,v])=>k!=='_rowNumber'&&String(v).trim()).slice(0,5);return `<div class="row-card"><span class="avatar">${esc(initials(vals[0]?.[1]||title))}</span><span class="row-main">${vals.map(([k,v],i)=>i===0?`<b>${esc(v)}</b>`:`<small>${esc(k)}: ${esc(v)}</small>`).join('')}</span></div>`}).join('');
}
async function renderCouncil(kind,seq){
  const title=kind==='activists'?'Активисты':'Студенческий совет';
  $('#view').innerHTML=`${pageHead(title,'more')}<div id="generic" class="list">${studentSkeletons()}</div>`;
  const data=await apiRequest('appGetCouncil',[state.initData,kind],{ttl:15000}); if(!pageAlive(state.currentPage,seq))return;
  const el=$('#generic'); if(!data.rows?.length){el.innerHTML='<div class="empty">Список пока пустой.</div>';return;}
  el.innerHTML=data.rows.map(r=>{const name=r['ФИО']||r['Имя']||Object.values(r).find(v=>v&&typeof v==='string')||'Участник';return `<div class="row-card"><span class="avatar">${esc(initials(name))}</span><span class="row-main"><b>${esc(name)}</b><small>${esc(r['Должность']||r['Роль']||r['Сектор']||'')}</small>${r['Комната']?`<small>Комната ${esc(r['Комната'])}</small>`:''}</span></div>`}).join('');
}

function renderAI(){
  if(!state.aiMessages.length) state.aiMessages=[{role:'bot',text:'Привет. Я Campus AI. Могу искать по базе, показывать свободные комнаты, анализировать заселение и помогать с текстами.',source:'campus'}];
  $('#view').innerHTML=`${pageHead('Campus AI','home')}<div class="chat-shell"><div class="ai-header"><span class="action-icon">${icon('spark')}</span><span class="ai-header-copy"><b>Помощник Campus №1</b><small>Данные базы + генерация текстов</small></span><span class="ai-status">ONLINE</span></div><div class="quick-prompts"><button class="prompt-chip" onclick="askQuick('Кто проживает в комнате 145?')">Комната 145</button><button class="prompt-chip" onclick="askQuick('Какие комнаты сейчас свободны?')">Свободные комнаты</button><button class="prompt-chip" onclick="askQuick('Сколько сейчас заселено студентов?')">Статистика</button><button class="prompt-chip" onclick="askQuick('Составь короткое объявление студентам о ремонтных работах на русском и казахском')">Объявление</button></div><div id="chat" class="chat">${state.aiMessages.map(renderBubble).join('')}</div><div class="chat-compose"><div class="compose"><textarea id="aiInput" rows="1" placeholder="Напишите вопрос…" oninput="autoGrow(this)" onkeydown="aiKeydown(event)"></textarea><button class="send-btn" onclick="sendAI()">↑</button></div></div></div>`;
  setTimeout(()=>scrollChat(false),0);
}
function renderBubble(m){ return `<div class="bubble ${m.role==='user'?'user':'bot'}">${esc(m.text)}${m.source?`<span class="bubble-meta">${m.source==='openai'?'OpenAI':'Campus'}</span>`:''}</div>`; }
function autoGrow(el){el.style.height='auto';el.style.height=Math.min(el.scrollHeight,110)+'px'}
function aiKeydown(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendAI()}}
function askQuick(text){ const el=$('#aiInput'); if(el){el.value=text;sendAI();} }
async function sendAI(){
  const inp=$('#aiInput'); const text=inp?.value.trim(); if(!text)return;
  state.aiMessages.push({role:'user',text}); inp.value=''; inp.style.height='auto';
  state.aiMessages.push({role:'bot',text:'Думаю…',source:''}); renderAI(); scrollChat(true);
  const waitIndex=state.aiMessages.length-1;
  try{ const r=await apiRequest('appAskAI',[state.initData,text],{ttl:0,force:true}); state.aiMessages[waitIndex]={role:'bot',text:r.text||'Ответ не получен.',source:r.source||'campus'}; }
  catch(e){ state.aiMessages[waitIndex]={role:'bot',text:e.message||String(e),source:'campus'}; }
  if(state.currentPage==='ai'){renderAI();scrollChat(true)}
}
function scrollChat(smooth){ setTimeout(()=>window.scrollTo({top:document.body.scrollHeight,behavior:smooth?'smooth':'auto'}),0); }

function roomOptions(selected){ return (state.rooms||[]).map(r=>`<option value="${esc(r)}" ${String(r)===String(selected)?'selected':''}>${esc(r)}</option>`).join(''); }
function openAddStudent(room=''){
  if(!canManage())return toast('Недостаточно прав');
  showModal(`<div class="sheet-handle"></div><h3>Заселить студента</h3><div class="field"><label>ФИО</label><input id="f_fio" autocomplete="off"></div><div class="field"><label>Комната</label><select id="f_room"><option value="">Выберите комнату</option>${roomOptions(room)}</select></div><div class="field"><label>ИИН / паспорт</label><input id="f_iin" autocomplete="off"></div><div class="field"><label>Факультет</label><input id="f_faculty"></div><div class="field"><label>Дата заселения</label><input id="f_dateIn" placeholder="01.09.2026"></div><div class="field"><label>Дата рождения</label><input id="f_birthDate" placeholder="15.03.2007"></div><div class="field"><label>Прописка</label><input id="f_registration"></div><button class="btn btn-primary btn-wide" onclick="saveNewStudent()">Заселить</button><button class="btn btn-secondary btn-wide" onclick="closeModal()">Отмена</button>`);
}
async function saveNewStudent(){
  try{
    await apiRequest('appAddStudent',[state.initData,{fio:$('#f_fio').value,room:$('#f_room').value,iin:$('#f_iin').value,faculty:$('#f_faculty').value,dateIn:$('#f_dateIn').value,birthDate:$('#f_birthDate').value,registration:$('#f_registration').value}],{ttl:0,force:true});
    closeModal(); toast('Студент добавлен'); await refreshAfterMutation(); render(state.currentPage==='rooms'?'rooms':'home');
  }catch(e){toast(e.message)}
}
function openMove(row){
  const s=state.studentMap.get(Number(row)); if(!s)return toast('Данные студента не загружены');
  showModal(`<div class="sheet-handle"></div><h3>Переселить</h3><p><b>${esc(s.fio)}</b><br><span style="color:var(--muted);font-size:12px">Текущая комната: ${esc(s.room||'—')}</span></p><div class="field"><label>Новая комната</label><select id="move_room"><option value="">Выберите комнату</option>${roomOptions('')}</select></div><button class="btn btn-primary btn-wide" onclick="saveMove(${row})">Подтвердить переселение</button><button class="btn btn-secondary btn-wide" onclick="closeModal()">Отмена</button>`);
}
async function saveMove(row){ try{await apiRequest('appMoveStudent',[state.initData,row,$('#move_room').value],{ttl:0,force:true});closeModal();toast('Студент переселён');await refreshAfterMutation();render('students');}catch(e){toast(e.message)} }
function confirmEvict(row){ const s=state.studentMap.get(Number(row)); showModal(`<div class="sheet-handle"></div><h3>Подтвердить выселение?</h3><p><b>${esc(s?.fio||'Студент')}</b></p><p style="color:var(--muted);font-size:12px">Действие будет записано в журнал.</p><button class="btn btn-danger btn-wide" onclick="doEvict(${row})">Выселить</button><button class="btn btn-secondary btn-wide" onclick="closeModal()">Отмена</button>`); }
async function doEvict(row){ try{await apiRequest('appEvictStudent',[state.initData,row],{ttl:0,force:true});closeModal();toast('Студент выселен');await refreshAfterMutation();render('students');}catch(e){toast(e.message)} }
async function refreshAfterMutation(){
  invalidateData();
  try{ const data=await apiRequest('appBootstrap',[state.initData],{ttl:0,force:true}); state.dashboard=data.dashboard;state.analytics=data.analytics;state.rooms=data.rooms||state.rooms; }catch(e){}
  prefetchCore();
}

function showModal(html){ $('#modalSheet').innerHTML=html; $('#modal').classList.remove('hidden'); document.body.style.overflow='hidden'; }
function closeModal(){ $('#modal').classList.add('hidden'); document.body.style.overflow=''; }
function showProfile(){
  const u=state.user||{};
  showModal(`<div class="sheet-handle"></div><div style="display:flex;align-items:center;gap:12px"><span class="avatar" style="width:54px;height:54px;font-size:15px">${esc(initials(u.firstName||u.username||'C1'))}</span><div><h3 style="margin:0 0 4px">${esc(u.firstName||'Пользователь')}</h3><span class="badge blue">${esc(roleLabel(u))}</span></div></div><div class="kv"><div><small>Telegram ID</small><b>${esc(u.id||'—')}</b></div><div><small>Доступ</small><b>${u.canManage?'Управление':'Просмотр'}</b></div></div><button class="btn btn-secondary btn-wide" onclick="closeModal()">Закрыть</button>`);
}

function bindGlobalEvents(){
  $$('.nav-item').forEach(btn=>btn.addEventListener('click',()=>render(btn.dataset.page)));
  $('#themeBtn')?.addEventListener('click',toggleTheme);
  $('#profileBtn')?.addEventListener('click',showProfile);
  $('#homeLogoBtn')?.addEventListener('click',()=>render('home'));
  $('#modal')?.addEventListener('click',e=>{ if(e.target?.hasAttribute('data-close-modal'))closeModal(); });
  document.addEventListener('keydown',e=>{ if(e.key==='Escape')closeModal(); });
}

initTheme();
bindGlobalEvents();
injectIcons();
boot();
