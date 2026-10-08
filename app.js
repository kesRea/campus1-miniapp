/* CAMPUS_GITHUB_UI_V13_2_AI_DEV */
const CAMPUS_API_URL = 'https://campus1-db-47a56e67.pages.dev/api';
const APP_VERSION = '13.2.0';
const tg = window.Telegram?.WebApp || null;
const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const state = {
  initData:'', user:null, dashboard:null, analytics:null, rooms:[],
  currentPage:'home', renderSeq:0, roomData:null, roomDataTime:0,
  studentLists:{}, studentListTime:{}, studentMap:new Map(),
  cache:new Map(), inflight:new Map(), aiMessages:[], aiStatus:null, aiBusy:false,
  aiDraft:'', searchTimer:null, theme:'light', lastCoreSync:0
};

const UPDATE_CENTER_VERSION = '13.2.0';
const CAMPUS_UPDATES = [
  {
    version:'13.2',
    date:'9 октября 2026',
    title:'Campus AI — режим разработки',
    latest:true,
    items:[
      'Campus AI временно отключён от рабочего интерфейса.',
      'Вкладка ИИ сохранена и теперь показывает статус «В разработке».',
      'Остальные разделы Campus №1 продолжают работать без изменений.'
    ]
  },
  {
    version:'13.1',
    date:'9 октября 2026',
    title:'Центр обновлений',
    latest:false,
    items:[
      'Добавлена аккуратная кнопка «Что нового» справа сверху.',
      'Новая версия отмечается маленькой синей точкой.',
      'Добавлена история последних обновлений Campus №1.'
    ]
  },
  {
    version:'13.0',
    date:'9 октября 2026',
    title:'Скорость и полировка',
    items:[
      'Студенты и комнаты открываются быстрее благодаря кэшу.',
      'Поиск сначала работает локально, без лишнего ожидания сервера.',
      'Campus AI сохраняет текущий диалог и черновик сообщения.',
      'Доработаны анимации, нажатия и тёмная тема.'
    ]
  },
  {
    version:'11.1',
    date:'9 октября 2026',
    title:'Campus AI',
    items:[
      'Добавлен полноценный экран Campus AI.',
      'Локальные запросы по базе работают без внешнего ИИ.',
      'Поддержано безопасное подключение OpenAI через backend.'
    ]
  },
  {
    version:'10.3',
    date:'9 октября 2026',
    title:'Быстрый запуск',
    items:[
      'Добавлена постоянная кнопка Campus №1 рядом с полем сообщения Telegram.',
      'Для запуска приложения больше не требуется каждый раз писать /start.'
    ]
  }
];

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
  council:'<svg viewBox="0 0 24 24"><circle cx="8" cy="8" r="3"/><circle cx="17" cy="7" r="2"/><path d="M2 21v-2a6 6 0 0 1 12 0v2M14 15a5 5 0 0 1 8 4v2"/></svg>',
  copy:'<svg viewBox="0 0 24 24"><rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></svg>',
  trash:'<svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6M10 11v5M14 11v5"/></svg>'
};

function icon(name){ return ICONS[name] || ICONS.grid; }
function injectIcons(){ $$('[data-icon]').forEach(el=>{ el.innerHTML=icon(el.dataset.icon); }); }
function initials(name){ return String(name||'C1').split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase(); }
function roleLabel(u){ return u?.role || 'Пользователь'; }
function canManage(){ return !!state.user?.canManage; }
function formatCount(n,one,few,many){ n=Math.abs(Number(n)||0); const n10=n%10,n100=n%100; const word=(n10===1&&n100!==11)?one:(n10>=2&&n10<=4&&(n100<12||n100>14))?few:many; return `${n} ${word}`; }

function haptic(type='light'){ try{ tg?.HapticFeedback?.impactOccurred(type); }catch(e){} }

