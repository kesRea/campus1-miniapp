const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
const state = { initData:'', user:null, dashboard:null, analytics:null, rooms:[], students:[], currentPage:'home' };
const $ = s => document.querySelector(s);
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const CAMPUS_API_URL = 'https://campus1-db-47a56e67.pages.dev/api';

async function server(name, ...args){
  const response = await fetch(CAMPUS_API_URL, {
    method: 'POST',
    redirect: 'follow',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ method:name, args:args })
  });

  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw new Error('API вернул некорректный ответ.');
  }

  if (!response.ok || !data.ok) {
    throw new Error(data && data.error ? data.error : 'Ошибка Campus API.');
  }

  return data.result;
}
function toast(msg){ const el=$('#toast'); el.textContent=msg; el.classList.remove('hidden'); clearTimeout(toast.t); toast.t=setTimeout(()=>el.classList.add('hidden'),2600); }
function loading(){ $('#view').innerHTML='<div class="loading">Загрузка…</div>'; }
function initials(name){ return String(name||'?').split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase(); }
function roleLabel(u){ return u && u.role ? u.role : 'Пользователь'; }

async function boot(){
  const btn = $('#openStateBtn');

  try{
    if(tg){
      tg.ready();
      tg.expand();
      try{
        tg.setHeaderColor('#f6f9fe');
        tg.setBackgroundColor('#f6f9fe');
      }catch(e){}
    }

    state.initData = tg ? (tg.initData || '') : '';

    btn.onclick = () => boot();

    if(!state.initData){
      btn.disabled = false;
      btn.textContent = 'Повторить подключение';
      $('.splash p').textContent = 'Откройте Campus №1 кнопкой внутри Telegram-бота.';
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Проверяем доступ…';

    const data = await server('appBootstrap', state.initData);

    state.user = data.user;
    state.dashboard = data.dashboard;
    state.analytics = data.analytics;
    state.rooms = data.rooms;

    $('#userPill').textContent =
      (state.user.firstName || 'Пользователь') + ' · ' + roleLabel(state.user);

    $('#splash').classList.add('hidden');
    $('#app').classList.remove('hidden');
    $('#bottomNav').classList.remove('hidden');

    render('home');

  }catch(e){
    btn.disabled = false;
    btn.textContent = 'Повторить вход';
    btn.onclick = () => boot();
    $('.splash p').textContent = e && e.message ? e.message : String(e);
  }
}

function setNav(page){ document.querySelectorAll('.nav').forEach(b=>b.classList.toggle('active',b.dataset.page===page)); }
async function render(page){ state.currentPage=page; setNav(page); loading(); try{
  if(page==='home') return renderHome();
  if(page==='students') return await renderStudents('active');
  if(page==='rooms') return await renderRooms();
  if(page==='ai') return renderAI();
  if(page==='more') return renderMore();
  if(page==='analytics') return renderAnalytics();
  if(page==='foreigners') return await renderGenericTable('Иностранные студенты','appGetForeigners');
  if(page==='council') return await renderCouncil('council');
  if(page==='activists') return await renderCouncil('activists');
  if(page==='control') return await renderGenericTable('Контроль общежития','appGetControl');
  if(page==='journal') return await renderGenericTable('Журнал действий','appGetJournal');
 }catch(e){ $('#view').innerHTML='<div class="empty">'+esc(e.message)+'</div>'; }}

function renderHome(){ const d=state.dashboard||{}; $('#view').innerHTML=`
  <div class="hero"><small>Добро пожаловать</small><h2>${esc(state.user.firstName||'')}</h2><p>${esc(roleLabel(state.user))} · Campus №1</p></div>
  <div class="search" onclick="render('students')"><span>⌕</span><input readonly placeholder="ФИО, ИИН, паспорт или комната"></div>
  <div class="section-title">Обзор</div><div class="stats">
    <div class="stat green"><strong>${d.currentStudents||0}</strong><span>Сейчас заселено</span></div>
    <div class="stat"><strong>${d.freeRooms||0}</strong><span>Свободно комнат</span></div>
    <div class="stat"><strong>${d.foreigners||0}</strong><span>Иностранцы</span></div>
    <div class="stat"><strong>${(d.council||0)+(d.activists||0)}</strong><span>Студсовет и активисты</span></div>
  </div>
  <div class="section-title">Быстрые действия</div><div class="actions">
    ${state.user.canManage?'<button class="action" onclick="openAddStudent()"><div class="icon">＋</div><b>Заселить</b><small>Добавить студента</small></button>':''}
    <button class="action" onclick="render('students')"><div class="icon">⌕</div><b>Найти</b><small>Студент / комната</small></button>
    <button class="action" onclick="render('rooms')"><div class="icon">▦</div><b>Комнаты</b><small>Карта Campus №1</small></button>
    <button class="action" onclick="render('analytics')"><div class="icon">↗</div><b>Аналитика</b><small>Динамика заселения</small></button>
  </div>
  <div class="ai-card" onclick="render('ai')"><div class="ai-glyph">✦</div><div><b>Campus AI</b><small>Спросить по базе или подготовить текст</small></div><div style="margin-left:auto">→</div></div>`; }

function pageHead(title, back){ return `<div class="page-head">${back?'<button onclick="render(\''+back+'\')">‹</button>':''}<h2>${esc(title)}</h2></div>`; }

async function renderStudents(mode){
  $('#view').innerHTML=pageHead('Студенты')+`<div class="search"><span>⌕</span><input id="studentSearch" placeholder="ФИО, ИИН, комната, факультет"><button class="secondary" onclick="doStudentSearch()">Найти</button></div><div class="tabs" style="margin-top:12px"><button class="tab ${mode==='active'?'active':''}" onclick="renderStudents('active')">Заселены</button><button class="tab ${mode==='all'?'active':''}" onclick="renderStudents('all')">Все</button><button class="tab ${mode==='evicted'?'active':''}" onclick="renderStudents('evicted')">Выселены</button></div><div id="studentList" class="list"><div class="loading">Загрузка…</div></div>`;
  const list=await server('appGetStudents',state.initData,mode); state.students=list; drawStudents(list);
}
function drawStudents(list){ const el=$('#studentList'); if(!list.length){el.innerHTML='<div class="empty">Ничего не найдено</div>';return;} el.innerHTML=list.map(s=>`<div class="row-card" onclick="openStudent(${s.rowNumber})"><div class="avatar">${esc(initials(s.fio))}</div><div class="row-main"><b>${esc(s.fio)}</b><small>Комната ${esc(s.room||'—')} · ${esc(s.faculty||'Факультет не указан')}</small></div><span class="badge ${s.active?'':'red'}">${s.active?'Заселен':'Выселен'}</span></div>`).join(''); }
async function doStudentSearch(){ const q=$('#studentSearch').value.trim(); if(!q) return; $('#studentList').innerHTML='<div class="loading">Поиск…</div>'; try{drawStudents(await server('appSearchStudents',state.initData,q));}catch(e){toast(e.message)} }

async function openStudent(row){ try{ const s=await server('appGetStudent',state.initData,row); const manage=state.user.canManage; showModal(`<div class="sheet-handle"></div><h3>${esc(s.fio)}</h3><span class="badge ${s.active?'':'red'}">${s.active?'Проживает':'Выселен'}</span><div class="kv"><div><small>Комната</small><b>${esc(s.room||'—')}</b></div><div><small>Факультет</small><b>${esc(s.faculty||'—')}</b></div><div><small>ИИН / паспорт</small><b>${esc(s.iin||'—')}</b></div><div><small>Дата заселения</small><b>${esc(s.dateIn||'—')}</b></div><div><small>Дата рождения</small><b>${esc(s.birthDate||'—')}</b></div><div><small>Прописка</small><b>${esc(s.registration||'—')}</b></div></div>${manage&&s.active?`<div class="button-row"><button class="secondary" onclick="openMove(${s.rowNumber},'${esc(s.fio)}','${esc(s.room)}')">Переселить</button><button class="secondary danger" onclick="confirmEvict(${s.rowNumber},'${esc(s.fio)}')">Выселить</button></div>`:''}<button class="secondary" style="width:100%;margin-top:10px" onclick="closeModal()">Закрыть</button>`); }catch(e){toast(e.message)} }

async function renderRooms(){ $('#view').innerHTML=pageHead('Комнаты')+`<div class="search"><span>⌕</span><input id="roomFilter" placeholder="Номер комнаты" oninput="filterRooms()"></div><div style="margin:12px 2px;color:var(--muted);font-size:12px">13, 14, 23, 30–117, 119–125, 128–162</div><div id="roomsGrid" class="rooms"><div class="loading">Загрузка…</div></div>`; state.roomData=await server('appGetRooms',state.initData); drawRooms(state.roomData); }
function drawRooms(list){ $('#roomsGrid').innerHTML=list.map(r=>`<div class="room ${r.occupants?'busy':'empty'}" onclick="openRoom('${r.room}')"><span class="dot"></span><b>${r.room}</b><small>${r.occupants? r.occupants+' прожив.':'Свободна'}</small></div>`).join(''); }
function filterRooms(){ const q=$('#roomFilter').value.trim(); drawRooms((state.roomData||[]).filter(r=>!q||r.room.includes(q))); }
async function openRoom(room){ try{ const data=await server('appGetRoom',state.initData,room); showModal(`<div class="sheet-handle"></div><h3>Комната №${esc(room)}</h3><div style="color:var(--muted);margin-bottom:12px">${data.occupants.length} проживающих</div><div class="list">${data.occupants.length?data.occupants.map(s=>`<div class="row-card" onclick="openStudent(${s.rowNumber})"><div class="avatar">${esc(initials(s.fio))}</div><div class="row-main"><b>${esc(s.fio)}</b><small>${esc(s.faculty||'')}</small></div></div>`).join(''):'<div class="empty">Комната свободна</div>'}</div>${state.user.canManage?`<button class="primary" style="width:100%;margin-top:14px" onclick="closeModal();openAddStudent('${esc(room)}')">＋ Заселить в комнату</button>`:''}<button class="secondary" style="width:100%;margin-top:9px" onclick="closeModal()">Закрыть</button>`); }catch(e){toast(e.message)} }

function renderAnalytics(){ const a=state.analytics||{}, d=a.dashboard||{}, m=a.months||[]; const max=Math.max(1,...m.map(x=>x.inCount)); $('#view').innerHTML=pageHead('Аналитика заселения','home')+`<div class="stats"><div class="stat green"><strong>${d.currentStudents||0}</strong><span>Заселено сейчас</span></div><div class="stat"><strong>${d.freeRooms||0}</strong><span>Свободно комнат</span></div><div class="stat"><strong>${d.occupiedRooms||0}</strong><span>Занято комнат</span></div><div class="stat"><strong>${d.totalRooms||0}</strong><span>Всего комнат</span></div></div><div class="section-title">Заселения за 6 месяцев</div><div class="panel"><div class="chart">${m.map(x=>`<div class="bar-wrap"><div class="bar" style="height:${Math.max(6,Math.round(x.inCount/max*120))}px"></div><span>${esc(x.label)}</span></div>`).join('')}</div></div><div class="section-title">Распределение комнат</div><div class="panel donut-grid"><div class="mini-stat"><b>${a.distribution?.empty||0}</b><small>Пустые</small></div><div class="mini-stat"><b>${a.distribution?.one||0}</b><small>1 человек</small></div><div class="mini-stat"><b>${a.distribution?.two||0}</b><small>2 человека</small></div><div class="mini-stat"><b>${a.distribution?.three||0}</b><small>3 человека</small></div><div class="mini-stat"><b>${a.distribution?.fourPlus||0}</b><small>4+ человека</small></div></div>`; }

function renderMore(){ $('#view').innerHTML=pageHead('Ещё')+`<div class="more-grid"><div class="more-item" onclick="render('foreigners')"><div class="mi">🌐</div><b>Иностранцы</b><small>Отдельный список</small></div><div class="more-item" onclick="render('council')"><div class="mi">◇</div><b>Студсовет</b><small>Состав и сектора</small></div><div class="more-item" onclick="render('activists')"><div class="mi">◎</div><b>Активисты</b><small>Список активистов</small></div><div class="more-item" onclick="render('control')"><div class="mi">!</div><b>Контроль</b><small>Нарушения и замечания</small></div><div class="more-item" onclick="render('journal')"><div class="mi">≡</div><b>Журнал</b><small>История действий</small></div><div class="more-item" onclick="render('analytics')"><div class="mi">↗</div><b>Аналитика</b><small>Общее заселение</small></div></div>`; }

async function renderGenericTable(title, fn){ $('#view').innerHTML=pageHead(title,'more')+'<div id="generic" class="list"><div class="loading">Загрузка…</div></div>'; const data=await server(fn,state.initData); const el=$('#generic'); if(!data.rows.length){ el.innerHTML='<div class="panel empty">Таблица пока пустая или не подключена.<br><small>Её можно хранить в отдельном Google Spreadsheet.</small></div>'; return; } el.innerHTML=data.rows.map(r=>{ const vals=Object.entries(r).filter(([k,v])=>k!=='_rowNumber'&&String(v).trim()).slice(0,4); return `<div class="row-card"><div class="avatar">${esc(initials(vals[0]?.[1]||title))}</div><div class="row-main">${vals.map(([k,v],i)=>i===0?`<b>${esc(v)}</b>`:`<small>${esc(k)}: ${esc(v)}</small>`).join('')}</div></div>`; }).join(''); }
async function renderCouncil(kind){ const title=kind==='activists'?'Активисты':'Студенческий совет'; $('#view').innerHTML=pageHead(title,'more')+'<div id="generic" class="list"><div class="loading">Загрузка…</div></div>'; const data=await server('appGetCouncil',state.initData,kind); const el=$('#generic'); if(!data.rows.length){el.innerHTML='<div class="panel empty">Список пока пустой.</div>';return;} el.innerHTML=data.rows.map(r=>{ const name=r['ФИО']||r['Имя']||Object.values(r).find(v=>v&&typeof v==='string')||'Участник'; return `<div class="row-card"><div class="avatar">${esc(initials(name))}</div><div class="row-main"><b>${esc(name)}</b><small>${esc(r['Должность']||r['Роль']||r['Сектор']||'')}</small>${r['Комната']?`<small>Комната ${esc(r['Комната'])}</small>`:''}</div></div>`; }).join(''); }

function renderAI(){ $('#view').innerHTML=pageHead('Campus AI')+`<div class="panel" style="margin-bottom:12px"><b>✦ Помощник Campus №1</b><div style="color:var(--muted);font-size:12px;margin-top:5px">Может искать по базе, анализировать заселение и помогать с текстами.</div></div><div id="chat" class="chat"><div class="bubble bot">Например: «Кто проживает в комнате 145?» или «Сколько сейчас заселено студентов?»</div></div><div class="chat-compose"><div class="compose"><textarea id="aiInput" placeholder="Введите вопрос…"></textarea><button class="send" onclick="sendAI()">↑</button></div></div>`; }
async function sendAI(){ const inp=$('#aiInput'); const text=inp.value.trim(); if(!text)return; const chat=$('#chat'); chat.insertAdjacentHTML('beforeend',`<div class="bubble user">${esc(text)}</div>`); inp.value=''; chat.insertAdjacentHTML('beforeend','<div id="aiWait" class="bubble bot">Думаю…</div>'); try{const r=await server('appAskAI',state.initData,text); $('#aiWait').remove(); chat.insertAdjacentHTML('beforeend',`<div class="bubble bot">${esc(r.text)}</div>`);}catch(e){$('#aiWait').remove();chat.insertAdjacentHTML('beforeend',`<div class="bubble bot">${esc(e.message)}</div>`);} window.scrollTo({top:document.body.scrollHeight,behavior:'smooth'}); }

function roomOptions(selected){ const rooms=state.rooms||[]; return rooms.map(r=>`<option value="${r}" ${String(r)===String(selected)?'selected':''}>${r}</option>`).join(''); }
function openAddStudent(room=''){ if(!state.user.canManage)return toast('Недостаточно прав'); showModal(`<div class="sheet-handle"></div><h3>Заселить студента</h3><div class="field"><label>ФИО</label><input id="f_fio"></div><div class="field"><label>Комната</label><select id="f_room"><option value="">Выберите</option>${roomOptions(room)}</select></div><div class="field"><label>ИИН / паспорт</label><input id="f_iin"></div><div class="field"><label>Факультет</label><input id="f_faculty"></div><div class="field"><label>Дата заселения</label><input id="f_dateIn" placeholder="01.09.2026"></div><div class="field"><label>Дата рождения</label><input id="f_birthDate" placeholder="15.03.2007"></div><div class="field"><label>Прописка</label><input id="f_registration"></div><button class="primary" style="width:100%" onclick="saveNewStudent()">Заселить</button><button class="secondary" style="width:100%;margin-top:9px" onclick="closeModal()">Отмена</button>`); }
async function saveNewStudent(){ try{ await server('appAddStudent',state.initData,{fio:$('#f_fio').value,room:$('#f_room').value,iin:$('#f_iin').value,faculty:$('#f_faculty').value,dateIn:$('#f_dateIn').value,birthDate:$('#f_birthDate').value,registration:$('#f_registration').value}); closeModal(); toast('Студент добавлен'); const b=await server('appGetDashboard',state.initData); state.dashboard=b; render(state.currentPage==='rooms'?'rooms':'home'); }catch(e){toast(e.message)} }
function openMove(row,fio,room){ showModal(`<div class="sheet-handle"></div><h3>Переселить</h3><p><b>${esc(fio)}</b><br><span style="color:var(--muted)">Текущая комната: ${esc(room||'—')}</span></p><div class="field"><label>Новая комната</label><select id="move_room">${roomOptions('')}</select></div><button class="primary" style="width:100%" onclick="saveMove(${row})">Подтвердить переселение</button><button class="secondary" style="width:100%;margin-top:9px" onclick="closeModal()">Отмена</button>`); }
async function saveMove(row){ try{await server('appMoveStudent',state.initData,row,$('#move_room').value);closeModal();toast('Студент переселён');}catch(e){toast(e.message)} }
function confirmEvict(row,fio){ showModal(`<div class="sheet-handle"></div><h3>Подтвердить выселение?</h3><p><b>${esc(fio)}</b></p><p style="color:var(--muted);font-size:13px">Действие будет записано в журнал.</p><button class="primary" style="width:100%;background:var(--red)" onclick="doEvict(${row})">Выселить</button><button class="secondary" style="width:100%;margin-top:9px" onclick="closeModal()">Отмена</button>`); }
async function doEvict(row){ try{await server('appEvictStudent',state.initData,row);closeModal();toast('Студент выселен');render('students');}catch(e){toast(e.message)} }

function showModal(html){ $('#modalSheet').innerHTML=html; $('#modal').classList.remove('hidden'); }
function closeModal(){ $('#modal').classList.add('hidden'); }
$('#modal').addEventListener('click',e=>{if(e.target.id==='modal')closeModal()});
document.querySelectorAll('.nav').forEach(b=>b.addEventListener('click',()=>render(b.dataset.page)));
boot();