function normalizeSearch(v){
  return String(v??'').toLowerCase().replace(/ё/g,'е').replace(/\s+/g,' ').trim();
}
function knownStudents(){
  const byRow=new Map();
  Object.values(state.studentLists).forEach(list=>(list||[]).forEach(s=>byRow.set(Number(s.rowNumber),s)));
  return [...byRow.values()];
}
function localStudentSearch(q){
  const needle=normalizeSearch(q);
  if(!needle)return [];
  const digits=needle.replace(/\D/g,'');
  return knownStudents().filter(s=>{
    const hay=normalizeSearch([s.fio,s.room,s.faculty,s.iin,s.registration].filter(Boolean).join(' '));
    if(hay.includes(needle))return true;
    if(digits.length>=3){
      const idDigits=String(s.iin||'').replace(/\D/g,'');
      if(idDigits.includes(digits))return true;
    }
    return false;
  });
}
function persistAIChat(){
  try{
    const safe=state.aiMessages.filter(m=>!m.pending&&m.text).slice(-24).map(m=>({
      role:m.role==='user'?'user':'bot',
      text:String(m.text).slice(0,12000),
      source:m.source||'',
      model:m.model||''
    }));
    sessionStorage.setItem('campus-ai-chat-v13',JSON.stringify(safe));
  }catch(e){}
}
function restoreAIChat(){
  try{
    const arr=JSON.parse(sessionStorage.getItem('campus-ai-chat-v13')||'[]');
    if(Array.isArray(arr))state.aiMessages=arr.slice(-24);
  }catch(e){}
}
function coreIsFresh(ts,maxAge=60000){ return !!ts && Date.now()-ts<maxAge; }

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
    state.lastCoreSync=Date.now();
    restoreAIChat();
    $('#profileInitials').textContent=initials(state.user.firstName || state.user.username || 'C1');
    $('#splash').classList.add('hidden'); $('#app').classList.remove('hidden'); $('#bottomNav').classList.remove('hidden');
    injectIcons(); applyTheme(state.theme,false); updateUpdatesBadge(); render('home');
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
      apiRequest('appGetStudents',[state.initData,'active'],{ttl:60000}),
      apiRequest('appGetRooms',[state.initData],{ttl:60000})
    ]);
    state.studentLists.active=students; state.studentListTime.active=Date.now(); indexStudents(students);
    state.roomData=rooms; state.roomDataTime=Date.now();
  }catch(e){}

  setTimeout(async()=>{
    try{
      if(state.studentLists.all)return;
      const all=await apiRequest('appGetStudents',[state.initData,'all'],{ttl:90000});
      state.studentLists.all=all; state.studentListTime.all=Date.now(); indexStudents(all);
    }catch(e){}
  },900);

  setTimeout(()=>loadAIStatus().catch(()=>{}),1400);
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
      <span class="ai-promo-copy"><b>Campus AI</b><small>В разработке · скоро вернётся</small></span>
      <span class="arrow">›</span>
    </button>`;
}

function statCard(iconName,value,label,tone,page){ return `<button class="stat-card ${tone||''}" type="button" onclick="render('${page}')"><div class="stat-top"><span class="mini-icon">${icon(iconName)}</span></div><span class="stat-value">${Number(value)||0}</span><span class="stat-label">${esc(label)}</span></button>`; }
function actionCard(iconName,title,subtitle,onclick){ return `<button class="action-card" type="button" onclick="${onclick}"><span class="action-icon">${icon(iconName)}</span><b>${esc(title)}</b><small>${esc(subtitle)}</small></button>`; }
function homeSearch(e){ e.preventDefault(); const q=$('#homeSearchInput')?.value.trim()||''; render('students',{mode:'all',query:q}); }

async function renderStudents(mode='active',query='',seq=state.renderSeq){
  $('#view').innerHTML=`${pageHead('Студенты','home')}
    <form class="global-search" onsubmit="studentSearchSubmit(event)"><span class="mini-icon">${icon('search')}</span><input id="studentSearch" autocomplete="off" value="${esc(query)}" placeholder="ФИО, ИИН, комната, факультет" oninput="studentSearchInput(this.value)"><button class="search-action" type="submit">Найти</button></form>
    <div id="studentSearchHint" class="search-hint"></div>
    <div class="tabs"><button class="tab ${mode==='active'?'active':''}" onclick="renderStudents('active','',state.renderSeq)" type="button">Заселены</button><button class="tab ${mode==='all'?'active':''}" onclick="renderStudents('all','',state.renderSeq)" type="button">Все</button><button class="tab ${mode==='evicted'?'active':''}" onclick="renderStudents('evicted','',state.renderSeq)" type="button">Выселены</button></div>
    <div id="studentList" class="list">${studentSkeletons()}</div>`;

  if(query){ return doStudentSearch(query,seq); }
  const cached=state.studentLists[mode];
  if(cached){
    drawStudents(cached);
    if(!coreIsFresh(state.studentListTime[mode],60000)) refreshStudents(mode,seq,true);
    return;
  }
  const list=await apiRequest('appGetStudents',[state.initData,mode],{ttl:60000});
  if(!pageAlive('students',seq)) return;
  state.studentLists[mode]=list; state.studentListTime[mode]=Date.now(); indexStudents(list); drawStudents(list);
}
function studentSkeletons(){ return Array.from({length:5},()=>'<div class="row-card"><div class="avatar skeleton"></div><div class="row-main"><div class="skeleton" style="height:14px;width:70%"></div><div class="skeleton" style="height:10px;width:50%;margin-top:7px"></div></div></div>').join(''); }
async function refreshStudents(mode,seq,silent){
  try{
    const list=await apiRequest('appGetStudents',[state.initData,mode],{ttl:0,force:true});
    state.studentLists[mode]=list; state.studentListTime[mode]=Date.now(); indexStudents(list);
    if(pageAlive('students',seq)) drawStudents(list);
  }catch(e){ if(!silent) toast(e.message); }
}
function drawStudents(list){
  const el=$('#studentList'); if(!el)return;
  if(!list?.length){el.innerHTML='<div class="empty">Ничего не найдено</div>';return;}
  el.innerHTML=list.map(s=>`<button class="row-card clickable" type="button" onclick="openStudent(${Number(s.rowNumber)})"><span class="avatar">${esc(initials(s.fio))}</span><span class="row-main"><b>${esc(s.fio)}</b><small>Комната ${esc(s.room||'—')} · ${esc(s.faculty||'Факультет не указан')}</small></span><span class="badge ${s.active?'':'red'}">${s.active?'Заселен':'Выселен'}</span></button>`).join('');
}
function studentSearchInput(value){
  clearTimeout(state.searchTimer);
  const q=String(value||'').trim();
  state.searchTimer=setTimeout(()=>{
    if(state.currentPage!=='students')return;
    const hint=$('#studentSearchHint');
    if(!q){
      if(hint)hint.textContent='';
      const list=state.studentLists.active||state.studentLists.all||[];
      drawStudents(list);
      return;
    }
    const local=localStudentSearch(q);
    if(local.length){
      drawStudents(local);
      if(hint)hint.textContent=`Мгновенный поиск · найдено ${local.length}`;
    }else{
      if(hint)hint.textContent='В локальном кэше совпадений нет · нажмите «Найти» для проверки базы';
    }
  },120);
}
function studentSearchSubmit(e){
  e.preventDefault();
  doStudentSearch($('#studentSearch')?.value.trim()||'',state.renderSeq);
}
async function doStudentSearch(q,seq=state.renderSeq){
  if(!q){ return renderStudents('active','',seq); }

  const local=localStudentSearch(q);
  const hint=$('#studentSearchHint');
  if(local.length){
    drawStudents(local);
    if(hint)hint.textContent=`Найдено ${local.length} · уточняем в базе…`;
  }else{
    const el=$('#studentList'); if(el) el.innerHTML=studentSkeletons();
    if(hint)hint.textContent='Проверяем базу…';
  }

  try{
    const list=await apiRequest('appSearchStudents',[state.initData,q],{ttl:12000,force:true});
    if(!pageAlive('students',seq))return;
    indexStudents(list); drawStudents(list);
    if(hint)hint.textContent=`База проверена · найдено ${(list||[]).length}`;
  }catch(e){
    if(pageAlive('students',seq)){
      if(local.length){
        drawStudents(local);
        if(hint)hint.textContent='Показаны данные из локального кэша';
      }else{
        $('#studentList').innerHTML=`<div class="empty">${esc(e.message)}</div>`;
      }
    }
  }
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
  if(state.roomData){
    drawRooms(state.roomData);
    if(!coreIsFresh(state.roomDataTime,60000)) refreshRooms(seq,true);
    return;
  }
  const list=await apiRequest('appGetRooms',[state.initData],{ttl:60000});
  if(!pageAlive('rooms',seq))return;
  state.roomData=list; state.roomDataTime=Date.now(); drawRooms(list);
}
function roomSkeletons(){return Array.from({length:12},()=>'<div class="room-card"><div class="skeleton" style="height:22px;width:42%;margin:8px auto"></div><div class="skeleton" style="height:10px;width:65%;margin:10px auto"></div></div>').join('')}
async function refreshRooms(seq,silent){
  try{
    const list=await apiRequest('appGetRooms',[state.initData],{ttl:0,force:true});
    state.roomData=list; state.roomDataTime=Date.now();
    if(pageAlive('rooms',seq))drawRooms(list);
  }catch(e){if(!silent)toast(e.message)}
}
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
  $('#view').innerHTML=`${pageHead('Campus AI','home')}
    <div class="ai-dev-shell">
      <div class="ai-dev-visual">
        <span class="ai-dev-orb">${icon('spark')}</span>
        <span class="ai-dev-badge">В разработке</span>
      </div>

      <div class="ai-dev-copy">
        <h2>Campus AI пока готовится</h2>
        <p>ИИ временно отключён от рабочего интерфейса. Сейчас приоритет — скорость, стабильность и основные функции Campus №1.</p>
      </div>

      <div class="ai-dev-progress">
        <div class="ai-dev-progress-head"><span>Статус разработки</span><b>В процессе</b></div>
        <div class="ai-dev-progress-bar"><span></span></div>
      </div>

      <div class="ai-dev-list">
        <div><span class="ai-dev-check">${icon('check')}</span><span><b>Интерфейс</b><small>Экран и базовый UX подготовлены</small></span></div>
        <div><span class="ai-dev-check">${icon('check')}</span><span><b>Безопасность</b><small>ИИ не имеет прямого доступа к базе</small></span></div>
        <div><span class="ai-dev-wait">${icon('clock')}</span><span><b>Умные действия</b><small>Будут добавлены позже после тестирования</small></span></div>
      </div>

      <button class="btn btn-secondary btn-wide" type="button" onclick="render('home')">Вернуться на главную</button>
    </div>`;
}
async function loadAIStatus(force=false){
  if(state.aiStatus && !force){ updateAIStatusBadge(); return state.aiStatus; }
  try{
    state.aiStatus=await apiRequest('appAIStatus',[state.initData],{ttl:60000,force});
  }catch(e){
    state.aiStatus={configured:false,provider:'Campus Local',model:'local',mode:'local',error:e?.message||String(e)};
  }
  updateAIStatusBadge();
  return state.aiStatus;
}

function updateAIStatusBadge(){
  const el=$('#aiModeBadge'); if(!el)return;
  const st=state.aiStatus;
  el.className='ai-mode '+(st?.configured?'online':'local');
  el.textContent=st?.configured ? (st.model||'OpenAI') : 'Локальный режим';
}


async function secretApiRequest(method,args=[]){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),22000);
  try{
    const response=await fetch(CAMPUS_API_URL,{
      method:'POST',redirect:'follow',signal:controller.signal,
      headers:{'Content-Type':'text/plain;charset=utf-8'},
      body:JSON.stringify({method,args})
    });
    const text=await response.text();
    let data;
    try{data=JSON.parse(text)}catch(e){throw new Error('Campus API вернул не JSON.')}
    if(!response.ok||!data.ok)throw new Error(data?.error||'Ошибка Campus API.');
    return data.result;
  }catch(e){
    if(e?.name==='AbortError')throw new Error('Сервер отвечает слишком долго.');
    throw e;
  }finally{clearTimeout(timer)}
}

function openAISetup(){
  if(!state.user?.isOwner)return toast('Настройки доступны только владельцу');
  const current=state.aiStatus?.model||'gpt-6-luna';
  const configured=!!state.aiStatus?.configured;
  showModal(`<div class="sheet-handle"></div><h3>Настройки Campus AI</h3>
    <p style="color:var(--muted);font-size:12px;line-height:1.5;margin-top:-2px">Ключ хранится только в Script Properties Apps Script и не сохраняется в GitHub.</p>
    <div class="field"><label>OpenAI API key</label><input id="ai_api_key" type="password" autocomplete="off" placeholder="sk-…"></div>
    <div class="field"><label>Модель</label><select id="ai_model"><option value="gpt-6-luna" ${current==='gpt-6-luna'?'selected':''}>GPT-6 Luna — быстро и недорого</option><option value="gpt-6-sol" ${current==='gpt-6-sol'?'selected':''}>GPT-6 Sol — умнее</option><option value="gpt-5.6-sol" ${current==='gpt-5.6-sol'?'selected':''}>GPT-5.6 Sol</option></select></div>
    <button class="btn btn-primary btn-wide" onclick="saveAISetup()">${configured?'Обновить настройки':'Подключить OpenAI'}</button>
    ${configured?'<button class="btn btn-danger btn-wide" onclick="disconnectAI()">Отключить OpenAI</button>':''}
    <button class="btn btn-secondary btn-wide" onclick="closeModal()">Закрыть</button>`);
}

async function saveAISetup(){
  const input=$('#ai_api_key'); const key=input?.value.trim()||''; const model=$('#ai_model')?.value||'gpt-6-luna';
  if(!key)return toast('Вставьте OpenAI API key');
  try{
    const btn=$('.sheet .btn-primary'); if(btn){btn.disabled=true;btn.textContent='Сохраняем…'}
    const result=await secretApiRequest('appSetAIConfig',[state.initData,key,model]);
    if(input)input.value='';
    state.aiStatus=result; state.cache.clear(); closeModal(); updateAIStatusBadge(); toast('OpenAI подключён');
    if(state.currentPage==='ai')renderAI();
  }catch(e){toast(e?.message||String(e))}
}

async function disconnectAI(){
  try{
    const result=await secretApiRequest('appClearAIConfig',[state.initData]);
    state.aiStatus=result;state.cache.clear();closeModal();toast('OpenAI отключён');if(state.currentPage==='ai')renderAI();
  }catch(e){toast(e?.message||String(e))}
}

function renderBubble(m,index){
  if(m.pending){
    return `<div class="ai-message bot"><div class="ai-avatar">${icon('spark')}</div><div class="ai-message-body"><div class="ai-bubble typing"><i></i><i></i><i></i></div></div></div>`;
  }
  const isUser=m.role==='user';
  const source=m.source==='openai' ? (m.model||'OpenAI') : (m.source==='campus'?'Campus data':'');
  return `<div class="ai-message ${isUser?'user':'bot'}">
    ${isUser?'':`<div class="ai-avatar">${icon('spark')}</div>`}
    <div class="ai-message-body">
      <div class="ai-bubble">${esc(m.text)}</div>
      <div class="ai-message-meta">
        ${source?`<span>${esc(source)}</span>`:'<span></span>'}
        ${isUser?'':`<button type="button" onclick="copyAIMessage(${index})">Копировать</button>`}
      </div>
    </div>
  </div>`;
}

function copyAIMessage(index){
  const text=state.aiMessages[index]?.text||''; if(!text)return;
  const done=()=>{toast('Ответ скопирован');try{tg?.HapticFeedback?.notificationOccurred('success')}catch(e){}};
  if(navigator.clipboard?.writeText){ navigator.clipboard.writeText(text).then(done).catch(()=>fallbackCopyAI(text,done)); }
  else fallbackCopyAI(text,done);
}

function fallbackCopyAI(text,done){
  const ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();
  try{document.execCommand('copy');done();}catch(e){toast('Не удалось скопировать');}
  ta.remove();
}

function confirmClearAI(){
  showModal(`<div class="sheet-handle"></div><h3>Очистить диалог?</h3><p style="color:var(--muted);font-size:12px;line-height:1.5">История Campus AI удалится только на этом устройстве.</p><button class="btn btn-danger btn-wide" onclick="clearAIChat()">Очистить</button><button class="btn btn-secondary btn-wide" onclick="closeModal()">Отмена</button>`);
}
function clearAIChat(){ state.aiMessages=[]; state.aiDraft=''; persistAIChat(); closeModal(); renderAI(); toast('Диалог очищен'); }

function autoGrow(el){el.style.height='auto';el.style.height=Math.min(el.scrollHeight,120)+'px'}
function aiKeydown(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendAI()}}
function askQuick(text){ haptic('light'); const el=$('#aiInput'); if(el){el.value=text;state.aiDraft=text;el.dispatchEvent(new Event('input'));sendAI();} }

async function sendAI(){
  if(state.aiBusy)return;
  const inp=$('#aiInput'); const text=inp?.value.trim(); if(!text)return;
  haptic('light');
  state.aiDraft='';

  const history=state.aiMessages
    .filter(m=>!m.pending && m.text && (m.role==='user'||m.role==='bot'))
    .slice(-8)
    .map(m=>({role:m.role==='user'?'user':'assistant',text:m.text}));

  state.aiMessages.push({role:'user',text});
  persistAIChat();
  state.aiMessages.push({role:'bot',text:'',pending:true,source:''});
  state.aiBusy=true;
  renderAI();
  scrollChat(true);
  const waitIndex=state.aiMessages.length-1;

  try{
    const r=await apiRequest('appAskAI',[state.initData,text,history],{ttl:0,force:true});
    state.aiMessages[waitIndex]={role:'bot',text:r.text||'Ответ не получен.',source:r.source||'campus',model:r.model||''};
    if(r.source==='openai') state.aiStatus={...(state.aiStatus||{}),configured:true,model:r.model||state.aiStatus?.model||'OpenAI'};
  }catch(e){
    state.aiMessages[waitIndex]={role:'bot',text:e?.message||String(e),source:'campus'};
  }finally{
    state.aiBusy=false;
  }

  persistAIChat();
  if(state.currentPage==='ai'){renderAI();scrollChat(true)}
}

function scrollChat(smooth){
  setTimeout(()=>{
    const chat=$('#chat');
    if(chat) window.scrollTo({top:document.body.scrollHeight,behavior:smooth?'smooth':'auto'});
  },20);
}

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

function updateSeenKey(){ return 'campus-update-seen-version'; }

function updateUpdatesBadge(){
  const dot=$('#updatesDot');
  if(!dot)return;
  const seen=localStorage.getItem(updateSeenKey())||'';
  dot.classList.toggle('hidden',seen===UPDATE_CENTER_VERSION);
}

function markUpdatesSeen(){
  try{ localStorage.setItem(updateSeenKey(),UPDATE_CENTER_VERSION); }catch(e){}
  updateUpdatesBadge();
}

function renderUpdateItem(update){
  return `<article class="update-card ${update.latest?'latest':''}">
    <div class="update-card-head">
      <div>
        <div class="update-version-row">
          <span class="update-version">v${esc(update.version)}</span>
          ${update.latest?'<span class="update-latest">Последнее</span>':''}
        </div>
        <h4>${esc(update.title)}</h4>
      </div>
      <time>${esc(update.date)}</time>
    </div>
    <ul>${(update.items||[]).map(item=>`<li>${esc(item)}</li>`).join('')}</ul>
  </article>`;
}

function showWhatsNew(){
  haptic('light');
  markUpdatesSeen();
  showModal(`<div class="sheet-handle"></div>
    <div class="updates-sheet-head">
      <div>
        <div class="updates-kicker">Campus №1</div>
        <h3>Что нового</h3>
        <p>Последние изменения и улучшения приложения.</p>
      </div>
      <span class="updates-current">v${esc(APP_VERSION)}</span>
    </div>
    <div class="updates-list">
      ${CAMPUS_UPDATES.map(renderUpdateItem).join('')}
    </div>
    <div class="updates-footer">Обновления устанавливаются автоматически после публикации новой версии.</div>
    <button class="btn btn-secondary btn-wide" onclick="closeModal()">Закрыть</button>`);
}

function showProfile(){
  const u=state.user||{};
  showModal(`<div class="sheet-handle"></div><div style="display:flex;align-items:center;gap:12px"><span class="avatar" style="width:54px;height:54px;font-size:15px">${esc(initials(u.firstName||u.username||'C1'))}</span><div><h3 style="margin:0 0 4px">${esc(u.firstName||'Пользователь')}</h3><span class="badge blue">${esc(roleLabel(u))}</span></div></div><div class="kv"><div><small>Telegram ID</small><b>${esc(u.id||'—')}</b></div><div><small>Доступ</small><b>${u.canManage?'Управление':'Просмотр'}</b></div></div><button class="btn btn-secondary btn-wide" onclick="closeModal()">Закрыть</button>`);
}

function bindGlobalEvents(){
  $$('.nav-item').forEach(btn=>btn.addEventListener('click',()=>{
    haptic('light');
    const page=btn.dataset.page;
    if(page===state.currentPage){
      window.scrollTo({top:0,behavior:'smooth'});
      return;
    }
    render(page);
  }));
  $('#themeBtn')?.addEventListener('click',()=>{haptic('light');toggleTheme()});
  $('#updatesBtn')?.addEventListener('click',showWhatsNew);
  $('#profileBtn')?.addEventListener('click',()=>{haptic('light');showProfile()});
  $('#homeLogoBtn')?.addEventListener('click',()=>{haptic('light');render('home')});
  $('#modal')?.addEventListener('click',e=>{ if(e.target?.hasAttribute('data-close-modal'))closeModal(); });
  document.addEventListener('keydown',e=>{ if(e.key==='Escape')closeModal(); });
}

initTheme();
bindGlobalEvents();
injectIcons();
boot();


function campusAIDevelopmentNotice(){
  toast('Campus AI сейчас в разработке');
}
